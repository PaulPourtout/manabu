# Clerk (publicMetadata) est la source de vérité du rôle

> **CADUC — remplacé par l'ADR [0003](./0003-better-auth-plutot-que-clerk.md).** Le projet abandonne Clerk au profit de Better Auth (auto-hébergé) ; le rôle est désormais possédé par notre base. Ce qui suit est conservé pour trace historique.

## Décision

Le rôle d'un utilisateur (`learner` / `admin`) a pour **source de vérité les `publicMetadata` du compte Clerk**, pas notre base. `user_profiles.role` n'est qu'un **miroir** synchronisé depuis Clerk par le webhook (`user.created`, `user.updated`).

- **Bootstrap du 1er admin** : on positionne `publicMetadata.role = "admin"` sur l'utilisateur dans le **dashboard Clerk** (après qu'il se soit inscrit via l'app). Le webhook propage vers `user_profiles`. → **Pas** de promotion par `UPDATE` SQL (elle serait écrasée au prochain `user.updated`).
- **Promotion / rétrogradation ultérieure** : via la page back-office _user-management_, qui écrit dans Clerk (API `updateUserMetadata`) ; le webhook met à jour le miroir local.
- **Autorisation** : les guards s'appuient sur le rôle (miroir `user_profiles.role`, alimenté par Clerk) ; ne jamais éditer `user_profiles.role` à la main, ce serait sans effet durable.

## Pourquoi

- Clerk possède déjà l'identité et les sessions ; centraliser le rôle au même endroit évite deux sources divergentes.
- Les changements de rôle transitent par un seul canal (Clerk → webhook → miroir), ce qui rend la synchro déterministe.
- Écarté : « notre base source de vérité + bootstrap SQL » — plus autonome vis-à-vis de Clerk, mais crée un conflit avec le webhook et deux chemins d'écriture du rôle.

## Conséquences

- **Lock-in** : la gestion des rôles dépend du dashboard/API Clerk.
- **Webhook critique** : la fiabilité de la synchro repose sur le webhook ; prévoir un fallback (relecture des `sessionClaims` Clerk) si le miroir local est en retard.
- **Docs à aligner** : `auth-clerk-mfa` (webhook sync du rôle depuis publicMetadata), `user-management` (écrit via Clerk, pas en base direct), README (procédure de bootstrap via dashboard Clerk). Abandon de la procédure « UPDATE SQL » pour le rôle.
