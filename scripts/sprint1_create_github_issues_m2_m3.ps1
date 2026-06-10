# Create Sprint 1 GitHub issues #104-107 (M2/M3).
param([switch]$DryRun)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "gh not authenticated" }

Push-Location $Root
try {
    $repo = gh repo view --json nameWithOwner -q .nameWithOwner
    foreach ($lb in @("sprint-1", "P0", "M2", "M3")) {
        if (-not $DryRun) { gh label create $lb --color "5319E7" --force 2>$null | Out-Null }
    }

    $issues = @(
        @{
            Title = "[Sprint 1][M2] #104 Last read remote sync (Hatim pattern)"
            Labels = @("sprint-1", "P0", "M2")
            Body = @"
## Description
Extend ``useLastReadPersistence`` with optional server sync (Hatim ``hatimProgress.ts`` pattern). Device QA: background app → reopen Quran → last ayah restored.

## Depends on
- #5 (M1 cutover gate) — or #103 sprint ID

## Tasks
- [ ] Design sync endpoint or reuse progress store
- [ ] Wire ``QuranSurahScreen`` / ``useLastReadPersistence``
- [ ] Jest: ``quranLastRead.test.ts`` extended
- [ ] Device QA background scenario

## Acceptance Criteria
- [ ] Last read survives app background on device
- [ ] Offline fallback when API unavailable
"@
        },
        @{
            Title = "[Sprint 1][M2] #105 AI KB-Only negative test suite + middleware audit"
            Labels = @("sprint-1", "P0", "M2")
            Body = @"
## Description
Expand adversarial tests for ``RAQAT_AI_KB_ONLY=1``; audit ``platform_api/ai_proxy.py`` middleware paths.

## Depends on
- M1 complete (#3–#5)

## Tasks
- [ ] Add negative cases to ``tests/test_ai_kb_only_mode.py``
- [ ] Run ``tests/test_ai_reply_guards.py`` in CI gate
- [ ] Verify ``GET /api/v1/ai/kb/status`` → ``kb_only: true``
- [ ] Document rollback in Deep Dive §4.2

## Acceptance Criteria
- [ ] 5+ adversarial prompts blocked or KB-sourced only
- [ ] CI green on AI test subset
"@
        },
        @{
            Title = "[Sprint 1][M3] #106 Redis write invalidation + cache drill"
            Labels = @("sprint-1", "P0", "M3")
            Body = @"
## Description
Document and verify cache TTL + invalidation on DB write (AI exact cache, tag pattern from genealogy cache manager).

## Depends on
- #4 (migration pipeline)

## Tasks
- [ ] Document key patterns in ``platform_api/ai_exact_cache.py``
- [ ] Invalidation hook on ``platform_ai_chat_messages`` insert
- [ ] Staging flush drill runbook step

## Acceptance Criteria
- [ ] Stale cache scenario documented + tested on staging
"@
        },
        @{
            Title = "[Sprint 1][M3] #107 Incident simulation Day 13–14"
            Labels = @("sprint-1", "P0", "M3")
            Body = @"
## Description
Execute SIM-01..04 from ``docs/operations/sprint-1-architecture-deep-dive-v2.md`` §6.

## Depends on
- #104, #105, #106

## Tasks
- [ ] SIM-01: PG down → rollback < 15 min
- [ ] SIM-02: AI adversarial prompts
- [ ] SIM-03: Mobile background last read
- [ ] SIM-04: Metrics rollback trigger dry-run
- [ ] M3 sign-off in sprint board

## Acceptance Criteria
- [ ] All SIM scenarios logged with timings
- [ ] Freeze lift proposal ready
"@
        }
    )

    foreach ($issue in $issues) {
        Write-Host "`n=== $($issue.Title) ===" -ForegroundColor Cyan
        if ($DryRun) { Write-Host "[DryRun]" -ForegroundColor Yellow; continue }
        $tmp = [System.IO.Path]::GetTempFileName()
        try {
            [System.IO.File]::WriteAllText($tmp, $issue.Body.Trim(), [System.Text.UTF8Encoding]::new($false))
            $args = @("issue", "create", "-R", $repo, "--title", $issue.Title, "--body-file", $tmp)
            foreach ($lb in $issue.Labels) { $args += @("--label", $lb) }
            $out = & gh @args 2>&1
            if ($LASTEXITCODE -ne 0) { throw ($out -join "`n") }
            Write-Host $out -ForegroundColor Green
        }
        finally { Remove-Item -Force $tmp -ErrorAction SilentlyContinue }
    }
}
finally { Pop-Location }
