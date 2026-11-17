$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Invoke-Git {
    & git @args
    if ($LASTEXITCODE -ne 0) { throw "Git failed: $args" }
}

$expectedRemote = 'https://github.com/nbt2005/DS441_Individual_Mini_Projects.git'
$remote = & git remote get-url origin
if ($LASTEXITCODE -ne 0 -or $remote -ne $expectedRemote) {
    throw 'Unexpected origin. No changes were published.'
}
$branch = & git branch --show-current
if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') {
    throw 'Run this script on branch main.'
}

Invoke-Git fetch origin main
Invoke-Git merge-base --is-ancestor origin/main HEAD

& npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Tests failed. No changes were published.' }

Invoke-Git add -- README.md .gitignore contracts docs evidence frontend package.json package-lock.json scripts publish.ps1
Invoke-Git diff --cached --check
& git diff --cached --quiet
$diffExit = $LASTEXITCODE
if ($diffExit -eq 1) {
    # Reuse the existing repository author's identity for this commit only.
    $authorName = & git log -1 --format=%an
    $authorEmail = & git log -1 --format=%ae
    if (-not $authorName -or -not $authorEmail) { throw 'Repository author identity is missing.' }
    Invoke-Git -c "user.name=$authorName" -c "user.email=$authorEmail" commit -m 'Complete Recycling Points Ledger assignment and evidence'
} elseif ($diffExit -ne 0) {
    throw 'Could not inspect staged changes.'
}

Invoke-Git push origin main
Invoke-Git log -1 --oneline
