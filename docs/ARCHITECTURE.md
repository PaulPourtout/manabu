# Manabu — Architecture technique

Complète `docs/PRD.md`. Décisions techniques validées avec l'utilisateur : **Better Auth** (auth auto-hébergée + MFA, voir ADR 0003), **Drizzle ORM**, gamification complète (complétion pilotée par les vies, ADR 0001), **Docker dev + prod**. Voir aussi `CONTEXT.md` (glossaire) et `docs/adr/`.

## 1. Stack technique

| Domaine                 | Choix                                                                                                                                      | Raison                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework fullstack     | **TanStack Start** (React 19, Vite, SSR)                                                                                                   | Fullstack React moderne : routing file-based (TanStack Router) + server functions/API routes intégrées → pas besoin d'un backend séparé.                                   |
| Langage                 | **TypeScript** (strict)                                                                                                                    | Type-safety de bout en bout, y compris entre server functions et client.                                                                                                   |
| Style / UI              | **Tailwind CSS v4** + composants **shadcn/ui**                                                                                             | Mobile-first par nature (breakpoints utilitaires), rapide à composer, accessible par défaut.                                                                               |
| Routing                 | **TanStack Router** (inclus dans Start)                                                                                                    | File-based routing, typé, gestion des loaders/route guards (protection back-office).                                                                                       |
| Data fetching / cache   | **TanStack Query** (via server functions de Start)                                                                                         | Cache client, invalidation, mutations optimistes (ex. réponse au quiz).                                                                                                    |
| État client léger       | **Zustand** (ou `useState`/context) pour l'état éphémère d'une session de leçon (vies restantes pendant la leçon en cours, étape courante) | Évite de solliciter le serveur à chaque frame ; sync en base à la fin de chaque étape.                                                                                     |
| ORM                     | **Drizzle ORM** + `drizzle-kit` (migrations)                                                                                               | Léger, SQL-first, typé, bon fit Vite/serverless-friendly.                                                                                                                  |
| Base de données         | **PostgreSQL 16**                                                                                                                          | Relationnel, robuste, adapté au modèle hiérarchique cours/unités/leçons.                                                                                                   |
| Authentification        | **Better Auth** (auto-hébergé)                                                                                                              | Auth dans notre Postgres (adapter Drizzle) : email/mot de passe, sessions, **MFA gratuite** (TOTP + codes de secours), rôles + bannissement via le plugin admin. Pas de lock-in. Voir ADR 0003. |
| Validation              | **Zod**                                                                                                                                    | Validation des formulaires, des payloads de server functions, et du fichier JSON importé au back-office.                                                                   |
| Tests                   | **Vitest** (unitaire/composants) + **Playwright** (e2e critique : login, faire une leçon)                                                  | Confiance sur les parcours critiques sans sur-investir en v1.                                                                                                              |
| Conteneurisation        | **Docker** + **docker-compose** (profils dev/prod)                                                                                         | Un seul point d'entrée pour lancer app + DB.                                                                                                                               |
| Gestionnaire de paquets | **pnpm**                                                                                                                                   | Rapide, lockfile strict, standard pour ce genre de stack.                                                                                                                  |

> TanStack Start joue le rôle de « frontend + backend » : les server functions (`createServerFn`) et/ou des routes API (`/api/...`) exposent les opérations nécessitant la base de données. Il n'y a **pas de service backend séparé** en v1 — cela simplifie fortement le Docker et le déploiement. Si un besoin de découplage fort apparaît plus tard (ex. worker asynchrone), on pourra extraire un service dédié sans tout réécrire grâce à la couche Drizzle isolée.

## 2. Arborescence de projet (proposée)

```
manabu/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── LESSON_FORMAT.md
├── docker/
│   ├── Dockerfile                 # multi-stage: deps → build → runtime
│   └── docker-compose.yml         # postgres + app (profils dev / prod)
├── drizzle/                       # migrations générées
├── src/
│   ├── routes/                    # file-based routing TanStack Router
│   │   ├── __root.tsx
│   │   ├── index.tsx               # landing / redirection
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── learn/
│   │   │   ├── index.tsx           # carte de parcours (path)
│   │   │   └── $lessonId.tsx       # player de leçon (contenu + quiz)
│   │   ├── profile.tsx
│   │   └── admin/
│   │       ├── index.tsx           # dashboard back-office
│   │       ├── courses/
│   │       │   ├── index.tsx
│   │       │   ├── $courseId.tsx
│   │       │   └── new.tsx
│   │       ├── import.tsx          # upload JSON
│   │       └── users.tsx
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts           # schéma Drizzle
│   │   │   ├── client.ts           # connexion pg + drizzle()
│   │   │   └── seed.ts
│   │   ├── auth/
│   │   │   ├── auth.ts             # config serveur Better Auth (plugins MFA/admin)
│   │   │   ├── auth-client.ts      # client Better Auth (navigateur)
│   │   │   └── session.ts          # guards requireUser / requireAdmin
│   │   ├── functions/              # server functions (createServerFn)
│   │   │   ├── lessons.ts
│   │   │   ├── quizzes.ts
│   │   │   ├── progress.ts
│   │   │   ├── gamification.ts
│   │   │   └── import.ts           # parsing + validation JSON → insert
│   │   └── lib/
│   │       └── permissions.ts      # guard "admin only"
│   ├── components/
│   │   ├── lesson/                 # étapes de contenu, player
│   │   ├── quiz/                   # types de questions
│   │   ├── gamification/           # XP bar, streak, vies, badges
│   │   └── ui/                     # shadcn/ui
│   ├── lib/
│   │   ├── validation/              # schémas Zod partagés
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

## 3. Modèle de données (schéma Drizzle — vue logique)

```
user                               -- table Better Auth (voir src/db/auth-schema.ts)
  id (text), name, email (unique), email_verified, image,
  two_factor_enabled,
  role ('learner' | 'admin'), banned, ban_reason, ban_expires,   -- plugin admin
  xp_total, current_streak, longest_streak, last_activity_date,  -- champs app
  timezone,                                                      -- fuseau de l'apprenant
  created_at, updated_at
