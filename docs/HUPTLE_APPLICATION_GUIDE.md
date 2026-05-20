# Huptle HR + Candidate Apply — Application Guide

**Version:** As of May 2026  
**Stack:** Next.js HR portal, Next.js apply portal, PostgreSQL, Docker on VPS, GitHub Actions → GHCR

---

## 1. System overview

```mermaid
flowchart TB
  subgraph Users
    HR[HR recruiter / Admin]
    CAND[Candidate]
  end

  subgraph VPS["VPS — Docker Compose"]
    APP["HR Portal :3000<br/>Next.js"]
    APPLY["Apply Portal :3002<br/>HUPTLE_userpfp"]
    DB[(PostgreSQL)]
    APP --> DB
    APPLY -->|"POST /api/integrations/candidate-apply<br/>Bearer CANDIDATE_SYNC_SECRET"| APP
  end

  subgraph External
    GEMINI[Google Gemini API]
    SUPA[Supabase Storage + DB]
    VAPI[Vapi Voice AI]
    GCAL[Google Calendar API]
    GHCR[GitHub Container Registry]
  end

  HR --> APP
  CAND --> APPLY
  APPLY --> GEMINI
  APPLY --> SUPA
  APP --> GEMINI
  APP --> VAPI
  APP --> GCAL
  GHCR -->|"CI: pull images"| VPS
```

| Layer | Role |
|--------|------|
| **HR portal** (`app`) | Jobs, candidates, screening, scheduling, reports, templates |
| **Apply portal** (`apply`) | Resume upload, parse, Supabase profile; syncs to HR |
| **Postgres** | Single source of truth for HR data |
| **CI/CD** | Build both images → GHCR → VPS `docker compose pull` |

---

## 2. Who sees what

```mermaid
flowchart LR
  subgraph HR_side["HR Portal — login required"]
    J[Jobs they created]
    CA[Candidates on those jobs]
    ACT[Activity / dashboard scoped]
    ADM[Admins: see everything]
  end

  subgraph Cand_side["Apply Portal — no HR login"]
    LINK["Link only: /?job=jobId"]
    UP[Upload PDF + email]
    PROF[Parsed profile page]
    SB[(Supabase)]
  end

  HR -->|creates job + shares link| LINK
  LINK --> UP
  UP --> SB
  UP -->|sync| CA
  HR --> J
  J --> CA
```

**Notes:**

- Candidates do **not** browse all HR jobs — they need a job-specific link (`?job=…`).
- HR does **not** use Supabase directly — apply portal syncs parsed data into Postgres.

---

## 3. HR portal — features by menu

```mermaid
mindmap
  root((Huptle HR))
    Auth
      Sign up Sign in
      JWT session
      Per HR scope vs Admin all
    Analytics Dashboard
      Stats funnel weekly
      Recent jobs activity
      Upcoming interview slots
      Recruitment Copilot Gemini
      Funnel insight Gemini
    Jobs
      Create edit Live Draft
      AI draft JD plus 10 questions
      Polish description AI
      Regenerate questions AI
      Apply link NEXT_PUBLIC_APPLY_URL
      Manual add candidates
      Voice screening batch Gemini
      Per candidate async text screening
      AI summary refresh
      Resume parse API
    Pipeline Shortlist
      Cross job top candidates
      Job shortlist page
      AI comparison narrative
      Mark selected journey
    Schedule
      Global calendar view
      Per job slots HR or AI mode
      Book candidate to slot
      AI invite rejection offer email drafts
      Google Calendar connect Profile
      Vapi AI calling campaign India
      Webhook transcript to availability
      Auto book slot plus GCal event
    Templates
      Email templates CRUD
      Scoped by author
    Reports
      Funnel conversion time to hire
      Weekly applicant chart
    Profile Settings
      User profile fields
      Google OAuth tokens
```

---

## 4. End-to-end hiring pipeline

