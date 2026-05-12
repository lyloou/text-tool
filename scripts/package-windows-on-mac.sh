#!/usr/bin/env bash
#brew install mingw-w64
#brew install nsis
#rustup target add x86_64-pc-windows-gnu

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_CLI="$ROOT_DIR/frontend/node_modules/.bin/tauri"
PACKAGE_TARGET_DIR="$ROOT_DIR/target/texttool-windows-package"
WINDOWS_TARGET="${WINDOWS_TARGET:-x86_64-pc-windows-gnu}"
WINDOWS_BUNDLES="${WINDOWS_BUNDLES:-nsis}"

cd "$ROOT_DIR"

echo "Packaging TextTool for Windows from macOS..."
echo "Target: ${WINDOWS_TARGET}"
echo "Bundles: ${WINDOWS_BUNDLES}"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This script is intended for macOS hosts."
  exit 1
fi

if [ "$WINDOWS_TARGET" != "x86_64-pc-windows-gnu" ]; then
  echo "Only x86_64-pc-windows-gnu is supported by this macOS helper."
  echo "The MSVC target needs link.exe from Visual Studio Build Tools on Windows."
  exit 1
fi

if [ ! -x "$TAURI_CLI" ]; then
  echo "Missing Tauri CLI at $TAURI_CLI"
  echo "Run npm install in frontend/ first."
  exit 1
fi

for command_name in x86_64-w64-mingw32-gcc x86_64-w64-mingw32-g++; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing $command_name."
    echo "Install the MinGW cross toolchain with:"
    echo "  brew install mingw-w64"
    exit 1
  fi
done

if ! command -v makensis >/dev/null 2>&1; then
  echo "Missing makensis."
  echo "Install NSIS with:"
  echo "  brew install nsis"
  exit 1
fi

if ! rustup target list --installed | grep -qx "$WINDOWS_TARGET"; then
  echo "Missing Rust target $WINDOWS_TARGET."
  echo "Install it with:"
  echo "  rustup target add $WINDOWS_TARGET"
  exit 1
fi

export CC_x86_64_pc_windows_gnu="${CC_x86_64_pc_windows_gnu:-x86_64-w64-mingw32-gcc}"
export CXX_x86_64_pc_windows_gnu="${CXX_x86_64_pc_windows_gnu:-x86_64-w64-mingw32-g++}"
export AR_x86_64_pc_windows_gnu="${AR_x86_64_pc_windows_gnu:-x86_64-w64-mingw32-ar}"
export CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER="${CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER:-x86_64-w64-mingw32-gcc}"

echo "Running Rust core tests..."
cargo test -p text_core

echo "Building frontend..."
npm --prefix frontend run build

echo "Building Windows app bundle..."
CARGO_TARGET_DIR="$PACKAGE_TARGET_DIR" "$TAURI_CLI" build --target "$WINDOWS_TARGET" --bundles "$WINDOWS_BUNDLES"

echo "Done. Check target/texttool-windows-package/${WINDOWS_TARGET}/release/bundle/ for Windows artifacts."
