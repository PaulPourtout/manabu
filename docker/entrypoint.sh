#!/bin/sh
set -e

# Applique les migrations Drizzle avant de démarrer le serveur (prod).
echo "→ Application des migrations Drizzle..."
pnpm drizzle-kit migrate

echo "→ Démarrage du serveur Manabu sur le port ${PORT:-3000}..."
exec node .output/server/index.mjs