session / account / verification / two_factor   -- tables Better Auth

courses
  id, title, description, slug, is_published, created_at, updated_at

units
  id, course_id (FK), title, position, is_published

lessons
  id, unit_id (FK), title, position, is_published
  -- pas de pass_threshold : la complétion est pilotée par les vies (ADR 0001)

lesson_steps
  id, lesson_id (FK), position, type ('content' | 'quiz'),
  content_body (jsonb, pour type=content : texte/markdown/media)

quiz_questions
  id, lesson_step_id (FK, 1-1 avec une step de type 'quiz'),
  type ('single_choice' | 'multiple_choice' | 'match' | 'fill_blank' | 'reorder'),
  prompt, explanation, data (jsonb : choix/réponses selon le type)

user_lesson_progress               -- progression + état de la tentative en cours
  id, user_id (FK->user), lesson_id (FK),
  status ('not_started' | 'in_progress' | 'completed'),
  current_step_id, hearts_remaining, requeue_step_ids (jsonb), perfect,  -- reprise
  last_attempt_at, completed_at, updated_at

user_step_attempts                 -- journal des réponses
  id, user_id (FK->user), lesson_step_id (FK), is_correct, answered_at

badges
  id, code, title, description, icon

user_badges
  id, user_id (FK), badge_id (FK), earned_at

xp_events                          -- journal, utile pour audits/anti-triche futurs
  id, user_id (FK), amount, reason, created_at
