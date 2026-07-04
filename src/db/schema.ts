/**
 * Schéma Drizzle — modèle de données Manabu.
 *
 * Hiérarchie contenu : courses → units → lessons → lesson_steps
 *   - une lesson_step est soit du contenu (`content`) soit un quiz (`quiz`)
 *   - une step de type `quiz` porte une quiz_questions associée (1-1)
 *
 * Auth : gérée par Better Auth (voir ADR 0003 et `src/db/auth-schema.ts`).
 * La table `user` (générée par Better Auth) porte l'identité, le rôle
 * (`learner`/`admin`, plugin admin), le bannissement (= désactivation) et les
 * champs applicatifs (XP, série, fuseau). On y référence `user.id` (text).
 *
 * Complétion des leçons : pilotée par les vies, pas par un score (ADR 0001).
 * L'état d'une tentative en cours (étape courante, vies restantes, file de
 * remise) est persisté sur `user_lesson_progress` pour permettre la reprise.
 *
 * Le contenu variable (choix de quiz, corps de leçon, médias) est stocké en
 * `jsonb` pour rester flexible et cohérent avec le format d'import JSON.
 */
import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

// Tables d'authentification gérées par Better Auth (générées).
import { user } from './auth-schema.ts'

// Re-export pour que `db` (et drizzle-kit) connaissent toutes les tables.
export * from './auth-schema.ts'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const stepTypeEnum = pgEnum('step_type', ['content', 'quiz'])

export const questionTypeEnum = pgEnum('question_type', [
  'single_choice',
  'multiple_choice',
  'match',
  'fill_blank',
  'reorder',
])

export const progressStatusEnum = pgEnum('progress_status', [
  'not_started',
  'in_progress',
  'completed',
])

// ---------------------------------------------------------------------------
// Contenu pédagogique
// ---------------------------------------------------------------------------

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique('courses_slug_unique').on(t.slug)],
)

export const units = pgTable(
  'units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
  },
  (t) => [index('units_course_id_idx').on(t.courseId)],
)

export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    unitId: uuid('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
  },
  (t) => [index('lessons_unit_id_idx').on(t.unitId)],
)

export const lessonSteps = pgTable(
  'lesson_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    type: stepTypeEnum('type').notNull(),
    // Pour type=content : { title?, body(markdown), media? }
    contentBody: jsonb('content_body'),
  },
  (t) => [index('lesson_steps_lesson_id_idx').on(t.lessonId)],
)

export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonStepId: uuid('lesson_step_id')
      .notNull()
      .references(() => lessonSteps.id, { onDelete: 'cascade' }),
    type: questionTypeEnum('type').notNull(),
    prompt: text('prompt').notNull(),
    explanation: text('explanation'),
    // Payload variable selon `type` (choices/correctIndex, pairs, tokens, etc.)
    data: jsonb('data').notNull(),
  },
  (t) => [unique('quiz_questions_lesson_step_id_unique').on(t.lessonStepId)],
)

// ---------------------------------------------------------------------------
// Progression & tentative en cours
// ---------------------------------------------------------------------------

export const userLessonProgress = pgTable(
  'user_lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: progressStatusEnum('status').notNull().default('not_started'),

    // État d'une tentative en cours (null hors tentative) — permet la reprise.
    currentStepId: uuid('current_step_id').references(() => lessonSteps.id, {
      onDelete: 'set null',
    }),
    heartsRemaining: integer('hearts_remaining'),
    // Ids d'étapes quiz ratées à re-présenter avant la fin (file de remise).
    requeueStepIds: jsonb('requeue_step_ids'),
    // Vrai tant qu'aucune vie n'a été perdue sur la tentative en cours/complétée.
    perfect: boolean('perfect'),

    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('user_lesson_progress_user_lesson_unique').on(t.userId, t.lessonId),
    index('user_lesson_progress_user_id_idx').on(t.userId),
  ],
)

export const userStepAttempts = pgTable(
  'user_step_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    lessonStepId: uuid('lesson_step_id')
      .notNull()
      .references(() => lessonSteps.id, { onDelete: 'cascade' }),
    isCorrect: boolean('is_correct').notNull(),
    answeredAt: timestamp('answered_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('user_step_attempts_user_id_idx').on(t.userId)],
)

// ---------------------------------------------------------------------------
// Gamification : badges & journal d'XP
// ---------------------------------------------------------------------------

export const badges = pgTable(
  'badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
  },
  (t) => [unique('badges_code_unique').on(t.code)],
)

export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    badgeId: uuid('badge_id')
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique('user_badges_user_badge_unique').on(t.userId, t.badgeId)],
)

export const xpEvents = pgTable(
  'xp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('xp_events_user_id_idx').on(t.userId)],
)

// ---------------------------------------------------------------------------
// Relations (pour les requêtes relationnelles de Drizzle)
// ---------------------------------------------------------------------------

export const coursesRelations = relations(courses, ({ many }) => ({
  units: many(units),
}))

export const unitsRelations = relations(units, ({ one, many }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  steps: many(lessonSteps),
  progress: many(userLessonProgress),
}))

export const lessonStepsRelations = relations(lessonSteps, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonSteps.lessonId],
    references: [lessons.id],
  }),
  question: one(quizQuestions, {
    fields: [lessonSteps.id],
    references: [quizQuestions.lessonStepId],
  }),
}))

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  step: one(lessonSteps, {
    fields: [quizQuestions.lessonStepId],
    references: [lessonSteps.id],
  }),
}))

export const userLessonProgressRelations = relations(
  userLessonProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [userLessonProgress.userId],
      references: [user.id],
    }),
    lesson: one(lessons, {
      fields: [userLessonProgress.lessonId],
      references: [lessons.id],
    }),
  }),
)

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(user, {
    fields: [userBadges.userId],
    references: [user.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}))
