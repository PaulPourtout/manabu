import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import type { ContentBody } from '../../../db/schema'
import type { QuestionInput } from '../../../lib/validation/content'
import { requireAdmin } from '../../../lib/auth/session'

// Types explicites de l'arbre (le nesting relationnel ne se propage pas via le loader).
type StepNode = {
  id: string
  type: 'content' | 'quiz'
  position: number
  contentBody: ContentBody | null
  question: { id: string; type: string; prompt: string } | null
}
type Lesson = { id: string; title: string; position: number; steps: StepNode[] }
type Unit = { id: string; title: string; position: number; lessons: Lesson[] }
type CourseNode = {
  id: string
  title: string
  description: string | null
  units: Unit[]
}
import {
  createContentStep,
  createLesson,
  createQuizStep,
  createUnit,
  deleteEntity,
  getCourseTree,
  renameEntity,
  reorder,
  updateCourse,
} from '../../../server/functions/content'

export const Route = createFileRoute('/admin/courses/$courseId')({
  beforeLoad: () => requireAdmin(),
  loader: async ({ params }) => {
    const course = await getCourseTree({ data: params.courseId })
    if (!course) throw notFound()
    return { course }
  },
  component: CourseEditor,
})

function CourseEditor() {
  const course = Route.useLoaderData().course as unknown as CourseNode
  const router = useRouter()
  const refresh = () => router.invalidate()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <Link to="/admin" className="text-sm underline">
        ← Retour
      </Link>
      <CourseHeader
        id={course.id}
        title={course.title}
        description={course.description}
        onSaved={refresh}
      />

      <div className="flex flex-col gap-4">
        {course.units.map((unit, ui) => (
          <UnitBlock
            key={unit.id}
            unit={unit}
            index={ui}
            total={course.units.length}
            siblingIds={course.units.map((u) => u.id)}
            onChange={refresh}
          />
        ))}
      </div>

      <AddForm
        placeholder="Nouvelle unité"
        onAdd={async (title) => {
          await createUnit({ data: { courseId: course.id, title } })
          refresh()
        }}
      />
    </main>
  )
}

function CourseHeader({
  id,
  title,
  description,
  onSaved,
}: {
  id: string
  title: string
  description: string | null
  onSaved: () => void
}) {
  const [t, setT] = useState(title)
  const [d, setD] = useState(description ?? '')
  return (
    <section className="flex flex-col gap-2 rounded-lg border p-4">
      <input
        value={t}
        onChange={(e) => setT(e.target.value)}
        className="rounded-md border px-3 py-2 text-lg font-semibold"
      />
      <textarea
        value={d}
        onChange={(e) => setD(e.target.value)}
        placeholder="Description"
        className="rounded-md border px-3 py-2 text-sm"
        rows={2}
      />
      <button
        onClick={async () => {
          await updateCourse({ data: { id, title: t, description: d } })
          onSaved()
        }}
        className="self-start min-h-9 rounded-md border px-3 text-sm"
      >
        Enregistrer
      </button>
    </section>
  )
}

function UnitBlock({
  unit,
  index,
  total,
  siblingIds,
  onChange,
}: {
  unit: Unit
  index: number
  total: number
  siblingIds: string[]
  onChange: () => void
}) {
  return (
    <section className="rounded-lg border p-3">
      <RowHeader
        title={unit.title}
        index={index}
        total={total}
        onRename={(title) => renameEntity({ data: { entity: 'unit', id: unit.id, title } }).then(onChange)}
        onDelete={() => deleteEntity({ data: { entity: 'unit', id: unit.id } }).then(onChange)}
        onMove={(dir) => move(siblingIds, index, dir, 'unit').then(onChange)}
      />
      <div className="mt-3 flex flex-col gap-3 pl-3">
        {unit.lessons.map((lesson, li) => (
          <LessonBlock
            key={lesson.id}
            lesson={lesson}
            index={li}
            total={unit.lessons.length}
            siblingIds={unit.lessons.map((l) => l.id)}
            onChange={onChange}
          />
        ))}
        <AddForm
          placeholder="Nouvelle leçon"
          onAdd={async (title) => {
            await createLesson({ data: { unitId: unit.id, title } })
            onChange()
          }}
        />
      </div>
    </section>
  )
}

