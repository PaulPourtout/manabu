import { Link, createFileRoute } from '@tanstack/react-router'
import { requireUser } from '../../lib/auth/session'

// Placeholder protégé — la carte de parcours réelle est construite par le change `lesson-player`.
export const Route = createFileRoute('/learn/')({
  beforeLoad: () => requireUser(),
  component: LearnIndex,
})

function LearnIndex() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Apprendre</h1>
      <p className="text-gray-600">
        Ta carte de parcours apparaîtra ici (à venir).
      </p>
      <Link to="/profile" className="underline">
        Mon profil
      </Link>
    </main>
  )
}
