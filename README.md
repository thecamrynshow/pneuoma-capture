# PNEUOMA Capture

Voice-first incident documentation and containment system for professionals across education, corporate, and individual use.

> **→ [PNEUOMA System Guide](PNEUOMA_SYSTEM_GUIDE.md)** — How everything works, how to run it, deploy to GCP, and troubleshooting. **Read this first** if anything breaks.

## The Problem

Professionals handling incidents — school administrators tracking 15-30 student events daily, HR managers documenting workplace issues, or individuals logging personal matters — lose critical details when they rely on handwritten notes, memory, and manual data entry. This creates compliance risk, liability exposure, and wasted time.

## The Solution

PNEUOMA Capture turns a spoken account into a structured, exportable report in under 60 seconds:

1. **Voice-to-Structured Capture** — Speak naturally into your phone. AI transcribes and extracts timestamps, locations, people involved, incident types, severity, actions taken, and de-escalation strategies into organized fields.
2. **Identity Protection** — People are anonymized by default (Person A, Person B). The recorder controls how each individual is labeled: alias, real name, initials, or a custom label.
3. **AI Refine Assistant** — Chat with an AI to clarify details, correct errors, or restructure the report after capture.
4. **Auto-Generated Communications** — Generate role-specific notification templates (teacher, parent, counselor, principal, dean, support staff, HR, manager, or personal contacts) with one tap.
5. **PDF & Clipboard Export** — Individual incident PDFs, combined daily roll-up reports, and clipboard-formatted text for pasting into external systems.

## Multi-Industry Modes

A home screen lets users select their context before capturing:

- **Education** — Designed for K-12 administrators, deans, and counselors. FERPA-aware anonymization, school-specific locations, and de-escalation strategies.
- **Corporate** — Built for HR, managers, and team leads. Workplace incident types, department-based locations, and professional resolution strategies.
- **Individual** — For personal documentation. Flexible categories, private locations, and self-care strategies.

Each mode customizes incident types, locations, communication templates, and terminology throughout the entire app.

## Architecture

```
App (Next.js)
  │
  │  HTTP POST
  ▼
pneuoma-ai (self-hosted server)
  ├── /v1/transcribe  →  audio → transcription  (Whisper large-v3)
  ├── /v1/parse       →  transcript → JSON       (Llama 3.1 8B)
  ├── /v1/templates   →  incident data → comms   (Llama 3.1 8B)
  └── /v1/refine      →  incident/chat → update  (Llama 3.1 8B)
```

All AI processing runs on PNEUOMA's own infrastructure. No student data is sent to third-party AI services (OpenAI, Google, Anthropic). This enables FERPA compliance.

### Frontend

Next.js 16 app with React components, Tailwind CSS, and Prisma ORM. Mobile-first dark UI with frosted glass navigation, gradient cards, and edge-to-edge `#07080d` background.

**Pages:**
- `/home` — Mode selector (Education / Corporate / Individual)
- `/` — Dashboard with daily stats and recent incidents
- `/capture` — Voice recording, AI parsing, manual editing, AI refine chat
- `/incidents` — Full incident list with search and filters
- `/incidents/[id]` — Single incident detail, communication templates, PDF export, status management
- `/reports` — Date-based report builder with daily roll-up and individual PDF generation
- `/privacy` — Privacy policy

### iOS App

The Next.js app is served to a native iOS shell via Capacitor 8. The WKWebView connects to the Next.js server (local for dev, remote for production). Native config handles safe area insets, status bar styling, and background color matching.

### Backend AI Service (`pneuoma-ai/`)

Self-hosted Python service running:
- **Whisper large-v3** (via faster-whisper/CTranslate2) for speech-to-text
- **Llama 3.1 8B Instruct** (via vLLM) for text processing
- Deployed on GCP Cloud Run with GPU
- OpenAI-compatible `/v1/chat/completions` endpoint included

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Database | SQLite via Prisma ORM |
| AI Service | Whisper large-v3, Llama 3.1 8B (self-hosted) |
| PDF | jsPDF + jspdf-autotable |
| iOS App | Capacitor 8 |
| Server Hosting | GCP Cloud Run (AI), Vercel/custom (Next.js) |

