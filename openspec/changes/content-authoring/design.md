## Context

Le contenu suit la hiérarchie cours → unités → leçons → étapes → question. Les admins ont besoin d'un CRUD ergonomique, y compris pour le contenu variable des quiz stocké en `jsonb`.

## Goals / Non-Goals

**Goals:**
- CRUD complet et validé (Zod) sur toute la hiérarchie.
- Réordonnancement simple par `position`.
- Publication contrôlée et prévisualisation fidèle au player.

**Non-Goals:**
- Édition collaborative temps réel, versionning fin (hors v1).
- Éditeur riche WYSIWYG (Markdown simple suffit en v1).

## Decisions

- **Server functions** (`createServerFn`) pour toutes les mutations, protégées par `requireAdmin`.
- **Validation Zod partagée** entre back-office et import JSON (`src/lib/validation/content.ts`) : mêmes schémas pour un quiz `single_choice`, `match`, etc.
- **jsonb** : le payload de quiz édité via des sous-formulaires typés par `question.type`, sérialisé dans `quiz_questions.data`.
- **Prévisualisation** : réutilise les composants du `lesson-player` en mode « lecture seule / non comptabilisé ».
- **Réordonnancement** : mise à jour en lot des `position` (drag & drop côté UI, batch update côté serveur).

## Risks / Trade-offs

- **Cohérence jsonb** : le typage fort côté Zod limite les payloads invalides ; un quiz invalide est refusé à la sauvegarde.
- **Couplage preview ↔ player** : accepté et voulu (source unique de rendu).
