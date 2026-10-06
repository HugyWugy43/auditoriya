param([string]$OutputPath = (Join-Path $PSScriptRoot '..\.env'))
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $OutputPath) { throw 'Файл уже существует. Секреты не перезаписаны.' }
function New-Secret([int]$Bytes = 48) { [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes($Bytes)) }
$values = [ordered]@{
 POSTGRES_PASSWORD = (New-Secret)
 USER_DB_PASSWORD = (New-Secret)
 ROOM_DB_PASSWORD = (New-Secret)
 BOOKING_DB_PASSWORD = (New-Secret)
 NOTIFICATION_DB_PASSWORD = (New-Secret)
 JWT_SECRET = (New-Secret)
 INTERNAL_SERVICE_TOKEN = (New-Secret)
 BOOTSTRAP_ADMIN_ENABLED = 'true'
 BOOTSTRAP_ADMIN_USERNAME = 'admin'
 BOOTSTRAP_ADMIN_EMAIL = 'admin@localhost.invalid'
 BOOTSTRAP_ADMIN_PASSWORD = (New-Secret 24)
}
$values.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Set-Content -Encoding utf8 -LiteralPath $OutputPath
Write-Host 'Создан локальный файл конфигурации. Пароли не выводятся в журнал.'
