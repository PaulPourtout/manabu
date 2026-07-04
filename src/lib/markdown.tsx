/**
 * Rendu Markdown minimal et **sûr** : produit des éléments React (jamais de HTML
 * brut / dangerouslySetInnerHTML), donc aucune surface d'injection XSS.
 * Supporte : paragraphes, listes `- `, **gras**, *italique*, `code`.
 */
import type { ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens: ReactNode[] = []
  // On découpe sur **gras**, *italique*, `code`.
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  const parts = text.split(regex)
  parts.forEach((part, i) => {
    if (!part) return
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) {
      tokens.push(<strong key={key}>{part.slice(2, -2)}</strong>)
    } else if (part.startsWith('*') && part.endsWith('*')) {
      tokens.push(<em key={key}>{part.slice(1, -1)}</em>)
    } else if (part.startsWith('`') && part.endsWith('`')) {
      tokens.push(
        <code key={key} className="rounded bg-gray-100 px-1">
          {part.slice(1, -1)}
        </code>,
      )
    } else {
      tokens.push(part)
    }
  })
  return tokens
}

export function Markdown({ children }: { children: string }) {
  const lines = children.split('\n')
  const blocks: ReactNode[] = []
  let list: string[] = []

  const flushList = (key: string) => {
    if (list.length === 0) return
    const items = [...list]
    blocks.push(
      <ul key={key} className="list-disc pl-5">
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    )
    list = []
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      list.push(trimmed.slice(2))
    } else {
      flushList(`ul-${i}`)
      if (trimmed) {
        blocks.push(<p key={`p-${i}`}>{renderInline(trimmed, `p-${i}`)}</p>)
      }
    }
  })
  flushList('ul-end')

  return <div className="flex flex-col gap-3 text-left leading-relaxed">{blocks}</div>
}
