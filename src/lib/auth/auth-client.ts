/**
 * Client Better Auth (navigateur).
 *
 * baseURL par défaut = origine courante. Expose les helpers utilisés par l'UI
 * ainsi que les plugins client (MFA, admin).
 */
import { createAuthClient } from 'better-auth/react'
import { adminClient, twoFactorClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [twoFactorClient(), adminClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
