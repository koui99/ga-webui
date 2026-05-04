#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f "webapi/requirements.txt" ]; then
  echo "ERROR: webapi/requirements.txt not found"
  exit 1
fi

if [ ! -f ".env.webapi" ]; then
  cp .env.webapi.example .env.webapi
  echo "Created .env.webapi from .env.webapi.example"
fi

python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r webapi/requirements.txt

echo
echo "WebAPI dependencies installed."
echo "Next: edit .env.webapi and make sure GA_REPO_ROOT points to your GenericAgent directory."
