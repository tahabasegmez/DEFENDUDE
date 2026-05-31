param(
  [string]$ConfigPath = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $PSScriptRoot "review-zip.config.json"
}

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$outputDirectory = Join-Path $repoRoot $config.outputDirectory
$stagingDirectory = Join-Path $repoRoot $config.stagingDirectory
$archivePath = Join-Path $outputDirectory $config.archiveName

function Convert-ToRelativePath {
  param([string]$Path)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $rootPath = [System.IO.Path]::GetFullPath($repoRoot).TrimEnd("\")
  if ($fullPath -eq $rootPath) {
    return ""
  }

  if ($fullPath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath.Substring($rootPath.Length + 1).Replace("\", "/")
  }

  throw "Path is outside the repository root: $fullPath"
}

function Test-IsExcluded {
  param([string]$RelativePath)
  foreach ($pattern in $config.excludeGlobs) {
    if ($RelativePath -like $pattern) {
      return $true
    }
  }
  return $false
}

function Copy-IncludedPath {
  param([string]$RelativePath)

  $source = Join-Path $repoRoot $RelativePath
  if (-not (Test-Path $source)) {
    return
  }

  $relative = Convert-ToRelativePath $source
  if (Test-IsExcluded $relative) {
    return
  }

  if (Test-Path $source -PathType Leaf) {
    $target = Join-Path $stagingDirectory $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    return
  }

  Get-ChildItem -LiteralPath $source -Recurse -Force | ForEach-Object {
    $itemRelative = Convert-ToRelativePath $_.FullName
    if (Test-IsExcluded $itemRelative) {
      return
    }

    $target = Join-Path $stagingDirectory $itemRelative
    if ($_.PSIsContainer) {
      New-Item -ItemType Directory -Force -Path $target | Out-Null
    }
    else {
      New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
      Copy-Item -LiteralPath $_.FullName -Destination $target -Force
    }
  }
}

if (Test-Path $stagingDirectory) {
  Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $stagingDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

foreach ($relativePath in $config.includePaths) {
  Copy-IncludedPath $relativePath
}

if (Test-Path $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Compress-Archive -Path (Join-Path $stagingDirectory "*") -DestinationPath $archivePath -Force
Remove-Item -LiteralPath $stagingDirectory -Recurse -Force

Write-Host "Review zip created:"
Write-Host $archivePath
