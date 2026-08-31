# BUILDLOG.md — AI Usage & Development Log

> Per capstone rules: where AI helped, where it was wrong, what was changed manually.
> Honesty is graded — this log reflects the real build process.

---

## Session 1 — Phase 1: Scaffolding & Design (2026-08-30)

**AI assisted with:**
- Generating project directory structure (`backend/`, `public/`, `test-site/`)
- Writing `docker-compose.yml` for PostgreSQL 16 Alpine
- Creating `pnpm-workspace.yaml` and root `package.json`
- Drafting initial SQL migration files for `users`, `widgets`, `submissions` tables

**What AI got wrong / had to be corrected:**
- AI initially proposed using **Prisma ORM** — this failed on Ubuntu because Prisma downloads native binary engines (`@prisma/engines`) which timed out repeatedly on the machine's network. Switched to **Drizzle ORM** which has zero native binaries and works with a plain `pg.Pool`.
- AI initially put `package.json` at the root with all backend code mixed in. Had to redirect it to use a proper `backend/` subdirectory with its own `package.json`.

**Key decisions made manually:**
- PostgreSQL 16 on Docker (not SQLite) for real persistence
- Drizzle ORM over Prisma — Ubuntu compatibility, lighter install
- ES modules (`"type": "module"`) throughout
- Layered architecture: `routes → controllers → services → db`

---

## Session 2 — Phase 2: Hardened Submission Pipeline (2026-08-30)

**AI assisted with:**
- JWT auth middleware and bcrypt password hashing in `auth.service.js`
- Zod schema definitions for request validation (`validators/`)
- `express-rate-limit` setup for per-IP rate limiting (15 req/min)
- Honeypot spam detection in `spam.service.js`
- Geo enrichment fallback chain in `geo.service.js` (ip-api.com → ipapi.co → null)
- Async notification wrapper in `notification.service.js`
- Idempotency key handling in submission pipeline
- Global error handler middleware (`errorHandler.js`)

**What AI got wrong / had to be corrected:**
- AI initially used `express@5` (beta) which pulled `iconv-lite@0.7.3` — this caused a `MODULE_NOT_FOUND: ../encodings` crash at runtime on the actual machine. Downgraded to `express@4.22.x` which uses a stable `iconv-lite` version.
- AI wrote the CORS middleware with `origin: true` (reflect origin) — changed to `origin: '*'` to match spec requirement of accepting any origin on the public submission endpoint.
- Rate limiter initially returned HTML on `429` — had to add `json: true` option to return proper JSON error body.

**Key decisions made manually:**
- Rate limit window: 15 req/60s per IP (not per widget — simpler and sufficient for the capstone)
- Honeypot field name: `_hp` (standard, invisible to real users)
- Geo fallback gracefully sets `country: 'Localhost'` for loopback IPs instead of erroring

---

## Session 3 — Phase 3: Delivery, Dashboard & Test Harness (2026-08-30)

**AI assisted with:**
- `public/widget.js` — vanilla JS IIFE that fetches config, renders form, submits cross-origin
- Embed routes with correct `Cache-Control` headers (`immutable` for bundle, `max-age=60` for config)
- Dashboard service aggregation queries (stats over time, geo breakdown, per-widget counts)
- `test-site/index.html` and `test-site/serve.js` static server on port 5500
- Automated probe test harness (`src/test_probes.js`) covering all 6 acceptance probes
- `public/dashboard.html` — owner dashboard UI (login, widget snippet display, live submissions table)

**What AI got wrong / had to be corrected:**
- `widget.js` initially used `fetch` with no error boundary — if config endpoint was down the page would throw an unhandled rejection. Added try/catch with silent failure.
- Dashboard UI initially tried to call APIs using relative paths (worked only from port 3000). Since the dashboard is served at `/dashboard` on the backend, relative paths work correctly — no change needed.
- AI placed `import path from 'path'` inside the function body in `index.js` instead of at the top. Rewrote file with correct top-level imports.

**Key decisions made manually:**
- `widget.js` served with `Cache-Control: public, max-age=31536000, immutable` — version-busted via `?id=` query param in embed snippet
- Owner dashboard served directly from backend at `/dashboard` — no separate frontend server needed
- Test probes run against live server (not mocked) — validates real end-to-end behavior

---

## Summary

| Phase | AI Role | Manual Corrections |
|---|---|---|
| Phase 1: Scaffold | Structure, Docker, migrations | Switched Prisma → Drizzle, fixed folder layout |
| Phase 2: Submission Pipeline | All middleware and services | Express 5 → 4, CORS fix, rate limit JSON response |
| Phase 3: Delivery & Proof | widget.js, dashboard, probes | Error boundaries, import order cleanup |
