# Architecture — Timetable Companion

## High-Level Overview

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                     │
│  ┌─────────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Vue 2 + Vuetify │  │  Vuex    │  │  IndexedDB     │  │
│  │  (SPA)           │  │  (State) │  │  (Offline/pers) │  │
│  └────────┬─────────┘  └──────────┘  └────────────────┘  │
│           │  REST API (JSON)                               │
└───────────┼──────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────┐
│           ▼              SERVER (Node.js + Express)        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Routes                                           │    │
│  │  /api/v1/courses    → Course search, lookup       │    │
│  │  /api/v1/timetable  → Export, import, generate,   │    │
│  │                       ICS, email                  │    │
│  │  /api/v1/feedback   → Submit feedback             │    │
│  │  /api/v1/pdf        → PDF generation              │    │
│  │  /admin/settings    → Web config panel (NEW)      │    │
│  └──────────┬───────────────────────────────────────┘    │
│             │                                             │
│  ┌──────────┴───────────────────────────────────────┐    │
│  │  Services                                         │    │
│  │  Mongoose (MongoDB ODM)                           │    │
│  │  Nodemailer (Email)                               │    │
│  │  Puppeteer (PDF rendering)                        │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Directory Structure

```
timetable-visualizer/
├── config/                  # App configuration
│   ├── db.js                # MongoDB connection
│   └── default.json         # Default config values (NEW)
├── data/                    # Timetable source data (JSON)
├── docs/                    # Documentation
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── frontend-desktop/        # Vue 2 SPA
│   └── src/
│       ├── components/
│       │   ├── layouts/     # Reusable UI components
│       │   └── pages/       # Route-level components
│       ├── router/          # Vue Router config
│       ├── store/           # Vuex store
│       │   ├── api/         # IndexedDB wrapper
│       │   └── helpers/     # API auth helpers
│       └── plugins/         # Vuetify config
├── frontend-mobile/         # Separate mobile frontend (legacy)
├── src/                     # Backend source
│   ├── models/              # Mongoose schemas
│   │   ├── Course.js
│   │   └── Timetable.js
│   └── routes/              # Express route handlers
│       ├── courses.js
│       ├── timetable.js
│       ├── feedback.js
│       └── pdf-generate/
├── timetable-generator/     # Timetable generation algorithm
│   ├── generator.js         # Core backtracking algorithm
│   ├── generateICS.js       # .ics file generation
│   └── generateParsedArrayForPDF.js
├── timetable-parser/        # Raw timetable → JSON parser
├── tmp/                     # Temporary file storage
├── Dockerfile
├── index.js                 # Express app entry point
└── package.json
```

## Data Flow

### Course Search Flow
```
User types query → Vue component → Vuex action (sendRequest)
  → GET /api/v1/courses?search=PHYS
  → MongoDB aggregation ($regexMatch on courseName + courseCode)
  → Paginated JSON response
  → Vuex state → Vue component renders results
```

### Timetable Generation Flow
```
User selects courses + preferences → POST /api/v1/timetable/generate-timetable
  → generator.js: recursive backtracking with clash detection
  → Returns array of Parsed objects (scheduledCourses)
  → Frontend renders as 2D grid (7 days × 12 slots)
```

### ICS Export Flow
```
User clicks "Export to Calendar" → POST /api/v1/timetable/generate/ics-file
  → generateICS.js: builds VCALENDAR string with VEVENT blocks
  → Option A: Download → sends .ics buffer as response
  → Option B: Email → Nodemailer sends as attachment
```

## Database Schemas

### Course (MongoDB collection: `courses`)
```
{
  courseNo: Number,
  courseCode: String,    // e.g., "PHY F111"
  courseName: String,    // e.g., "General Physics"
  units: Number,
  comprehensiveExamDate: Date,
  IC: String,            // Instructor-in-charge
  lectures: [{ section, dhString, timings, instructors, roomNumber, newSection }],
  tutorials: [{ ... }],
  labs: [{ ... }]
}
```

### Timetable (MongoDB collection: `timetables`)
```
{
  shareID: String (unique),  // Random ID for sharing
  scheduledCourses: [{
    courseCode: String,
    lecturesSection: { section, dhString, timings, instructors, roomNumber },
    tutorialsSection: { ... },
    labsSection: { ... }
  }]
}
```

## Key Algorithms

### Timetable Generator (Backtracking)
The core algorithm in `generator.js` works as follows:

1. For each course, compute all section permutations (lecture × tutorial × lab)
2. Filter sections by user preferences (preferred/unpreferred)
3. Recursively try each combination, checking for time-slot clashes
4. Clash detection: map (weekday × time-slot) → check if occupied
5. Stop after 2000 valid timetables found
6. Randomize the result set

### Timetable Parser
Parses raw BITS timetable data (space-delimited day/hour strings) into structured JSON with:
- Day/hour parsing: `"M W F 3"` → `[{day: "Monday", time: "10:00 - 10:50"}]`
- Lab timing: `"T 5 6 7 8"` → `[{day: "Tuesday", time: "12:00 - 15:50"}]`
- New section detection via trailing "N" suffix
- Instructor name capitalization

## Deployment

### Current (Docker)
```
node:14-alpine + chromium → npm install → npm run prod_setup → npm run start:prod
```

### Proposed
```
node:20-alpine + chromium → npm ci → npm run build → npm start
```
With optional docker-compose including MongoDB.

## Dependencies (Non-Dev)

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.17 | HTTP framework |
| mongoose | ^5.13 | MongoDB ODM |
| puppeteer | ^19.5 | Headless Chrome for PDF |
| ejs | ^3.1 | Template engine (PDF) |
| nodemailer | ^6.7 | Email sending |
| randomstring | ^1.2 | Share ID generation |
| uuid | ^8.3 | ICS event UIDs |
| lodash | ^4.17 | Utility functions |
| @sendgrid/mail | ^7.6 | SendGrid email (unused?) |
| node-device-detector | ^1.3 | UA parsing for mobile redirect |
| morgan | ^1.10 | HTTP request logging |

## Development Conventions

- **Branch naming:** `overhaul/*` for major changes, `fix/*` for bug fixes, `feat/*` for features
- **Commit style:** Conventional Commits (`fix:`, `feat:`, `docs:`, `chore:`)
- **Formatting:** Prettier (2-space indent, single quotes, no semicolons)
- **Linting:** ESLint for JS, TSC for TS files
- **Testing:** Vitest, describe/it blocks, mock external services
