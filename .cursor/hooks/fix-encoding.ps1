param(
  [switch]$Hook,
  [string[]]$Paths = @()
)

$ErrorActionPreference = "SilentlyContinue"

if ($Hook -and [Console]::IsInputRedirected) {
  $stdin = [Console]::In.ReadToEnd()
  if ($stdin.Trim()) {
    try {
      $payload = $stdin | ConvertFrom-Json
      if ($payload.file_path) { $Paths += $payload.file_path }
      if ($payload.path) { $Paths += $payload.path }
      if ($payload.files) { $Paths += @($payload.files) }
    } catch {}
  }
}

function Fix-IfUtf16([string]$File) {
  if (-not (Test-Path -LiteralPath $File)) { return $false }
  $b = [IO.File]::ReadAllBytes($File)
  if ($b.Length -lt 2 -or $b[1] -ne 0) { return $false }
  $text = [IO.File]::ReadAllText($File, [Text.Encoding]::Unicode)
  [IO.File]::WriteAllText($File, $text, (New-Object Text.UTF8Encoding $false))
  Write-Host "fixed encoding: $File"
  return $true
}

$fixed = 0
foreach ($p in ($Paths | Select-Object -Unique)) {
  if (Fix-IfUtf16 $p) { $fixed++ }
}

$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $root "package.json"))) {
  $root = (Get-Location).Path
}

$dirs = @(
  (Join-Path $root "shared"),
  (Join-Path $root "src"),
  (Join-Path $root "electron")
)
foreach ($full in $dirs) {
  if (-not (Test-Path $full)) { continue }
  Get-ChildItem -LiteralPath $full -Recurse -Include *.ts,*.tsx,*.json -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\dist-electron\\' } |
    ForEach-Object { if (Fix-IfUtf16 $_.FullName) { $fixed++ } }
}

if ($fixed -gt 0) { Write-Host "utf8-fix: converted $fixed file(s)" } else { Write-Host "utf8-fix: all clean" }
exit 0