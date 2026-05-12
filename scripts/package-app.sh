#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_CLI="$ROOT_DIR/frontend/node_modules/.bin/tauri"

cd "$ROOT_DIR"

echo "Packaging TextTool..."

if [ ! -x "$TAURI_CLI" ]; then
  echo "Missing Tauri CLI at $TAURI_CLI"
  echo "Run npm install in frontend/ first."
  exit 1
fi

echo "Running Rust core tests..."
cargo test -p text_core

echo "Building frontend..."
npm --prefix frontend run build

echo "Building macOS app bundle..."
"$TAURI_CLI" build --bundles app

echo "Done. App bundle: target/release/bundle/macos/TextTool.app"
