import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { requireUser } from '../../lib/auth/session'
import { getLearningPath } from '../../server/functions/lessons'
import { syncTimezone } from '../../server/functions/gamification'

export const Route = createFileRoute('/learn/')({
  beforeLoad: () => requireUser(),
  loader: async () => ({ path: await getLearningPath() }),
  component: LearnPath,
})

function LearnPath() {
  const { path } = Route.useLoaderData()

  // Détecte et enregistre le fuseau de l'apprenant (pour le calcul de la série).
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz) syncTimezone({ data: tz }).catch(() => {})
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Apprendre</h1>
        <Link to="/profile" className="text-sm underline">
          Profil
        </Link>
      </header>

      {path.length === 0 && (
        <p className="text-gray-500">Aucun cours publié pour l'instant.</p>
      )}

      {path.map((course) => (
        <section key={course.id} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{course.title}</h2>
          {course.units.map((unit) => (
            <div key={unit.id} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-gray-500">{unit.title}</h3>
              {unit.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </main>
  )
}

type LessonItem = {
  id: string
  title: string
  status: 'not_started' | 'in_progress' | 'completed'
  locked: boolean
}

function LessonRow({ lesson }: { lesson: LessonItem }) {
  const icon =
    lesson.status === 'completed' ? '✅' : lesson.locked ? '🔒' : lesson.status === 'in_progress' ? '▶️' : '⭕'

  if (lesson.locked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3 opacity-50">
        <span>{icon}</span>
        <span className="flex-1">{lesson.title}</span>
      </div>
    )
  }

  return (
    <Link
      to="/learn/$lessonId"
      params={{ lessonId: lesson.id }}
      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
    >
      <span>{icon}</span>
      <span className="flex-1 font-medium">{lesson.title}</span>
      {lesson.status === 'completed' && (
        <span className="text-xs text-green-600">terminée</span>
      )}
    </Link>
  )
}
