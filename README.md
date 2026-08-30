# FlyRank Embeddable Widget & Lead-Capture Platform

A resilient, multi-tenant lead capture and embeddable widget platform built with Node.js, Express, and PostgreSQL.

---

## Architecture Overview

```
Widget Owner (authenticated JWT)
  → /api/widgets (CRUD, tenant-isolated)
  → /api/dashboard/* (aggregated stats & submissions)

Customer Website (Second Origin: http://localhost:5500)
  → <script src="http://localhost:3000/widget.js?id=<widget_id>">
  → GET /widgets/:id/config (Public · Cached · CORS)
  → Renders embed form

Website Visitor
  → POST /api/submissions (Public · CORS · Rate-Limited)
    ├── Boundary Validation (Zod schemas, 4xx errors)
    ├── Spam Protection (Honeypot trap)
    ├── Rate Limiting (express-rate-limit)
    ├── Geolocation Enrichment (Fallback: ip-api.com -> ipapi.co -> null)
    ├── Persistence (PostgreSQL)
    └── Non-blocking Side Effect (Async notification log)
```

---

## Quick Start

### 1. Prerequisites
- Node.js >= 20
- pnpm >= 9
- Docker Engine / Docker Desktop

### 2. Start Database
```bash
docker compose up -d
```

### 3. Setup Backend
```bash
cd backend
cp .env.example .env
pnpm install
pnpm migrate
pnpm seed
```

### 4. Run API Server
```bash
pnpm start
# or development with watch:
pnpm dev
```

### 5. Health Check
```bash
curl http://localhost:3000/health
```

---

## API Surface

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Service & DB status |
| POST | `/api/auth/register` | None | Register owner account |
| POST | `/api/auth/login` | None | Login, receive JWT |
| POST | `/api/widgets` | JWT | Create widget |
| GET | `/api/widgets` | JWT | List tenant widgets |
| GET | `/api/widgets/:id` | JWT | Get single widget |
| PUT | `/api/widgets/:id` | JWT | Update widget |
| DELETE | `/api/widgets/:id` | JWT | Delete widget |
| GET | `/widget.js` | None | Serve cached embed script |
| GET | `/widgets/:id/config` | None | Public widget configuration |
| POST | `/api/submissions` | None | Public form submission |
| GET | `/api/dashboard/submissions` | JWT | View tenant submissions |
| GET | `/api/dashboard/stats` | JWT | Aggregated metrics |
| GET | `/api/dashboard/geo` | JWT | Geolocation breakdown |

---

## Evaluation & Evidence

See [EVIDENCE.md](EVIDENCE.md) for test transcripts and proof of all 6 acceptance probes.
See [BUILDLOG.md](BUILDLOG.md) for development notes.
