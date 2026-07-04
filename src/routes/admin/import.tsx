import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { requireAdmin } from '../../lib/auth/session'
import type { ImportResult } from '../../server/functions/import'
import { importCourse } from '../../server/functions/import'

export const Route = createFileRoute('/admin/import')({
  beforeLoad: () => requireAdmin(),
  component: ImportPage,
})

function ImportPage() {
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [slugOverride, setSlugOverride] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setRaw(await file.text())
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    const res = await importCourse({
      data: { raw, slugOverride: slugOverride || undefined },
    })
    setLoading(false)
    setResult(res)
    if (res.ok) {
      navigate({ to: '/admin/courses/$courseId', params: { courseId: res.courseId } })
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Importer un cours (JSON)</h1>
      <p className="text-sm text-gray-600">
        Format attendu : voir <code>docs/LESSON_FORMAT.md</code>. L'import crée un
        nouveau cours (aucune mise à jour d'un cours existant).
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input type="file" accept="application/json,.json" onChange={onFile} className="text-sm" />
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{ "course": { "title": "…" }, "units": [ … ] }'
          className="min-h-64 rounded-md border p-3 font-mono text-xs"
        />

        {result && !result.ok && 'slug' in result && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
            <p>
              Le slug <code>{result.slug}</code> existe déjà. Choisis un nouveau
              slug pour créer un cours distinct :
            </p>
            <input
              value={slugOverride}
              onChange={(e) => setSlugOverride(e.target.value)}
              placeholder="nouveau-slug"
              className="mt-2 w-full rounded border px-2 py-1"
            />
          </div>
        )}

        {result && !result.ok && !('slug' in result) && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
            <p className="font-medium text-red-700">{result.error}</p>
            {'issues' in result && result.issues && (
              <ul className="mt-2 list-disc pl-5 text-red-700">
                {result.issues.map((i, idx) => (
                  <li key={idx}>
                    <code>{i.path || '(racine)'}</code> : {i.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !raw.trim()}
          className="min-h-11 rounded-md bg-black px-4 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Import…' : 'Importer'}
        </button>
      </form>
    </main>
  )
}
