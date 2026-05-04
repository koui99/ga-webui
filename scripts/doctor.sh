#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f ".env.webapi" ]; then
  set -a
  . ./.env.webapi
  set +a
fi

fail=0

ok() {
  echo "[OK] $1"
}

warn() {
  echo "[WARN] $1"
}

err() {
  echo "[ERROR] $1"
  fail=1
}

command -v python3 >/dev/null 2>&1 && ok "python3 found" || err "python3 not found"
command -v node >/dev/null 2>&1 && ok "node found" || err "node not found"
command -v pnpm >/dev/null 2>&1 && ok "pnpm found" || err "pnpm not found"

if [ -f "frontend/.env.local" ]; then
  ok "frontend/.env.local exists"
else
  warn "frontend/.env.local missing (run scripts/install-frontend.sh)"
fi

if [ -d ".venv" ] && [ -x ".venv/bin/python" ]; then
  ok "root Python venv exists"
else
  warn "root .venv missing (run scripts/install-webapi.sh)"
fi

if [ -n "${GA_REPO_ROOT:-}" ]; then
  if [ -d "$GA_REPO_ROOT" ]; then
    ok "GA_REPO_ROOT directory exists: $GA_REPO_ROOT"
    if [ -f "$GA_REPO_ROOT/agentmain.py" ]; then
      ok "agentmain.py exists under GA_REPO_ROOT"
    else
      err "agentmain.py not found under GA_REPO_ROOT"
    fi
  else
    err "GA_REPO_ROOT does not exist: $GA_REPO_ROOT"
  fi
else
  warn "GA_REPO_ROOT not set (create .env.webapi from .env.webapi.example)"
fi

if [ -f "webapi/requirements.txt" ]; then
  ok "webapi/requirements.txt exists"
else
  err "webapi/requirements.txt missing"
fi

if [ $fail -ne 0 ]; then
  echo
  echo "doctor result: FAILED"
  exit 1
fi

echo
echo "doctor result: OK"
