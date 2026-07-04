/**
 * Configuration serveur Better Auth.
 *
 * Auth auto-hébergée dans notre PostgreSQL (adapter Drizzle). Voir ADR 0003.
 * - email + mot de passe
 * - MFA (plugin twoFactor : TOTP + codes de secours)
 * - rôles + bannissement (plugin admin) : rôle `learner` par défaut, `admin` = back-office
 * - champs applicatifs additionnels (gamification, fuseau) portés par la table user
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, twoFactor } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '../../db/index.ts'
import {
  account,
  session,
  twoFactor as twoFactorTable,
  user,
  verification,
} from '../../db/auth-schema.ts'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, twoFactor: twoFactorTable },
  }),
  emailAndPassword: {
    enabled: true,
    // v1 dev : pas de vérification d'email (nécessiterait un provider d'envoi).
    // À passer à true en prod une fois l'email branché (cf. tasks 4.x).
    requireEmailVerification: false,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      xpTotal: { type: 'number', required: false, defaultValue: 0, input: false },
      currentStreak: { type: 'number', required: false, defaultValue: 0, input: false },
      longestStreak: { type: 'number', required: false, defaultValue: 0, input: false },
      lastActivityDate: { type: 'date', required: false, input: false },
      timezone: { type: 'string', required: false, input: false },
    },
  },
  plugins: [
    twoFactor({ issuer: 'Manabu' }),
    admin({ defaultRole: 'learner', adminRoles: ['admin'] }),
    // Doit rester en dernier : gère les cookies dans le contexte TanStack Start.
    tanstackStartCookies(),
  ],
})
