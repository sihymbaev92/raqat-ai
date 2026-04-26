# Репо түбірінен: Redis (опция) → platform_api → GET /ready → Telegram бот.
# Альтернатива: Docker — infra/docker/docker-compose.stack.yml + scripts\stack_docker_up.ps1
# Пайдалану (PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\scripts\run_stack_dev.ps1
#   Тек бот (API бұрыннан жүріп тұр): -BotOnly
#   Redis жоқ жергілікті: -Dev (API-ға -Dev беріледі)
#   Docker Redis өткізу: -SkipDockerRedis
#   Бот тоқтағанда API терезесін жабу: -StopApiWhenBotStops
#   Docker стек (infra/docker/docker-compose.stack.yml): -UseStackDocker (-BuildStack)
param(
    [switch]$Dev,
    [switch]$SkipDockerRedis,
    [switch]$BotOnly,
    [switch]$StopApiWhenBotStops,
    [switch]$UseStackDocker,
    [switch]$BuildStack,
    [int]$Port = 0
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ComposeMain = Join-Path $Root "infra\docker\docker-compose.yml"
$ComposeStack = Join-Path $Root "infra\docker\docker-compose.stack.yml"
$RunApi = Join-Path $Root "scripts\run_platform_api.ps1"
$RunBot = Join-Path $Root "scripts\run_bot.ps1"
$usedStackDocker = $false

function Import-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        elseif ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
        if ($key.Length -gt 0) {
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

Import-DotEnv (Join-Path $Root ".env")

if ($Port -le 0) {
    $Port = 8787
    if ($env:PORT) {
        try { $Port = [int]$env:PORT } catch { $Port = 8787 }
    }
}
$env:PORT = "$Port"

Set-Location $Root

$apiProc = $null
if (-not $BotOnly) {
    if ($UseStackDocker) {
        $dk = Get-Command docker -ErrorAction SilentlyContinue
        if (-not $dk) {
            Write-Error "docker not in PATH (-UseStackDocker үшін қажет)"
        }
        $redisHostPort = if ($env:RAQAT_STACK_REDIS_PORT) { $env:RAQAT_STACK_REDIS_PORT } else { "6380" }
        if (-not $env:RAQAT_REDIS_URL) {
            $env:RAQAT_REDIS_URL = "redis://127.0.0.1:$redisHostPort/0"
        }
        Write-Host "Starting Docker stack: $ComposeStack (Redis:$redisHostPort → API:$Port)..."
        $dc = @("compose", "-f", $ComposeStack, "up")
        if ($BuildStack) { $dc += "--build" }
        $dc += "-d"
        Set-Location $Root
        & docker @dc
        if ($LASTEXITCODE -ne 0) {
            Write-Error "docker compose stack up failed"
        }
        $usedStackDocker = $true
        if (-not $env:RAQAT_PLATFORM_URL) {
            $env:RAQAT_PLATFORM_URL = "http://127.0.0.1:$Port"
            Write-Host "Set RAQAT_PLATFORM_URL=$($env:RAQAT_PLATFORM_URL) (бот үшін процесс .env)"
        }
    } else {
        $redisUp = $false
        if (-not $SkipDockerRedis) {
            $docker = Get-Command docker -ErrorAction SilentlyContinue
            if ($docker) {
                docker compose -f $ComposeMain up -d redis 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $redisUp = $true
                    Write-Host "OK: Docker Redis up."
                    if (-not $env:RAQAT_REDIS_URL) {
                        $env:RAQAT_REDIS_URL = "redis://127.0.0.1:6379/0"
                    }
                } else {
                    Write-Host "WARN: docker compose redis failed — API Dev режимі немесе Redis орнатыңыз."
                }
            }
        }

        $useDevSwitch = $Dev
        if (-not $redisUp -and -not $Dev) {
            $useDevSwitch = $true
            Write-Host "WARN: Redis жоқ — API -Dev (RAQAT_REDIS_REQUIRED=0) іске қосылады."
        }

        $apiArgList = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $RunApi)
        if ($useDevSwitch) { $apiArgList += "-Dev" }

        Write-Host "Starting platform API in new window (PORT=$Port)..."
        $apiProc = Start-Process -FilePath "powershell.exe" -ArgumentList $apiArgList -PassThru -WindowStyle Normal
    }

    $readyUrl = "http://127.0.0.1:$Port/ready"
    $waitSec = if ($UseStackDocker) { 180 } else { 90 }
    Write-Host "Waiting for GET $readyUrl (ok=true), max ${waitSec}s ..."
    $ok = $false
    for ($i = 0; $i -lt $waitSec; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri $readyUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) {
                $j = $resp.Content | ConvertFrom-Json
                if ($j.ok -eq $true) {
                    $ok = $true
                    break
                }
            }
        } catch {
            # API әлі тұрмаған
        }
        Start-Sleep -Seconds 1
    }
    if (-not $ok) {
        if ($UseStackDocker) {
            Write-Error "API /ready дайын болмады. Лог: docker compose -f infra/docker/docker-compose.stack.yml logs platform-api"
        } else {
            Write-Error "API /ready ${waitSec} сек ішінде дайын болмады. uvicorn терезесін қараңыз."
        }
    }
    Write-Host "OK: platform API ready."
} else {
    Write-Host "BotOnly: API іске қосылмайды."
}

try {
    Write-Host "Starting Telegram bot..."
    & powershell -NoProfile -ExecutionPolicy Bypass -File $RunBot
} finally {
    if ($StopApiWhenBotStops) {
        if ($usedStackDocker) {
            Write-Host "Stopping Docker stack (compose down)..."
            Set-Location $Root
            & docker compose -f $ComposeStack down 2>$null
        } elseif ($apiProc -and -not $apiProc.HasExited) {
            Write-Host "Stopping API process (PID $($apiProc.Id))..."
            Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
