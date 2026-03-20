# RecruitAI

Next.js app for AI-powered recruiting: requisitions, candidate ranking, boolean search (LinkedIn/Naukri), and interview guides. **No custom server** — uses Supabase for the database and Next.js API routes for AI (Gemini).

## What’s included

- **Requisitions** – Create jobs; AI parses JD and extracts role, experience, hard/soft skills.
- **Candidates** – Add candidates (resume/profile text); AI scores match and reasoning.
- **Sourcing** – Generate boolean search query, then **search on LinkedIn or Naukri** in one click (opens their site with the query; no API keys needed).
- **Interview guide** – AI explains key concepts and suggests interview questions.
- **Interview reports** – Turn raw notes into structured strengths/weaknesses/recommendation.

## Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- [Gemini API key](https://ai.google.dev/)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase (database)

- Create a project at [supabase.com](https://supabase.com).
- Get **Project URL** and **anon public** key from Project Settings → API.
- Apply the schema using the Supabase CLI (recommended) or run the SQL in the SQL Editor.

**Option A – Supabase CLI (you can verify with your DB)**

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or **Option B – Manual**: open Supabase Dashboard → SQL Editor, paste and run the contents of `supabase/migrations/20250308000000_initial_schema.sql`.

### 3. Environment variables

Copy `.env.example` to `.env.local` and set:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Candidate search (LinkedIn / Naukri)

- **No API keys required** for the current flow: generate the boolean query in the **Sourcing** tab, then use **“Search on LinkedIn”** or **“Search on Naukri”** to open the respective site with the query (or copy the query and paste there).
- **Automated APIs**: LinkedIn Recruiter and Naukri candidate-search APIs are restricted (partnership/recruiter products). If you get API access later, you can add `.env` keys (e.g. `NAUKRI_API_KEY`, `LINKEDIN_CLIENT_ID`) and implement server-side search in `app/api/` and call it from the Sourcing tab.

## Tech stack

- **Next.js 15** (App Router), React 19
- **Supabase** (Postgres) – direct from browser/API routes; no separate backend server
- **Gemini** – JD parsing, boolean search, candidate scoring, knowledge assistant, interview reports
- **Tailwind CSS 4**, Motion

## Project layout

- `app/` – pages and API routes
- `app/api/` – Next.js API routes (Supabase + Gemini)
- `lib/supabase.ts` – Supabase client
- `lib/gemini.ts` – Gemini helpers (server-only)
- `supabase/migrations/` – DB schema for Supabase CLI
