#!/usr/bin/env bash
set -euo pipefail

# Always run from the project root
cd /Users/graham/Work/mm

echo "[mm] Stopping existing containers (if any)..."
docker compose down --remove-orphans

echo "[mm] Starting stack in foreground (Ctrl+C to stop)..."
# Rebuild images if sources changed; run attached (non-daemon)
exec docker compose up --build
