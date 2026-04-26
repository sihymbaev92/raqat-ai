# Portable жинақтағы pytest: handlers/config/state жоқ кезде жиналатын тесттер.
# Пайдалану: powershell -ExecutionPolicy Bypass -File scripts\run_pytest_portable.ps1
# Алдымен: platform_api\.venv + pip install -r platform_api\requirements.txt -r scripts\requirements-dev.txt
param(
    [switch]$Verbose
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Py = Join-Path $Root "platform_api\.venv\Scripts\python.exe"
if (-not (Test-Path $Py)) {
    Write-Error "Missing platform_api\.venv - run scripts\setup_venv_platform_api.ps1 first."
}
$env:PYTHONPATH = "platform_api"
$tests = @(
    "tests/test_auth_link.py",
    "tests/test_content_and_bot_sync_api.py",
    "tests/test_dialect_sql.py",
    "tests/test_get_db.py",
    "tests/test_migrations.py",
    "tests/test_hadith_kk_quality.py",
    "tests/test_halal_service.py",
    "tests/test_prayer_visuals.py",
    "tests/test_qibla_service.py",
    "tests/test_quran_translit.py",
    "tests/test_text_cleanup.py",
    "tests/test_voice_service.py",
    "tests/test_pg_migrate_integration.py"
) | ForEach-Object { Join-Path $Root $_ }
Set-Location $Root
# Startup smoke: DB схема үйлесімділігі (міндетті бағандар + info warnings)
& $Py "scripts/check_schema_compat.py" "--db" "global_clean.db"
$pytestArgs = @("-m", "pytest") + $tests
if ($Verbose) { $pytestArgs += "-v" }
& $Py @pytestArgs