function LessonBlock({
  lesson,
  index,
  total,
  siblingIds,
  onChange,
}: {
  lesson: Lesson
  index: number
  total: number
  siblingIds: string[]
  onChange: () => void
}) {
  const [adding, setAdding] = useState<'none' | 'content' | 'quiz'>('none')
  return (
    <div className="rounded-md border bg-gray-50 p-3">
      <RowHeader
        title={lesson.title}
        index={index}
        total={total}
        onRename={(title) => renameEntity({ data: { entity: 'lesson', id: lesson.id, title } }).then(onChange)}
        onDelete={() => deleteEntity({ data: { entity: 'lesson', id: lesson.id } }).then(onChange)}
        onMove={(dir) => move(siblingIds, index, dir, 'lesson').then(onChange)}
      />
      <ol className="mt-2 flex flex-col gap-1 pl-3 text-sm">
        {lesson.steps.map((step, si) => (
          <li key={step.id} className="flex items-center justify-between gap-2">
            <span>
              {si + 1}.{' '}
              {step.type === 'content'
                ? `📄 ${step.contentBody?.title ?? 'Contenu'}`
                : `❓ ${step.question?.prompt ?? 'Quiz'} (${step.question?.type})`}
            </span>
            <button
              onClick={() => deleteEntity({ data: { entity: 'step', id: step.id } }).then(onChange)}
              className="text-xs text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex gap-2 pl-3">
        <button onClick={() => setAdding('content')} className="rounded border px-2 py-1 text-xs">
          + Contenu
        </button>
        <button onClick={() => setAdding('quiz')} className="rounded border px-2 py-1 text-xs">
          + Quiz
        </button>
        {lesson.steps.length > 0 && (
          <Link
            to="/admin/lessons/$lessonId/preview"
            params={{ lessonId: lesson.id }}
            className="rounded border px-2 py-1 text-xs"
          >
            👁 Prévisualiser
          </Link>
        )}
      </div>
      {adding === 'content' && (
        <ContentStepForm
          lessonId={lesson.id}
          onDone={() => {
            setAdding('none')
            onChange()
          }}
        />
      )}
      {adding === 'quiz' && (
        <QuizStepForm
          lessonId={lesson.id}
          onDone={() => {
            setAdding('none')
            onChange()
          }}
        />
      )}
    </div>
  )
}

function RowHeader({
  title,
  index,
  total,
  onRename,
  onDelete,
  onMove,
}: {
  title: string
  index: number
  total: number
  onRename: (t: string) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [t, setT] = useState(title)
  return (
    <div className="flex items-center gap-2">
      <input
        value={t}
        onChange={(e) => setT(e.target.value)}
        onBlur={() => t !== title && onRename(t)}
        className="flex-1 rounded border bg-white px-2 py-1 font-medium"
      />
      <button disabled={index === 0} onClick={() => onMove(-1)} className="px-1 disabled:opacity-30">
        ↑
      </button>
      <button
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        className="px-1 disabled:opacity-30"
      >
        ↓
      </button>
      <button onClick={onDelete} className="px-1 text-red-600">
        🗑
      </button>
    </div>
  )
}

function AddForm({
  placeholder,
  onAdd,
}: {
  placeholder: string
  onAdd: (title: string) => void | Promise<void>
}) {
  const [v, setV] = useState('')
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!v.trim()) return
        await onAdd(v.trim())
        setV('')
      }}
      className="flex gap-2"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        className="min-h-9 flex-1 rounded-md border px-2 text-sm"
      />
      <button className="min-h-9 rounded-md border px-3 text-sm">Ajouter</button>
    </form>
  )
}

function ContentStepForm({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!body.trim()) return
        await createContentStep({ data: { lessonId, title: title || undefined, body } })
        onDone()
      }}
      className="mt-2 flex flex-col gap-2 rounded border bg-white p-2"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre (optionnel)"
        className="rounded border px-2 py-1 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Contenu (Markdown)"
        className="rounded border px-2 py-1 text-sm"
        rows={3}
      />
      <button className="self-start rounded bg-black px-3 py-1 text-xs text-white">
        Ajouter le contenu
      </button>
    </form>
  )
}

const QUIZ_TYPES: { value: QuestionInput['type']; label: string }[] = [
  { value: 'single_choice', label: 'Choix unique' },
  { value: 'multiple_choice', label: 'Choix multiples' },
  { value: 'fill_blank', label: 'Texte à trous' },
]

function QuizStepForm({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const [type, setType] = useState<QuestionInput['type']>('single_choice')
  const [prompt, setPrompt] = useState('')
  const [choices, setChoices] = useState('')
  const [correct, setCorrect] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    let question: QuestionInput
    const choiceList = choices
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean)
    try {
      if (type === 'single_choice') {
        question = { type, prompt, choices: choiceList, correctIndex: Number(correct) }
      } else if (type === 'multiple_choice') {
        question = {
          type,
          prompt,
          choices: choiceList,
          correctIndexes: correct.split(',').map((n) => Number(n.trim())),
        }
      } else {
        question = { type: 'fill_blank', prompt, answer }
      }
      await createQuizStep({ data: { lessonId, question } })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de validation')
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded border bg-white p-2 text-sm">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as QuestionInput['type'])}
        className="rounded border px-2 py-1"
      >
        {QUIZ_TYPES.map((q) => (
          <option key={q.value} value={q.value}>
            {q.label}
          </option>
        ))}
      </select>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Question"
        className="rounded border px-2 py-1"
      />
      {(type === 'single_choice' || type === 'multiple_choice') && (
        <>
          <textarea
            value={choices}
            onChange={(e) => setChoices(e.target.value)}
            placeholder="Un choix par ligne"
            className="rounded border px-2 py-1"
            rows={3}
          />
          <input
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            placeholder={
              type === 'single_choice'
                ? 'Index de la bonne réponse (0, 1, …)'
                : 'Index corrects séparés par des virgules'
            }
            className="rounded border px-2 py-1"
          />
        </>
      )}
      {type === 'fill_blank' && (
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Réponse attendue"
          className="rounded border px-2 py-1"
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button className="self-start rounded bg-black px-3 py-1 text-xs text-white">
        Ajouter le quiz
      </button>
    </form>
  )
}

// Réordonnancement : construit le nouvel ordre et appelle le serveur.
function move(ids: string[], index: number, dir: -1 | 1, entity: 'unit' | 'lesson' | 'step') {
  const target = index + dir
  if (target < 0 || target >= ids.length) return Promise.resolve()
  const next = [...ids]
  ;[next[index], next[target]] = [next[target], next[index]]
  return reorder({ data: { entity, orderedIds: next } })
}
