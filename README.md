# ASTRA MIND — Decision Memory Engine

> *"This app exposes how wrong you are."*

Astra Mind is a production-grade **cognitive calibration engine**. It forces users through a high-friction decision logging loop, uses Gemini AI to deliver brutal post-mortem diagnoses, and maintains a persistent **Calibration Score** that reflects the accuracy of a user's judgment over time.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                 │
│                                                          │
│  /           Capture UI (Brain dump → AI parse)          │
│  /reviews    Review Loop (Outcome + Delta Analysis)      │
│  /profile    Identity Dashboard (Score + Pattern Layer)  │
│  /login      Auth (Supabase SSR)                         │
│  /signup     Auth (Supabase SSR + validation guards)     │
│                                                          │
│  /api/analyze    → Gemini: extract structured data       │
│  /api/commit     → Supabase: persist decision            │
│  /api/outcome    → Gemini: Delta Analysis + score update │
└──────────────────────────────────────────────────────────┘
         │                            │
         ▼                            ▼
  Supabase (Auth + DB)        Google Gemini 2.5 Flash
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL via PostgREST) |
| Auth | Supabase SSR (`@supabase/ssr`) |
| AI | Google Gemini 2.5 Flash (`@ai-sdk/google`) |
| AI SDK | Vercel AI SDK (`generateObject`) |

---

## Database Schema

### `auth.users` (Supabase managed)
Supabase handles this. A PostgreSQL trigger auto-copies `full_name`, `profession`, `country` from auth metadata into `public.users` on signup.

### `public.users`
```sql
id                uuid (FK → auth.users)
full_name         text
profession        text
country           text
calibration_score integer  DEFAULT 50
total_decisions   integer  DEFAULT 0
```

### `public.decisions`
```sql
id                uuid
user_id           uuid (FK → users)
raw_input         text
status            text  ('pending' | 'resolved')
actual_outcome    text
success_rating    integer
ai_diagnosis      jsonb  { mistake, bias, missed_factor, verdict }
ai_feedback       text   ('agree' | 'disagree')
emotional_response text  ('neutral' | 'uncomfortable' | 'brutal')
review_date       timestamptz
created_at        timestamptz
```

### `public.structured_data`
```sql
decision_id       uuid (FK → decisions)
analysis_id       uuid (hard-linked to prevent mismatch attacks)
context           text
chosen_option     text
discarded_options text[]
rationale         text
expected_outcome  text
confidence_level  integer
```

### `public.events` (instrumentation)
```sql
id          uuid
user_id     uuid
event_name  text  (decision_created | review_started | review_submitted | ai_verdict_shown | cta_clicked | ai_feedback_given | emotional_response_given)
metadata    jsonb
created_at  timestamptz
```

---

## Calibration Score Algorithm

```ts
const delta = Math.abs(confidence - success_rating)

// Deduct proportionally to how wrong the user was
let score_change = -(delta * 0.2)

// Reward accurate predictions
if (delta < 10) score_change += 2

// Cap impact at ±10 per decision (prevents rage-quit disengagement)
const MAX_CHANGE = 10
score_change = Math.max(-MAX_CHANGE, Math.min(MAX_CHANGE, score_change))

// Clamp score between 0–100
new_score = Math.max(0, Math.min(100, old_score + score_change))
```

### Identity Labels
| Score | Label |
|---|---|
| 0–29 | Delusional |
| 30–49 | Uncalibrated |
| 50–69 | Average |
| 70–84 | Sharp |
| 85–100 | Dangerous Thinker |

---

## AI Pipeline

### Capture (`/api/analyze`)
Takes a raw, unstructured brain-dump and extracts:
- Context, Chosen Option, Discarded Options, Rationale, Expected Outcome, Confidence Level
- Generates a **Challenger Prompt** that identifies a specific blindspot in the user's logic

### Delta Analysis (`/api/outcome`)
After the user submits their real-world outcome:
1. Fetches original `expected_outcome` and `confidence` from DB
2. Fetches last 2 AI verdicts to **prevent repetitive diagnoses**
3. Calls Gemini 2.5 Flash with the full context and anti-repetition constraint
4. Returns structured JSON: `{ mistake, bias, missed_factor, verdict }`
5. Updates `calibration_score` and `total_decisions` in `public.users`

---

## Security Architecture

| Layer | Control |
|---|---|
| Auth | Supabase SSR session cookies (httpOnly) |
| Route Protection | Next.js Middleware (`updateSession`) on all non-static routes |
| API Auth | Every API route calls `supabase.auth.getUser()` server-side before any DB write |
| Commit Gate | Backend enforces `challenge_response OR override_reason` — cannot be bypassed client-side |
| Disposable Emails | `disposable-email-domains` package blocks throwaway signups |
| Password Policy | Regex: min 8 chars, must contain letters AND numbers |
| Duplicate Outcome | `/api/outcome` checks `status === 'resolved'` before processing — returns 403 |
| HTTP Headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy` |
| Secrets | All keys in `.env.local` (git-ignored via `.env*` rule) |

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/CREATORRADHEY/ASTRA.git
cd ASTRA/Astra

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and Gemini API key

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Vercel Deployment

1. Push to GitHub (already done)
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** → `Astra`
4. Add Environment Variables (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_GENERATIVE_AI_API_KEY
```

5. Deploy. Vercel auto-detects Next.js.

> **Supabase Auth Redirect**: After deploying, go to your Supabase project → Authentication → URL Configuration → add your Vercel production URL to the **Allowed Redirect URLs** list.

---

## Instrumentation

All key user actions write to the `events` table. Query in Supabase SQL Editor:

```sql
-- Drop-off funnel
SELECT event_name, COUNT(*) FROM events GROUP BY event_name ORDER BY count DESC;

-- Users who submitted but never returned
SELECT user_id FROM events WHERE event_name = 'review_submitted'
EXCEPT
SELECT user_id FROM events WHERE event_name = 'decision_created'
  AND created_at > (SELECT MAX(created_at) FROM events e2 WHERE e2.event_name = 'review_submitted' AND e2.user_id = events.user_id);

-- AI trust rate
SELECT ai_feedback, COUNT(*) FROM decisions WHERE ai_feedback IS NOT NULL GROUP BY ai_feedback;

-- Emotional impact distribution
SELECT emotional_response, COUNT(*) FROM decisions WHERE emotional_response IS NOT NULL GROUP BY emotional_response;
```

---

## Key Design Decisions

**Why no streaming AI?** Structured `generateObject` is used over streaming because the Delta Analysis must return a typed JSON object (`mistake`, `bias`, `missed_factor`, `verdict`) that gets persisted to the DB and rendered in a structured UI. Streaming adds complexity with no UX gain here.

**Why is the Calibration Score capped at ±10?** To prevent a single bad decision from causing an emotional "rage quit". Users must feel the system is *fair and mathematical*, not arbitrary.

**Why does the pattern insight require 7 decisions + 3 occurrences?** Surfacing a pattern after 2-3 data points creates false insights and destroys credibility. Credibility is the product's only moat.

**Why no email verification?** Speed of onboarding is prioritized for the beta phase. Users are blocked from disposable emails. Email verification is the planned next step before public launch.
