param(
    [string] $AssetRoot = "wwwroot/assets/pixel",
    [string] $OutputPath = "wwwroot/assets/pixel/assets.manifest.json",
    [string] $ReportPath = "wwwroot/assets/pixel/assets.manifest-report.json"
)

$ErrorActionPreference = "Stop"

$metadataPath = Join-Path $AssetRoot "metadata.csv"
if (-not (Test-Path $metadataPath)) {
    throw "Metadata file not found: $metadataPath"
}

function Convert-ToAssetKey {
    param(
        [string] $Category,
        [string] $Label
    )

    $parts = @($Category -split "[\\/]" | Where-Object { $_ }) + @($Label)
    return ($parts | ForEach-Object {
        $_.ToLowerInvariant() -replace "[^a-z0-9]+", "_"
    }) -join "."
}

function Get-AnimationKey {
    param(
        [string] $Category,
        [string] $Label
    )

    $baseLabel = $Label -replace "_frame_\d+$", ""
    return Convert-ToAssetKey -Category $Category -Label $baseLabel
}

$rows = Import-Csv $metadataPath
$imageEntries = @()

foreach ($row in $rows) {
    $relativeFile = ($row.file -replace "\\", "/")
    $width = [int]$row.bbox_x2 - [int]$row.bbox_x1 + 1
    $height = [int]$row.bbox_y2 - [int]$row.bbox_y1 + 1

    $imageEntries += [pscustomobject]@{
        key = Convert-ToAssetKey -Category $row.category -Label $row.label
        category = $row.category
        label = $row.label
        path = "/assets/pixel/$relativeFile"
        source = $row.source
        width = $width
        height = $height
        bounds = [pscustomobject]@{
            x1 = [int]$row.bbox_x1
            y1 = [int]$row.bbox_y1
            x2 = [int]$row.bbox_x2
            y2 = [int]$row.bbox_y2
        }
    }
}

$animationEntries = @()
$frameRows = $rows | Where-Object { $_.label -match "_frame_\d+$" }

foreach ($group in ($frameRows | Group-Object { Get-AnimationKey -Category $_.category -Label $_.label })) {
    $frames = $group.Group |
        Sort-Object { [int]([regex]::Match($_.label, "_frame_(\d+)$").Groups[1].Value) } |
        ForEach-Object {
            Convert-ToAssetKey -Category $_.category -Label $_.label
        }

    $animationEntries += [pscustomobject]@{
        key = $group.Name
        frames = @($frames)
        frameRate = 8
        repeat = -1
    }
}

$categories = $imageEntries |
    Group-Object category |
    ForEach-Object {
        [pscustomobject]@{
            name = $_.Name
            count = $_.Count
        }
    }

$manifest = [ordered]@{
    version = 1
    generatedAtUtc = (Get-Date).ToUniversalTime().ToString("O")
    assetRoot = "/assets/pixel"
    images = @($imageEntries | Sort-Object key)
    animations = @($animationEntries | Sort-Object key)
    categories = @($categories | Sort-Object name)
}

$report = [ordered]@{
    totalImages = $imageEntries.Count
    totalAnimations = $animationEntries.Count
    categories = $manifest.categories
    warnings = @(
        "Some source sets are intentionally asymmetric; verify left/right parity before binding gameplay-critical animations."
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path -LiteralPath (Split-Path $OutputPath -Parent)).Path + [System.IO.Path]::DirectorySeparatorChar + (Split-Path $OutputPath -Leaf), ($manifest | ConvertTo-Json -Depth 8), $utf8NoBom)
[System.IO.File]::WriteAllText((Resolve-Path -LiteralPath (Split-Path $ReportPath -Parent)).Path + [System.IO.Path]::DirectorySeparatorChar + (Split-Path $ReportPath -Leaf), ($report | ConvertTo-Json -Depth 8), $utf8NoBom)

Write-Host "Generated asset manifest: $OutputPath"
Write-Host "Images: $($imageEntries.Count), animations: $($animationEntries.Count)"
