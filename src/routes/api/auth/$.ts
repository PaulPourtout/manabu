import { createFileRoute } from '@tanstack/react-router'
import { auth } from '../../../lib/auth/auth'

/**
 * Monte le handler Better Auth sur /api/auth/* (toutes les opérations d'auth :
 * sign-in/up/out, MFA, admin, etc.).
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
})
