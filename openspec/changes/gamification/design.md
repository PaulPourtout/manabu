## Context

La gamification se greffe sur `lesson-player` : les événements de complétion et d'erreur alimentent XP, streak, vies et badges. Les calculs sensibles sont côté serveur.

## Goals / Non-Goals

**Goals:**
- XP journalisée et cumulée, streak fiable (par jour civil), vies avec régénération, déblocage progressif, badges automatiques.
- UI claire des indicateurs (XP, streak, vies, badges).

**Non-Goals:**
- Achat de vies / monétisation (hors v1).
- Ligues, classements sociaux, gel de streak (v2).
- Notifications de rappel (v2).

## Decisions

- **Effets côté serveur** : `submitStep`/complétion appellent des helpers de `gamification.ts` dans la même transaction que la progression (cohérence).
- **XP** : montant de base par leçon + bonus parfait ; chaque gain = une ligne `xp_events` + incrément `xp_total`.
- **Streak** : comparaison `last_activity_date` (jour civil, fuseau serveur) ; +1 si hier, reset si trou, no-op si déjà aujourd'hui.
- **Vies** : `hearts` sur le profil ; décrément à l'erreur ; `hearts_refill_at` planifie la régénération (calcul paresseux à la lecture : on recharge si le délai est passé). Politique exacte (délai, régén partielle) paramétrable — valeur par défaut à confirmer (cf. ARCHITECTURE §11).
- **Déblocage** : dérivé de `user_lesson_progress` (leçon N jouable si N-1 `completed`) ; vérifié serveur à l'ouverture du player.
- **Badges** : évaluation des critères après chaque complétion ; insertion `user_badges` idempotente (contrainte unique user+badge).

## Risks / Trade-offs

- **Fuseau horaire du streak** : basé serveur en v1 (simple) ; la personnalisation par utilisateur est une amélioration future.
- **Régénération paresseuse des vies** : évite un job planifié en v1 ; suffisant tant qu'on recalcule à la lecture.
- **Couplage transactionnel** progression ↔ gamification : voulu pour éviter les états incohérents (XP sans complétion, etc.).
