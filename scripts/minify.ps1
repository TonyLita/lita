<#
Simple minifier for this static project.

Usage:
  Open PowerShell in the repo root (c:\portfolio) and run:
    .\scripts\minify.ps1

What it does:
- Produces assets/css/main.min.css from assets/css/main.css
- Produces assets/js/main.min.js from assets/js/main.js

Notes:
- This script performs conservative minification (removes block comments, collapses whitespace).
- For stronger/minifier-quality results install Node + terser/clean-css and pass -UseNode parameter.
- Always review the generated files before deploying.
#>
param(
  [switch]$UseNode
)

function Minify-CSS($srcPath, $outPath) {
  if (-not (Test-Path $srcPath)) { Write-Host "CSS source not found: $srcPath"; return }
  $css = Get-Content $srcPath -Raw -ErrorAction Stop
  # Remove block comments
  $css = [regex]::Replace($css, '/\*.*?\*/', '', 'Singleline')
  # Remove newlines and collapse whitespace
  $css = [regex]::Replace($css, "\s+", ' ')
  # Tighten around punctuation
  $css = [regex]::Replace($css, '\s?([{}:;,])\s?', '$1')
  # Trim
  $css = $css.Trim()
  Set-Content -LiteralPath $outPath -Value $css -Encoding UTF8
  Write-Host "Wrote: $outPath"
}

function Minify-JS-Conservative($srcPath, $outPath) {
  if (-not (Test-Path $srcPath)) { Write-Host "JS source not found: $srcPath"; return }
  $js = Get-Content $srcPath -Raw -ErrorAction Stop
  # Remove block comments (/* ... */)
  $js = [regex]::Replace($js, '/\*.*?\*/', '', 'Singleline')
  # Collapse multiple blank lines
  $js = [regex]::Replace($js, "\r?\n[ \t\f]*\r?\n", "\n")
  # Collapse spaces (conservative)
  $js = [regex]::Replace($js, "[ \t]{2,}", ' ')
  # Remove leading/trailing whitespace on lines
  $lines = $js -split "\r?\n"
  $lines = $lines | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
  $min = ($lines -join ' ')
  $min = $min.Trim()
  Set-Content -LiteralPath $outPath -Value $min -Encoding UTF8
  Write-Host "Wrote: $outPath"
}

function Minify-UsingNode($srcPath, $outPath, $type) {
  # Requires terser (npm i -g terser) for JS and clean-css-cli (npm i -g clean-css-cli) for CSS
  if ($type -eq 'js') {
    $cmd = "terser `"$srcPath`" -c -m -o `"$outPath`""
  } else {
    $cmd = "cleancss -o `"$outPath`" `"$srcPath`""
  }
  Write-Host "Running: $cmd"
  $proc = Start-Process -FilePath pwsh -ArgumentList "-NoProfile","-Command","$cmd" -Wait -NoNewWindow -PassThru
n  if ($proc.ExitCode -eq 0) { Write-Host "Wrote: $outPath (node minifier)" } else { Write-Host "Node minifier failed with code $($proc.ExitCode)" }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

$cssSrc = 'assets/css/main.css'
$cssOut = 'assets/css/main.min.css'
$jsSrc = 'assets/js/main.js'
$jsOut = 'assets/js/main.min.js'

if ($UseNode) {
  Minify-UsingNode $cssSrc $cssOut 'css'
  Minify-UsingNode $jsSrc $jsOut 'js'
} else {
  Minify-CSS $cssSrc $cssOut
  Minify-JS-Conservative $jsSrc $jsOut
}

Write-Host "Done. Review the generated files before deploying."