```

Le contenu variable (choix de quiz, éléments à associer, texte du contenu de leçon) est stocké en `jsonb` pour rester flexible sans exploser le nombre de tables — cohérent avec le format d'import (voir `docs/LESSON_FORMAT.md`).

## 4. Format d'import JSON (back-office)

Un admin peut uploader un fichier JSON représentant un **cours complet**. Schéma validé côté serveur avec Zod avant insertion transactionnelle en base. Détail complet et exemple dans `docs/LESSON_FORMAT.md`.

Aperçu de la forme générale :

```json
{
  "course": { "title": "Anglais - Débutant", "slug": "anglais-debutant" },
  "units": [
    {
      "title": "Unité 1 : Se présenter",
      "lessons": [
        {
          "title": "Dire bonjour",
          "steps": [
            { "type": "content", "body": "..." },
            {
              "type": "quiz",
              "quiz": {
                "type": "single_choice",
                "prompt": "...",
                "choices": ["..."],
                "correctIndex": 0
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 5. Authentification & autorisation

Voir ADR 0003 pour le choix de Better Auth.

- **Better Auth** gère l'inscription/connexion (email + mot de passe), les sessions et cookies, **dans notre PostgreSQL** (adapter Drizzle). Config serveur `src/lib/auth/auth.ts`, client `src/lib/auth/auth-client.ts`, endpoint `/api/auth/$`.
- **Rôle** : champ `user.role` (`learner` par défaut, `admin`), **possédé par notre base**. Bootstrap du 1er admin par `UPDATE "user" SET role='admin' WHERE email='…'` ; promotions ultérieures via la page user-management.
- **Guards** (`src/lib/auth/session.ts`) sur les routes `admin/*` et les server functions sensibles : vérification **côté serveur** de la session + du rôle — jamais une vérification côté client seule.
- **MFA** (plugin `twoFactor` : TOTP + codes de secours, gratuit) :
  - **obligatoire** pour le rôle `admin` — contrôle serveur qui refuse l'accès à `admin/*` tant que le second facteur n'est pas enrôlé ;
  - **optionnelle** pour le rôle `learner`, activable depuis le profil ;
  - flag d'env pour assouplir l'exigence en dev.
- **Désactivation de compte** : ban/unban via le plugin `admin` (réversible, non destructif).
- **Emails** (vérification / réinitialisation) : nécessitent un provider d'envoi à brancher ; désactivés en dev.

## 6. Mobile-first & responsive

- Développement des écrans en priorité sur breakpoint mobile (`base`, sans préfixe Tailwind), puis extension `sm:` / `md:` / `lg:` pour tablette/desktop.
- Navigation : barre de navigation basse fixe sur mobile (Apprendre / Profil), transformée en barre latérale sur `md:`+.
- Le player de leçon (contenu + quiz) est pensé pour être utilisable au pouce (gros boutons, une action principale visible sans scroll).
- Le back-office est utilisable sur tablette/desktop en priorité (formulaires plus denses), mais reste consultable sur mobile sans être cassé (tables → cartes empilées sur petit écran).

## 7. Docker (dev + prod)

- **`docker/Dockerfile`** multi-stage :
  1. `deps` : install des dépendances (pnpm, cache des layers).
  2. `build` : build Vite/TanStack Start (`pnpm build`).
  3. `runtime` : image finale légère (node:alpine) ne contenant que le build + `node_modules` de prod, lancée via `pnpm start`.
- **`docker/docker-compose.yml`** :
  - service `db` : `postgres:16-alpine`, volume nommé pour la persistance, healthcheck.
  - service `app` :
    - en **dev** : bind mount du code source, commande `pnpm dev`, hot-reload, dépend de `db` (healthy).
    - en **prod** : utilise l'image buildée par le Dockerfile (stage `runtime`), variables d'env de prod, pas de bind mount.
  - Utilisation de **profils** (`dev` / `prod`) ou de deux fichiers compose (`docker-compose.yml` + `docker-compose.prod.yml` en override) pour distinguer les deux modes sans dupliquer toute la config.
- Migrations Drizzle exécutées automatiquement au démarrage du conteneur `app` (script `pnpm db:migrate` avant `pnpm start`), avec un `seed` optionnel pour données de démo.

## 8. Variables d'environnement (`.env.example`)

```
DATABASE_URL=postgres://manabu:manabu@db:5432/manabu
BETTER_AUTH_SECRET=...            # openssl rand -hex 32
BETTER_AUTH_URL=http://localhost:3000
# Email (vérif/reset) — à brancher : SMTP_URL=...
NODE_ENV=development
PORT=3000
```

> `BETTER_AUTH_SECRET` est propre à chaque environnement — à ne jamais committer, seulement dans `.env` local et les secrets du déploiement.

## 9. Scripts principaux (`package.json`)

```
dev            → tanstack start dev (via vite)
build          → build de production
start          → lance le serveur buildé
db:generate    → drizzle-kit generate (nouvelles migrations depuis le schéma)
db:migrate     → drizzle-kit migrate (applique les migrations)
db:seed        → script de seed (contenu de démo + badges ; pas de compte)
test           → vitest
test:e2e       → playwright test
```

## 10. Roadmap de mise en œuvre proposée

1. **Bootstrap** : scaffold TanStack Start + TypeScript + Tailwind + shadcn/ui, Docker Compose (db + app dev), connexion Drizzle ↔ Postgres, `pnpm dev` fonctionnel.
2. **Auth** : intégration Better Auth (inscription/connexion/déconnexion), MFA, rôle `admin`/`learner` en base, guards back-office. *(fondation déjà posée : config, route `/api/auth/$`, tables auth, sign-up testé)*
3. **Modèle de données & back-office CRUD** : schéma Drizzle + migrations, CRUD cours/unités/leçons/quiz basique en back-office.
4. **Import JSON** : schéma Zod, page d'upload, validation + insertion transactionnelle, prévisualisation.
5. **Player de leçon** : rendu des étapes de contenu et de quiz (types principaux), sauvegarde de progression par étape, écran de résultat.
6. **Gamification** : XP, streak, vies, déverrouillage progressif des unités/leçons, badges.
7. **Polish mobile-first & accessibilité**, tests e2e des parcours critiques.
8. **Dockerfile de prod** (multi-stage) + configuration `docker-compose.prod.yml`, documentation de déploiement.

## 11. Points tranchés / à trancher

Décisions actées lors du grilling (voir `CONTEXT.md` et `docs/adr/`) :

- **Complétion pilotée par les vies**, sans seuil de score ; **vies par tentative** (défaut 3), remise en file des questions ratées, échec → reprise immédiate, **pas de timer de régénération** (ADR 0001).
- **Reprise en cours de leçon** persistée (étape + vies + file).
- **Déverrouillage linéaire strict** (séquence aplatie).
- **Streak** calculé dans le **fuseau de l'apprenant** (`user.timezone`).
- **Better Auth** auto-hébergé, rôle en base, MFA gratuite ; bootstrap admin par SQL (ADR 0003).
- **Import = création seule** (slug en conflit → nouveau slug).
- **Preview interactive à blanc** ; **contenu assaini** (Markdown sans HTML brut, médias HTTPS image/audio).

Restant à préciser (non bloquant) :

- Montants exacts d'XP (base + bonus « parfait »).
- Détection/stockage du fuseau utilisateur (fallback si absent).
- Branchement du provider d'emails (vérification / réinitialisation).
- Activation future d'OAuth (plugin Better Auth), notifications, ligues (v2).
