# FlyRank Internship · Backend Track · Capstone Brief
# Embeddable Widget & Lead-Capture Platform

> Let a customer define a widget, hand them one line of `<script>`, and safely catch everything the public internet throws back at you — validated, spam-filtered, enriched, and dashboarded.

| | |
|---|---|
| **Difficulty** | Medium–Hard |
| **Pace** | Self-paced · no deadlines |
| **Language** | JavaScript or Python |
| **Repo** | Public GitHub repo |
| **Cost** | $0 · no credit card, ever |

---

## Table of Contents

1. [The Mission](#1-the-mission)
2. [What It Takes to Finish](#2-what-it-takes-to-finish)
3. [Ground Rules](#3-ground-rules)
4. [What You'll Build](#4-what-youll-build)
5. [Architecture Overview](#5-architecture-overview)
6. [Requirements](#6-requirements)
7. [Realistic Scope](#7-realistic-scope)
8. [The Build, Phase by Phase](#8-the-build-phase-by-phase)
9. [Stretch Goals](#9-stretch-goals)
10. [Your $0 Stack](#10-your-0-stack)
11. [GitHub Rules](#11-github-rules)
12. [How to Submit](#12-how-to-submit)
13. [How It's Evaluated](#13-how-its-evaluated)
14. [Curated Resources](#14-curated-resources)
15. [Glossary](#15-glossary)

---

## 1. The Mission

In this capstone you build a platform that lets customers create **embeddable widgets** — signup forms, contact forms, call-to-action popovers — and install them on any website with a single `<script>` tag.

When a visitor interacts with the widget, the submission travels back to your backend, where it is:

- Validated
- Protected against abuse
- Enriched with location data
- Stored
- Shown to the widget's owner in a dashboard

Unlike a private project, your application will receive requests directly from **browsers you don't control**. That single fact changes everything: you can't trust the input, you can't control the traffic, and you can't predict the origin. You'll think like a backend engineer building software for the open internet — because that is exactly what you'll be doing.

> **This is a real product category.** Intercom chat bubbles, Mailchimp signup forms, HubSpot lead popups — all of them are exactly this system: a script snippet, a config endpoint, and a hardened public submission API. FlyRank runs its own version in production; you're building the same machine from scratch, your way.

---

## 2. What It Takes to Finish

**Honest picture before you commit** — this is a Medium–Hard capstone.

### The Three Genuinely Hard Parts

**1. CORS debugging**
The browser blocks cross-origin requests with terse console errors and invisible preflight requests. Expect an afternoon of confusion — it's a rite of passage. The MDN guide in Section 14 is your map.

**2. Thinking like an attacker**
Rate limiting and spam controls only make sense once you imagine someone deliberately flooding your endpoint. You'll attack your own API to prove the limits hold — a genuinely new skill.

**3. Failure that must not fail**
The enrichment chain and the email side effect both practice the same discipline: a broken dependency must *degrade* the response, never *destroy* it. Getting the error-handling boundaries right takes design, not just code.

**Time budget:** Plan for roughly **35–50 focused hours**, entirely at your own pace. The phases in Section 8 slice it into assignment-sized chunks. If you can only ship the core (Section 6), that is a real, passing capstone.

> You practiced every piece of this capstone in the program assignments and live lectures. This capstone is **assembly**, not a first attempt.
>
> Choose with your curiosity, not the stars. A medium capstone done excellently beats a hard one that falls over. Pick this one if *"my code runs on a site I don't control"* sounds exciting.

---

## 3. Ground Rules

These rules are the same for every capstone in the track. They exist so that 20,000+ interns can be evaluated fairly — and so your finished project is something you can safely show in an interview.

### The Five Rules

| Rule | What It Means for You |
|---|---|
| **Pick one, early** | Choose your capstone early and write a one-page design doc (problem, data model, API surface, layer sketch, one explicit non-goal). Phase 1 in Section 8 is exactly that doc. |
| **One separate, public repo** | The capstone lives in its own public GitHub repository from day one — never inside a repository that holds other work. Full rules in Section 11. |
| **$0, no credit card — ever** | Everything can be built with free tools; this document lists the exact free stack in Section 10. If you ever find yourself on a page asking for a credit card, stop — you took a wrong turn. |
| **AI-assisted building is encouraged — and owned** | Use AI tools freely, but keep `BUILDLOG.md` honest: where AI helped, where it was wrong, what you changed. You must be able to explain any 2–3 lines of your code that the evaluator picks. "The AI wrote it" is not an answer. |
| **Build your own idea instead?** | Do you want to build your own idea? Pick the **10x Solution** capstone. |

### Constraints for This Capstone

- No real CDN, domain, or hosting needed — the "customer site" is just a plain HTML file served from a different origin (a second local port, or a `file://` page)
- Mock the geo providers when you prove the fallback — use the real free APIs while developing, but make the fallback proof deterministic
- **Never commit an API key or SMTP credential** — everything secret lives in `.env` (git-ignored) with a committed `.env.example`

---

## 4. What You'll Build

A platform with **five moving parts**. Build them in this order:

### 1. Widget Management API
*teaches: multi-tenant CRUD + auth*

An authenticated admin API where a customer creates and manages widgets:
- Type (signup form / CTA / popover)
- Title and description
- Form fields, button text, display options

Widgets are **tenant-isolated** — one customer can never see or edit another's widgets. Full CRUD, validated, correct status codes.

### 2. Embed Snippet Generation
*teaches: developer experience*

Once a widget exists, your API returns the one line the customer pastes into any website:

```html
<script src="https://your-domain.com/widget.js?id=abc123"></script>
```

Everything it needs — config, rendering, submission wiring — must flow from it automatically.

### 3. Fast, Cached Widget Delivery
*teaches: HTTP caching + versioned assets*

Serve the widget JavaScript and each widget's configuration from public endpoints with:
- Correct `Cache-Control` headers with a `max-age` value
- Small payloads, the way a CDN would
- A **versioned bundle** for the script (cache long, bust on release)
- A **short-lived cache** for config

> A widget that loads slowly is a widget customers remove.

### 4. Public Submission Endpoint
*teaches: CORS + boundary validation*

Visitors on external websites submit the form. Your endpoint must:
- Accept **cross-origin requests** (correct CORS, including preflight)
- **Validate every field** before it touches business logic
- Reject invalid or oversized payloads with a `4xx` status code and an error message
- Safely store what passes

> The server never trusts the client — here, the client is the entire internet.

### 5. Protection, Enrichment & Safe Side Effects
*teaches: abuse resistance + graceful degradation*

Three layers run between "request arrives" and "row stored":

| Layer | Description |
|---|---|
| **Abuse protection** | Rate limiting per IP and per widget, plus at least one spam control (honeypot field, heuristic, or token). A flood of requests must not take you down. |
| **Enrichment with a fallback chain** | IP → geolocation, trying provider A, then provider B on failure. If all providers are down, the submission still succeeds — just without geo data. |
| **Safe side effects** | After storing, trigger a confirmation email / webhook / notification. If that secondary action fails, the submission itself must still succeed. Non-critical operations never break the main path. |

### 6. Owner Dashboard API
*teaches: aggregation queries*

The authenticated owner views their submissions with basic analytics:
- Counts over time
- Per-widget stats
- Geo breakdown

> Endpoints + a simple table are enough — this is a backend capstone, not a frontend one.

---

## 5. Architecture Overview

```
Widget Owner (authenticated)
  → Widget Management API → Widget DB (tenant-isolated) → embed snippet

Customer Website (any origin)
  <script src="widget.js?id=123">
  → GET /widgets/:id/config  (public · cached · CORS)
  → render widget

Website Visitor
  → POST /submissions  (public · CORS)
  | validation       — bad payload?       → 4xx, never 500
  | rate limit + spam check — flood?      → 429, service stays up
  | geo enrichment: Provider A —(fails)→ Provider B —(fails)→ store anyway
  | store submission
  | email / webhook side effect  (failure must NOT block success)

Widget Owner (authenticated)
  → Dashboard API ←— submissions + stats
```

> One request path per actor: the owner manages widgets (authenticated), the customer site loads the script (cached, public), the visitor submits (public, CORS, protected). Keep the three paths separate in your head and the code stays clean.

---

## 6. Requirements

> **Done = every box below ticked**, with one pasted proof per box in `EVIDENCE.md`. Each box is written so a reviewer can verify it in minutes.

### Widget Management
- [ ] Authenticated CRUD endpoints for widgets; requests without valid auth are rejected
- [ ] Multi-tenant isolation proven: tenant A cannot read or modify tenant B's widgets or submissions
- [ ] Embed snippet generated per widget

### Widget Delivery
- [ ] Public config endpoint serves a small payload with correct HTTP cache headers
- [ ] Widget JavaScript is served as a versioned bundle (new version = new URL or cache-bust)
- [ ] The widget renders on a page served from a **different origin** than your API

### Public Submission API
- [ ] Cross-origin submissions work: CORS headers correct, preflight (`OPTIONS`) handled
- [ ] All incoming input validated; malformed and oversized payloads rejected with appropriate `4xx` codes and JSON errors
- [ ] Valid submissions stored safely, linked to the right widget and tenant

### Abuse Protection
- [ ] Rate limiting per IP and/or per widget returns `429` under a burst — and the API keeps serving legitimate traffic
- [ ] At least one spam-prevention technique (honeypot field, token, or heuristic) demonstrably blocks a spam submission

### Enrichment & Safe Side Effects
- [ ] IP → geo enrichment uses a provider fallback chain: provider A down → provider B answers → submission enriched
- [ ] All providers down → submission still succeeds (without geo). Degrade, never fail.
- [ ] A failing confirmation email / webhook does not prevent the submission from being stored

### Documentation
- [ ] `README` with architecture diagram, setup instructions, and API documentation
- [ ] All required files from Section 11 present

---

## 7. Realistic Scope

**Where "enough" is — stop gold-plating past this line:**

- The customer site is a plain HTML file opened from a different origin (a second local port or `file://`). No hosting, no domain, no real CDN.
- The widget UI can be minimal — a `div` with a form and a submit button. The grade lives in the backend, not the CSS.
- One or two widget types are plenty if the model supports more. Prove the pattern, don't build a form-builder startup.
- Email can be fake: log it to the console or use a free local catcher (Mailpit). What's graded is that its failure doesn't block success.
- Mock the geo providers when you prove the fallback so it is deterministic. Real free APIs are for manual dev only.

---

## 8. The Build, Phase by Phase

> This internship is self-paced — there is no calendar and no deadline. Work through the phases in order, at your own speed. Each phase ends with a **gate** — a concrete result that tells you it's safe to move on.

---

### Phase 1 — Design *(≈ 4–6 hours)*

- [ ] Widget model + submission model (fields, tenancy, indexes)
- [ ] The embed flow: snippet → config → render → submit
- [ ] API contracts for all three request paths
- [ ] One explicit non-goal written down

> **GATE** — The one-page design document is committed to the repository.

---

### Phase 2 — The Hardened Submission Path *(≈ 14–20 hours)*

- [ ] Public submission endpoint: validation + CORS + correct status codes
- [ ] Rate limiting + one spam control
- [ ] Geo enrichment with the provider fallback chain
- [ ] Safe side effect (email/webhook that may fail harmlessly)

> **GATE** — A cross-origin `curl` stores an enriched row.

---

### Phase 3 — Delivery, Dashboard & Proof *(≈ 12–16 hours)*

- [ ] Widget script + cached, versioned config delivery
- [ ] The "customer site" test page on a different origin
- [ ] Dashboard endpoints with stats
- [ ] `README` + `EVIDENCE.md` filled as you go

> **GATE** — Widget renders on a second-origin page.

---

> **FINAL SELF-CHECK** — Go through the Requirements list in Section 6. Tick every box. Check your proofs in `EVIDENCE.md`.

---

## 9. Stretch Goals

> ⚠️ Only attempt these **after** the core ships. A finished core with one polished stretch beats three half-stretches.

Each of these is a genuine "I went deep" interview story:

- [ ] **Production bundle** — a minified, versioned widget build
- [ ] **Real-time dashboard** — new submissions appear live via WebSockets or Server-Sent Events
- [ ] **Targeting rules** — show on certain pages, after N seconds, or once per visitor
- [ ] **Double opt-in + GDPR** — confirmation flow, consent record, export/delete endpoints
- [ ] **Bot defense** — proof-of-work or CAPTCHA challenge, and measure the spam reduction
- [ ] **A test suite** — CORS preflight, invalid payload, rate limiting, spam control, provider fallback — deterministic

---

## 10. Your $0 Stack

> The iron rule: if any tool, tier, or tutorial asks for a credit card, it is the wrong path — a free alternative for this capstone exists in the table below.

| You Need | Free Tool (No Credit Card) | Notes |
|---|---|---|
| Language + framework | Node.js + Express **or** Python + FastAPI | Free, as all track long |
| Database | PostgreSQL via Docker (or SQLite to start) | Free · `docker compose up` |
| Geo provider A | [ip-api.com](http://ip-api.com) (JSON endpoint) | Free, no key, 45 req/min |
| Geo provider B (fallback) | [ipapi.co](https://ipapi.co) | Free tier ~1,000 lookups/day, no card |
| Email side effect | Console log, or Mailpit (local mail catcher) | Free · failure-tolerance is what's graded |
| The "customer site" | Plain HTML file on a second local port (`npx serve` / `python -m http.server`) | Free · that's your second origin |
| Repo + CI | GitHub (public repo) | Free |
| Hosting | None required — everything runs locally | Deploying is optional, free tiers only |

---

## 11. GitHub Rules

> Your capstone is also your **portfolio piece**. These rules make the repo something a recruiter, a mentor, and the automated evaluator can all navigate without asking you anything.

### The Non-Negotiables

- **One dedicated repository, public from day one.** Create it the day you choose your capstone. Do not build inside a repository that holds other work, a private repo you flip later, or a monorepo.
- **Name it clearly:** `flyrank-capstone-widget-platform` (lowercase, hyphens, no spaces)
- **Commit as you build.** Small, meaningful commits — e.g. `Add idempotency key check to publish endpoint`, not `update stuff`. Aim for at least one commit per working session.
- **Never commit a secret.** No API keys, tokens, passwords, or `.env` files. Put `.env` in `.gitignore` before your first commit and ship a `.env.example` with placeholder values instead.
- **A stranger can run it.** The README's setup section must work on a clean machine with one documented run command (`docker compose up` or equivalent) plus a seed step for demo data.

### Required Files at Submission

| File | What Goes in It |
|---|---|
| `README.md` | What the system does, an architecture diagram (image or ASCII sketch), exact run + seed steps, and an honest "limitations" note |
| `capstone.yaml` | A small manifest: `run:` (one command), `seed:`, `test:` (optional), `base_url:`, and the endpoints to probe |
| `EVIDENCE.md` | One pasted proof per Requirements checkbox in Section 6 — a test name + output, a curl transcript, or a log line. **Claims without evidence score as not done.** |
| `BUILDLOG.md` | Your AI-usage log: where AI helped, where it was wrong, what you changed. Honesty is graded, perfection is not. |
| `.env.example` | Every environment variable the app needs, with safe placeholder values |

### DO / DON'T

**DO:**
- Create the repo public before you build (first commit = README skeleton + `.gitignore`)
- Add a license (MIT is a fine default)
- Keep `main` always runnable
- Paste real command output into `EVIDENCE.md` as you go

**DON'T:**
- Mix capstone code with other work — separate repos, always
- Commit `node_modules/`, virtualenvs, or datasets over a few MB
- Force-push over your history before submission — the journey is evidence
- Commit real tokens "just for a second"

---

## 12. How to Submit

1. Create a new **public GitHub repository** with your code
2. Paste the repository link into the **submission form on the portal**

> ⚠️ Do **not** upload ZIP files, ZIP folders, or the full codebase into the form. This is the most common cause of submission errors.

Review is asynchronous. Nothing is scheduled with you. If we need anything from you, we will reach out through the portal.

---

## 13. How It's Evaluated

Two layers, published up front — you know exactly what will be checked, so build to pass it.

### Layer 1 — The Submission Pack *(machine-checkable)*

The evaluation first checks your repo structure: the required files from Section 11, a `run:` command that boots the system. Missing pack files are flagged before a human ever looks.

### Layer 2 — Acceptance Probes *(behavioral, pass/fail)*

An evaluator (human or automated) runs these against your live system. They are not secrets — they are promises:

| Probe | What It Tests |
|---|---|
| **PROBE 1** | `POST` a valid submission from the second-origin test page → stored, `2xx`, and visible via the dashboard API |
| **PROBE 2** | Send a malformed and an oversized payload → clean `4xx` JSON errors, never a `500` |
| **PROBE 3** | Fire a burst of rapid submissions → `429`s appear, and a normal request right after still succeeds |
| **PROBE 4** | Disable geo provider A → next submission is stored, enriched by provider B. Disable both → stored anyway, without geo |
| **PROBE 5** | Force the email/webhook side effect to throw → the submission still returns success and is stored |
| **PROBE 6** | Fill the honeypot field like a bot would → the submission is silently dropped or rejected |

> **One principle guides the review:** a small system that is correct, resilient, and well tested beats a huge one that falls over — that is what senior engineers actually value.

### Shared Requirements *(every capstone must show these)*

| # | Requirement |
|---|---|
| 1 | **Layered architecture** — data / logic / HTTP separated |
| 2 | **Validation at the boundary** — bad input → clean `4xx`, never a `500` |
| 3 | **≥1 background job** — slow/bulk work off the request path, retries + failure alert |
| 4 | **Real persistence** — schema as migrations, right indexes, isolated tenants |
| 5 | **Idempotency where it matters** — the retried action happens once |
| 6 | **Secrets clean** — env only, encrypted if stored, never logged |
| 7 | **Cost tracked, if AI is used** — per call, attributed, with a budget guard |

---

## 14. Curated Resources

> Don't read everything. Each row says when to reach for it. Every resource is free with no credit card.

### Phase 1 · Design

| Resource | Format | When to Use It |
|---|---|---|
| MDN — Cross-Origin Resource Sharing (CORS) | Article, ~30 min | Read before designing the public endpoint — origins, preflights, headers. Your future debugging map. |
| Cloudflare — What is rate limiting? | Article, ~10 min | Read while sketching abuse protection |
| How to create a simple form honeypot | Article, ~10 min | Read before designing the spam-filter step |
| MDN — HTTP caching guide | Article, ~25 min | When planning how the versioned bundle and config are served |

### Phase 2 · The Hardened Submission Path

| Resource | Format | When to Use It |
|---|---|---|
| Zod — Basic usage | Docs, ~15 min | Before writing payload validation in Express |
| Pydantic — Models | Docs, ~25 min | Before writing payload validation in FastAPI |
| Express cors middleware | Docs, ~15 min | Open while wiring CORS onto the submission route |
| FastAPI — CORSMiddleware | Docs, ~10 min | Open while adding CORS in FastAPI |
| express-rate-limit — Overview | Docs, ~15 min | When adding per-IP limits (PY lane: `slowapi` works the same way) |
| ip-api.com — JSON API docs | Docs, ~10 min | When building IP → geo enrichment. No key, no card, 45 req/min. |
| ipapi.co — IP geolocation API | Docs, ~10 min | Your second provider for the fallback chain (~1,000 lookups/day free) |
| MDN — HTTP status codes | Reference, ~10 min | Keep open — pick correct codes for 400/401/404/413/429 |

### Phase 3 · Delivery & Hardening

| Resource | Format | When to Use It |
|---|---|---|
| Building an embeddable JavaScript widget | Article, ~20 min | Follow along before building the embed script and loader |
| MDN — Cache-Control reference | Reference, ~15 min | When tuning `max-age`, `immutable`, and cache-busting for the bundle |

---

## 15. Glossary

| Term | What It Means |
|---|---|
| **Origin** | The scheme + domain + port a page is served from. `http://localhost:3000` and `http://localhost:5500` are two different origins — which is exactly how you'll test. |
| **CORS** | Cross-Origin Resource Sharing — the browser rules deciding whether a page from one origin may call an API on another. Your submission endpoint must explicitly allow it. |
| **Preflight** | The automatic `OPTIONS` request a browser sends before certain cross-origin calls, asking "am I allowed?". Your API must answer it correctly or the real request never arrives. |
| **Embed snippet** | The one-line `<script>` tag a customer pastes into their website to load your widget. |
| **Versioned bundle** | A JavaScript file whose URL changes when its content changes (e.g. `widget.v2.js`), so browsers can cache it forever without serving stale code. |
| **Cache headers** | HTTP response headers (like `Cache-Control`) telling browsers and proxies how long they may reuse a response without asking again. |
| **Rate limiting** | Refusing requests above a threshold (per IP, per widget) with `429`, so a flood can't take the service down. |
| **Honeypot** | A hidden form field humans never fill but bots do. A filled honeypot = spam, rejected without telling the bot why. |
| **Enrichment** | Adding derived data to a submission before storing it — here, turning the visitor's IP address into country/city. |
| **Fallback chain** | Trying providers in order (A, then B) so one dead upstream doesn't kill the feature. The pattern behind "degrade gracefully". |
| **Side effect** | A secondary action after the main work (confirmation email, webhook). Safe side effects can fail without breaking the main response. |
| **Tenant isolation** | Guaranteeing each customer (tenant) can only ever see their own data, enforced in every query — not just in the UI. |
| **Payload** | The body of a request — here, the submitted form data your API must validate before trusting. |

---

*FlyRank Internship · Backend Development Track · Capstone — Embeddable Widget & Lead-Capture Platform.*
*Everything in this brief can be completed with free tools; no resource requires a credit card.*
*Questions → the capstone channel on the community.*
