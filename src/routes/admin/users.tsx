import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { requireAdmin } from '../../lib/auth/session'
import { listUsers, setUserBanned, setUserRole } from '../../server/functions/users'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: () => requireAdmin(),
  loader: async () => listUsers({ data: 0 }),
  component: UsersPage,
})

function UsersPage() {
  const { users } = Route.useLoaderData()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function run(p: Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    const res = await p
    if (!res.ok) setError(res.error ?? 'Action refusée')
    router.invalidate()
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <Link to="/admin" className="text-sm underline">
          ← Back-office
        </Link>
      </header>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <ul className="flex flex-col gap-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"
          >
            <div className="flex-1">
              <p className="font-medium">
                {u.name}{' '}
                {u.banned && (
                  <span className="rounded bg-red-100 px-1.5 text-xs text-red-700">
                    désactivé
                  </span>
                )}
              </p>
              <p className="text-gray-500">{u.email}</p>
            </div>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{u.role}</span>
            <button
              onClick={() =>
                run(setUserRole({ data: { userId: u.id, role: u.role === 'admin' ? 'learner' : 'admin' } }))
              }
              className="min-h-9 rounded border px-2"
            >
              {u.role === 'admin' ? '↓ learner' : '↑ admin'}
            </button>
            <button
              onClick={() => run(setUserBanned({ data: { userId: u.id, banned: !u.banned } }))}
              className="min-h-9 rounded border px-2"
            >
              {u.banned ? 'Réactiver' : 'Désactiver'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
