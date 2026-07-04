## Why

Pour maximiser l'engagement façon Duolingo, l'app doit récompenser et motiver : XP, série de jours (streak), vies, déverrouillage progressif et badges. Ces mécaniques s'ajoutent par-dessus le player de leçon.

## What Changes

- **XP** : attribution d'XP à la complétion d'une leçon (bonus si leçon parfaite = aucune vie perdue), journalisée dans `xp_events`, cumulée sur `user.xp_total`.
- **Streak** : incrémenté le jour où l'apprenant complète ≥ 1 leçon, calculé dans le **fuseau de l'apprenant** (`user.timezone`) ; remise à zéro si un jour est manqué.
- **Vies (hearts) par tentative** : chaque tentative démarre avec des vies fraîches (défaut 3) ; une mauvaise réponse en décrémente une ; à 0, la tentative échoue et peut être recommencée **immédiatement** (pas de pool global, pas de timer de régénération) — voir ADR 0001.
- **Déverrouillage progressif** : ordre linéaire strict (séquence aplatie des leçons d'un cours).
- **Badges** : attribution automatique selon des critères (première leçon, leçon parfaite, streak 7 jours, cours terminé) et affichage sur le profil.
- Indicateurs UI : barre d'XP, compteur de streak, vies (de la tentative), badges.

## Capabilities

### New Capabilities
- `gamification`: XP, streak, vies, déverrouillage progressif et badges par-dessus le parcours d'apprentissage.

### Modified Capabilities
- `lesson-player`: la complétion déclenche désormais les effets de gamification (XP, streak) et la consommation de vies s'applique aux erreurs ; le player respecte le verrouillage.

## Impact

- Dépend de `lesson-player` et `authentication`.
- Code : `src/server/functions/gamification.ts`, hooks dans `progress.ts`, `src/components/gamification/**`, `src/routes/profile.tsx`, mise à jour de `learn/*`.
- Données : `user` (xp_total, streak, timezone), état de tentative sur `user_lesson_progress` (hearts_remaining…), `xp_events`, `badges`, `user_badges`.
