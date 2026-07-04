import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { signIn } from '../lib/auth/auth-client'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signIn.email({ email, password })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? 'Échec de la connexion')
      return
    }
    // Si le MFA est actif, Better Auth demande une vérification du 2e facteur.
    if ((res.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      navigate({ to: '/verify-2fa' })
      return
    }
    navigate({ to: '/learn' })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border px-3 py-2"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border px-3 py-2"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? '…' : 'Se connecter'}
        </button>
      </form>
      <p className="text-center text-sm">
        Pas de compte ?{' '}
        <Link to="/register" className="underline">
          Créer un compte
        </Link>
      </p>
    </main>
  )
}
