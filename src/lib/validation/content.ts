/**
 * Schémas Zod du contenu pédagogique — partagés par le back-office
 * (content-authoring) et l'import JSON (course-import).
 *
 * Reflète `docs/LESSON_FORMAT.md`. Posture stricte : médias HTTPS image/audio,
 * bornes sur les index/tableaux (voir aussi assainissement du Markdown au rendu).
 */
import { z } from 'zod'

// --- Média ---------------------------------------------------------------
export const mediaSchema = z.object({
  type: z.enum(['image', 'audio']),
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'Le média doit être en HTTPS'),
  alt: z.string().optional(),
})

// --- Questions de quiz (union discriminée sur `type`) --------------------
const baseQuestion = {
  prompt: z.string().min(1),
  explanation: z.string().optional(),
}

// Membres = objets simples (pas de .refine) pour rester compatibles avec
// discriminatedUnion ; les contrôles inter-champs sont dans le superRefine ci-dessous.
export const singleChoiceSchema = z.object({
  type: z.literal('single_choice'),
  ...baseQuestion,
  choices: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().nonnegative(),
})

export const multipleChoiceSchema = z.object({
  type: z.literal('multiple_choice'),
  ...baseQuestion,
  choices: z.array(z.string().min(1)).min(2),
  correctIndexes: z.array(z.number().int().nonnegative()).min(1),
})

export const matchSchema = z.object({
  type: z.literal('match'),
  ...baseQuestion,
  pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).min(2),
})

export const fillBlankSchema = z.object({
  type: z.literal('fill_blank'),
  ...baseQuestion,
  answer: z.string().min(1),
  acceptableAnswers: z.array(z.string().min(1)).optional(),
})

export const reorderSchema = z.object({
  type: z.literal('reorder'),
  ...baseQuestion,
  tokens: z.array(z.string().min(1)).min(2),
  correctOrder: z.array(z.number().int().nonnegative()).min(2),
})

export const questionSchema = z
  .discriminatedUnion('type', [
    singleChoiceSchema,
    multipleChoiceSchema,
    matchSchema,
    fillBlankSchema,
    reorderSchema,
  ])
  .superRefine((q, ctx) => {
    if (q.type === 'single_choice' && q.correctIndex >= q.choices.length) {
      ctx.addIssue({ code: 'custom', message: 'correctIndex hors limites', path: ['correctIndex'] })
    }
    if (q.type === 'multiple_choice' && q.correctIndexes.some((i) => i >= q.choices.length)) {
      ctx.addIssue({ code: 'custom', message: 'correctIndexes hors limites', path: ['correctIndexes'] })
    }
    if (q.type === 'reorder') {
      const ok =
        q.correctOrder.length === q.tokens.length &&
        [...q.correctOrder].sort((a, b) => a - b).every((v, i) => v === i)
      if (!ok) {
        ctx.addIssue({
          code: 'custom',
          message: 'correctOrder doit être une permutation des index de tokens',
          path: ['correctOrder'],
        })
      }
    }
  })
export type QuestionInput = z.infer<typeof questionSchema>
export const questionTypes = [
  'single_choice',
  'multiple_choice',
  'match',
  'fill_blank',
  'reorder',
] as const

// --- Étapes --------------------------------------------------------------
export const contentStepSchema = z.object({
  type: z.literal('content'),
  title: z.string().optional(),
  body: z.string().min(1),
  media: mediaSchema.optional(),
})

export const quizStepSchema = z.object({
  type: z.literal('quiz'),
  quiz: questionSchema,
})

export const stepSchema = z.discriminatedUnion('type', [
  contentStepSchema,
  quizStepSchema,
])
export type StepInput = z.infer<typeof stepSchema>

// --- Leçon / unité / cours ----------------------------------------------
export const lessonSchema = z.object({
  title: z.string().min(1),
  steps: z
    .array(stepSchema)
    .min(1, 'Une leçon doit contenir au moins une étape')
    .refine((steps) => steps.some((s) => s.type === 'quiz'), {
      message: 'Une leçon doit contenir au moins une étape de quiz',
    }),
})

export const unitSchema = z.object({
  title: z.string().min(1),
  lessons: z.array(lessonSchema).min(1),
})

export const courseMetaSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug : minuscules, chiffres et tirets')
    .optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
})

/** Fichier d'import complet : un cours + sa hiérarchie. */
export const courseImportSchema = z.object({
  course: courseMetaSchema,
  units: z.array(unitSchema).min(1),
})
export type CourseImportInput = z.infer<typeof courseImportSchema>

/** Génère un slug à partir d'un titre (fallback si absent). */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}
