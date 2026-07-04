## Why

Pour maximiser l'engagement façon Duolingo, l'app doit récompenser et motiver : XP, série de jours (streak), vies, déverrouillage progressif et badges. Ces mécaniques s'ajoutent par-dessus le player de leçon.

## What Changes

- **XP** : attribution d'XP à la complétion d'une leçon (bonus si score parfait), journalisée dans `xp_events`, cumulée sur le profil.
- **Streak** : incrémenté le jour où l'apprenant complète ≥ 1 leçon ; remise à zéro si un jour est manqué.
- **Vies (hearts)** : décrémentées à chaque mauvaise réponse en quiz ; à 0, la leçon en cours est bloquée jusqu'à régénération (par temps) ; régénération programmée.
- **Déverrouillage progressif** : une leçon/unité n'est jouable que si le prérequis précédent est complété.
- **Badges** : attribution automatique selon des critères (première leçon, leçon parfaite, streak 7 jours, cours terminé) et affichage sur le profil.
- Indicateurs UI : barre d'XP, compteur de streak, vies, badges.

## Capabilities

### New Capabilities
- `gamification`: XP, streak, vies, déverrouillage progressif et badges par-dessus le parcours d'apprentissage.

### Modified Capabilities
- `lesson-player`: la complétion d'étape/leçon déclenche désormais les effets de gamification (XP, streak, consommation de vies) et le player respecte le verrouillage et l'état des vies.

## Impact

- Dépend de `lesson-player` et `authentication`.
- Code : `src/server/functions/gamification.ts`, hooks dans `progress.ts`, `src/components/gamification/**`, `src/routes/profile.tsx`, mise à jour de `learn/*`.
- Données : `user_profiles` (xp_total, streak, hearts…), `xp_events`, `badges`, `user_badges`.
