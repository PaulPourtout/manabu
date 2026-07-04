# Manabu

Application web d'apprentissage gamifiée façon Duolingo : leçons + quiz, progression sauvegardée, back-office de création/import de contenu.

> Statut : fondations posées (scaffold, DB, Docker, migrations, seed). Implémentation des fonctionnalités pilotée par OpenSpec.

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — Description du produit, fonctionnalités, exigences.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Stack technique, architecture, modèle de données, Docker.
- [`docs/LESSON_FORMAT.md`](docs/LESSON_FORMAT.md) — Format du fichier JSON d'import des cours/leçons/quiz.
- [`JOURNAL.md`](JOURNAL.md) — Journal de bord : fait / en cours / planifié.

## Stack (résumé)

TanStack Start (React + TypeScript) · Tailwind CSS + shadcn/ui · TanStack Query · Drizzle ORM · PostgreSQL · Clerk · Docker (dev + prod).

## Démarrage rapide

```bash
cp .env.example .env          # renseigner les clés Clerk (dashboard.clerk.com)

# Option A — tout en Docker (app + db)
docker compose -f docker/docker-compose.yml up

# Option B — dev local (DB via Docker, app en local)
docker compose -f docker/docker-compose.yml up -d db
pnpm install && pnpm run generate-routes
pnpm db:migrate && pnpm db:seed
pnpm dev            # http://localhost:3000
```

## Développement des fonctionnalités (OpenSpec)

Chaque fonctionnalité est décrite comme un « change » spec-driven dans `openspec/changes/` :

```bash
openspec list                 # état des changes et de leurs tâches
openspec show auth-clerk-mfa  # détail d'un change
```

Ordre d'implémentation recommandé : `auth-clerk-mfa` → `content-authoring` → `course-import` → `lesson-player` → `gamification`.
