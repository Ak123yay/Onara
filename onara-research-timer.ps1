$cli = (Get-ChildItem "$env:USERPROFILE\.wakatime" -Filter "wakatime-cli*.exe" -Recurse | Select-Object -First 1).FullName

if (-not $cli) {
    Write-Host "Could not find wakatime-cli."
    Write-Host "Make sure Hackatime is installed in VS Code and you are logged in."
    exit
}

$project = "Onara"
$entity = Join-Path $PSScriptRoot "hello.py"

if (-not (Test-Path $entity)) {
    New-Item -ItemType File -Path $entity | Out-Null
}

Write-Host "Onara research timer started."
Write-Host "Project: $project"
Write-Host "Entity: $entity"
Write-Host "Category: Coding"
Write-Host "Only keep this running while you are actually researching Onara ideas."
Write-Host "Press Ctrl + C to stop."

while ($true) {
    & $cli `
      --entity $entity `
      --project $project `
      --category researching `
      --write

    Write-Host "Sent Onara heartbeat at $(Get-Date -Format 'h:mm:ss tt')"

    Start-Sleep -Seconds 120
}