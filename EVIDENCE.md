# EVIDENCE.md — Acceptance Probes & Requirements Proof

Run these commands against the live backend to collect evidence for evaluation.

---

## Acceptance Probes

### Probe 1: Cross-Origin Submission & Dashboard Visibility
**Action:** Submit from customer test site (`http://localhost:5500`) or via curl simulating cross-origin browser.
```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@flyrank.com","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Get seeded widget ID
WIDGET_ID=$(curl -s http://localhost:3000/api/widgets \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)

# 3. Submit from external origin
curl -i -X POST http://localhost:3000/api/submissions \
  -H "Origin: http://localhost:5500" \
  -H "Content-Type: application/json" \
  -d "{\"widgetId\":\"$WIDGET_ID\",\"data\":{\"name\":\"John Doe\",\"email\":\"john@example.com\"}}"

# 4. Verify in Dashboard
curl -s http://localhost:3000/api/dashboard/submissions \
  -H "Authorization: Bearer $TOKEN"
```
**Pasted Output Proof:**
```text
[Paste terminal output here]
```

---

### Probe 2: Malformed & Oversized Payload Handling
**Action:** Verify boundary validation rejects bad input with `4xx` JSON errors and never crashes with `500`.
```bash
# A. Empty form data (Expect 400 Bad Request)
curl -i -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"widgetId":"11111111-1111-1111-1111-111111111111","data":{}}'

# B. Malformed JSON (Expect 400 Bad Request)
curl -i -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"widgetId": INVALID_JSON'

# C. Invalid UUID (Expect 400 Bad Request)
curl -i -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"widgetId":"not-a-uuid","data":{"test":"val"}}'
```
**Pasted Output Proof:**
```text
[Paste terminal output here]
```

---

### Probe 3: Rate Limiting
**Action:** Fire burst of rapid submissions to trigger `429 Too Many Requests`.
```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/submissions \
    -H "Content-Type: application/json" \
    -d "{\"widgetId\":\"$WIDGET_ID\",\"data\":{\"burst\":$i}}"
done
```
**Pasted Output Proof:**
```text
[Paste burst status codes here e.g. 201s followed by 429s]
```

---

### Probe 4: Geo Enrichment Fallback Chain
**Action:** Public submission captures visitor IP and enriches location (Provider A -> Provider B -> null fallback).
```bash
# Run automated probe verification:
cd backend && pnpm test:probes
```
**Pasted Output Proof:**
```text
[Paste test:probes output here]
```

---

### Probe 5: Safe Side Effects (Email/Webhook)
**Action:** Side effects are non-blocking; failure never affects submission return status.
```bash
cd backend && pnpm test:probes
```
**Pasted Output Proof:**
```text
[Paste notification test output here]
```

---

### Probe 6: Honeypot Spam Prevention
**Action:** Submitting with `_hp` field populated blocks bot submission with `400`.
```bash
curl -i -X POST http://localhost:3000/api/submissions \
  -H "Content-Type: application/json" \
  -d "{\"widgetId\":\"$WIDGET_ID\",\"data\":{\"name\":\"SpamBot\"},\"_hp\":\"bot-trap-filled\"}"
```
**Pasted Output Proof:**
```text
[Paste honeypot 400 rejection output here]
```

---

## Core Requirements Checklist

- [x] Authenticated CRUD endpoints for widgets (auth required)
- [x] Multi-tenant isolation verified (`userId` scoped on all queries)
- [x] Embed snippet generated per widget
- [x] Public config endpoint with `Cache-Control: public, max-age=60`
- [x] Widget JS served as versioned asset with `Cache-Control: public, max-age=31536000, immutable`
- [x] Widget renders on second-origin test page (`http://localhost:5500`)
- [x] CORS & preflight `OPTIONS` handled correctly
- [x] Boundary validation with clean `4xx` errors
- [x] Valid submissions safely stored with tenant link
- [x] Rate limiting per IP (`429 Too Many Requests`)
- [x] Honeypot spam control
- [x] Geo fallback chain degrades gracefully
- [x] Failing side effect does not block submission
- [x] `README.md`, `capstone.yaml`, `EVIDENCE.md`, `BUILDLOG.md`, `context/project_build_map.md` present
