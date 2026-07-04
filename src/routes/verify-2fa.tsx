import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth/auth-client'

export const Route = createFileRoute('/verify-2fa')({ component: Verify2faPage })

function Verify2faPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await authClient.twoFactor.verifyTotp({ code })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? 'Code invalide')
      return
    }
    navigate({ to: '/learn' })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Vérification en deux étapes</h1>
      <p className="text-sm text-gray-600">
        Saisis le code à 6 chiffres de ton application d'authentification.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-md border px-3 py-2 text-center text-lg tracking-widest"
          placeholder="000000"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="min-h-11 rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? '…' : 'Vérifier'}
        </button>
      </form>
    </main>
  )
}
