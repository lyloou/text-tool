#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-1420}"
TAURI_CLI="$ROOT_DIR/frontend/node_modules/.bin/tauri"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT_DIR/target/texttool-dev}"

echo "Restarting TextTool dev environment..."

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
echo "Using Rust target directory: ${CARGO_TARGET_DIR}"
"$TAURI_CLI" dev
