# RAQAT v1 Technical Architecture

This document binds the RAQAT Islamic ecosystem to a layered, modular architecture.

## 1. North Star

RAQAT is a trust-first Islamic AI platform:

- User asks
- System answers with grounded evidence
- Trust grows

Core trust assets:

- Qur'an
- Sahih hadith
- Safety-aware AI assistant
- Worship utility tools

## 2. Layered Architecture

### 2.1 Experience Layer

- Telegram bot
- Mobile app
- Web app
- Admin panel

All clients consume the same platform API and identity model.

### 2.2 Platform Gateway Layer

Single entry point for all clients:

- Authentication and authorization
- Rate limiting
- Request tracing and structured logging
- API versioning
- Response normalization
- Routing into domain services

### 2.3 Identity Layer

Canonical identity model:

- `global_user_id` (UUID) as the only source of user truth
- Linked identities: `telegram_id`, `phone`, `email`, `apple_sub`, `google_sub`, `device_id`

### 2.4 Domain Services Layer

- Auth service
- User service
- Quran service
- Hadith service
- AI orchestrator service
- Worship tools service
- Halal service
- Notifications service

### 2.5 Data Layer

- PostgreSQL for transactional data
- Redis for cache, counters, temporary tokens, queue coordination
- Search index (PostgreSQL FTS first, OpenSearch/Meilisearch later)
- S3-compatible object storage

### 2.6 Operations Layer

- Background workers
- Monitoring and alerting
- Backups and restore drills
- Audit reporting
- CI/CD pipeline

## 3. AI Contract (Retrieval Grounded)

Pipeline:

1. Intent detection
2. Evidence retrieval from trusted Islamic sources
3. Reasoning/generation
4. Safety guardrails and disclaimers

The assistant must be retrieval-first, not LLM-first.

## 4. Reliability Rules

- `/health` for liveness
- `/ready` for dependency readiness
- Graceful degradation between services
- Retry and timeout strategy
- Circuit breaker for unstable upstreams
- Structured logs and exception tracking

## 5. Security Rules

- JWT access + refresh
- Token rotation and revocation
- Session and device management
- RBAC (`user`, `reviewer`, `moderator`, `admin`, `superadmin`)
- Content provenance and review flags
- Immutable audit trail for sensitive actions

## 6. Repository Binding (Current Implementation)

A new modular skeleton exists at `platform_api/app`:

- `app/main.py`: modern API entrypoint
- `app/core`: config and response contracts
- `app/infrastructure`: DB and readiness utilities
- `app/api/v1`: versioned endpoint modules grouped by domain

The current production MVP entrypoint (`platform_api/main.py`) is intentionally kept intact for compatibility.

## 7. Next Implementation Steps

1. Wire domain services to real repositories
2. Add SQLAlchemy models + Alembic migrations for PostgreSQL
3. Replace placeholder handlers with actual business logic
4. Integrate Redis cache and worker queue
5. Add auth scopes and policy guards per endpoint
6. Add tests for health, auth flow, and AI safety decisions
