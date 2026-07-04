/**
 * Server functions du back-office (content-authoring).
 * Toutes les mutations sont protégées par `assertAdmin` (contrôle serveur).
 */
import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, max } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.ts'
import {
  courses,
  lessonSteps,
  lessons,
  quizQuestions,
  units,
} from '../../db/schema.ts'
import { assertAdmin } from '../../lib/auth/session.ts'
import {
  courseMetaSchema,
  questionSchema,
  slugify,
} from '../../lib/validation/content.ts'

// --- Lecture -------------------------------------------------------------

export const listCourses = createServerFn({ method: 'GET' }).handler(async () => {
  await assertAdmin()
  return db.query.courses.findMany({
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
  })
})

export const getCourseTree = createServerFn({ method: 'GET' })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: courseId }) => {
    await assertAdmin()
    return db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        units: {
          orderBy: (u, { asc: a }) => [a(u.position)],
          with: {
            lessons: {
              orderBy: (l, { asc: a }) => [a(l.position)],
              with: {
                steps: {
                  orderBy: (s, { asc: a }) => [a(s.position)],
                  with: { question: true },
                },
              },
            },
          },
        },
      },
    })
  })

/** Charge une leçon (même non publiée) avec les réponses, pour la preview admin. */
export const getLessonForPreview = createServerFn({ method: 'GET' })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: lessonId }) => {
    await assertAdmin()
    return db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
      with: {
        steps: {
          orderBy: (s, { asc: a }) => [a(s.position)],
          with: { question: true },
        },
      },
    })
  })

// --- Cours ---------------------------------------------------------------

async function uniqueSlug(base: string): Promise<string> {
  const root = base || 'cours'
  let slug = root
  let n = 2
  while (await db.query.courses.findFirst({ where: eq(courses.slug, slug) })) {
    slug = `${root}-${n++}`
  }
  return slug
}

export const createCourse = createServerFn({ method: 'POST' })
  .validator((input: unknown) => courseMetaSchema.parse(input))
  .handler(async ({ data }) => {
    await assertAdmin()
    const slug = await uniqueSlug(data.slug ?? slugify(data.title))
    const [course] = await db
      .insert(courses)
      .values({ title: data.title, description: data.description, slug })
      .returning()
    return course
  })

export const updateCourse = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({ id: z.string().uuid() })
      .merge(courseMetaSchema.pick({ title: true, description: true }))
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    await db
      .update(courses)
      .set({ title: data.title, description: data.description, updatedAt: new Date() })
      .where(eq(courses.id, data.id))
    return { ok: true }
  })

export const setCoursePublished = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), isPublished: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    await db
      .update(courses)
      .set({ isPublished: data.isPublished, updatedAt: new Date() })
      .where(eq(courses.id, data.id))
    return { ok: true }
  })

export const deleteCourse = createServerFn({ method: 'POST' })
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: id }) => {
    await assertAdmin()
    await db.delete(courses).where(eq(courses.id, id))
    return { ok: true }
  })

// --- Unités & leçons -----------------------------------------------------

async function nextPosition(
  table: typeof units | typeof lessons | typeof lessonSteps,
  fkCol: unknown,
  fkVal: string,
): Promise<number> {
  const [row] = await db
    .select({ m: max(table.position) })
    .from(table)
    .where(eq(fkCol as never, fkVal))
  return (row?.m ?? -1) + 1
}

export const createUnit = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ courseId: z.string().uuid(), title: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const position = await nextPosition(units, units.courseId, data.courseId)
    const [unit] = await db
      .insert(units)
      .values({ courseId: data.courseId, title: data.title, position })
      .returning()
    return unit
  })

export const createLesson = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ unitId: z.string().uuid(), title: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const position = await nextPosition(lessons, lessons.unitId, data.unitId)
    const [lesson] = await db
      .insert(lessons)
      .values({ unitId: data.unitId, title: data.title, position })
      .returning()
    return lesson
  })

export const renameEntity = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        entity: z.enum(['unit', 'lesson']),
        id: z.string().uuid(),
        title: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const table = data.entity === 'unit' ? units : lessons
    await db.update(table).set({ title: data.title }).where(eq(table.id, data.id))
    return { ok: true }
  })

export const deleteEntity = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({ entity: z.enum(['unit', 'lesson', 'step']), id: z.string().uuid() })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const table =
      data.entity === 'unit' ? units : data.entity === 'lesson' ? lessons : lessonSteps
    await db.delete(table).where(eq(table.id, data.id))
    return { ok: true }
  })

// --- Étapes --------------------------------------------------------------

export const createContentStep = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        lessonId: z.string().uuid(),
        title: z.string().optional(),
        body: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const position = await nextPosition(lessonSteps, lessonSteps.lessonId, data.lessonId)
    const [step] = await db
      .insert(lessonSteps)
      .values({
        lessonId: data.lessonId,
        type: 'content',
        position,
        contentBody: { title: data.title, body: data.body },
      })
      .returning()
    return step
  })

export const createQuizStep = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ lessonId: z.string().uuid(), question: questionSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const position = await nextPosition(lessonSteps, lessonSteps.lessonId, data.lessonId)
    const q = data.question
    return db.transaction(async (tx) => {
      const [step] = await tx
        .insert(lessonSteps)
        .values({ lessonId: data.lessonId, type: 'quiz', position })
        .returning()
      const { type, prompt, explanation, ...rest } = q
      await tx.insert(quizQuestions).values({
        lessonStepId: step.id,
        type,
        prompt,
        explanation,
        data: rest,
      })
      return step
    })
  })

// --- Réordonnancement ----------------------------------------------------

export const reorder = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({
        entity: z.enum(['unit', 'lesson', 'step']),
        orderedIds: z.array(z.string().uuid()),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    const table =
      data.entity === 'unit' ? units : data.entity === 'lesson' ? lessons : lessonSteps
    await db.transaction(async (tx) => {
      for (let i = 0; i < data.orderedIds.length; i++) {
        await tx.update(table).set({ position: i }).where(eq(table.id, data.orderedIds[i]))
      }
    })
    return { ok: true }
  })

// (imports asc/and conservés pour extensions futures)
void asc
void and
