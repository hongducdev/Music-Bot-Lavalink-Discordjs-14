# Chay Lavalink voi secret nap tu ../.env (khong hardcode trong application.yml)
# Dung:  .\start.ps1
#
# Luu y: phai gan qua provider "Env:" de bien duoc ke thua cho tien trinh java.
# [Environment]::SetEnvironmentVariable(..., "Process") khong du tin cay o day.

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "..\.env"
if (-not (Test-Path $envFile)) {
    throw "Khong tim thay $envFile - hay copy .env.example thanh .env truoc."
}

$loaded = 0
foreach ($line in (Get-Content $envFile)) {
    if ($line -notmatch '^\s*[^#].*=') { continue }
    $name, $value = $line -split '=', 2
    Set-Item -Path ("Env:" + $name.Trim()) -Value $value.Trim()
    $loaded++
}

if (-not $env:LAVALINK_PASSWORD) {
    throw "Thieu LAVALINK_PASSWORD trong .env"
}

if (-not (Test-Path (Join-Path $PSScriptRoot "yt-dlp.exe"))) {
    Write-Warning "Chua co yt-dlp.exe - YouTube se khong phat duoc. Xem README muc 3."
}

Write-Output "Nap $loaded bien tu .env (mat khau dai $($env:LAVALINK_PASSWORD.Length) ky tu)"
Write-Output "Khoi dong Lavalink: port $($env:LAVALINK_PORT), bind 127.0.0.1"
Set-Location $PSScriptRoot
java -jar Lavalink.jar
