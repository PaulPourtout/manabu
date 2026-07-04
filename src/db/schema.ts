/**
 * Schéma Drizzle — modèle de données Manabu.
 *
 * Hiérarchie contenu : courses → units → lessons → lesson_steps
 *   - une lesson_step est soit du contenu (`content`) soit un quiz (`quiz`)
 *   - une step de type `quiz` porte une quiz_questions associée (1-1)
 *
 * Auth : gérée par Clerk. On ne stocke ni mot de passe ni session ici ;
 * `user_profiles` est le miroir local d'un utilisateur Clerk (clé `clerkUserId`),
 * enrichi des données propres à l'app (rôle, gamification).
 *
 * Le contenu variable (choix de quiz, corps de leçon, médias) est stocké en
 * `jsonb` pour rester flexible et cohérent avec le format d'import JSON.
 */
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum('user_role', ['learner', 'admin'])

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
// Utilisateurs (miroir local de Clerk)
// ---------------------------------------------------------------------------

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').notNull(),
    email: text('email'),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('learner'),

    // Gamification
    xpTotal: integer('xp_total').notNull().default(0),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    lastActivityDate: timestamp('last_activity_date', { withTimezone: true }),
    hearts: integer('hearts').notNull().default(5),
    heartsRefillAt: timestamp('hearts_refill_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique('user_profiles_clerk_user_id_unique').on(t.clerkUserId)],
)

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
    // Seuil de réussite au quiz pour valider la leçon (0..1)
    passThreshold: real('pass_threshold').notNull().default(0.7),
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
  (t) => [
    unique('quiz_questions_lesson_step_id_unique').on(t.lessonStepId),
  ],
)

// ---------------------------------------------------------------------------
// Progression & gamification
// ---------------------------------------------------------------------------

export const userLessonProgress = pgTable(
  'user_lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: progressStatusEnum('status').notNull().default('not_started'),
    bestScore: real('best_score'),
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
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
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
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
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
    userId: uuid('user_id')
      .notNull()
      .references(() => userProfiles.id, { onDelete: 'cascade' }),
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

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  progress: many(userLessonProgress),
  attempts: many(userStepAttempts),
  badges: many(userBadges),
  xpEvents: many(xpEvents),
}))

export const userLessonProgressRelations = relations(
  userLessonProgress,
  ({ one }) => ({
    user: one(userProfiles, {
      fields: [userLessonProgress.userId],
      references: [userProfiles.id],
    }),
    lesson: one(lessons, {
      fields: [userLessonProgress.lessonId],
      references: [lessons.id],
    }),
  }),
)

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userBadges.userId],
    references: [userProfiles.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}))

// Le `sql` import est réservé aux futures colonnes générées / defaults SQL.
void sql
