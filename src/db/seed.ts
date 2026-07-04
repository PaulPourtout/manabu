/**
 * Seed de démonstration.
 *
 * Idempotent sur les données de référence (badges, slug de cours) : on peut
 * le relancer sans dupliquer. Lancé via `pnpm db:seed` (nécessite la DB up).
 *
 * NB : les utilisateurs viennent de Clerk (créés au premier login via webhook),
 * donc on ne seed pas de compte ici — seulement du contenu et des badges.
 */
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { db } from './index.ts'
import {
  badges,
  courses,
  lessonSteps,
  lessons,
  quizQuestions,
  units,
} from './schema.ts'

const DEMO_COURSE_SLUG = 'anglais-debutant'

async function seed() {
  console.log('→ Seed des badges...')
  await db
    .insert(badges)
    .values([
      {
        code: 'first_lesson',
        title: 'Premiers pas',
        description: 'Terminer sa première leçon',
        icon: '🎉',
      },
      {
        code: 'perfect_lesson',
        title: 'Sans faute',
        description: 'Réussir une leçon avec un score parfait',
        icon: '💯',
      },
      {
        code: 'streak_7',
        title: 'Une semaine !',
        description: 'Maintenir une série de 7 jours',
        icon: '🔥',
      },
      {
        code: 'course_complete',
        title: 'Cours terminé',
        description: 'Terminer un cours entier',
        icon: '🏆',
      },
    ])
    .onConflictDoNothing({ target: badges.code })

  const existing = await db.query.courses.findFirst({
    where: eq(courses.slug, DEMO_COURSE_SLUG),
  })
  if (existing) {
    console.log('→ Cours de démo déjà présent, on saute la création de contenu.')
    console.log('✓ Seed terminé.')
    return
  }

  console.log('→ Création du cours de démo...')
  const [course] = await db
    .insert(courses)
    .values({
      slug: DEMO_COURSE_SLUG,
      title: 'Anglais - Débutant',
      description: 'Apprendre les bases de l’anglais du quotidien.',
      isPublished: true,
    })
    .returning()

  const [unit] = await db
    .insert(units)
    .values({
      courseId: course.id,
      title: 'Unité 1 : Se présenter',
      position: 0,
    })
    .returning()

  const [lesson] = await db
    .insert(lessons)
    .values({
      unitId: unit.id,
      title: 'Dire bonjour',
      position: 0,
    })
    .returning()

  const [contentStep] = await db
    .insert(lessonSteps)
    .values({
      lessonId: lesson.id,
      position: 0,
      type: 'content',
      contentBody: {
        title: 'Les salutations',
        body: '**Hello** = bonjour, à toute heure de la journée. On peut aussi dire **Hi** de manière plus familière.',
      },
    })
    .returning()
  void contentStep

  const [quizStep] = await db
    .insert(lessonSteps)
    .values({
      lessonId: lesson.id,
      position: 1,
      type: 'quiz',
    })
    .returning()

  await db.insert(quizQuestions).values({
    lessonStepId: quizStep.id,
    type: 'single_choice',
    prompt: 'Comment dit-on « bonjour » en anglais ?',
    explanation: '« Hello » est la salutation la plus courante.',
    data: {
      choices: ['Hello', 'Goodbye', 'Please', 'Thanks'],
      correctIndex: 0,
    },
  })

  console.log('✓ Seed terminé : cours de démo + badges créés.')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Échec du seed :', err)
    process.exit(1)
  })