```mermaid
flowchart TD
  A[HR: Create job] --> B{Share apply link?}
  B -->|yes| C[Candidate: job id + upload resume]
  B -->|no| D[HR: Add candidate manually]
  C --> E[Gemini parse in Apply portal]
  E --> F[Supabase store PDF + profile]
  F --> G[Sync to HR Postgres]
  D --> G
  G --> H[HR: Job page Candidates list]
  H --> I[Voice screening Gemini scores rank]
  H --> J[Async text screening per candidate]
  I --> K[Shortlist Pipeline views]
  J --> K
  K --> L[Schedule: create slots]
  L --> M{Scheduling path}
  M -->|Manual| N[Book candidate to slot]
  M -->|AI calls| O[Vapi calls shortlisted with phone]
  O --> P[Webhook transcript]
  P --> Q[Gemini parse availability]
  Q --> R[Book slot + optional Google Calendar]
  N --> R
  R --> S[Journey Round 1 to Offer to Hired]
  S --> T[Reports + Activity feed]
  K --> U[AI email drafts invite reject offer]
  K --> V[Recruiting Copilot Q and A]
```

**Candidate journey states** (`Candidate.journey`):

`Applied` → `Shortlisted` → `Round 1` / `Round 2` / `Round 3` → `Offer Sent` → `Offer Accepted`

---

## 5. AI (Gemini) touchpoints

```mermaid
flowchart LR
  GEMINI[(Gemini 2.5 Flash)]

  GEMINI --> A1[New job JD + questions]
  GEMINI --> A2[Polish JD / replace questions]
  GEMINI --> A3[Voice screening scores + summary]
  GEMINI --> A4[Async screening Q and A scoring]
  GEMINI --> A5[Shortlist comparison]
  GEMINI --> A6[Email drafts invite reject offer]
  GEMINI --> A7[Copilot + funnel insight]
  GEMINI --> A8[HR resume parse API]
  GEMINI --> A9[Vapi transcript to availability JSON]
  GEMINI --> A10[Apply portal resume parse]
  GEMINI --> A11[Vapi assistant config model]
```

Without `GEMINI_API_KEY`, voice screening uses **simulated random scores** so the UI remains usable.

---

## 6. Apply portal (candidate) flows

```mermaid
flowchart TD
  START[Landing /?job=jobId] -->|missing job| ERR[Invalid apply link]
  START -->|valid| FORM[Apply form: email + PDF]
  FORM --> API[POST /api/resume]
  API --> PARSE[Gemini extract structured resume]
  PARSE --> STORE[Supabase profile + file]
  STORE --> SYNC[hr-sync to HR internal API]
  SYNC --> OK[Success optional Profile page]
  OK --> VIEW[Rich profile UI from parsed JSON]
```

**Pages:** apply home (`/?job=`), parsed profile (`/profile`). OTP APIs exist (`/api/otp/send`, `/api/otp/verify`).

---

## 7. Integrations and webhooks

```mermaid
sequenceDiagram
  participant HR as HR UI
  participant App as HR app
  participant Vapi as Vapi
  participant GCal as Google Calendar
  participant Apply as Apply portal

  HR->>App: Start scheduling call campaign
  App->>Vapi: Outbound call +91
  Vapi->>App: POST /api/webhooks/vapi
  App->>App: Gemini parse transcript
  App->>GCal: Create event if connected
  App->>HR: Slot booked + call status

  Apply->>App: POST candidate-apply secret
  App->>HR: Candidate on job + activity log
```

| Integration | Check | Configuration |
|-------------|--------|----------------|
| Gemini | `GET /api/integrations/status` | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Vapi | same | `VAPI_*`, public HTTPS webhook URL |
| Google Calendar | same | OAuth; requires HTTPS domain |
| Email send | `not_configured` | Drafts only — no SMTP wired |
| Candidate sync | env on both services | `CANDIDATE_SYNC_SECRET`, `HR_PORTAL_INTERNAL_URL` |

---

## 8. Data model (core entities)

