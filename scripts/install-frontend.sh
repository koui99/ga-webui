#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/frontend"

if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "Created frontend/.env.local from frontend/.env.example"
fi

pnpm install
pnpm build

echo
echo "Frontend dependencies installed and production build completed."
echo "Edit frontend/.env.local if you need to change GENERIC_AGENT_API_URL."
