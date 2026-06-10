## Summary

<!-- Не не істелді, неге (1–3 сөйлем) -->

## Feature freeze (2026-06)

<!-- https://github.com/.../docs/roadmap/feature-freeze-2026-06.md -->

- [ ] **Жаңа экран / интеграция жоқ** (немесе freeze lift рұқсаты бар)
- [ ] Scope: crash fix · perf · UX polish · security · offline · Quran/Hatim/KB-only maintenance
- [ ] `npm run test:full` (`mobile/`) green (немесе неге skip)
- [ ] `pytest tests` green (backend touched болса)
- [ ] Device QA: [2026-05-24-device-qa.md](docs/mobile/changelog/2026-05-24-device-qa.md) — §N touched болса

## Test plan

- [ ] Jest / pytest
- [ ] `scripts/mobile_device_qa_preflight.ps1` (mobile/release)
- [ ] `scripts/perf_smoke_baseline.ps1` (perf/API touched)
