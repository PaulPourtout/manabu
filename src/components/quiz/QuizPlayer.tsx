import { useState } from 'react'

export type PublicQuestion = {
  type: string
  prompt: string
  choices?: string[]
  tokens?: string[]
  lefts?: string[]
  rights?: string[]
}

const BTN = 'min-h-11 rounded-lg border px-4 py-3 text-left'

/** Collecte la réponse selon le type de quiz et la remonte via onSubmit. */
export function QuizPlayer({
  question,
  disabled,
  onSubmit,
}: {
  question: PublicQuestion
  disabled: boolean
  onSubmit: (answer: unknown) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{question.prompt}</h2>
      {question.type === 'single_choice' && (
        <SingleChoice choices={question.choices ?? []} disabled={disabled} onSubmit={onSubmit} />
      )}
      {question.type === 'multiple_choice' && (
        <MultipleChoice choices={question.choices ?? []} disabled={disabled} onSubmit={onSubmit} />
      )}
      {question.type === 'fill_blank' && <FillBlank disabled={disabled} onSubmit={onSubmit} />}
      {question.type === 'reorder' && (
        <Reorder tokens={question.tokens ?? []} disabled={disabled} onSubmit={onSubmit} />
      )}
      {question.type === 'match' && (
        <Match
          lefts={question.lefts ?? []}
          rights={question.rights ?? []}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      )}
    </div>
  )
}

function SubmitBtn({ disabled, ok }: { disabled: boolean; ok: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled || !ok}
      className="min-h-11 rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-40"
    >
      Valider
    </button>
  )
}

function SingleChoice({
  choices,
  disabled,
  onSubmit,
}: {
  choices: string[]
  disabled: boolean
  onSubmit: (a: unknown) => void
}) {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (sel !== null) onSubmit(sel)
      }}
      className="flex flex-col gap-3"
    >
      {choices.map((c, i) => (
        <button
          type="button"
          key={i}
          disabled={disabled}
          onClick={() => setSel(i)}
          className={`${BTN} ${sel === i ? 'border-black bg-gray-100' : ''}`}
        >
          {c}
        </button>
      ))}
      <SubmitBtn disabled={disabled} ok={sel !== null} />
    </form>
  )
}

function MultipleChoice({
  choices,
  disabled,
  onSubmit,
}: {
  choices: string[]
  disabled: boolean
  onSubmit: (a: unknown) => void
}) {
  const [sel, setSel] = useState<number[]>([])
  const toggle = (i: number) =>
    setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(sel)
      }}
      className="flex flex-col gap-3"
    >
      {choices.map((c, i) => (
        <button
          type="button"
          key={i}
          disabled={disabled}
          onClick={() => toggle(i)}
          className={`${BTN} ${sel.includes(i) ? 'border-black bg-gray-100' : ''}`}
        >
          {sel.includes(i) ? '☑ ' : '☐ '}
          {c}
        </button>
      ))}
      <SubmitBtn disabled={disabled} ok={sel.length > 0} />
    </form>
  )
}

function FillBlank({ disabled, onSubmit }: { disabled: boolean; onSubmit: (a: unknown) => void }) {
  const [v, setV] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (v.trim()) onSubmit(v)
      }}
      className="flex flex-col gap-3"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        disabled={disabled}
        className="min-h-11 rounded-lg border px-4"
        placeholder="Ta réponse"
      />
      <SubmitBtn disabled={disabled} ok={v.trim().length > 0} />
    </form>
  )
}

function Reorder({
  tokens,
  disabled,
  onSubmit,
}: {
  tokens: string[]
  disabled: boolean
  onSubmit: (a: unknown) => void
}) {
  const [order, setOrder] = useState<number[]>([])
  const used = new Set(order)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(order.map((i) => tokens[i]))
      }}
      className="flex flex-col gap-3"
    >
      <div className="min-h-11 rounded-lg border border-dashed p-2">
        {order.map((i, pos) => (
          <button
            type="button"
            key={pos}
            disabled={disabled}
            onClick={() => setOrder((o) => o.filter((_, p) => p !== pos))}
            className="m-1 rounded border bg-gray-100 px-2 py-1"
          >
            {tokens[i]}
          </button>
        ))}
      </div>
      <div>
        {tokens.map((t, i) =>
          used.has(i) ? null : (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => setOrder((o) => [...o, i])}
              className="m-1 rounded border px-2 py-1"
            >
              {t}
            </button>
          ),
        )}
      </div>
      <SubmitBtn disabled={disabled} ok={order.length === tokens.length} />
    </form>
  )
}

function Match({
  lefts,
  rights,
  disabled,
  onSubmit,
}: {
  lefts: string[]
  rights: string[]
  disabled: boolean
  onSubmit: (a: unknown) => void
}) {
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const complete = lefts.every((l) => pairs[l])
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(lefts.map((l) => ({ left: l, right: pairs[l] })))
      }}
      className="flex flex-col gap-3"
    >
      {lefts.map((l) => (
        <div key={l} className="flex items-center gap-2">
          <span className="flex-1">{l}</span>
          <select
            disabled={disabled}
            value={pairs[l] ?? ''}
            onChange={(e) => setPairs((p) => ({ ...p, [l]: e.target.value }))}
            className="min-h-11 flex-1 rounded-lg border px-2"
          >
            <option value="">—</option>
            {rights.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      ))}
      <SubmitBtn disabled={disabled} ok={complete} />
    </form>
  )
}
