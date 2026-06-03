# Product Requirements Document — Timetable Companion v2.0

**Status:** In Progress | **Last Updated:** 2026-06-03

---

## Executive Summary

Timetable Companion is a web application for BITS Pilani students to search courses, build clash-free timetables, export to calendar apps, and share schedules. This v2.0 overhaul transforms it from a student prototype into a production-grade, self-service application that requires **zero command-line interaction** to set up and operate.

---

## Goals

| Goal | Success Metric |
|------|---------------|
| Zero-CLI onboarding | User can deploy and configure entirely via browser GUI |
| Production reliability | 99% uptime, graceful error handling on all paths |
| Security baseline | No XSS, no injection, no plaintext secrets in code |
| Tested codebase | 80%+ coverage on core logic (generator, parser, API) |
| Maintainable | Clear docs, CI/CD, TypeScript migration path |

---

## Target Personas

### Primary: BITS Student
- Wants to search courses, add them, see timetable visually
- May use desktop or mobile
- Technical ability: basic web browsing

### Secondary: BITS Admin / Maintainer
- Deploys and configures the app
- Should never need to SSH, edit files manually, or run CLI commands
- Technical ability: comfortable with a web settings panel

---

## Architecture (Current & Proposed)

### Current Stack
- **Frontend:** Vue 2 + Vuetify + Vuex
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **PDF:** Puppeteer + Chromium
- **Email:** Nodemailer (Gmail SMTP)
- **Storage:** IndexedDB (client-side persistence)

### Proposed Changes
- **Config UI:** Web-based admin panel for all settings (no `.env` files)
- **Node.js:** Upgrade from 14 → 20 LTS
- **Testing:** Vitest for backend, Vue Test Utils for frontend
- **CI/CD:** GitHub Actions (tests + lint on every PR)
- **Security:** Helmet.js, input sanitization, rate limiting
- **TypeScript:** Gradual migration (new code in TS, existing JS maintained)

---

## Feature Roadmap

### Phase 1 — Clean Slate (Current)
- [x] Fork and own the repo
- [ ] Fix all critical bugs
- [ ] PRD + ARCHITECTURE.md
- [ ] Web-based settings panel
- [ ] .gitignore cleanup
- [ ] Basic test suite
- [ ] CI pipeline

### Phase 2 — Stabilize
- [ ] Rate limiting
- [ ] Helmet.js security headers
- [ ] CORS configuration
- [ ] Input validation (express-validator)
- [ ] Email provider abstraction (SendGrid, SMTP options)
- [ ] Database migration scripts

### Phase 3 — Enhance
- [ ] PWA support (service worker, offline mode)
- [ ] Dark mode toggle
- [ ] Mobile-responsive single frontend (merge frontend-desktop + frontend-mobile)
- [ ] TypeScript migration
- [ ] Admin dashboard with usage analytics

---

## Functional Requirements

### FR-1: Course Search
- Search by course code or name
- Paginated results with metadata (lectures/tutorials/labs count)
- Sort by course code
- Filter already-added courses

### FR-2: Timetable Builder
- 7-day × 12-slot grid layout
- Drag/add sections (lecture, tutorial, lab) to slots
- Automatic clash detection
- Lunch hour availability check (12:00–13:00)
- Comprehensive exam clash detection
- Change tracking with unsaved-changes indicator

### FR-3: Timetable Generator
- Input: list of course codes with section preferences
- Output: multiple clash-free timetable options
- Preferences: preferred/unpreferred sections per course
- Max 2000 generated timetables (configurable)

### FR-4: Export / Share
- `.ics` file download (imports into Google Calendar, Apple Calendar)
- Email `.ics` file as attachment
- Share via unique link (persists timetable in MongoDB)
- PDF export (via Puppeteer → Chromium)

### FR-5: Onboarding & Configuration (NEW)
- Web-based config panel at `/admin/settings`
- Configure: MongoDB URI, email provider, semester dates, app settings
- No `.env` file editing required
- Configuration stored in database with fallback to defaults
- Setup wizard on first launch

### FR-6: Feedback
- Star rating + message
- Emailed to admin(s)
- Saved locally to disk

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Security | No XSS, no SQL/NoSQL injection, input sanitized, secrets never in code |
| Performance | Search < 500ms, timetable generation < 5s for 5 courses |
| Accessibility | WCAG 2.1 AA (ARIA labels, keyboard navigation, color contrast) |
| Documentation | README, ARCHITECTURE.md, PRD.md, inline JSDoc |
| Error Handling | Every API route returns proper error responses (never hangs) |
| Testing | Unit tests for generator, parser, API routes; integration for PDF |

---

## Breaking Changes from v1

1. **Config migration:** `.env` files replaced by DB-stored config with admin UI
2. **Default config values:** If no config exists, app starts in "setup wizard" mode
3. **Hardcoded paths removed:** All paths relative to `__dirname`
4. **Node.js 14 → 20:** May need dependency updates

---

## Open Questions

1. Keep MongoDB or offer SQLite option for simpler deployments?
2. Keep separate mobile frontend or merge into responsive SPA?
3. Auth system for admin panel? (Simple passcode? OAuth? None — trust localhost?)
