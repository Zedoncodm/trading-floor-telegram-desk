$ErrorActionPreference = "SilentlyContinue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show("Node.js (>= 23.6) est requis pour lancer Trading Floor Desk.", "Trading Floor Desk", "OK", "Error") | Out-Null
  exit 1
}

if (-not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
  npm install
}

$dataDir = Join-Path $RepoRoot "data"
if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

function Get-ExpectedUiLength {
  try {
    $verRes = Invoke-WebRequest -Uri "http://127.0.0.1:4080/api/version" -TimeoutSec 2 -UseBasicParsing
    if ($verRes.StatusCode -eq 200) {
      return ($verRes.Content | ConvertFrom-Json)
    }
  } catch {}
  return $null
}

function Stop-StalePort4080 {
  try {
    $conns = Get-NetTCPConnection -LocalPort 4080 -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
      if ($c.OwningProcess -gt 0) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    }
    Start-Sleep -Milliseconds 300
  } catch {}
}

function Test-DeskReady {
  try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:4080/api/state" -TimeoutSec 2 -UseBasicParsing
    return ($res.StatusCode -eq 200)
  } catch {
    return $false
  }
}

# Verification du service FreeLLM Desktop
$freeLlmExe = "$env:LOCALAPPDATA\Programs\freellmapi-desktop\FreeLLMAPI.exe"
if (Test-Path $freeLlmExe) {
  $proc = Get-Process -Name "FreeLLMAPI" -ErrorAction SilentlyContinue
  if (-not $proc) {
    Start-Process -FilePath $freeLlmExe -WindowStyle Minimized
  }
}

# Verifier si un serveur obsolete tourne (absent de /api/version ou anterieur aux derniers edits src/*.ts)
$latestSrcMs = 0
foreach ($f in (Get-ChildItem -Path (Join-Path $RepoRoot "src") -Filter "*.ts" -ErrorAction SilentlyContinue)) {
  $ms = [long]([DateTimeOffset]$f.LastWriteTimeUtc).ToUnixTimeMilliseconds()
  if ($ms -gt $latestSrcMs) { $latestSrcMs = $ms }
}

$needRestart = $true
if (Test-DeskReady) {
  $ver = Get-ExpectedUiLength
  if ($ver -and $ver.ok -eq $true -and $ver.startedAt -and ([long]$ver.startedAt -ge $latestSrcMs)) {
    $needRestart = $false
  } else {
    Stop-StalePort4080
  }
}

if ($needRestart -or (-not (Test-DeskReady))) {
  Stop-StalePort4080
  $nodeArgs = "--env-file-if-exists=.env src/main.ts --console"
  Start-Process -FilePath "node" -ArgumentList $nodeArgs -WorkingDirectory $RepoRoot -WindowStyle Hidden
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-DeskReady) { break }
  }
}

$ts = Get-Date -Format "yyyyMMddHHmmss"
$url = "http://localhost:4080/?v=$ts"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$chrome = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"

if (Test-Path $chrome) {
  Start-Process -FilePath $chrome -ArgumentList "--app=$url"
} elseif (Test-Path $edge) {
  Start-Process -FilePath $edge -ArgumentList "--app=$url"
} else {
  Start-Process $url
}
