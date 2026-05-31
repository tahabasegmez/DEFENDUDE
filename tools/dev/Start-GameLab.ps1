param(
  [int]$Port = 5174,
  [string]$Path = "/",
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$gameLab = Join-Path $repoRoot "experiments\game-lab"
$url = "http://127.0.0.1:$Port$Path"

function Show-LauncherHeader {
  Clear-Host
  Write-Host ""
  Write-Host "  DDDDD   EEEEE  FFFFF  EEEEE  N   N  DDDD   U   U  DDDD   EEEEE" -ForegroundColor Yellow
  Write-Host "  D    D  E      F      E      NN  N  D   D  U   U  D   D  E    " -ForegroundColor Yellow
  Write-Host "  D    D  EEEE   FFFF   EEEE   N N N  D   D  U   U  D   D  EEEE " -ForegroundColor Yellow
  Write-Host "  D    D  E      F      E      N  NN  D   D  U   U  D   D  E    " -ForegroundColor Yellow
  Write-Host "  DDDDD   EEEEE  F      EEEEE  N   N  DDDD    UUU   DDDD   EEEEE" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "  Game Lab Launcher" -ForegroundColor DarkYellow
  Write-Host ""
}

function Show-LoadingAnimation {
  param(
    [string]$Message,
    [int]$Cycles = 12,
    [int]$DelayMilliseconds = 90
  )

  $frames = @("|", "/", "-", "\")
  for ($index = 0; $index -lt $Cycles; $index++) {
    $frame = $frames[$index % $frames.Count]
    Write-Host -NoNewline "`r  $Message $frame"
    Start-Sleep -Milliseconds $DelayMilliseconds
  }
  Write-Host "`r  $Message done.   "
}

function Write-Step {
  param([string]$Message)
  Write-Host "  > $Message" -ForegroundColor Cyan
}

function Assert-CommandExists {
  param(
    [string]$Name,
    [string]$InstallHint
  )

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name was not found. $InstallHint"
  }
}

function Test-GameLabServer {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  }
  catch {
    return $false
  }
}

function Get-ChromePath {
  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Test-DependenciesInstalled {
  $nodeModules = Join-Path $gameLab "node_modules"
  $phaserPackage = Join-Path $nodeModules "phaser\package.json"
  $vitePackage = Join-Path $nodeModules "vite\package.json"
  return (Test-Path $phaserPackage) -and (Test-Path $vitePackage)
}

function Install-GameLabDependencies {
  if ($SkipInstall) {
    return
  }

  if (Test-DependenciesInstalled) {
    Write-Step "Dependencies are ready."
    return
  }

  Write-Step "Installing game lab dependencies. This needs internet the first time..."
  if (Test-Path (Join-Path $gameLab "package-lock.json")) {
    & npm.cmd ci --prefix $gameLab
  }
  else {
    & npm.cmd install --prefix $gameLab
  }

  if ($LASTEXITCODE -ne 0) {
    throw "Dependency installation failed. Check your internet connection and npm setup."
  }
}

Show-LauncherHeader
Show-LoadingAnimation "Loading DEFENDUDE" 16 80
Assert-CommandExists "node.exe" "Install Node.js LTS from https://nodejs.org/ and run Start-GameLab.cmd again."
Assert-CommandExists "npm.cmd" "Install Node.js LTS from https://nodejs.org/ and run Start-GameLab.cmd again."
Write-Step "Node.js and npm found."
Install-GameLabDependencies

if (-not (Test-GameLabServer)) {
  Write-Step "Starting local game server on $url"
  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $gameLab -WindowStyle Hidden

  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    if (Test-GameLabServer) {
      break
    }
    Show-LoadingAnimation "Waiting for server" 1 180
  }
}
else {
  Write-Step "Local game server is already running."
}

$chrome = Get-ChromePath
if ($chrome) {
  Write-Step "Opening Chrome."
  Start-Process -FilePath $chrome -ArgumentList @("--new-window", $url)
}
else {
  Write-Step "Chrome was not found. Opening the default browser."
  Start-Process $url
}

Write-Host ""
Write-Host "  DEFENDUDE is ready: $url" -ForegroundColor Green
Write-Host "  You can close this window after the browser opens." -ForegroundColor DarkGray
