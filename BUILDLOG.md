# BUILDLOG.md

Log of AI-assisted building, modifications, decisions, and validations.

---

## Working Sessions

### Session 1: Phase 1 — Project Scaffolding & Design
- **Date:** 2026-08-30
- **What AI assisted with:** Scaffolding project structure, creating Docker Compose config, database migrations, package dependencies via pnpm.
- **What was changed / refined manually:** Switched package manager to pnpm, created dedicated `backend/` directory structure, verified Docker & pnpm versions.
- **Key decisions made:** PostgreSQL 16 on Docker, Node.js + Express with ES modules, layered architecture (routes -> controllers -> services -> DB).
