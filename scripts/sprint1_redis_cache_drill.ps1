# Sprint 1 #106 — Redis AI cache flush drill (staging/local)
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_redis_cache_drill.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/sprint1_redis_cache_drill.ps1 -FlushOnly

param(
    [switch]$FlushOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

& powershell -ExecutionPolicy Bypass -File "$Root\scripts\bootstrap_dev_pg_redis.ps1" | Out-Null

$env:RAQAT_REDIS_URL = if ($env:RAQAT_REDIS_URL) { $env:RAQAT_REDIS_URL } else { "redis://127.0.0.1:16379/0" }

New-Item -ItemType Directory -Force -Path ".logs" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$log = Join-Path $Root ".logs\redis_cache_drill_$stamp.log"

$py = @"
import json
import os
import sys
from pathlib import Path

ROOT = Path(r'$Root')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'platform_api'))

from ai_exact_cache import (
    EXACT_CACHE_KEY_PREFIX,
    cache_flush_all_ai,
    cache_get_reply,
    cache_key_for_prompt,
    cache_set_reply,
)
from ai_semantic_cache import SEMANTIC_CACHE_KEY, cache_set_semantic

prompt = 'Sprint1 cache drill prompt'
before = cache_get_reply(prompt)
cache_set_reply(prompt, 'drill answer v1')
cache_set_semantic(prompt, 'drill answer v1')
hit = cache_get_reply(prompt)
key = cache_key_for_prompt(prompt)
stats = cache_flush_all_ai()
after = cache_get_reply(prompt)
print(json.dumps({
    'prefix': EXACT_CACHE_KEY_PREFIX,
    'semantic_key': SEMANTIC_CACHE_KEY,
    'key_sample': key[:48] + '...',
    'hit_before_flush': hit,
    'hit_after_flush': after,
    'flush_stats': stats,
}, ensure_ascii=False))
if hit != 'drill answer v1':
    raise SystemExit('cache_set/get failed')
if after is not None:
    raise SystemExit('stale entry after flush')
"@

if ($FlushOnly) {
    $py = @"
import json, sys
from pathlib import Path
ROOT = Path(r'$Root')
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'platform_api'))
from ai_exact_cache import cache_flush_all_ai
print(json.dumps({'flush_stats': cache_flush_all_ai()}, ensure_ascii=False))
"@
}

Write-Host "Redis cache drill — $env:RAQAT_REDIS_URL" -ForegroundColor Cyan
$out = python -c $py 2>&1
$out | Tee-Object -FilePath $log
if ($LASTEXITCODE -ne 0) { throw "cache drill failed: $out" }

Write-Host "OK — #106 Redis cache drill passed. Log: $log" -ForegroundColor Green
