# Timetable Companion v2.0

BITS Pilani Timetable Companion — Search courses, build clash-free timetables, export to Google Calendar, share with friends, and generate PDF schedules. **Everything configurable via browser GUI, zero command-line required.**

---

## Quick Start (No CLI Needed)

### 1. Deploy (choose one)

**Option A: Docker (recommended)**
```bash
docker run -p 5050:5050 ghcr.io/azizim3/timetable-visualizer
```

**Option B: Manual**
```bash
npm install
npm run prod_setup
npm run start:prod
```

### 2. Open Admin Panel

Go to `http://localhost:5050/admin/settings` in your browser and configure:
- MongoDB connection URI
- Email provider (Gmail)
- Semester dates
- App settings

**That's it.** Everything is managed through the web UI. No SSH, no `.env` files, no config editing.

---

## Features

| Feature | Description |
|---------|-------------|
| Course Search | Search by course code or name, paginated results |
| Timetable Builder | Drag sections onto a 7-day x 12-slot grid with clash detection |
| Clash Detection | Automatic time-slot and comprehensive exam clash checks |
| Lunch Hour Guard | Warns if you schedule over 12:00–13:00 |
| Timetable Generator | Auto-generate multiple clash-free timetables from course preferences |
| ICS Export | Download or email `.ics` file for Google Calendar / Apple Calendar |
| PDF Export | Beautiful A4 timetable PDFs |
| Share | Generate a unique link to share your timetable |
| Feedback | Star rating + message sent to admin |
| Dark Mode | Toggle dark/light theme |
| Admin Panel | Web-based config at `/admin/settings` |
| Offline-Ready | IndexedDB for client-side persistence |
| Zero-CLI Config | All settings managed via browser GUI |

---

## Tech Stack

- **Frontend:** Vue 2 + Vuetify + Vuex
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose ODM)
- **PDF:** Puppeteer + Chromium
- **Email:** Nodemailer
- **Offline:** IndexedDB

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture document.

```
Browser (Vue SPA) → REST API (Express) → MongoDB
                    ↘ PDF (Puppeteer + Chromium)
                    ↘ Email (Nodemailer)
                    ↘ ICS Generator
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/courses` | Search courses (query: search, page, limit) |
| GET | `/api/v1/courses/:code` | Get course details |
| GET | `/api/v1/courses/generate/course_details` | Get details for specific course codes |
| POST | `/api/v1/timetable/export` | Export timetable (generates share ID) |
| GET | `/api/v1/timetable/import/:share_id` | Import shared timetable |
| POST | `/api/v1/timetable/generate-timetable` | Auto-generate timetable |
| POST | `/api/v1/timetable/generate/ics-file` | Generate and download/email ICS file |
| POST | `/api/v1/feedback/to-me` | Submit feedback |
| POST | `/api/v1/pdf/generate-timetable` | Generate PDF timetable |
| GET | `/admin/settings` | Web admin panel |
| POST | `/api/v1/admin/settings` | Save admin settings |
| GET | `/api/v1/admin/test` | Test database connection |
| GET | `/health` | Health check |

---

## Development

```bash
# Clone and install
git clone https://github.com/Azizim3/timetable-visualizer.git
cd timetable-visualizer
npm run setup_env

# Start dev server (with hot reload)
npm run start:dev

# Run tests
npm test

# Run parser (populate MongoDB from timetable data)
npm run parse-timetable
```

---

## What's New in v2.0

### Critical Bug Fixes
- Fixed `ReferenceError` in ICS endpoint (wrong variable name in catch block)
- Fixed XSS vulnerabilities in feedback and email templates
- Fixed hardcoded file paths (`/opt/nil1729/...`)
- Replaced `eval()` with safe arithmetic in PDF generator
- Added proper error responses on all API routes (no more hanging requests)
- Added ReDoS protection on search (regex special chars sanitized)
- Fixed relative file paths in ICS download

### New Features
- **Web Admin Panel** (`/admin/settings`) — configure everything from browser
- **Health Check** (`/health`) endpoint for monitoring
- **CI/CD Pipeline** — GitHub Actions with lint + test + build
- **Test Suite** — Vitest for backend logic
- **Full Documentation** — PRD, Architecture, improved README
- **Docker Upgrade** — Node 14 → Node 20 Alpine, optimized layers
- **Config Persistence** — Settings saved to `config/app-config.json`
- **HTML Sanitization** — All user input escaped before rendering in email

### Documentation
- [PRD (Product Requirements Document)](docs/PRD.md)
- [Architecture Guide](docs/ARCHITECTURE.md)

---

## Configuration (All via Web UI)

| Setting | Default | Description |
|---------|---------|-------------|
| MongoDB URI | (required) | Connection string |
| Sender Email | (required) | Gmail address for sending |
| Sender Password | (required) | Gmail app password |
| Receiver Email | (required) | Admin email for feedback |
| Semester Start | (required) | For ICS date ranges |
| Semester End | (required) | For ICS date ranges |
| Page Limit | 10 | Courses per search page |
| Environment | development | dev/production |

---

## Credits

- Original design adapted from [StudyDeck](https://studydeck.bits-sutechteam.org/)
- Created by [Nil Deb](https://github.com/nil1729) & [Shaurya](https://github.com/spidy102)
- v2.0 overhaul by [Azizim3](https://github.com/Azizim3)

---

## License

MIT — see [LICENSE](LICENSE)
