import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { Markdown } from '../../../lib/markdown'
import { QuizPlayer } from '../../../components/quiz/QuizPlayer'
import type { QuizData } from '../../../db/schema'
import { requireAdmin } from '../../../lib/auth/session'
import { evaluateAnswer } from '../../../lib/quiz-eval'
import { getLessonForPreview } from '../../../server/functions/content'

export const Route = createFileRoute('/admin/lessons/$lessonId/preview')({
  beforeLoad: () => requireAdmin(),
  loader: async ({ params }) => {
    const lesson = await getLessonForPreview({ data: params.lessonId })
    if (!lesson) throw notFound()
    return { lesson }
  },
  component: PreviewPage,
})

function PreviewPage() {
  const { lesson } = Route.useLoaderData()
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<boolean | null>(null)

  const step = lesson.steps[index]
  const done = index >= lesson.steps.length

  function next() {
    setFeedback(null)
    setIndex((i) => i + 1)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
          Prévisualisation (à blanc — rien n'est enregistré)
        </span>
        <Link to="/admin" className="text-sm underline">
          Fermer
        </Link>
      </header>

      {done ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-4xl">👀</p>
          <p className="font-medium">Fin de la prévisualisation.</p>
          <button
            onClick={() => setIndex(0)}
            className="min-h-11 rounded-lg border px-4"
          >
            Rejouer
          </button>
        </div>
      ) : step.type === 'content' ? (
        <div className="flex flex-col gap-6">
          {step.contentBody?.title && (
            <h2 className="text-xl font-bold">{step.contentBody.title}</h2>
          )}
          <Markdown>{step.contentBody?.body ?? ''}</Markdown>
          <button onClick={next} className="min-h-11 rounded-lg bg-black px-4 py-3 font-medium text-white">
            Continuer
          </button>
        </div>
      ) : step.question ? (
        feedback === null ? (
          <QuizPlayer
            question={toPublic(step.question.type, step.question.prompt, step.question.data)}
            disabled={false}
            onSubmit={(answer) =>
              setFeedback(evaluateAnswer(step.question!.type, step.question!.data, answer))
            }
          />
        ) : (
          <div
            className={`flex flex-col gap-3 rounded-lg p-4 ${
              feedback ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <p className={`font-bold ${feedback ? 'text-green-700' : 'text-red-700'}`}>
              {feedback ? '✓ Correct' : '✗ Incorrect'}
            </p>
            {step.question.explanation && (
              <p className="text-sm text-gray-700">{step.question.explanation}</p>
            )}
            <button onClick={next} className="min-h-11 rounded-lg bg-black px-4 py-3 font-medium text-white">
              Continuer
            </button>
          </div>
        )
      ) : null}
    </main>
  )
}

function toPublic(type: string, prompt: string, data: QuizData) {
  return {
    type,
    prompt,
    choices: data.choices,
    tokens: data.tokens,
    lefts: data.pairs?.map((p) => p.left),
    rights: data.pairs?.map((p) => p.right),
  }
}
