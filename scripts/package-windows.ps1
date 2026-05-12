$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$TauriCli = Join-Path $RootDir "frontend\node_modules\.bin\tauri.cmd"

Set-Location $RootDir

Write-Host "Packaging TextTool for Windows..."

if (-not (Test-Path $TauriCli)) {
  Write-Host "Missing Tauri CLI at $TauriCli"
  Write-Host "Run npm install in frontend/ first."
  exit 1
}

Write-Host "Running Rust core tests..."
cargo test -p text_core

Write-Host "Building frontend..."
npm --prefix frontend run build

Write-Host "Building Windows app bundle..."
& $TauriCli build

Write-Host "Done. Check target\release\bundle\ for Windows installers."
