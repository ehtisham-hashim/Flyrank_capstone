# Original User Request

## Initial Request — 2026-08-30T13:44:44Z

Build and verify a multi-tenant embeddable widget and lead-capture backend platform that serves embed snippets, delivers cached widget scripts, receives public form submissions cross-origin, applies rate limiting, honeypot spam filtering, geo IP enrichment with provider fallbacks, and surfaces analytics via a dashboard API.

Working directory: /home/ehtisham/Desktop/Projects/Flyrank_capstone
Integrity mode: development

## Requirements

### R1. Multi-Tenant Widget & Auth Management
- Secure JWT-based registration and login.
- Tenant-isolated CRUD endpoints for widgets (POST/GET/PUT/DELETE /api/widgets).
- Automatic generation of the single-line embed snippet <script src="..."> for each widget.

### R2. High-Performance Widget Delivery
- Public cached endpoint for the widget JavaScript bundle (/widget.js) with immutable caching headers.
- Public cached endpoint for widget configuration (/widgets/:id/config) with short TTL and CORS support.

### R3. Hardened Public Submission Pipeline
- Public submission endpoint (POST /api/submissions) accepting cross-origin requests from any domain with preflight OPTIONS support.
- Strict boundary validation on form payloads returning clean 4xx JSON errors on malformed or oversized inputs.
- Abuse protection including per-IP rate limiting (429 Too Many Requests) and honeypot spam detection.
- Visitor geolocation enrichment using a fallback chain (ip-api.com -> ipapi.co -> null fallback) that degrades gracefully without failing submissions.
- Idempotency support to safely handle duplicated submissions.
- Asynchronous non-blocking side-effects (e.g. notifications/emails) whose failures never disrupt the main submission response.

### R4. Aggregated Owner Dashboard API
- Authenticated endpoints (/api/dashboard/*) to retrieve paginated submissions, submission counts over time, per-widget metrics, and geolocation breakdowns.

### R5. Verification & Test Harness
- Customer test website served on a secondary origin (http://localhost:5500) proving cross-origin rendering and submissions.
- Automated acceptance test suite covering all 6 evaluation probes.

## Acceptance Criteria

### Probe 1: Cross-Origin Submission & Dashboard Visibility
- [ ] Submitting form data from second-origin test site succeeds with 201 Created and persists in PostgreSQL.
- [ ] Submission appears in tenant's GET /api/dashboard/submissions response.

### Probe 2: Boundary Validation
- [ ] Submitting malformed JSON, empty payload, or invalid UUID returns clean 400 JSON errors, never 500.
- [ ] Payloads over 100KB are rejected with 413 Payload Too Large.

### Probe 3: Rate Limiting
- [ ] Firing a burst of 15+ rapid submissions triggers 429 Too Many Requests.
- [ ] Legitimate submissions succeed after the rate window resets.

### Probe 4: Geolocation Enrichment Fallback
- [ ] Public IP lookup populates country and city via primary provider.
- [ ] Inactive/failing primary provider gracefully falls back to secondary provider.
- [ ] Total provider failure allows submission to save without geo data.

### Probe 5: Safe Side Effects
- [ ] Notification or email failures do not block or fail the HTTP submission response.

### Probe 6: Honeypot Spam Defense
- [ ] Populating hidden honeypot field (_hp) flags submission as spam and rejects with 400.
