## Context

Le player est mobile-first (usage au pouce). L'état d'une tentative en cours (étape courante, file de remise, vies restantes) est **persisté** sur `user_lesson_progress` pour permettre la reprise à l'identique (exigence PRD §5). La complétion est pilotée par les vies (ADR 0001), sans seuil de score.

## Goals / Non-Goals

**Goals:**
- Rendu fidèle et fluide des étapes contenu + 5 types de quiz.
- Feedback immédiat ; remise en file des questions ratées.
- État de tentative persisté par étape ; reprise fiable.
- Complétion quand toutes les questions sont finalement réussies.

**Non-Goals:**
- Mécaniques de vies / XP / streak / déblocage — apportées par `gamification`.
- Mode hors-ligne complet.

## Decisions

- **Évaluation serveur** : `submitStep` évalue la réponse côté serveur (jamais confiance au client) ; la bonne réponse n'est renvoyée qu'après soumission.
- **File de remise** : une question ratée est ajoutée à `requeueStepIds` (sur `user_lesson_progress`) et re-présentée après les étapes restantes ; la leçon se termine quand la file est vide et toutes les questions réussies.
- **État de tentative** : `currentStepId`, `heartsRemaining`, `requeueStepIds`, `perfect` persistés à chaque étape → reprise exacte.
- **Composants quiz** : un composant par type sous `src/components/quiz/`, pilotés par `question.type` et `question.data`.
- **Store de session** : store léger (Zustand) pour l'UI de l'étape en cours ; la source de vérité de progression reste le serveur.
- **Reprise vs redémarrage** : une tentative en cours reprend (PRD §5) ; un échec (0 vie) recommence à zéro immédiatement (voir `gamification`).

## Risks / Trade-offs

- **Anti-triche** : évaluation serveur uniquement.
- **Aller-retour serveur par étape** : acceptable (une action à la fois) ; optimistic UI possible en amélioration.
