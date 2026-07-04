/**
 * Accès à la session et guards côté serveur.
 *
 * `getCurrentUser` est une server function : lit la session Better Auth à partir
 * des en-têtes de la requête. `requireUser` / `requireAdmin` s'utilisent dans le
 * `beforeLoad` des routes pour protéger l'accès (vérification côté serveur).
 */
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

/** MFA admin exigée par défaut ; désactivable en dev via AUTH_REQUIRE_ADMIN_MFA=false. */
const REQUIRE_ADMIN_MFA = process.env.AUTH_REQUIRE_ADMIN_MFA !== 'false'

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    return session?.user ?? null
  },
)

/** Exige un utilisateur authentifié ; sinon redirige vers /login. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw redirect({ to: '/login' })
  }
  return user
}

/**
 * Exige un admin ; sinon redirige. Impose aussi l'enrôlement MFA pour les admins
 * (sauf si assoupli en dev). À utiliser dans le `beforeLoad` des routes.
 */
export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') {
    throw redirect({ to: '/' })
  }
  if (REQUIRE_ADMIN_MFA && !user.twoFactorEnabled) {
    // Second facteur non enrôlé : on renvoie vers le profil pour l'activer.
    throw redirect({ to: '/profile' })
  }
  return user
}

/**
 * Variante pour les server functions (mutations) : lève une erreur 403 au lieu
 * de rediriger. Défense en profondeur en plus des guards de route.
 */
export async function assertAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 })
  }
  return user
}
