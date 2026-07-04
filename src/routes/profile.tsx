import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { authClient, signOut, useSession } from '../lib/auth/auth-client'
import { requireUser } from '../lib/auth/session'
import { parseTotpUri } from '../lib/auth/totp-uri'
import { getMyGamification } from '../server/functions/gamification'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => requireUser(),
  loader: async () => ({ stats: await getMyGamification() }),
  component: ProfilePage,
})

function ProfilePage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { stats } = Route.useLoaderData()
  const user = session?.user

  async function onSignOut() {
    await signOut()
    navigate({ to: '/' })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      {user && (
        <section className="rounded-lg border p-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-gray-600">{user.email}</p>
          <p className="mt-2 text-gray-600">
            ⭐ {stats.xpTotal} XP · 🔥 Série {stats.currentStreak} j (record{' '}
            {stats.longestStreak})
          </p>
        </section>
      )}

      <section className="rounded-lg border p-4">
        <h2 className="font-semibold">Badges</h2>
        {stats.badges.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">Aucun badge pour l'instant.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-3">
            {stats.badges.map((b) => (
              <li key={b.code} className="flex flex-col items-center text-center text-xs">
                <span className="text-2xl">{b.icon ?? '🏅'}</span>
                <span>{b.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TwoFactorSection
        enabled={Boolean((user as { twoFactorEnabled?: boolean })?.twoFactorEnabled)}
      />

      <button
        onClick={onSignOut}
        className="min-h-11 rounded-md border px-4 py-2 font-medium"
      >
        Se déconnecter
      </button>
    </main>
  )
}

function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const [password, setPassword] = useState('')
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(enabled)

  async function startEnable(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await authClient.twoFactor.enable({ password })
    if (res.error) {
      setError(res.error.message ?? "Impossible d'activer le MFA")
      return
    }
    setTotpUri(res.data?.totpURI ?? null)
    setBackupCodes(res.data?.backupCodes ?? [])
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await authClient.twoFactor.verifyTotp({ code })
    if (res.error) {
      setError(res.error.message ?? 'Code invalide')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold">Double authentification</h2>
        <p className="mt-1 text-sm text-green-700">✓ MFA activée sur ce compte.</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-semibold">Double authentification (MFA)</h2>
      <p className="mt-1 text-sm text-gray-600">
        Recommandée. Obligatoire pour les comptes administrateurs.
      </p>

      {!totpUri ? (
        <form onSubmit={startEnable} className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Confirme ton mot de passe
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
          <button className="min-h-11 rounded-md bg-black px-4 py-2 font-medium text-white">
            Activer la MFA
          </button>
        </form>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm">
            Scanne le QR code avec Google Authenticator, ou saisis la clé
            manuellement (pas l&apos;URI complète).
          </p>
          {totpUri && (
            <div className="flex flex-col items-center gap-3 rounded-md border bg-white p-4">
              <QRCode
                value={totpUri}
                size={192}
                aria-label="QR code pour configurer la double authentification"
              />
              {(() => {
                const parsed = parseTotpUri(totpUri)
                if (!parsed) {
                  return (
                    <code className="break-all rounded bg-gray-100 p-2 text-xs">
                      {totpUri}
                    </code>
                  )
                }

                return (
                  <div className="w-full space-y-2 text-sm">
                    {parsed.issuer && (
                      <p className="text-gray-600">
                        Compte : {parsed.issuer}
                        {parsed.account ? ` (${parsed.account})` : ''}
                      </p>
                    )}
                    <label className="flex flex-col gap-1">
                      <span className="font-medium">Clé de configuration (base32)</span>
                      <code className="break-all rounded bg-gray-100 p-2 font-mono text-xs uppercase tracking-wide">
                        {parsed.secret}
                      </code>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(parsed.secret)}
                      className="min-h-11 rounded-md border px-4 py-2 text-sm font-medium"
                    >
                      Copier la clé
                    </button>
                  </div>
                )
              })()}
            </div>
          )}
          {backupCodes.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer">
                Codes de secours ({backupCodes.length}) — à conserver, pas pour
                l&apos;app d&apos;authentification
              </summary>
              <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          )}
          <form onSubmit={confirm} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Code à 6 chiffres
              <input
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-md border px-3 py-2 text-center tracking-widest"
                placeholder="000000"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="min-h-11 rounded-md bg-black px-4 py-2 font-medium text-white">
              Confirmer
            </button>
          </form>
        </div>
      )}
    </section>
  )
}
