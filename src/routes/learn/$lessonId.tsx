import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Markdown } from '../../lib/markdown'
import { QuizPlayer } from '../../components/quiz/QuizPlayer'
import { requireUser } from '../../lib/auth/session'
import { getLessonForPlay } from '../../server/functions/lessons'
import { startAttempt, submitStep } from '../../server/functions/progress'

export const Route = createFileRoute('/learn/$lessonId')({
  beforeLoad: () => requireUser(),
  loader: async ({ params }) => {
    const lesson = await getLessonForPlay({ data: params.lessonId })
    return { lesson }
  },
  component: LessonPlayer,
})

type Phase = 'answering' | 'feedback' | 'done' | 'failed'

function LessonPlayer() {
  const { lesson } = Route.useLoaderData()
  const navigate = useNavigate()
  const stepsById = useMemo(
    () => new Map((lesson?.steps ?? []).map((s) => [s.id, s])),
    [lesson],
  )
  const total = lesson?.steps.length ?? 0

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [hearts, setHearts] = useState(3)
  const [phase, setPhase] = useState<Phase>('answering')
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string | null } | null>(
    null,
  )
  const [solved, setSolved] = useState(0)
  const [busy, setBusy] = useState(false)
  const [reward, setReward] = useState<{ xpGained: number; newBadges: string[] }>({
    xpGained: 0,
    newBadges: [],
  })

  // Démarre ou reprend une tentative au montage.
  useEffect(() => {
    if (!lesson) return
    const a = lesson.attempt
    if (a && a.status === 'in_progress' && a.currentStepId) {
      setCurrentId(a.currentStepId)
      setHearts(a.heartsRemaining ?? 3)
    } else {
      startAttempt({ data: lessonId }).then((r) => {
        setCurrentId(r.currentStepId)
        setHearts(r.heartsRemaining)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.lessonId])

  if (!lesson) {
    return <Centered>Leçon introuvable.</Centered>
  }

  const lessonId = lesson.lessonId
  const current = currentId ? stepsById.get(currentId) : null

  async function handleSubmit(answer?: unknown) {
    if (!current || busy) return
    setBusy(true)
    const res = await submitStep({
      data: { lessonId, stepId: current.id, answer },
    })
    setBusy(false)
    setHearts(res.heartsRemaining)
    if (res.failed) {
      setPhase('failed')
      return
    }
    if (res.status === 'completed') {
      setReward({ xpGained: res.xpGained, newBadges: res.newBadges })
    }
    if (current.type === 'content') {
      setSolved((s) => s + 1)
      if (res.status === 'completed') setPhase('done')
      else setCurrentId(res.currentStepId)
      return
    }
    // Quiz : afficher le feedback avant de continuer.
    setFeedback({ correct: res.correct, explanation: res.explanation })
    if (res.correct) setSolved((s) => s + 1)
    setPhase(res.status === 'completed' ? 'done' : 'feedback')
    setCurrentId(res.currentStepId)
  }

  async function restart() {
    const r = await startAttempt({ data: lessonId })
    setCurrentId(r.currentStepId)
    setHearts(r.heartsRemaining)
    setSolved(0)
    setFeedback(null)
    setPhase('answering')
  }

  if (phase === 'failed') {
    return (
      <Centered>
        <p className="text-5xl">💔</p>
        <h1 className="text-2xl font-bold">Leçon ratée</h1>
        <p className="text-gray-600">Plus de vies. Tu peux recommencer.</p>
        <button onClick={restart} className="min-h-11 rounded-lg bg-black px-6 font-medium text-white">
          Recommencer
        </button>
        <Link to="/learn" className="underline">
          Retour au parcours
        </Link>
      </Centered>
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <p className="text-5xl">🎉</p>
        <h1 className="text-2xl font-bold">Leçon terminée !</h1>
        <p className="text-gray-600">Bravo, toutes les questions sont réussies.</p>
        <p className="text-lg font-semibold text-green-600">+{reward.xpGained} XP</p>
        {reward.newBadges.length > 0 && (
          <p className="text-sm">🏅 Nouveau badge : {reward.newBadges.join(', ')}</p>
        )}
        <button
          onClick={() => navigate({ to: '/learn' })}
          className="min-h-11 rounded-lg bg-black px-6 font-medium text-white"
        >
          Continuer
        </button>
      </Centered>
    )
  }

  const progress = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Link to="/learn" className="text-xl">
          ✕
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm" aria-label={`${hearts} vies`}>
          {'❤️'.repeat(Math.max(0, hearts))}
        </span>
      </header>

      <section className="flex-1">
        {phase === 'feedback' && feedback ? (
          <FeedbackCard
            feedback={feedback}
            onNext={() => {
              setFeedback(null)
              setPhase('answering')
            }}
          />
        ) : current?.type === 'content' ? (
          <div className="flex flex-col gap-6">
            {current.body.title && <h2 className="text-xl font-bold">{current.body.title}</h2>}
            <Markdown>{current.body.body}</Markdown>
            <button
              onClick={() => handleSubmit()}
              disabled={busy}
              className="min-h-11 rounded-lg bg-black px-4 py-3 font-medium text-white"
            >
              Continuer
            </button>
          </div>
        ) : current?.type === 'quiz' ? (
          <QuizPlayer question={current.question} disabled={busy} onSubmit={handleSubmit} />
        ) : (
          <p className="text-gray-500">Chargement…</p>
        )}
      </section>
    </main>
  )
}

function FeedbackCard({
  feedback,
  onNext,
}: {
  feedback: { correct: boolean; explanation: string | null }
  onNext: () => void
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg p-4 ${
        feedback.correct ? 'bg-green-50' : 'bg-red-50'
      }`}
    >
      <p className={`text-lg font-bold ${feedback.correct ? 'text-green-700' : 'text-red-700'}`}>
        {feedback.correct ? '✓ Correct !' : '✗ Pas tout à fait'}
      </p>
      {!feedback.correct && (
        <p className="text-sm text-gray-700">
          Cette question te sera reposée en fin de leçon.
        </p>
      )}
      {feedback.explanation && <p className="text-sm text-gray-700">{feedback.explanation}</p>}
      <button
        onClick={onNext}
        className="min-h-11 rounded-lg bg-black px-4 py-3 font-medium text-white"
      >
        Continuer
      </button>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  )
}
