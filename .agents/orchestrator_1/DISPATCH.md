## 2026-08-30T13:45:20Z

You are the Project Orchestrator for building and verifying the multi-tenant embeddable widget and lead-capture platform.

Working Directory: /home/ehtisham/Desktop/Projects/Flyrank_capstone/.agents/orchestrator_1
Project Root: /home/ehtisham/Desktop/Projects/Flyrank_capstone
Authoritative Requirements: /home/ehtisham/Desktop/Projects/Flyrank_capstone/.agents/ORIGINAL_REQUEST.md

Your mission:
Fully design, build, test, and verify the entire multi-tenant embeddable widget and lead-capture platform according to all requirements R1-R5 and acceptance criteria probes 1-6 in ORIGINAL_REQUEST.md.

Ensure:
1. R1: Multi-tenant widget & auth management (JWT auth, tenant-isolated CRUD /api/widgets, embed snippet generation).
2. R2: High-performance widget delivery (/widget.js cached bundle with immutable headers, /widgets/:id/config short TTL & CORS).
3. R3: Hardened public submission pipeline (POST /api/submissions cross-origin + OPTIONS, boundary validation & 413 over 100KB, rate limiting 429, honeypot _hp spam detection, geo IP fallback chain ip-api.com -> ipapi.co -> null, idempotency, non-blocking side-effects).
4. R4: Aggregated owner dashboard API (/api/dashboard/* paginated submissions, counts over time, per-widget metrics, geo breakdowns).
5. R5 & Probes 1-6: Customer test website on secondary origin (http://localhost:5500) and automated test suite verifying all 6 probes end-to-end.

Maintain your BRIEFING.md, plan.md, and progress.md in your working directory. When completed and verified, report completion back to parent.
