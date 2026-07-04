/**
 * Import d'un cours complet depuis un JSON (course-import).
 * Validation stricte (Zod), insertion transactionnelle, création seule
 * (slug en conflit → refus + demande d'un nouveau slug). Voir docs/LESSON_FORMAT.md.
 */
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
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
import { courseImportSchema, slugify } from '../../lib/validation/content.ts'

export type ImportResult =
  | { ok: true; courseId: string; slug: string }
  | { ok: false; error: string; issues?: { path: string; message: string }[] }
  | { ok: false; error: 'slug_conflict'; slug: string }

export const importCourse = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ raw: z.string(), slugOverride: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<ImportResult> => {
    await assertAdmin()

    // 1. Parse JSON
    let json: unknown
    try {
      json = JSON.parse(data.raw)
    } catch {
      return { ok: false, error: 'JSON invalide (syntaxe).' }
    }

    // 2. Validation de schéma
    const parsed = courseImportSchema.safeParse(json)
    if (!parsed.success) {
      return {
        ok: false,
        error: 'Le fichier ne respecte pas le format attendu.',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      }
    }
    const { course, units: unitInputs } = parsed.data

    // 3. Slug : création seule, pas d'écrasement
    const slug = data.slugOverride?.trim() || course.slug || slugify(course.title)
    const existing = await db.query.courses.findFirst({ where: eq(courses.slug, slug) })
    if (existing) {
      return { ok: false, error: 'slug_conflict', slug }
    }

    // 4. Insertion transactionnelle
    const courseId = await db.transaction(async (tx) => {
      const [createdCourse] = await tx
        .insert(courses)
        .values({
          title: course.title,
          description: course.description,
          slug,
          isPublished: course.isPublished ?? false,
        })
        .returning()

      for (let ui = 0; ui < unitInputs.length; ui++) {
        const u = unitInputs[ui]
        const [unit] = await tx
          .insert(units)
          .values({ courseId: createdCourse.id, title: u.title, position: ui })
          .returning()

        for (let li = 0; li < u.lessons.length; li++) {
          const l = u.lessons[li]
          const [lesson] = await tx
            .insert(lessons)
            .values({ unitId: unit.id, title: l.title, position: li })
            .returning()

          for (let si = 0; si < l.steps.length; si++) {
            const s = l.steps[si]
            if (s.type === 'content') {
              await tx.insert(lessonSteps).values({
                lessonId: lesson.id,
                type: 'content',
                position: si,
                contentBody: { title: s.title, body: s.body, media: s.media },
              })
            } else {
              const [step] = await tx
                .insert(lessonSteps)
                .values({ lessonId: lesson.id, type: 'quiz', position: si })
                .returning()
              const { type, prompt, explanation, ...rest } = s.quiz
              await tx.insert(quizQuestions).values({
                lessonStepId: step.id,
                type,
                prompt,
                explanation,
                data: rest,
              })
            }
          }
        }
      }
      return createdCourse.id
    })

    return { ok: true, courseId, slug }
  })
