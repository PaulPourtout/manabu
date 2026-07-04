/**
 * Lectures côté apprenant : carte de parcours et chargement d'une leçon à jouer.
 * L'évaluation et l'écriture de progression sont dans `progress.ts`.
 */
import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.ts'
import type { ContentBody, QuizData } from '../../db/schema.ts'
import { courses, lessonSteps, lessons, userLessonProgress } from '../../db/schema.ts'
import { requireUser } from '../../lib/auth/session.ts'

export type PlayStep =
  | { id: string; type: 'content'; body: ContentBody }
  | {
      id: string
      type: 'quiz'
      question: {
        type: string
        prompt: string
        // Données publiques (sans la réponse) : choix/tokens/lefts+rights mélangés.
        choices?: string[]
        tokens?: string[]
        lefts?: string[]
        rights?: string[]
      }
    }

/** Carte de parcours : cours publiés + statut/verrou des leçons pour l'apprenant. */
export const getLearningPath = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireUser()
  const published = await db.query.courses.findMany({
    where: eq(courses.isPublished, true),
    orderBy: (c, { asc: a }) => [a(c.createdAt)],
    with: {
      units: {
        orderBy: (u, { asc: a }) => [a(u.position)],
        with: {
          lessons: {
            orderBy: (l, { asc: a }) => [a(l.position)],
            columns: { id: true, title: true, position: true, isPublished: true },
          },
        },
      },
    },
  })

  const progress = await db.query.userLessonProgress.findMany({
    where: eq(userLessonProgress.userId, user.id),
    columns: { lessonId: true, status: true },
  })
  const statusByLesson = new Map(progress.map((p) => [p.lessonId, p.status]))

  // Déverrouillage linéaire strict : séquence aplatie des leçons publiées du cours.
  return published.map((course) => {
    const flat = course.units.flatMap((u) => u.lessons.filter((l) => l.isPublished))
    let prevCompleted = true
    const lockByLesson = new Map<string, boolean>()
    for (const lesson of flat) {
      lockByLesson.set(lesson.id, !prevCompleted)
      prevCompleted = statusByLesson.get(lesson.id) === 'completed'
    }
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      units: course.units.map((u) => ({
        id: u.id,
        title: u.title,
        lessons: u.lessons
          .filter((l) => l.isPublished)
          .map((l) => ({
            id: l.id,
            title: l.title,
            status: statusByLesson.get(l.id) ?? 'not_started',
            locked: lockByLesson.get(l.id) ?? false,
          })),
      })),
    }
  })
})

/** Mélange déterministe léger (par index) pour ne pas dépendre de Math.random. */
function shuffleByIndex<T>(arr: T[]): T[] {
  // rotation simple : suffit pour éviter que la bonne réponse soit toujours 1re.
  if (arr.length < 2) return arr
  return [...arr.slice(1), arr[0]]
}

function toPublicStep(step: {
  id: string
  type: 'content' | 'quiz'
  contentBody: ContentBody | null
  question: { type: string; prompt: string; data: QuizData } | null
}): PlayStep {
  if (step.type === 'content') {
    return { id: step.id, type: 'content', body: step.contentBody ?? { body: '' } }
  }
  const q = step.question!
  const d = q.data
  return {
    id: step.id,
    type: 'quiz',
    question: {
      type: q.type,
      prompt: q.prompt,
      choices: d.choices,
      tokens: d.tokens ? shuffleByIndex(d.tokens) : undefined,
      lefts: d.pairs?.map((p) => p.left),
      rights: d.pairs ? shuffleByIndex(d.pairs.map((p) => p.right)) : undefined,
    },
  }
}

/** Charge une leçon jouable + l'état de la tentative en cours (reprise). */
export const getLessonForPlay = createServerFn({ method: 'GET' })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: lessonId }) => {
    const user = await requireUser()
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        steps: {
          orderBy: (s, { asc: a }) => [a(s.position)],
          with: { question: true },
        },
      },
    })
    if (!lesson) return null

    const steps = lesson.steps.map(toPublicStep)
    const progress = await db.query.userLessonProgress.findFirst({
      where: and(
        eq(userLessonProgress.userId, user.id),
        eq(userLessonProgress.lessonId, lessonId),
      ),
    })

    return {
      lessonId,
      title: lesson.title,
      steps,
      attempt: progress
        ? {
            status: progress.status,
            currentStepId: progress.currentStepId,
            heartsRemaining: progress.heartsRemaining,
            queue: progress.requeueStepIds ?? [],
          }
        : null,
    }
  })

void asc
void lessonSteps
