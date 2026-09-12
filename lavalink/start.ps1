# Chay Lavalink voi secret nap tu ../.env (khong hardcode trong application.yml)
# Dung:  .\start.ps1
#
# Luu y: phai gan qua provider "Env:" de bien duoc ke thua cho tien trinh java.
# [Environment]::SetEnvironmentVariable(..., "Process") khong du tin cay o day.

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "..\.env"

# In loi ro rang roi giu cua so lai: java thoat se lam cua so PowerShell dong ngay,
# nguoi chay khong kip doc loi.
function Fail([string]$message) {
    Write-Host $message -ForegroundColor Red
    Read-Host "Nhan Enter de dong"
    exit 1
}

if (-not (Test-Path $envFile)) {
    Fail "Khong tim thay $envFile - hay copy .env.example thanh .env truoc."
}

$loaded = 0
foreach ($line in (Get-Content $envFile)) {
    if ($line -notmatch '^\s*[^#].*=') { continue }
    $name, $value = $line -split '=', 2
    Set-Item -Path ("Env:" + $name.Trim()) -Value $value.Trim()
    $loaded++
}

if (-not $env:LAVALINK_PASSWORD) {
    Fail "Thieu LAVALINK_PASSWORD trong .env"
}

# Chan truong hop hay gap nhat: mot Lavalink khac dang chiem port,
# Spring se thoat voi PortInUseException va cua so dong truoc khi kip doc.
$port = if ($env:LAVALINK_PORT) { [int]$env:LAVALINK_PORT } else { 2333 }
$busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
    $pidOwner = $busy[0].OwningProcess
    $owner = (Get-Process -Id $pidOwner -ErrorAction SilentlyContinue).ProcessName
    Fail @"
Port $port dang bi chiem boi PID $pidOwner ($owner) - Lavalink co the dang chay san.
Dung no truoc roi chay lai:
  Stop-Process -Id $pidOwner
Hoac doi LAVALINK_PORT trong .env sang port khac.
"@
}

if (-not (Test-Path (Join-Path $PSScriptRoot "yt-dlp.exe"))) {
    Write-Warning "Chua co yt-dlp.exe - YouTube se khong phat duoc. Xem README muc 3."
}

Write-Output "Nap $loaded bien tu .env (mat khau dai $($env:LAVALINK_PASSWORD.Length) ky tu)"
Write-Output "Khoi dong Lavalink: port $($env:LAVALINK_PORT), bind 127.0.0.1"
Set-Location $PSScriptRoot
java -jar Lavalink.jar
if ($LASTEXITCODE -ne 0) {
    Fail "Lavalink thoat voi ma loi $LASTEXITCODE - xem log: lavalink\logs\spring.log"
}
