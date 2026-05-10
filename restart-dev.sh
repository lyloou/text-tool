#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-1420}"
TAURI_CLI="$ROOT_DIR/frontend/node_modules/.bin/tauri"

echo "Restarting Text Utility dev environment..."

if [ ! -x "$TAURI_CLI" ]; then
  echo "Missing Tauri CLI at $TAURI_CLI"
  echo "Run npm install in frontend/ first."
  exit 1
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti "tcp:${PORT}" || true)"
  if [ -n "$PIDS" ]; then
    echo "Stopping processes on port ${PORT}: ${PIDS}"
    kill $PIDS || true
    sleep 1
  fi
fi

echo "Starting Tauri dev server on port ${PORT}..."
"$TAURI_CLI" dev
