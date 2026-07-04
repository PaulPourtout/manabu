/**
 * Moteur de gamification (serveur) : XP, série (streak), badges.
 * Appelé à la complétion d'une leçon depuis `progress.ts`. Voir ADR 0001.
 */
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db/index.ts'
import {
  badges,
  lessons,
  units,
  user,
  userBadges,
  userLessonProgress,
  xpEvents,
} from '../../db/schema.ts'
import { requireUser } from '../../lib/auth/session.ts'

const XP_BASE = 10
const XP_PERFECT_BONUS = 5
const DEFAULT_TZ = 'Europe/Paris'

/** Jour civil (YYYY-MM-DD) dans un fuseau donné. */
function civilDay(date: Date, tz: string): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: tz })
  } catch {
    return date.toLocaleDateString('en-CA', { timeZone: DEFAULT_TZ })
  }
}

async function awardBadge(userId: string, code: string, out: string[]) {
  const badge = await db.query.badges.findFirst({ where: eq(badges.code, code) })
  if (!badge) return
  const inserted = await db
    .insert(userBadges)
    .values({ userId, badgeId: badge.id })
    .onConflictDoNothing({ target: [userBadges.userId, userBadges.badgeId] })
    .returning()
  if (inserted.length > 0) out.push(code)
}

/** Stats + badges de l'apprenant connecté (pour le profil). */
export const getMyGamification = createServerFn({ method: 'GET' }).handler(async () => {
  const authed = await requireUser()
  const u = await db.query.user.findFirst({ where: eq(user.id, authed.id) })
  const earned = await db.query.userBadges.findMany({
    where: eq(userBadges.userId, authed.id),
    with: { badge: true },
  })
  return {
    xpTotal: u?.xpTotal ?? 0,
    currentStreak: u?.currentStreak ?? 0,
    longestStreak: u?.longestStreak ?? 0,
    badges: earned.map((e) => ({
      code: e.badge.code,
      title: e.badge.title,
      icon: e.badge.icon,
      description: e.badge.description,
    })),
  }
})

/** Enregistre le fuseau de l'apprenant (détecté côté client) s'il a changé. */
export const syncTimezone = createServerFn({ method: 'POST' })
  .validator((tz: string) => String(tz).slice(0, 64))
  .handler(async ({ data: tz }) => {
    const authed = await requireUser()
    if (tz && authed.timezone !== tz) {
      await db.update(user).set({ timezone: tz }).where(eq(user.id, authed.id))
    }
    return { ok: true }
  })

export type CompletionReward = { xpGained: number; newBadges: string[] }

/**
 * À appeler quand une leçon vient d'être complétée. Attribue l'XP, met à jour la
 * série (fuseau de l'apprenant) et évalue les badges. Idempotent sur les badges.
 */
export async function onLessonCompleted(
  userId: string,
  lessonId: string,
  perfect: boolean,
  now: Date,
): Promise<CompletionReward> {
  const u = await db.query.user.findFirst({ where: eq(user.id, userId) })
  if (!u) return { xpGained: 0, newBadges: [] }

  // --- XP ---
  const xpGained = XP_BASE + (perfect ? XP_PERFECT_BONUS : 0)
  await db.insert(xpEvents).values({
    userId,
    amount: xpGained,
    reason: perfect ? 'lesson_complete_perfect' : 'lesson_complete',
  })

  // --- Streak (fuseau de l'apprenant) ---
  const tz = u.timezone ?? DEFAULT_TZ
  const today = civilDay(now, tz)
  const yesterday = civilDay(new Date(now.getTime() - 86_400_000), tz)
  const last = u.lastActivityDate ? civilDay(u.lastActivityDate, tz) : null

  let streak = u.currentStreak ?? 0
  if (last !== today) {
    streak = last === yesterday ? streak + 1 : 1
  }
  const longest = Math.max(u.longestStreak ?? 0, streak)

  await db
    .update(user)
    .set({
      xpTotal: (u.xpTotal ?? 0) + xpGained,
      currentStreak: streak,
      longestStreak: longest,
      lastActivityDate: now,
      updatedAt: now,
    })
    .where(eq(user.id, userId))

  // --- Badges ---
  const newBadges: string[] = []
  const completedCount = await db.$count(
    userLessonProgress,
    and(eq(userLessonProgress.userId, userId), eq(userLessonProgress.status, 'completed')),
  )
  if (completedCount >= 1) await awardBadge(userId, 'first_lesson', newBadges)
  if (perfect) await awardBadge(userId, 'perfect_lesson', newBadges)
  if (streak >= 7) await awardBadge(userId, 'streak_7', newBadges)

  // Cours terminé : toutes les leçons publiées du cours sont complétées.
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: { unit: true },
  })
  if (lesson) {
    const courseId = lesson.unit.courseId
    const courseUnits = await db.query.units.findMany({
      where: eq(units.courseId, courseId),
      with: { lessons: { columns: { id: true, isPublished: true } } },
    })
    const lessonIds = courseUnits
      .flatMap((un) => un.lessons)
      .filter((l) => l.isPublished)
      .map((l) => l.id)
    const completed = await db.query.userLessonProgress.findMany({
      where: and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.status, 'completed'),
      ),
      columns: { lessonId: true },
    })
    const completedSet = new Set(completed.map((c) => c.lessonId))
    if (lessonIds.length > 0 && lessonIds.every((id) => completedSet.has(id))) {
      await awardBadge(userId, 'course_complete', newBadges)
    }
  }

  return { xpGained, newBadges }
}
