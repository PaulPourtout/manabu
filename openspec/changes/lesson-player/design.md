## Context

Le player est mobile-first (usage au pouce). L'état d'une session de leçon (étape courante, réponses) est éphémère côté client, mais chaque validation d'étape est persistée serveur pour permettre la reprise.

## Goals / Non-Goals

**Goals:**
- Rendu fidèle et fluide des étapes contenu + 5 types de quiz.
- Feedback immédiat, une action principale par écran.
- Progression persistée par étape ; reprise fiable.
- Calcul de score et complétion selon `pass_threshold`.

**Non-Goals:**
- Gamification (XP/streak/vies/déblocage) — traitée par `gamification`.
- Mode hors-ligne complet.

## Decisions

- **État de session** : store léger (Zustand) pour l'étape courante et les réponses en cours ; source de vérité de progression = serveur.
- **Server functions** : `getLearningPath`, `getLessonForPlay(lessonId)` (avec reprise), `submitStep` (enregistre `user_step_attempts` + met à jour `user_lesson_progress`).
- **Évaluation quiz** : effectuée **côté serveur** dans `submitStep` (ne pas faire confiance au client) ; la bonne réponse n'est renvoyée qu'après soumission.
- **Composants quiz** : un composant par type sous `src/components/quiz/`, pilotés par `question.type` et `question.data`.
- **Score** : ratio de réponses correctes sur les étapes quiz de la leçon ; complétion si ≥ `pass_threshold`.
- **Reprise** : `getLessonForPlay` calcule la première étape non validée à partir de `user_step_attempts`.

## Risks / Trade-offs

- **Anti-triche** : évaluation serveur uniquement ; les payloads de réponses correctes ne transitent pas avant soumission.
- **Sync client/serveur** : la validation d'étape est un aller-retour serveur ; acceptable (une action à la fois). Optimistic UI possible en amélioration.