```mermaid
erDiagram
  HrUser ||--o{ Job : creates
  HrUser ||--o{ Template : authors
  HrUser ||--o{ Activity : actor
  HrUser ||--o{ SchedulingCallCampaign : runs
  Job ||--o{ Candidate : has
  Job ||--o{ ScreeningQuestion : has
  Job ||--o{ InterviewSlot : has
  Job ||--o{ SchedulingCallCampaign : has
  Candidate ||--o{ InterviewSlot : booked
  Candidate ||--o{ SchedulingCall : receives
  SchedulingCallCampaign ||--o{ SchedulingCall : contains
```

**Candidate uniqueness:** `@@unique([jobId, email])` — re-apply with same email updates the row.

---

## 9. Access control

```mermaid
flowchart TD
  U[HR user logs in]
  U --> Q{isAdmin?}
  Q -->|yes| ALL[All jobs candidates templates activity]
  Q -->|no| OWN[Only jobs where createdById = user + related data]
```

---

## 10. Deploy flow (production)

```mermaid
flowchart LR
  DEV[Push main or dev] --> GHA[GitHub Actions]
  GHA --> B1[Build HR image]
  GHA --> B2[Build apply image]
  B1 --> GHCR[GHCR tags]
  B2 --> GHCR
  GHCR --> SCP[SCP docker-compose.yml]
  SCP --> SSH[VPS update DOCKER_IMAGE + APPLY_DOCKER_IMAGE]
  SSH --> PULL[docker compose pull]
  PULL --> UP[docker compose up -d]
  UP --> EP[entrypoint prisma db push]
```

**Typical ports:** HR `3000`, Apply `3002`, dev HR `3001`.

---

## 11. URL reference

| App | Path | Purpose |
|-----|------|---------|
| HR | `/` | Dashboard + copilot |
| HR | `/jobs`, `/jobs/[id]` | Jobs, candidates, apply link |
| HR | `/jobs/[id]/shortlist` | Job shortlist |
| HR | `/jobs/[id]/schedule` | Slots + Vapi panel |
| HR | `/jobs/[id]/async-screen/[candidateId]` | Text screening |
| HR | `/shortlist` | Global pipeline |
| HR | `/schedule` | Global calendar |
| HR | `/templates` | Email templates |
| HR | `/reports` | Analytics |
| HR | `/profile` | Settings + Google connect |
| HR | `/signin`, `/signup` | Auth |
| Apply | `/?job=` | Apply form |
| Apply | `/profile` | Parsed resume view |

---

## 12. Environment variables (summary)

### HR portal (`app`)

- `DATABASE_URL`, `AUTH_SECRET`
- `GEMINI_API_KEY`, `GEMINI_MODEL` (e.g. `gemini-2.5-flash`)
- `CANDIDATE_SYNC_SECRET`, `NEXT_PUBLIC_APPLY_URL`
- `VAPI_*` (API key, assistant, phone, webhook secret)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL`
- `DOCKER_IMAGE` (set by CI on VPS)

### Apply portal (`apply`)

- `GEMINI_API_KEY`, Supabase URL + anon key
- `CANDIDATE_SYNC_SECRET`
- `HR_PORTAL_INTERNAL_URL=http://app:3000` (Docker)
- `APPLY_DOCKER_IMAGE` (set by CI on VPS)

---

## 13. Candidate apply sequence (detailed)

1. HR creates job (Live or Draft).
2. HR copies apply link: `{NEXT_PUBLIC_APPLY_URL}/?job={jobId}`.
3. Candidate uploads PDF; Gemini parses skills, experience, contact info.
4. File stored in Supabase; profile row created.
5. Apply service POSTs to `http://app:3000/api/integrations/candidate-apply` with Bearer secret.
6. HR upserts `Candidate` on that `jobId`; activity logged for job owner.
7. HR runs voice or async screening, shortlists, schedules (manual or Vapi + Calendar).

---

*Generated from the Huptle HR-tech repository. Re-export this PDF after major feature changes.*
