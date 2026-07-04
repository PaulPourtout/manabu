## Context

Le format d'import est spécifié dans `docs/LESSON_FORMAT.md`. L'import doit être sûr (validation stricte, atomicité) et réutiliser au maximum la validation de `content-authoring`.

## Goals / Non-Goals

**Goals:**
- Parsing + validation Zod du fichier complet avant toute écriture.
- Insertion transactionnelle (rollback total en cas d'erreur).
- Messages d'erreur exploitables (chemin du champ).
- Gestion explicite des conflits de slug.

**Non-Goals:**
- Import de médias en pièce jointe (URLs externes seulement en v1).
- Import incrémental / mise à jour partielle fine (hors v1).

## Decisions

- **Schéma Zod dédié import** (`src/lib/validation/import.ts`) composé à partir des schémas de contenu, reflétant le format documenté (course/units/lessons/steps/quiz).
- **Server function** `importCourse` protégée `requireAdmin`, exécutée dans une transaction Drizzle (`db.transaction`).
- **Erreurs** : les erreurs Zod (avec `path`) sont renvoyées telles quelles et formatées côté UI.
- **Conflit de slug** : détection avant insertion ; l'import est refusé et demande un nouveau slug. Pas de mise à jour en place en v1 (évite toute perte de progression liée aux `lesson.id` existants).
- **UI** : upload de fichier OU zone de texte JSON, aperçu du nombre d'unités/leçons détectées avant confirmation.

## Risks / Trade-offs

- **Gros fichiers** : validation en mémoire ; acceptable pour la v1 (cours de taille raisonnable). Limite de taille appliquée.
- **Divergence format/doc** : la source de vérité est `docs/LESSON_FORMAT.md` ; le schéma Zod doit rester aligné (test de conformité sur l'exemple du doc).
