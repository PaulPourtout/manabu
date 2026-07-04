## Why

C'est le cœur de l'expérience apprenant : dérouler une leçon (étapes de contenu + quiz) façon Duolingo, avec feedback immédiat, et sauvegarder la progression pour pouvoir reprendre plus tard.

## What Changes

- Carte de parcours `/learn` : cours publiés, unités et leçons, avec état de progression et verrouillage.
- Player de leçon `/learn/$lessonId` : progression étape par étape, barre de progression, une action principale visible.
- Rendu des étapes de contenu (Markdown + média) et des 5 types de quiz (choix unique/multiple, association, texte à trous, remise en ordre).
- Feedback immédiat sur les réponses de quiz (correct/incorrect + explication).
- Sauvegarde de progression par étape (reprise en cours de leçon) et écran de résultat en fin de leçon (score).
- Calcul du score et statut de complétion selon le seuil de réussite de la leçon.

## Capabilities

### New Capabilities
- `lesson-player`: parcours et exécution d'une leçon par l'apprenant, rendu des étapes/quiz, sauvegarde de progression et résultat.

### Modified Capabilities
<!-- Aucune. La gamification (XP/streak/vies/déblocage) est ajoutée par le change `gamification`. -->

## Impact

- Dépend de `authentication` (`requireUser`) et de contenu existant (`content-authoring` / `course-import`).
- Code : `src/routes/learn/index.tsx`, `src/routes/learn/$lessonId.tsx`, `src/components/lesson/**`, `src/components/quiz/**`, `src/server/functions/lessons.ts`, `progress.ts`.
- Données : lecture `courses/units/lessons/lesson_steps/quiz_questions` ; écriture `user_lesson_progress`, `user_step_attempts`.
