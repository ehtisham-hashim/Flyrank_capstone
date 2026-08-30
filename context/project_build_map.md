# FlyRank Capstone — Full Build Map

> **Project:** Embeddable Widget & Lead-Capture Platform
> **Stack:** Node.js + Express + PostgreSQL (Docker) + Vanilla JS widget
> **Estimated Hours:** 35–50 focused hours
> **Created:** 2026-08-30

---

## Table of Contents

1. [Stack Decisions](#1-stack-decisions)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Repository Structure](#3-repository-structure)
4. [Data Models](#4-data-models)
5. [API Surface Map](#5-api-surface-map)
6. [Phase-by-Phase Build Plan](#6-phase-by-phase-build-plan)
7. [Task Ownership Matrix](#7-task-ownership-matrix)
8. [Acceptance Probes Checklist](#8-acceptance-probes-checklist)
9. [Non-Goals](#9-non-goals)

---

## 1. Stack Decisions

| Concern | Choice | Why |
|---|---|---|
| Language | **Node.js (JavaScript)** | Matches capstone options; shared language with the widget JS |
| Framework | **Express.js** | Lightweight, well-documented, `cors` and `express-rate-limit` middleware ready |
| Validation | **Zod** | Recommended by the brief for Express; composable schemas |
| Database | **PostgreSQL** via Docker Compose | Real persistence with migrations, indexes, tenant isolation |
| ORM / Query | **Drizzle ORM** | Type-safe, lightweight, SQL-like syntax, pg pool native |
| Auth | **JWT (jsonwebtoken)** | Stateless, simple multi-tenant auth — no third-party service |
| Geo Provider A | **ip-api.com** | Free, no key, 45 req/min |
| Geo Provider B | **ipapi.co** | Free tier ~1,000/day, no card |
| Email Side Effect | **Console log** (+ optional Mailpit) | Failure tolerance is what's graded, not real delivery |
| Widget JS | **Vanilla JS** (IIFE bundle) | Zero dependencies, small payload, loads fast |
| Customer Test Site | **Plain HTML** on a second local port (`npx serve`) | Different origin for CORS testing |
| Rate Limiting | **express-rate-limit** | Per-IP and per-widget, in-memory store |
| Spam Control | **Honeypot field** | Hidden field — filled = bot = rejected |

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM OVERVIEW                          │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐         ┌──────────────────────────────────┐
  │  Widget      │  JWT    │        BACKEND (Express)         │
  │  Owner       │────────►│                                  │
  │  (Admin)     │         │  ┌────────────────────────────┐  │
  └──────────────┘         │  │   Auth Middleware (JWT)     │  │
         │                 │  └────────────┬───────────────┘  │
         │                 │               ▼                   │
         │                 │  ┌────────────────────────────┐  │
         │                 │  │  Widget Management API     │  │
         │                 │  │  POST/GET/PUT/DELETE        │  │
         │                 │  │  /api/widgets               │  │
         │                 │  └────────────┬───────────────┘  │
         │                 │               │                   │
         │                 │  ┌────────────────────────────┐  │
         │                 │  │  Dashboard API             │  │
         │                 │  │  GET /api/dashboard/*       │  │
         │                 │  └────────────────────────────┘  │
         │                 └──────────────────────────────────┘
         │
         │  (gets embed snippet)
         ▼
  ┌──────────────┐         ┌──────────────────────────────────┐
  │  Customer    │  GET    │   PUBLIC ENDPOINTS (Express)     │
  │  Website     │────────►│                                  │
  │  (2nd origin)│         │  ┌────────────────────────────┐  │
  └──────────────┘         │  │ GET /widget.js             │  │
         │                 │  │ (versioned, long cache)     │  │
         │                 │  └────────────────────────────┘  │
         │                 │  ┌────────────────────────────┐  │
         │                 │  │ GET /widgets/:id/config    │  │
         │                 │  │ (short cache, CORS)         │  │
         │                 │  └────────────────────────────┘  │
         ▼                 └──────────────────────────────────┘
  ┌──────────────┐
  │  Website     │         ┌──────────────────────────────────┐
  │  Visitor     │  POST   │   SUBMISSION PIPELINE            │
  │  (public)    │────────►│                                  │
  └──────────────┘         │  ┌────────────────────────────┐  │
                           │  │ 1. CORS (preflight OK)     │  │
                           │  │ 2. Rate Limit (429)        │  │
                           │  │ 3. Honeypot Check          │  │
                           │  │ 4. Zod Validation (4xx)    │  │
                           │  │ 5. Geo Enrichment          │  │
                           │  │    A → B → fallback null   │  │
                           │  │ 6. Store in DB             │  │
                           │  │ 7. Side Effect (email/log) │  │
                           │  │    (fire-and-forget)        │  │
                           │  └────────────────────────────┘  │
                           └──────────┬───────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │    PostgreSQL DB      │
                           │  ┌────────────────┐   │
                           │  │ users           │   │
                           │  │ widgets         │   │
                           │  │ submissions     │   │
                           │  └────────────────┘   │
                           └──────────────────────┘
```

---

## 3. Repository Structure

```
flyrank-capstone-widget-platform/
├── .env.example                    # Placeholder env vars
├── .gitignore
├── LICENSE                         # MIT
├── README.md                       # Architecture, setup, API docs
├── BUILDLOG.md                     # AI-usage log
├── EVIDENCE.md                     # Proof per requirement checkbox
├── capstone.yaml                   # run/seed/test/base_url manifest
├── docker-compose.yml              # PostgreSQL + app
├── package.json
│
├── src/
│   ├── index.js                    # Express app entry point
│   ├── config/
│   │   └── env.js                  # Loads + validates env vars
│   │
│   ├── db/
│   │   ├── migrations/             # SQL migration files
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_widgets.sql
│   │   │   └── 003_create_submissions.sql
│   │   ├── migrate.js              # Migration runner
│   │   ├── seed.js                 # Demo data seeder
│   │   └── pool.js                 # pg Pool singleton
│   │
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   ├── cors.js                 # CORS config
│   │   ├── rateLimiter.js          # express-rate-limit setup
│   │   ├── errorHandler.js         # Global error → JSON
│   │   └── requestLogger.js        # Optional request logging
│   │
│   ├── routes/
│   │   ├── auth.routes.js          # POST /api/auth/register, /login
│   │   ├── widget.routes.js        # CRUD /api/widgets
│   │   ├── submission.routes.js    # POST /api/submissions (public)
│   │   ├── dashboard.routes.js     # GET /api/dashboard/* (authed)
│   │   └── embed.routes.js         # GET /widget.js, /widgets/:id/config
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── widget.controller.js
│   │   ├── submission.controller.js
│   │   ├── dashboard.controller.js
│   │   └── embed.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js         # Password hashing, JWT signing
│   │   ├── widget.service.js       # Widget CRUD logic
│   │   ├── submission.service.js   # Submission pipeline orchestrator
│   │   ├── geo.service.js          # Enrichment: provider A → B → null
│   │   ├── spam.service.js         # Honeypot check + heuristics
│   │   ├── notification.service.js # Email/webhook (fire-and-forget)
│   │   └── dashboard.service.js    # Aggregation queries
│   │
│   ├── validators/
│   │   ├── widget.validator.js     # Zod schemas for widget CRUD
│   │   └── submission.validator.js # Zod schemas for public submissions
│   │
│   └── utils/
│       ├── httpErrors.js           # Custom error classes (400, 401, 404, 413, 429)
│       └── idempotency.js          # Idempotency key helper
│
├── widget/
│   ├── widget.js                   # The embeddable IIFE script (source)
│   └── build.js                    # Optional: minify + version stamp
│
├── test-site/
│   ├── index.html                  # Customer test page (different origin)
│   └── serve.sh                    # Script to run on port 5500
│
└── tests/                          # Optional test suite (stretch)
    ├── submission.test.js
    ├── cors.test.js
    ├── rateLimit.test.js
    └── geoFallback.test.js
```

---

## 4. Data Models

### 4.1 `users` table

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default gen |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `name` | VARCHAR(100) | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

### 4.2 `widgets` table

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default gen |
| `user_id` | UUID | FK → users.id, NOT NULL (tenant) |
| `type` | ENUM('signup', 'contact', 'cta') | NOT NULL |
| `title` | VARCHAR(200) | NOT NULL |
| `description` | TEXT | |
| `fields` | JSONB | Form field definitions |
| `button_text` | VARCHAR(100) | DEFAULT 'Submit' |
| `display_options` | JSONB | Colors, position, trigger |
| `version` | INTEGER | DEFAULT 1 (bumps on update) |
| `is_active` | BOOLEAN | DEFAULT true |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Indexes:** `(user_id)`, `(id, user_id)` for tenant-scoped lookups.

### 4.3 `submissions` table

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default gen |
| `widget_id` | UUID | FK → widgets.id, NOT NULL |
| `user_id` | UUID | FK → users.id, NOT NULL (denormalized tenant) |
| `data` | JSONB | The submitted form data |
| `ip_address` | VARCHAR(45) | |
| `geo_country` | VARCHAR(100) | Nullable (enrichment may fail) |
| `geo_city` | VARCHAR(100) | Nullable |
| `geo_provider` | VARCHAR(50) | Which provider answered |
| `idempotency_key` | VARCHAR(255) | UNIQUE, for retry safety |
| `spam_score` | REAL | 0.0 = legit, 1.0 = spam |
| `is_spam` | BOOLEAN | DEFAULT false |
| `notification_sent` | BOOLEAN | DEFAULT false |
| `notification_error` | TEXT | Nullable |
| `created_at` | TIMESTAMP | DEFAULT NOW() |

**Indexes:** `(widget_id, created_at)`, `(user_id, created_at)`, `(idempotency_key)` UNIQUE.

---

## 5. API Surface Map

### 5.1 Auth (Private)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account → returns JWT |
| POST | `/api/auth/login` | Login → returns JWT |

### 5.2 Widget Management (Private, JWT required)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/widgets` | Create a widget |
| GET | `/api/widgets` | List my widgets |
| GET | `/api/widgets/:id` | Get one of my widgets |
| PUT | `/api/widgets/:id` | Update my widget (bumps version) |
| DELETE | `/api/widgets/:id` | Delete my widget |
| GET | `/api/widgets/:id/snippet` | Get the embed `<script>` tag |

### 5.3 Public Widget Delivery (No auth, CORS, Cached)

| Method | Endpoint | Cache | Description |
|---|---|---|---|
| GET | `/widget.js` | `max-age=31536000, immutable` | Versioned JS bundle |
| GET | `/widgets/:id/config` | `max-age=60` | Widget config JSON |

### 5.4 Public Submission (No auth, CORS, Rate-limited)

| Method | Endpoint | Description |
|---|---|---|
| OPTIONS | `/api/submissions` | CORS preflight |
| POST | `/api/submissions` | Submit form data |

### 5.5 Dashboard (Private, JWT required)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/submissions` | List submissions (paginated, filterable) |
| GET | `/api/dashboard/stats` | Counts over time, per-widget |
| GET | `/api/dashboard/geo` | Geo breakdown of submissions |

---

## 6. Phase-by-Phase Build Plan

### Phase 1 — Design (≈ 4–6 hours)

| # | Task | Owner | Details |
|---|---|---|---|
| 1.1 | Initialize repo, `.gitignore`, `LICENSE`, `README` skeleton | 🤖 AI | Scaffold all required files |
| 1.2 | Set up `docker-compose.yml` (PostgreSQL + app) | 🤖 AI | Postgres 16, volumes, env |
| 1.3 | Set up Express app skeleton with layered architecture | 🤖 AI | index.js, routes, controllers, services, middleware dirs |
| 1.4 | Write SQL migration files (users, widgets, submissions) | 🤖 AI | Based on data models above |
| 1.5 | Write `.env.example` with all env vars | 🤖 AI | |
| 1.6 | Write `capstone.yaml` manifest | 🤖 AI | run, seed, test, base_url |
| 1.7 | **Review the design doc** — does this match your vision? | 👤 YOU | Read through, flag anything you'd change |
| 1.8 | **Write your one-page design doc** and commit it | 👤 YOU | Problem statement, data model, API surface, non-goal — in YOUR words |
| 1.9 | **GATE:** Design doc committed | 👤 YOU | First commit to the repo |

---

### Phase 2 — The Hardened Submission Path (≈ 14–20 hours)

| # | Task | Owner | Details |
|---|---|---|---|
| **Auth** | | | |
| 2.1 | Implement `env.js` config loader | 🤖 AI | dotenv, validate required vars |
| 2.2 | Implement `pool.js` (pg connection pool) | 🤖 AI | |
| 2.3 | Implement migration runner + seed script | 🤖 AI | |
| 2.4 | Implement user registration & login (auth service + controller + routes) | 🤖 AI | bcrypt hash, JWT sign/verify |
| 2.5 | Implement JWT auth middleware | 🤖 AI | Extracts user from `Authorization: Bearer <token>` |
| 2.6 | **Test auth manually** — register, login, use token | 👤 YOU | curl / Postman, verify it works |
| **Widget CRUD** | | | |
| 2.7 | Implement Zod validators for widget create/update | 🤖 AI | |
| 2.8 | Implement widget service (CRUD with tenant isolation) | 🤖 AI | Every query scoped by `user_id` |
| 2.9 | Implement widget controller + routes | 🤖 AI | |
| 2.10 | Implement embed snippet generation endpoint | 🤖 AI | Returns `<script src="...?id=X">` |
| 2.11 | **Test widget CRUD manually** — create, list, update, delete, test tenant isolation | 👤 YOU | Prove tenant A can't see tenant B's widgets |
| **Submission Pipeline** | | | |
| 2.12 | Implement CORS middleware (configured for public submission + config routes) | 🤖 AI | Allow all origins on public routes, handle `OPTIONS` |
| 2.13 | Implement rate limiter middleware (per-IP + per-widget) | 🤖 AI | `express-rate-limit`, returns `429` |
| 2.14 | Implement honeypot spam check service | 🤖 AI | Hidden field detection |
| 2.15 | Implement Zod validators for submission payload | 🤖 AI | Reject malformed + oversized |
| 2.16 | Implement geo enrichment service (provider A → B → null fallback) | 🤖 AI | `ip-api.com` → `ipapi.co` → store without geo |
| 2.17 | Implement notification service (fire-and-forget email/console log) | 🤖 AI | try/catch, never blocks main response |
| 2.18 | Implement submission service (orchestrates the full pipeline) | 🤖 AI | validate → spam → rate limit → enrich → store → notify |
| 2.19 | Implement submission controller + routes | 🤖 AI | |
| 2.20 | Implement idempotency key handling | 🤖 AI | Duplicate key → return existing result |
| 2.21 | Implement global error handler middleware | 🤖 AI | Catches all → JSON `{ error, status }`, never leaks stack |
| 2.22 | **Test the entire submission pipeline end-to-end** | 👤 YOU | Cross-origin POST, verify enrichment, test rate limit burst, test honeypot, test side-effect failure |
| 2.23 | **GATE:** A cross-origin `curl` stores an enriched row | 👤 YOU | Verify in DB |

---

### Phase 3 — Delivery, Dashboard & Proof (≈ 12–16 hours)

| # | Task | Owner | Details |
|---|---|---|---|
| **Widget Delivery** | | | |
| 3.1 | Write the embeddable `widget.js` (IIFE) | 🤖 AI | Fetches config, renders form, posts submission |
| 3.2 | Implement `/widget.js` serve route with versioned cache headers | 🤖 AI | `Cache-Control: max-age=31536000, immutable` |
| 3.3 | Implement `/widgets/:id/config` public config route with short cache | 🤖 AI | `Cache-Control: max-age=60` |
| 3.4 | Create the test-site `index.html` on a second origin | 🤖 AI | Includes `<script src="...">` |
| 3.5 | Write `serve.sh` to run the test site | 🤖 AI | `npx serve -l 5500` |
| 3.6 | **Test widget rendering on the second origin** | 👤 YOU | Open the test page, fill form, submit, verify it works cross-origin |
| **Dashboard** | | | |
| 3.7 | Implement dashboard service (aggregation queries) | 🤖 AI | Counts over time, per-widget stats, geo breakdown |
| 3.8 | Implement dashboard controller + routes | 🤖 AI | |
| 3.9 | **Test dashboard endpoints** | 👤 YOU | Check stats are correct after some submissions |
| **Documentation & Evidence** | | | |
| 3.10 | Write full `README.md` (architecture, setup, API docs) | 🤖 AI | Will draft; you review/personalize |
| 3.11 | Write `EVIDENCE.md` template | 🤖 AI | One section per requirement checkbox |
| 3.12 | **Fill in `EVIDENCE.md`** with real terminal output | 👤 YOU | Paste actual curl output, logs, screenshots |
| 3.13 | **Write `BUILDLOG.md`** — your AI usage log | 👤 YOU | Where AI helped, where it was wrong, what you changed — MUST be in your words |
| 3.14 | **Review and personalize `README.md`** | 👤 YOU | Add your own explanation, limitations section |
| 3.15 | **Final self-check** against Section 6 requirements | 👤 YOU | Tick every box |
| 3.16 | **GATE:** Widget renders on second-origin page | 👤 YOU | |

---

## 7. Task Ownership Matrix

### Legend
- 🤖 **AI (Antigravity)** — I write the code, you review it
- 👤 **YOU (Ehtisham)** — You do this; I can advise but you execute
- 🤝 **SHARED** — We collaborate; I draft, you refine

---

### Summary by Category

| Category | 🤖 AI Tasks | 👤 Your Tasks |
|---|---|---|
| **Project Setup** | Scaffold repo, docker-compose, migrations, env, capstone.yaml | Review design, write design doc in your words |
| **Auth System** | Code registration, login, JWT middleware | Test manually, debug edge cases |
| **Widget CRUD** | Code service, controller, routes, validators | Test manually, prove tenant isolation |
| **Submission Pipeline** | Code CORS, rate limiter, honeypot, validation, geo enrichment, notification, idempotency, error handler | Test end-to-end, attack your own API |
| **Widget Delivery** | Code widget.js, config endpoint, cache headers, test site | Test cross-origin rendering |
| **Dashboard** | Code aggregation queries, controller, routes | Test correctness |
| **Documentation** | Draft README, EVIDENCE template | Write BUILDLOG, fill EVIDENCE, personalize README |
| **Git Discipline** | — | All commits, branch management, never commit secrets |
| **Submission** | — | Submit repo link on portal |

---

### What I (AI) Will NOT Do — These Are Yours

| Task | Why It's Yours |
|---|---|
| **Write `BUILDLOG.md`** | The evaluator checks that YOU can explain what AI did. Honesty is graded. |
| **Fill `EVIDENCE.md` with real output** | You must run the probes and paste real terminal/log output. I can give you the commands. |
| **Manual testing & debugging** | You need to understand the system by breaking it. CORS debugging is "a rite of passage." |
| **Attacking your own API** | Fire bursts, send garbage, fill honeypots — prove the defenses hold. |
| **Git commits with good messages** | Your commit history is evaluated. Small, meaningful commits. |
| **Personalize the README** | Add your own architecture explanation and honest "limitations" note. |
| **Final self-check** | Go through every checkbox in Section 6. |
| **Submit on the portal** | Paste the repo link. |

---

### What I (AI) Will Do

| Task | What You Get |
|---|---|
| **All production code** | Layered architecture: routes → controllers → services → DB |
| **Database schema & migrations** | SQL files, migration runner, seed script |
| **Middleware stack** | Auth, CORS, rate limiter, error handler |
| **Submission pipeline** | Full validation → spam → enrich → store → notify chain |
| **Widget JavaScript** | The embeddable IIFE that renders and submits |
| **Test site HTML** | The second-origin page for CORS proof |
| **Docker setup** | `docker-compose.yml` for one-command startup |
| **Draft documentation** | README, EVIDENCE template, capstone.yaml |
| **Debugging help** | When something breaks (especially CORS), I help you fix it |
| **Curl commands for testing** | Ready-to-paste commands for every probe |

---

## 8. Acceptance Probes Checklist

These are the exact probes the evaluator will run. I'll build the system to pass all of them, and give you the commands to prove it.

| Probe | What It Tests | How We Pass It |
|---|---|---|
| **PROBE 1** | Valid submission from 2nd origin → stored, `2xx`, visible in dashboard | Widget.js on test-site submits → CORS OK → DB row → dashboard GET returns it |
| **PROBE 2** | Malformed + oversized payload → `4xx` JSON errors, never `500` | Zod validation + payload size limit + global error handler |
| **PROBE 3** | Rapid burst → `429`s appear, normal request after still works | `express-rate-limit` with sensible window + max |
| **PROBE 4** | Disable geo A → enriched by B. Disable both → stored without geo | Fallback chain in `geo.service.js` with try/catch cascade |
| **PROBE 5** | Email/webhook throws → submission still succeeds + stored | Fire-and-forget in `notification.service.js` |
| **PROBE 6** | Honeypot filled → submission dropped/rejected | `spam.service.js` checks the hidden field |

---

## 9. Non-Goals

> Explicitly out of scope — don't build these:

- ❌ **No frontend dashboard UI** — backend API endpoints only (this is a backend capstone)
- ❌ **No real hosting/domain** — everything runs locally
- ❌ **No real email delivery** — console log or Mailpit is enough
- ❌ **No fancy widget CSS** — minimal form with submit button suffices
- ❌ **No CI/CD pipeline** — optional stretch only
- ❌ **No payment/billing** — not part of the capstone
- ❌ **No real CDN** — cache headers prove the concept

---

## Execution Order (TL;DR)

```
Week 1 (Phase 1):  Design + Scaffold
  🤖 I scaffold everything
  👤 You review, write your design doc, first commit

Week 2-3 (Phase 2):  The Hard Part — Submission Pipeline
  🤖 I build auth → widget CRUD → submission pipeline
  👤 You test each piece, debug CORS, attack your API

Week 3-4 (Phase 3):  Delivery + Dashboard + Proof
  🤖 I build widget.js, config delivery, dashboard
  👤 You test cross-origin, fill EVIDENCE.md, write BUILDLOG.md

Final:  Self-Check + Submit
  👤 You verify all 6 probes, commit, submit
```

---

> **Ready to start?** Say the word and I'll begin with Phase 1 — scaffolding the repo, docker-compose, migrations, and the Express app skeleton.
