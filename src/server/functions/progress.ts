/**
 * Progression apprenant : démarrage de tentative et soumission d'étape.
 * Évaluation côté serveur, file de remise, vies par tentative, complétion (ADR 0001).
 * XP / streak / badges / verrou seront ajoutés par le change `gamification`.
 */
import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.ts'
import type { QuizData } from '../../db/schema.ts'
import { lessonSteps, lessons, userLessonProgress, userStepAttempts } from '../../db/schema.ts'
import { requireUser } from '../../lib/auth/session.ts'
import { onLessonCompleted } from './gamification.ts'

const START_HEARTS = 3

async function orderedStepIds(lessonId: string): Promise<string[]> {
  const rows = await db
    .select({ id: lessonSteps.id })
    .from(lessonSteps)
    .where(eq(lessonSteps.lessonId, lessonId))
    .orderBy(asc(lessonSteps.position))
  return rows.map((r) => r.id)
}

async function upsertAttempt(
  userId: string,
  lessonId: string,
  values: Partial<typeof userLessonProgress.$inferInsert>,
) {
  const existing = await db.query.userLessonProgress.findFirst({
    where: and(
      eq(userLessonProgress.userId, userId),
      eq(userLessonProgress.lessonId, lessonId),
    ),
  })
  if (existing) {
    await db
      .update(userLessonProgress)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(userLessonProgress.id, existing.id))
  } else {
    await db
      .insert(userLessonProgress)
      .values({ userId, lessonId, ...values })
  }
}

/** (Re)démarre une tentative : file complète, vies fraîches. */
export const startAttempt = createServerFn({ method: 'POST' })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: lessonId }) => {
    const user = await requireUser()
    const queue = await orderedStepIds(lessonId)
    await upsertAttempt(user.id, lessonId, {
      status: 'in_progress',
      currentStepId: queue[0] ?? null,
      heartsRemaining: START_HEARTS,
      requeueStepIds: queue,
      perfect: true,
      completedAt: null,
      lastAttemptAt: new Date(),
    })
    return { currentStepId: queue[0] ?? null, heartsRemaining: START_HEARTS }
  })

function evaluate(type: string, data: QuizData, answer: unknown): boolean {
  switch (type) {
    case 'single_choice':
      return answer === data.correctIndex
    case 'multiple_choice': {
      if (!Array.isArray(answer)) return false
      const a = [...(answer as number[])].sort()
      const b = [...(data.correctIndexes ?? [])].sort()
      return a.length === b.length && a.every((v, i) => v === b[i])
    }
    case 'fill_blank': {
      const norm = (s: string) => s.trim().toLowerCase()
      const accepted = [data.answer ?? '', ...(data.acceptableAnswers ?? [])].map(norm)
      return typeof answer === 'string' && accepted.includes(norm(answer))
    }
    case 'reorder': {
      if (!Array.isArray(answer)) return false
      const correct = (data.correctOrder ?? []).map((i) => (data.tokens ?? [])[i])
      return (answer as string[]).join('') === correct.join('')
    }
    case 'match': {
      if (!Array.isArray(answer)) return false
      const chosen = new Map(
        (answer as { left: string; right: string }[]).map((p) => [p.left, p.right]),
      )
      return (data.pairs ?? []).every((p) => chosen.get(p.left) === p.right)
    }
    default:
      return false
  }
}

export type SubmitResult = {
  correct: boolean
  explanation: string | null
  heartsRemaining: number
  status: 'in_progress' | 'completed'
  failed: boolean
  currentStepId: string | null
  xpGained: number
  newBadges: string[]
}

export const submitStep = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        lessonId: z.string().uuid(),
        stepId: z.string().uuid(),
        answer: z.unknown().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<SubmitResult> => {
    const user = await requireUser()

    let attempt = await db.query.userLessonProgress.findFirst({
      where: and(
        eq(userLessonProgress.userId, user.id),
        eq(userLessonProgress.lessonId, data.lessonId),
      ),
    })
    // Auto-init si pas de tentative active.
    if (!attempt || attempt.status !== 'in_progress') {
      const queue = await orderedStepIds(data.lessonId)
      await upsertAttempt(user.id, data.lessonId, {
        status: 'in_progress',
        currentStepId: queue[0] ?? null,
        heartsRemaining: START_HEARTS,
        requeueStepIds: queue,
        perfect: true,
        completedAt: null,
        lastAttemptAt: new Date(),
      })
      attempt = await db.query.userLessonProgress.findFirst({
        where: and(
          eq(userLessonProgress.userId, user.id),
          eq(userLessonProgress.lessonId, data.lessonId),
        ),
      })
    }
    if (!attempt) throw new Error('Attempt init failed')

    const queue = [...(attempt.requeueStepIds ?? [])]
    let hearts = attempt.heartsRemaining ?? START_HEARTS
    let perfect = attempt.perfect ?? true

    if (queue[0] !== data.stepId) {
      // Étape inattendue (double soumission / désync) : renvoyer l'état courant.
      return {
        correct: false,
        explanation: null,
        heartsRemaining: hearts,
        status: 'in_progress',
        failed: false,
        xpGained: 0,
        newBadges: [],
        currentStepId: queue[0] ?? null,
      }
    }

    const step = await db.query.lessonSteps.findFirst({
      where: eq(lessonSteps.id, data.stepId),
      with: { question: true },
    })
    if (!step) throw new Error('Step not found')

    let correct = true
    if (step.type === 'quiz' && step.question) {
      correct = evaluate(step.question.type, step.question.data, data.answer)
      await db.insert(userStepAttempts).values({
        userId: user.id,
        lessonStepId: step.id,
        isCorrect: correct,
      })
    }

    queue.shift() // retire l'étape courante
    if (step.type === 'quiz' && !correct) {
      hearts -= 1
      perfect = false
      queue.push(step.id) // remise en file
      if (hearts <= 0) {
        // Échec de la tentative : on réinitialise (reprise immédiate possible).
        await upsertAttempt(user.id, data.lessonId, {
          status: 'not_started',
          currentStepId: null,
          heartsRemaining: null,
          requeueStepIds: null,
          perfect: null,
        })
        return {
          correct: false,
          explanation: step.question.explanation ?? null,
          heartsRemaining: 0,
          status: 'in_progress',
          failed: true,
          currentStepId: null,
          xpGained: 0,
          newBadges: [],
        }
      }
    }

    const now = new Date()
    const completed = queue.length === 0
    await upsertAttempt(user.id, data.lessonId, {
      status: completed ? 'completed' : 'in_progress',
      currentStepId: queue[0] ?? null,
      heartsRemaining: hearts,
      requeueStepIds: queue,
      perfect,
      completedAt: completed ? now : null,
      lastAttemptAt: now,
    })

    // Effets de gamification à la complétion (XP, série, badges).
    let reward = { xpGained: 0, newBadges: [] as string[] }
    if (completed) {
      reward = await onLessonCompleted(user.id, data.lessonId, perfect, now)
    }

    return {
      correct,
      explanation: step.type === 'quiz' ? (step.question?.explanation ?? null) : null,
      heartsRemaining: hearts,
      status: completed ? 'completed' : 'in_progress',
      failed: false,
      currentStepId: queue[0] ?? null,
      xpGained: reward.xpGained,
      newBadges: reward.newBadges,
    }
  })

void lessons
