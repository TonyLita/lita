This folder contains a basic PowerShell minifier helper for the static portfolio.

Usage:

1) Open PowerShell at the project root (c:\portfolio)
2) Run the script:
   .\scripts\minify.ps1

Options:
- Use -UseNode if you have Node installed and want to use terser/clean-css for stronger minification:
  .\scripts\minify.ps1 -UseNode

What it creates:
- assets/css/main.min.css
- assets/js/main.min.js

After generating, update your HTML to reference the minified files (or keep using the original files during development).

To revert, remove or rename the .min files and point your HTML back to the original files.
