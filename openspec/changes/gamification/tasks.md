## 1. Moteur de gamification (serveur)

- [ ] 1.1 `src/server/functions/gamification.ts` : XP (base + bonus « parfait », `xp_events`)
- [ ] 1.2 Logique de streak (jour civil dans `user.timezone` ; +1 / reset / no-op)
- [ ] 1.3 Logique de vies par tentative : init à 3, décrément, échec à 0, réinit à la reprise
- [ ] 1.4 Évaluation et attribution des badges (idempotente)
- [ ] 1.5 Détection du fuseau côté client + stockage sur `user.timezone`

## 2. Intégration au player

- [ ] 2.1 Brancher XP + streak à la complétion (même transaction que la progression)
- [ ] 2.2 Décrémenter une vie sur réponse incorrecte dans `submitStep`
- [ ] 2.3 Échec à 0 vie → recommencer immédiatement (vies fraîches)
- [ ] 2.4 Déverrouillage linéaire strict : vérifier le prérequis à l'ouverture du player

## 3. UI gamification

- [ ] 3.1 `src/components/gamification/` : barre d'XP, compteur de streak, vies (de la tentative)
- [ ] 3.2 Verrous visuels sur les leçons dans `/learn`
- [ ] 3.3 Écran de résultat enrichi (XP gagnée, streak, badge débloqué)
- [ ] 3.4 `src/routes/profile.tsx` : XP total, streak, badges obtenus

## 4. Vérification

- [ ] 4.1 Compléter une leçon → XP + streak mis à jour, `xp_events` créé
- [ ] 4.2 Enchaîner des erreurs → vies décrémentées puis échec à 0 + reprise immédiate
- [ ] 4.3 Tenter une leçon verrouillée → refus ; la débloquer en complétant le prérequis
- [ ] 4.4 Déclencher les badges « Premiers pas » et « Une semaine ! »
