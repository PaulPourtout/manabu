# Journal de bord — Manabu

Suivi de l'évolution du projet : ce qui est fait, en cours, et planifié.
Le détail fonctionnel/technique est dans `docs/` ; le suivi d'implémentation des
features est piloté par **OpenSpec** (`openspec/changes/`).

---

## Méthode de travail

- **Documentation** : `docs/PRD.md` (produit), `docs/ARCHITECTURE.md` (technique), `docs/LESSON_FORMAT.md` (format d'import).
- **Spec-driven** : chaque fonctionnalité = un « change » OpenSpec (`proposal` → `specs` → `design` → `tasks`).
  - Lister : `openspec list` · Détail : `openspec show <change>` · Valider : `openspec validate <change>`
  - Implémenter : `/opsx:apply` (ou skill `openspec-apply-change`) · Archiver une fois fini : `/opsx:archive`.
- **Journal** : ce fichier, mis à jour à chaque jalon.

---

## Fait

### 2026-07-03 — Cadrage & documentation
- Rédaction du PRD, de l'architecture technique et du format d'import JSON (`docs/`).
- Décisions validées : **TanStack Start** (React/TS), **Drizzle ORM**, **PostgreSQL**, **Clerk** (auth + MFA), **Docker** (dev + prod), gamification complète, mobile-first.

### 2026-07-04 — Fondations du projet
- **Git** initialisé (branche `main`) + `.gitignore` / `.dockerignore`.
- **OpenSpec** initialisé (`openspec/`, outillage Claude dans `.claude/`).
- **Scaffold TanStack Start** via le CLI officiel avec add-ons **Clerk**, **Drizzle**, **shadcn/ui**, **TanStack Query**.
  - Provider Clerk basculé sur `@clerk/tanstack-react-start` (SDK client + serveur).
  - Route racine adaptée : `lang="fr"`, `<title>Manabu</title>`, meta description, viewport `viewport-fit=cover`.
  - Build de prod (`pnpm build` → Nitro node-server) ✅ et serveur de dev (SSR, HTTP 200) ✅ vérifiés.
  - Note outillage : `verify-deps-before-run=false` (`.npmrc`) + `onlyBuiltDependencies` (`pnpm-workspace.yaml`) pour esbuild/lightningcss.
- **Drizzle + PostgreSQL** :
  - Schéma complet (11 tables) : `user_profiles`, `courses`, `units`, `lessons`, `lesson_steps`, `quiz_questions`, `user_lesson_progress`, `user_step_attempts`, `badges`, `user_badges`, `xp_events` + enums + relations.
  - Migration initiale générée (`drizzle/0000_init.sql`).
  - Seed de démo idempotent (`src/db/seed.ts`) : 4 badges + 1 cours publié (unité/leçon/contenu/quiz).
  - **Validé de bout en bout** contre une vraie DB : `migrate` + `seed` OK (1 cours, 1 leçon, 2 étapes, 1 quiz, 4 badges), seed rejouable sans doublon.
- **Docker (dev + prod)** :
  - `docker/docker-compose.yml` : Postgres 16 (healthcheck, volume) + app en dev (hot-reload, migrate au boot).
  - `docker/docker-compose.prod.yml` : override prod (build image, pas de bind mount).
  - `docker/Dockerfile` multi-stage (deps → build → prod-deps → runtime) + `entrypoint.sh` (migrate puis start).
  - Postgres testé via compose (conteneur `healthy`).
- **Change proposals OpenSpec créés et validés** (5) :
  - `auth-clerk-mfa` — auth Clerk, profil local synchronisé (webhook), rôles, MFA admin.
  - `content-authoring` — back-office CRUD contenu + publication + prévisualisation.
  - `course-import` — import JSON transactionnel + validation.
  - `lesson-player` — carte de parcours + player (contenu + 5 types de quiz) + progression.
  - `gamification` — XP, streak, vies, déblocage progressif, badges (modifie `lesson-player`).

---

### 2026-07-04 — Grilling, décisions produit & bascule Better Auth

- **Session de grilling** (skill `grill-with-docs`) : création de `CONTEXT.md` (glossaire) et des ADR.
- **Décisions actées** :
  - Complétion **pilotée par les vies**, sans seuil de score ; **vies par tentative** (3), remise en file, échec → reprise immédiate, **pas de timer** (ADR 0001).
  - Reprise en cours de leçon **persistée**.
  - Déverrouillage **linéaire strict** ; streak dans le **fuseau de l'apprenant**.
  - Preview **interactive à blanc** ; contenu **assaini** (Markdown, médias HTTPS image/audio).
  - Import **création seule** (slug conflit → nouveau slug).
  - **Bascule Clerk → Better Auth** (auto-hébergé, MFA gratuite, rôle en base ; ADR 0003, ADR 0002 caduc). Désactivation = ban/unban Better Auth.
- **Réconciliation appliquée** :
  - Fondation : deps (`better-auth`, retrait `@clerk/*`/`svix`), config serveur/client, route `/api/auth/$`, `__root` nettoyé, `.env`/compose. **Auth testée en runtime** (sign-up + get-session OK, user en base).
  - Schéma : table `user` (Better Auth + rôle/ban/gamification/timezone), état de tentative sur `user_lesson_progress`, retrait `pass_threshold`/`best_score`/hearts globaux ; migration régénérée (15 tables) ; migrate + seed validés.
  - Specs OpenSpec réécrites : `auth-mfa` (ex auth-clerk-mfa), `lesson-player`, `gamification`, `course-import`, `content-authoring` ; **nouveau change `user-management`**. Les 6 changes valident.
  - Docs alignées : PRD, ARCHITECTURE, LESSON_FORMAT, README, CONTEXT, ADR.

---

## En cours

- Rien en cours d'implémentation. Fondations + specs à jour ; l'implémentation attend le lancement des changes OpenSpec.

---

## Planifié (prochaines étapes)

Ordre d'implémentation recommandé (dépendances) :

1. **`auth-mfa`** — prérequis (identité + guards) ; fondation déjà posée, reste pages login/register, guards, MFA, emails.
2. **`content-authoring`** — création de contenu (dépend de l'auth admin).
3. **`course-import`** — accélère la création (réutilise la validation de content-authoring).
4. **`lesson-player`** — expérience apprenant (dépend d'avoir du contenu).
5. **`gamification`** — se greffe sur le player.
6. **`user-management`** — gestion des comptes/rôles (dépend de l'auth).

Pour démarrer une feature : `openspec show <change>` puis `/opsx:apply` (ou skill `openspec-apply-change`).

### À trancher avant/pendant l'implémentation
- Montants d'XP (base + bonus « parfait ») ; nombre de vies par tentative (défaut 3).
- Détection/stockage du fuseau utilisateur (fallback si absent).
- Branchement d'un provider d'emails (vérification / réinitialisation Better Auth).

### Non couvert en v1 (rappel)
App native, paiement/achat de vies, social (amis/ligues/classements), notifications push/email, i18n de l'UI.

---

## Commandes utiles

```bash
# DB (Docker) uniquement
docker compose -f docker/docker-compose.yml up -d db

# Stack dev complète (app + db) en Docker
docker compose -f docker/docker-compose.yml up

# Stack prod
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up --build -d

# Dev local (hors Docker, DB requise sur localhost:5432)
pnpm install && pnpm run generate-routes && pnpm dev

# Base de données
pnpm db:generate   # nouvelle migration depuis le schéma
pnpm db:migrate    # applique les migrations
pnpm db:seed       # données de démo

# OpenSpec
openspec list
openspec show <change>
```
