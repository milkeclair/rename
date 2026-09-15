$ErrorActionPreference = 'Stop'
$resourceCompiler = (Get-Command llvm-rc.exe -ErrorAction Stop).Source
$resourceConverter = (Get-Command llvm-cvtres.exe -ErrorAction Stop).Source

Push-Location (Join-Path $PSScriptRoot '../..')
try {
  go run ./build/resources
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

  wails build -platform windows/amd64 -nopackage -trimpath -webview2 error
  if ($LASTEXITCODE -ne 0) { throw 'ビルドに失敗しました。' }
} finally {
  Pop-Location
}
