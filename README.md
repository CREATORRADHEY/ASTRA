# Astra Mind Engine

Astra Mind is a "Decision Memory Engine" designed to force cognitive engagement, track decision integrity, and expose cognitive biases through AI-driven pattern diagnosis.

By enforcing "commit gates" before a decision is finalized and requiring users to close "open loops" by logging actual outcomes, Astra Mind creates a localized, unalterable ledger of your judgment history.

## Key Features
* **Secure Direct-Access Auth**: Quick onboarding with demographic data capture (Profession, Country) and strict password requirements.
* **The Decision Capture UI**: A dark, focused terminal-like interface forcing users to define context, rationale, expectations, and confidence.
* **The Challenger Prompt**: A friction-inducing "Commit Gate" that challenges the user's rationale before saving the decision.
* **Open Loop Reflection**: Forces users to confront pending decisions and officially log the actual outcome versus their original expectation.
* **Delta Analysis (AI Insight)**: Compares the `Expected Outcome` vs `Actual Reality` to provide a brutal, objective diagnosis of the user's judgment calibration.
* **Calibration Score**: A gamified metric tracking the accuracy of the user's foresight.

## Tech Stack
* **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
* **Backend**: Next.js Server Actions, API Routes
* **Database & Auth**: Supabase (PostgreSQL, Supabase Auth)
* **AI Integration**: Google Gemini API (Delta Analysis)

## Setup Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env.local` and add your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
4. Run `npm run dev` to start the local server.
