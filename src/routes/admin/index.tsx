import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { requireAdmin } from '../../lib/auth/session'
import {
  createCourse,
  deleteCourse,
  listCourses,
  setCoursePublished,
} from '../../server/functions/content'

export const Route = createFileRoute('/admin/')({
  beforeLoad: () => requireAdmin(),
  loader: async () => ({ courses: await listCourses() }),
  component: AdminDashboard,
})

function AdminDashboard() {
  const { courses } = Route.useLoaderData()
  const router = useRouter()
  const [title, setTitle] = useState('')

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await createCourse({ data: { title: title.trim() } })
    setTitle('')
    router.invalidate()
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Back-office</h1>
        <div className="flex gap-3 text-sm">
          {/* Routes créées par les changes course-import / user-management. */}
          <a href="/admin/import" className="underline">
            Importer
          </a>
          <a href="/admin/users" className="underline">
            Utilisateurs
          </a>
        </div>
      </header>

      <form onSubmit={onCreate} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du nouveau cours"
          className="min-h-11 flex-1 rounded-md border px-3"
        />
        <button className="min-h-11 rounded-md bg-black px-4 font-medium text-white">
          Créer
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {courses.length === 0 && (
          <li className="text-gray-500">Aucun cours pour l'instant.</li>
        )}
        {courses.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <Link
              to="/admin/courses/$courseId"
              params={{ courseId: c.id }}
              className="flex-1 font-medium hover:underline"
            >
              {c.title}
              <span
                className={`ml-2 rounded px-2 py-0.5 text-xs ${
                  c.isPublished
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {c.isPublished ? 'publié' : 'brouillon'}
              </span>
            </Link>
            <button
              onClick={async () => {
                await setCoursePublished({
                  data: { id: c.id, isPublished: !c.isPublished },
                })
                router.invalidate()
              }}
              className="min-h-9 rounded-md border px-3 text-sm"
            >
              {c.isPublished ? 'Dépublier' : 'Publier'}
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Supprimer « ${c.title} » ?`)) return
                await deleteCourse({ data: c.id })
                router.invalidate()
              }}
              className="min-h-9 rounded-md border border-red-300 px-3 text-sm text-red-600"
            >
              Suppr.
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}
