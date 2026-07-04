/**
 * Gestion des utilisateurs (back-office) — user-management.
 * Rôle et bannissement sont des colonnes de `user` (source de vérité en base).
 * Le plugin admin de Better Auth refuse la session d'un utilisateur banni.
 * Garde-fou anti-lockout : on n'enlève pas / ne bannit pas le dernier admin.
 */
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.ts'
import { user } from '../../db/schema.ts'
import { assertAdmin } from '../../lib/auth/session.ts'

const PAGE_SIZE = 50

export const listUsers = createServerFn({ method: 'GET' })
  .validator((page: number = 0) => z.number().int().nonnegative().catch(0).parse(page))
  .handler(async ({ data: page }) => {
    await assertAdmin()
    const rows = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE)
    return { users: rows, page }
  })

async function otherAdminsExist(exceptUserId: string): Promise<boolean> {
  const n = await db.$count(
    user,
    and(eq(user.role, 'admin'), ne(user.id, exceptUserId)),
  )
  return n > 0
}

export const setUserRole = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z
      .object({ userId: z.string(), role: z.enum(['learner', 'admin']) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await assertAdmin()
    // Empêche de rétrograder le dernier admin.
    if (data.role === 'learner' && !(await otherAdminsExist(data.userId))) {
      return { ok: false as const, error: 'Impossible de rétrograder le dernier admin.' }
    }
    await db.update(user).set({ role: data.role }).where(eq(user.id, data.userId))
    return { ok: true as const }
  })

export const setUserBanned = createServerFn({ method: 'POST' })
  .validator((input: unknown) =>
    z.object({ userId: z.string(), banned: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const admin = await assertAdmin()
    if (data.banned && data.userId === admin.id) {
      return { ok: false as const, error: 'Tu ne peux pas te désactiver toi-même.' }
    }
    // Empêche de bannir le dernier admin.
    if (data.banned) {
      const target = await db.query.user.findFirst({ where: eq(user.id, data.userId) })
      if (target?.role === 'admin' && !(await otherAdminsExist(data.userId))) {
        return { ok: false as const, error: 'Impossible de désactiver le dernier admin.' }
      }
    }
    await db
      .update(user)
      .set({
        banned: data.banned,
        banReason: data.banned ? 'Désactivé par un administrateur' : null,
        banExpires: null,
      })
      .where(eq(user.id, data.userId))
    return { ok: true as const }
  })
