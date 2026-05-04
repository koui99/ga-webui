# GA WebUI + WebAPI Adapter

A clean open-source frontend package for GenericAgent deployments.

This repository contains:
- frontend: Next.js Web UI
- webapi: Python / FastAPI adapter layer
- deploy: systemd and Caddy examples
- scripts: install and doctor helpers

This repository is not GenericAgent itself. It is meant to be deployed alongside a separate GenericAgent checkout.

## What this project is for

Use this repository if you want to:
- publish a standalone Web UI project for GenericAgent
- keep frontend / webapi deployment files separate from the upstream backend
- make deployment easier for other users with templates and helper scripts

This repository does not include:
- GenericAgent core source code
- virtual environments, build output, caches, or logs
- real secrets, real domains, or machine-specific paths

## Project layout

- `frontend/` — Next.js frontend
- `webapi/` — FastAPI adapter that bridges to GenericAgent
- `deploy/` — example deployment files
- `scripts/` — helper scripts for install and checks

## How it works

Recommended layout:

`/opt/GenericAgent`
- upstream GenericAgent checkout

`/opt/ga-webui`
- this repository

Connection flow:
- `webapi/` uses `GA_REPO_ROOT` to locate your GenericAgent directory
- `frontend/` uses `GENERIC_AGENT_API_URL` to talk to the WebAPI service
- browser → frontend → webapi → GenericAgent

## Requirements

You need to prepare:
- a working GenericAgent directory
- Python 3
- Node.js
- pnpm

Also make sure GenericAgent itself is already installed and configured.

## Quick start

### 1) Prepare GenericAgent

Example path:

`/opt/GenericAgent`

Make sure this file exists:

`/opt/GenericAgent/agentmain.py`

### 2) Install WebAPI adapter

From this repository root:

`bash scripts/install-webapi.sh`

This will:
- create `.env.webapi` from `.env.webapi.example` if missing
- create `.venv/`
- install `webapi/requirements.txt`

Then edit `.env.webapi` and set at least:

`GA_REPO_ROOT=/opt/GenericAgent`

Start WebAPI:

`set -a && . ./.env.webapi && set +a`
`./.venv/bin/python -m webapi.server`

Default bind:
- `127.0.0.1:8765`

### 3) Install frontend

From this repository root:

`bash scripts/install-frontend.sh`

This will:
- create `frontend/.env.local` from `frontend/.env.example` if missing
- install frontend dependencies
- run a production build check

Development:

`cd frontend && pnpm dev`

Production:

`cd frontend && pnpm start`

## Configuration

### Frontend

See:
- `frontend/.env.example`

Main setting:
- `GENERIC_AGENT_API_URL=http://127.0.0.1:8765`

### WebAPI

See:
- `.env.webapi.example`

Main settings:
- `GA_REPO_ROOT=/opt/GenericAgent`
- `GA_HOST=127.0.0.1`
- `GA_PORT=8765`
- `GA_IMAGE_PROVIDER=mock`
- `GA_VISION_PROVIDER=glm`

Optional provider variables:
- `OPENAI_API_KEY`
- `AI_GATEWAY_API_KEY`
- `FAL_KEY`
- `GEMINI_API_KEY`
- `GEMINI_BASE_URL`
- `GEMINI_MODEL`
- `GLM_API_KEY`
- `GLM_BASE_URL`
- `GLM_MODEL`

## Helper scripts

### `scripts/install-webapi.sh`
Creates `.env.webapi`, creates `.venv`, and installs Python dependencies.

### `scripts/install-frontend.sh`
Creates `frontend/.env.local`, installs frontend dependencies, and runs a build.

### `scripts/doctor.sh`
Checks:
- Python / Node / pnpm availability
- `frontend/.env.local`
- root `.venv`
- `GA_REPO_ROOT`
- `agentmain.py` under `GA_REPO_ROOT`
- `webapi/requirements.txt`

Run:

`bash scripts/doctor.sh`

## Deploy examples

The `deploy/` directory includes:
- `ga-backend.service.example`
- `ga-frontend.service.example`
- `Caddyfile.example`

These examples assume an external GenericAgent layout:
- WebAPI runs from this repository
- `GA_REPO_ROOT` points to a separate GenericAgent directory
- frontend talks to WebAPI through `GENERIC_AGENT_API_URL`

## Troubleshooting

### Could not locate GenericAgent repo

Your `GA_REPO_ROOT` is wrong or incomplete.

Check:
- the directory exists
- `agentmain.py` exists inside it

### Frontend opens, but models/chat do not work

Usually one of these is wrong:
- WebAPI is not running
- `GENERIC_AGENT_API_URL` is incorrect
- GenericAgent itself is not configured correctly

### Why is GenericAgent not bundled here?

Because this repository is specifically for:
- open-sourcing the frontend + WebAPI layer
- keeping deployment packaging separate from the upstream backend
- letting users choose how they obtain and update GenericAgent

## Notes for release

Before publishing, this repository has already been cleaned to exclude:
- `.venv/`
- `frontend/node_modules/`
- `frontend/.next/`
- `__pycache__/`
- `mykey.py`
- local `.env` files
- machine-specific runtime artifacts

## License

MIT

When publishing publicly, it is a good idea to state clearly that:
- this repository contains your frontend / webapi / deploy / scripts package
- GenericAgent backend core comes from upstream `lsdefine/GenericAgent`
- this project is intended for Web UI + WebAPI deployment alongside GenericAgent
