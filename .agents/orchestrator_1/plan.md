# Orchestrator Master Plan

## 1. Survey Phase
- Spawn 3 Explorers / Spec Miners:
  1. `explorer_1_survey_backend`: Examine existing backend/ (Node/Express/Postgres/etc.), database schemas, scripts, endpoints, package.json, docker-compose.
  2. `explorer_2_survey_frontend_widget`: Examine public/ (widget.js bundle), test-site/ (secondary origin on :5500), styling, embed snippet scripts.
  3. `spec_miner_1_requirements`: Mine all explicit and implicit requirements from ORIGINAL_REQUEST.md, capstone.yaml, and acceptance probes 1-6.
- Synthesize findings into `PROJECT.md` at project root with complete Feature Inventory, Milestones, and Interface Contracts.

## 2. Dual-Track Execution
- **Track 1: E2E Acceptance Testing Track**
  - Build comprehensive test runner and test suites (Tiers 1-4) verifying all 6 acceptance probes and requirement areas independently on :5500 and API server.
  - Publish `TEST_READY.md`.
- **Track 2: Implementation Track**
  - M1: Auth & Multi-tenant Widget CRUD (`/api/widgets`, JWT auth, embed snippet generator).
  - M2: Widget Delivery & Configuration (`/widget.js`, `/widgets/:id/config` with CORS and caching headers).
  - M3: Hardened Public Submission Pipeline (`POST /api/submissions`, boundary & 100KB limits, rate limiter, honeypot `_hp`, geo IP fallback chain, non-blocking side-effects, idempotency).
  - M4: Aggregated Dashboard Analytics (`/api/dashboard/*` pagination, metrics, geo breakdowns).
  - M5: Customer Test Website & End-to-End Integration (`http://localhost:5500` cross-origin test harness).

## 3. Final Milestone & Hardening
- Pass 100% E2E tests (Probes 1-6).
- Phase 2 Adversarial coverage hardening (Tier 5 Challengers).
- Forensic integrity audit (`teamwork_preview_auditor`).
- Report verified victory to Sentinel.
