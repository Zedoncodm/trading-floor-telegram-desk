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

if (-not (Test-DeskReady)) {
  $nodeArgs = "--env-file-if-exists=.env src/main.ts --console"
  Start-Process -FilePath "node" -ArgumentList $nodeArgs -WorkingDirectory $RepoRoot -WindowStyle Hidden
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-DeskReady) { break }
  }
}

$url = "http://localhost:4080"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$chrome = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"

if (Test-Path $chrome) {
  Start-Process -FilePath $chrome -ArgumentList "--app=$url"
} elseif (Test-Path $edge) {
  Start-Process -FilePath $edge -ArgumentList "--app=$url"
} else {
  Start-Process $url
}
