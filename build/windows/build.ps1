param([string]$Version = '')

$ErrorActionPreference = 'Stop'
$resourceCompiler = (Get-Command llvm-rc.exe -ErrorAction Stop).Source
$resourceConverter = (Get-Command llvm-cvtres.exe -ErrorAction Stop).Source

Push-Location (Join-Path $PSScriptRoot '../..')
try {
  if (-not (Test-Path -LiteralPath frontend/dist)) {
    New-Item -ItemType Directory -Path frontend/dist | Out-Null
    New-Item -ItemType File -Path frontend/dist/.gitkeep | Out-Null
  }
  New-Item -ItemType Directory -Path build/bin -Force | Out-Null
  wails3 generate bindings -ts -i
  if ($LASTEXITCODE -ne 0) { throw 'Wailsの接続コード生成に失敗しました。' }

  Push-Location frontend
  try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'フロント依存の導入に失敗しました。' }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'フロントのビルドに失敗しました。' }
  } finally {
    Pop-Location
  }

  go run ./build/resources "-version=$Version"
  if ($LASTEXITCODE -ne 0) { throw 'Windowsリソースの生成に失敗しました。' }

  Push-Location build/generated
  try {
    & $resourceCompiler /c 65001 /fo rename.res rename.rc
    if ($LASTEXITCODE -ne 0) { throw 'Windowsリソースのコンパイルに失敗しました。' }
    & $resourceConverter /machine:x64 /out:../../rename-res.syso rename.res
    if ($LASTEXITCODE -ne 0) { throw 'WindowsリソースのCOFF変換に失敗しました。' }
  } finally {
    Pop-Location
  }

  go build -trimpath -tags production -ldflags '-s -w -H windowsgui' -o build/bin/rename.exe .
  if ($LASTEXITCODE -ne 0) { throw 'Windowsアプリのビルドに失敗しました。' }
} finally {
  Pop-Location
}