## Local Development

### Next.js App

```bash
npm install
cp .env.example .env
# Add PNEUOMA_AI_URL and optionally PNEUOMA_AI_KEY to .env
npm run dev
```

The app runs on `http://localhost:3000`.

### AI Service (PNEUOMA AI — run this first)

```bash
cd pneuoma-ai
./setup-and-run.sh
```

Runs on http://localhost:8000. For GPU + vLLM, see `pneuoma-ai/README.md`. For full system docs, see **[PNEUOMA_SYSTEM_GUIDE.md](PNEUOMA_SYSTEM_GUIDE.md)**.

### iOS (Capacitor)

```bash
# Set server.url in capacitor.config.ts to your local network IP
npm install
npx cap sync ios
npx cap open ios
```

Build and run from Xcode. For production, update `server.url` to the deployed Next.js server.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PNEUOMA_AI_URL` | For AI features | Base URL of the self-hosted AI service |
| `PNEUOMA_AI_KEY` | Optional | API key for AI service authentication |
| `DATABASE_URL` | Yes | SQLite connection string (default: `file:./dev.db`) |

Voice capture and all AI features require the AI service. Manual entry works without it.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── home/page.tsx         # Mode selector
│   ├── capture/page.tsx      # Voice capture + AI refine
│   ├── incidents/page.tsx    # Incident list
│   ├── incidents/[id]/       # Incident detail + templates
│   ├── reports/page.tsx      # Report builder
│   ├── privacy/page.tsx      # Privacy policy
│   └── api/                  # Next.js API routes
│       ├── incidents/        # CRUD
│       ├── transcribe/       # Audio → text
│       ├── parse/            # Text → structured JSON
│       ├── templates/        # Incident → communications
│       └── refine/           # AI chat refinement
├── components/
│   ├── AppHeader.tsx         # Top nav with mode switcher
│   ├── Navigation.tsx        # Bottom tab bar
│   ├── ModeGuard.tsx         # Mode selection enforcer
│   ├── VoiceRecorder.tsx     # Mic recording UI
│   ├── IncidentForm.tsx      # Form with student identity management
│   ├── IncidentCard.tsx      # Incident list item
│   ├── RefinePanel.tsx       # AI chat panel
│   ├── TemplateModal.tsx     # Communication template viewer
│   └── DataConsentBanner.tsx # AI processing consent
├── lib/
│   ├── ai.ts                 # AI service client (transcribe, parse, templates, refine)
│   ├── api.ts                # API base URL resolver
│   ├── modes.ts              # Mode configuration (education, corporate, individual)
│   └── pdf.ts                # PDF generation utilities
└── types/
    └── incident.ts           # TypeScript interfaces

pneuoma-ai/                   # Self-hosted AI backend
ios/                          # Xcode project (Capacitor-generated)
capacitor.config.ts           # Capacitor configuration
```

## Privacy & Compliance

- All AI processing on PNEUOMA's own infrastructure — no third-party AI services
- People anonymized by default across all modes
- FERPA-aware design for education settings
- No unnecessary personal data collection
- Full export and delete capabilities
- [Privacy Policy](https://pneuoma.com/privacy.html)

## Deployed Services

| Service | URL |
|---------|-----|
| PNEUOMA AI (API) | http://35.239.184.183:8000 |
| PNEUOMA Core (consciousness chat) | http://35.239.184.183:8100/chat |

See [PNEUOMA_SYSTEM_GUIDE.md](PNEUOMA_SYSTEM_GUIDE.md) §10 for deploy instructions.

## Links

- **Platform:** [pneuoma.com](https://pneuoma.com)
- **Privacy Policy:** [pneuoma.com/privacy.html](https://pneuoma.com/privacy.html)
- **App Store:** PNEUOMA Capture (iOS)
