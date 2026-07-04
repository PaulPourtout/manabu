/**
 * Évaluation pure d'une réponse de quiz (aucune dépendance serveur).
 * Partagée par le serveur (progress.ts) et la prévisualisation admin (client).
 */
import type { QuizData } from '../db/schema'

export function evaluateAnswer(type: string, data: QuizData, answer: unknown): boolean {
  switch (type) {
    case 'single_choice':
      return answer === data.correctIndex
    case 'multiple_choice': {
      if (!Array.isArray(answer)) return false
      const a = [...(answer as number[])].sort()
      const b = [...(data.correctIndexes ?? [])].sort()
      return a.length === b.length && a.every((v, i) => v === b[i])
    }
    case 'fill_blank': {
      const norm = (s: string) => s.trim().toLowerCase()
      const accepted = [data.answer ?? '', ...(data.acceptableAnswers ?? [])].map(norm)
      return typeof answer === 'string' && accepted.includes(norm(answer))
    }
    case 'reorder': {
      if (!Array.isArray(answer)) return false
      const correct = (data.correctOrder ?? []).map((i) => (data.tokens ?? [])[i])
      return (answer as string[]).join('') === correct.join('')
    }
    case 'match': {
      if (!Array.isArray(answer)) return false
      const chosen = new Map(
        (answer as { left: string; right: string }[]).map((p) => [p.left, p.right]),
      )
      return (data.pairs ?? []).every((p) => chosen.get(p.left) === p.right)
    }
    default:
      return false
  }
}
