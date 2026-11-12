param(
  [Parameter(Mandatory = $true)][string]$BinaryPath,
  [string]$Version = ''
)

$ErrorActionPreference = 'Stop'
if (-not $Version) {
  $projectFile = Join-Path $PSScriptRoot '../../wails.json'
  $Version = (Get-Content -Raw -LiteralPath $projectFile | ConvertFrom-Json).info.productVersion
}

$binary = Get-Item -LiteralPath $BinaryPath
if ($binary.VersionInfo.ProductVersion -ne $Version) {
  throw "EXEのバージョンが一致しません: expected=$Version actual=$($binary.VersionInfo.ProductVersion)"
}

$hash = (Get-FileHash -LiteralPath $binary.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
$checksumFile = Join-Path $binary.DirectoryName 'SHA256SUMS'
[System.IO.File]::WriteAllText($checksumFile, "$hash  $($binary.Name)`n", [System.Text.Encoding]::ASCII)
