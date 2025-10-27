# Remove all console statements from TypeScript/JavaScript files
# This script removes console.log, console.error, console.warn, console.debug statements

$sourceDir = "src"
$files = Get-ChildItem -Path $sourceDir -Include *.ts,*.tsx,*.js,*.jsx -Recurse

$totalRemoved = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Remove console.log statements (with any arguments)
    $content = $content -replace "console\.log\([^)]*\);\s*", ""

    # Remove console.error statements
    $content = $content -replace "console\.error\([^)]*\);\s*", ""

    # Remove console.warn statements
    $content = $content -replace "console\.warn\([^)]*\);\s*", ""

    # Remove console.debug statements
    $content = $content -replace "console\.debug\([^)]*\);\s*", ""

    # Remove console statements without semicolons (on their own line)
    $content = $content -replace "^\s*console\.(log|error|warn|debug)\([^)]*\)\s*$", "" -replace "`r`n`r`n`r`n", "`r`n`r`n"

    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $removed = ([regex]::Matches($originalContent, "console\.(log|error|warn|debug)")).Count
        $totalRemoved += $removed
        Write-Host "✓ Cleaned $($file.Name): removed $removed console statements"
    }
}

Write-Host "`n✅ Total console statements removed: $totalRemoved"
Write-Host "🎉 Production code is now clean!"
