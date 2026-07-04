# Complétion des leçons pilotée par les vies (par tentative), sans seuil de score

## Décision

La réussite d'une leçon n'est **pas** déterminée par un pourcentage de bonnes réponses. Une leçon est **terminée** quand toutes ses questions ont été **finalement réussies** sans épuiser les vies de la tentative. On supprime donc le seuil de score (`pass_threshold`) et la notion de `best_score`.

Mécanique retenue (façon Duolingo, avec un écart assumé) :

- **Vies par tentative** : chaque tentative de leçon démarre avec un stock de vies frais (défaut : **3**, ajustable). Les vies **ne sont pas** un pool global partagé entre leçons — elles sont propres à la tentative en cours. (⇒ suppression de `hearts` / `hearts_refill_at` sur `user_profiles`.)
- **Mauvaise réponse** : coûte une vie **et** la question est **remise en file** à la fin de la leçon ; il faut y répondre correctement pour terminer.
- **0 vie** : la tentative échoue. On peut **recommencer immédiatement** la leçon depuis le début avec des vies fraîches — **aucun timer/cooldown de régénération**.
- **Reprise en cours** : l'état d'une tentative non terminée (étape courante, vies restantes, file de remise) est **persisté** ; fermer l'onglet puis revenir reprend exactement où on s'était arrêté (exigence PRD §5). Seules les leçons **complétées** sont définitivement acquises.
- **Leçon « parfaite »** (pour le bonus d'XP / badge) = terminée **sans aucune vie perdue**.

## Pourquoi

- **Cohérence** : le seuil de % et les vies répondaient tous deux à « que se passe-t-il quand on se trompe ? » de façon incompatible. Une seule mécanique, plus lisible.
- **Ludique** : perdre des vies est plus engageant et immédiat qu'un pourcentage final.
- **Écart vs Duolingo (vies par tentative plutôt que pool global)** : choix délibéré pour un jeu plus permissif, sans blocage transverse ni économie de vies à gérer en v1 ; en contrepartie, moins d'« enjeu » global et pas de gate temporel.

## Conséquences

- **Schéma** : retirer `lessons.pass_threshold`, `user_lesson_progress.best_score`, `user_profiles.hearts` et `user_profiles.hearts_refill_at`. Ajouter un état de tentative en cours (étape courante + vies restantes + file de remise) persisté (p. ex. sur `user_lesson_progress` ou une table de tentative dédiée).
- **Specs OpenSpec** : réécrire les scénarios de `lesson-player` et `gamification` liés au score/seuil et aux vies globales/régénération.
- **Docs** : `PRD.md` (§4.3/§4.4) et `ARCHITECTURE.md` (modèle de données, §11) à aligner.
