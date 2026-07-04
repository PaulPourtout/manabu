## Context

La gamification se greffe sur `lesson-player`. Les calculs sensibles sont côté serveur. Modèle de vies et de complétion : voir ADR 0001 (vies par tentative, sans seuil de score). Streak calculé dans le fuseau de l'apprenant.

## Goals / Non-Goals

**Goals:**
- XP journalisée et cumulée ; leçon parfaite = aucune vie perdue.
- Streak fiable par jour civil dans le fuseau de l'apprenant.
- Vies par tentative (défaut 3), échec → reprise immédiate.
- Déblocage linéaire strict ; badges automatiques.

**Non-Goals:**
- Pool de vies global, timer de régénération, achat de vies (écartés en v1).
- Ligues, classements sociaux, gel de streak, notifications (v2).

## Decisions

- **Effets côté serveur, transactionnels** : `submitStep` / complétion appellent les helpers de `gamification.ts` dans la même transaction que la progression.
- **XP** : montant de base par leçon + bonus si `perfect` ; chaque gain = une ligne `xp_events` + incrément `user.xp_total`.
- **Streak** : comparaison du dernier jour d'activité au jour courant, tous deux exprimés dans `user.timezone` (détecté côté client, stocké sur `user`). +1 si hier, reset si trou, no-op si déjà aujourd'hui.
- **Vies** : `hearts_remaining` sur l'état de tentative (`user_lesson_progress`), initialisé à 3 au début d'une tentative ; décrément à l'erreur ; à 0, tentative échouée → réinitialisation à la reprise. Pas de pool global, pas de `hearts_refill_at`.
- **Déblocage** : dérivé de `user_lesson_progress` sur la séquence aplatie du cours ; vérifié serveur à l'ouverture du player.
- **Badges** : évaluation des critères après complétion ; insertion `user_badges` idempotente (unique user+badge).

## Risks / Trade-offs

- **Fuseau streak** : dépend d'un fuseau détecté/valide ; fallback raisonnable si absent.
- **Permissivité** : vies par tentative + reprise immédiate = faible friction (choix assumé, ADR 0001).
- **Couplage transactionnel** progression ↔ gamification : voulu pour éviter les états incohérents.
