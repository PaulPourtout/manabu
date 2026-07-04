import { createFileRoute } from '@tanstack/react-router'
import { requireAdmin } from '../../lib/auth/session'

// Placeholder protégé (admin + MFA) — le back-office réel est construit par `content-authoring`.
export const Route = createFileRoute('/admin/')({
  beforeLoad: () => requireAdmin(),
  component: AdminIndex,
})

function AdminIndex() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Back-office</h1>
      <p className="text-gray-600">
        Réservé aux administrateurs (MFA requise). Contenu à venir.
      </p>
    </main>
  )
}
