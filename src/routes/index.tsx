import { Link, createFileRoute } from '@tanstack/react-router'
import { useSession } from '../lib/auth/auth-client'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session, isPending } = useSession()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-4xl font-bold">Manabu</h1>
        <p className="mt-2 text-gray-600">
          Apprends en t'amusant : leçons et quiz gamifiés.
        </p>
      </div>

      {isPending ? null : session?.user ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">Bonjour {session.user.name} 👋</p>
          <Link
            to="/learn"
            className="min-h-11 rounded-md bg-black px-4 py-2 font-medium text-white"
          >
            Continuer à apprendre
          </Link>
          <Link to="/profile" className="underline">
            Mon profil
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            to="/register"
            className="min-h-11 rounded-md bg-black px-4 py-2 font-medium text-white"
          >
            Créer un compte
          </Link>
          <Link to="/login" className="underline">
            J'ai déjà un compte
          </Link>
        </div>
      )}
    </main>
  )
}
