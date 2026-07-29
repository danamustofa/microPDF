<#
.SYNOPSIS
    Downloads Ghostscript into vendor/ so microPDF can use it as its second
    compression engine.

.DESCRIPTION
    vendor/ is gitignored because the binaries are ~40 MB. Run this once after
    cloning, and again whenever you bump $Version.

    Ghostscript is licensed under the AGPLv3. If you redistribute a build that
    bundles it, your distribution must comply with the AGPL - or you need a
    commercial licence from Artifex. The licence text is kept alongside the
    binaries as COPYING-Ghostscript.txt.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\fetch-ghostscript.ps1
#>

param(
    [string]$Version = "10.07.1",
    [string]$Tag     = "gs10071"
)

$ErrorActionPreference = "Stop"

$root      = Split-Path -Parent $PSScriptRoot
$target    = Join-Path $root "vendor\ghostscript"
$installer = Join-Path $env:TEMP "$Tag`w64.exe"
$url       = "https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/$Tag/$Tag" + "w64.exe"

if (Test-Path (Join-Path $target "bin\gswin64c.exe")) {
    $existing = & (Join-Path $target "bin\gswin64c.exe") --version
    Write-Host "Ghostscript $existing already present in vendor/ - nothing to do."
    Write-Host "Delete vendor\ghostscript first if you want to re-fetch."
    exit 0
}

Write-Host "Downloading Ghostscript $Version (~62 MB)..."
$ProgressPreference = "SilentlyContinue"
Invoke-WebRequest -Uri $url -OutFile $installer

Write-Host "Extracting to vendor\ghostscript..."
New-Item -ItemType Directory -Force -Path $target | Out-Null
Start-Process -FilePath $installer -ArgumentList "/S", "/D=$target" -Wait

if (-not (Test-Path (Join-Path $target "bin\gswin64c.exe"))) {
    throw "Extraction failed - gswin64c.exe not found in $target"
}

# Keep the AGPL text next to the binaries, then drop what we do not ship.
$copying = Join-Path $target "doc\COPYING"
if (Test-Path $copying) {
    Copy-Item $copying (Join-Path $target "COPYING-Ghostscript.txt") -Force
}
foreach ($cruft in @("doc", "examples", "uninstgs.exe", "bin\gsdll64.lib", "bin\gswin64.exe")) {
    $p = Join-Path $target $cruft
    if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}

Remove-Item $installer -Force -ErrorAction SilentlyContinue

$size = (Get-ChildItem $target -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
$ver  = & (Join-Path $target "bin\gswin64c.exe") --version
Write-Host ("Done. Ghostscript {0} installed in vendor\ghostscript ({1:N1} MB)." -f $ver, $size)
