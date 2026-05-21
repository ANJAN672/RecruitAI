# RecruitAI

AI-powered recruiting assistant — parse job descriptions, score candidates, generate
boolean sourcing queries and interview guides, and turn raw interview notes into
structured reports.

## Tech Stack

| Layer    | Technology                                            |
| -------- | ----------------------------------------------------- |
| Framework| Next.js 15 (App Router) + React 19 + TypeScript       |
| Styling  | Tailwind CSS 4, Motion                                |
| Database | Supabase (PostgreSQL + Row Level Security)            |
| Auth     | Supabase Auth (email/password + Google/GitHub OAuth)  |
| AI       | OpenAI / Gemini / OpenRouter (first configured wins)  |
| Hosting  | Vercel                                                |

## Features

- **JD parsing** — extract role, experience, and skills from a pasted or uploaded
  (PDF/DOCX) job description.
- **Candidate scoring** — score a candidate profile against a job (0–100) with reasoning.
- **Boolean sourcing** — generate a boolean search query and open LinkedIn / Naukri /
  Google X-Ray searches.
- **Interview guide** — AI explanations of key technical concepts plus suggested
  interview questions.
- **Interview reports** — convert rough interview notes into a structured report.

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An API key for **one** of: OpenAI, Gemini, or OpenRouter

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` (or `.env.local`) and fill in the values:

```bash
cp .env.example .env
```

You must set the Supabase variables and at least one AI provider key. See
`.env.example` for the full list and provider priority order.

### 3. Set up the database

Apply the migrations in `supabase/migrations/` in filename order.

**Option A — Supabase CLI**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B — SQL Editor**

Open the Supabase dashboard → SQL Editor and run each file in
`supabase/migrations/` in order (oldest first).

Then, under **Authentication → URL Configuration**, add your app URL to the
redirect allow-list, and enable Google/GitHub providers if you want OAuth.

### 4. Run locally

```bash
yarn dev
```

The app runs at `http://localhost:3000`.

### 5. Deploy

Push to a Git provider and import the repo into Vercel. Next.js is detected
automatically — no `vercel.json` is needed. Set the same environment variables
in the Vercel project settings.

## Project Structure

```
app/
  layout.tsx              # Root layout + nav + AuthProvider
  page.tsx                # Dashboard (requisitions list)
  error.tsx, not-found.tsx
  auth/
    page.tsx              # Sign in / sign up
    callback/route.ts     # OAuth code exchange
  jobs/[id]/page.tsx      # Job detail (overview, candidates, sourcing, guide)
  candidates/[id]/page.tsx# Candidate detail + interview reports
  api/                    # Route handlers (see below)
lib/
  ai.ts                   # Provider router (OpenAI → Gemini → OpenRouter)
  openai.ts, gemini.ts, openrouter.ts
  parse-file.ts           # PDF/DOCX text extraction
  supabase-*.ts           # Browser / server / middleware Supabase clients
  auth-context.tsx, nav-user.tsx, utils.ts
middleware.ts             # Session refresh + route protection
supabase/migrations/      # Database schema
```

## API Routes

| Method   | Route                              | Description                          |
| -------- | ---------------------------------- | ------------------------------------ |
| GET/POST | `/api/jobs`                        | List jobs / create job (AI parse)    |
| GET      | `/api/jobs/[id]`                   | Get a job                            |
| GET/POST | `/api/jobs/[id]/candidates`        | List candidates / ingest + score one |
| GET/POST | `/api/jobs/[id]/boolean-search`    | Read saved query / generate one      |
| GET/POST | `/api/jobs/[id]/knowledge`         | Read saved guide / generate one      |
| GET      | `/api/candidates/[id]`             | Get a candidate                      |
| POST     | `/api/candidates/[id]/report`      | Generate an interview report         |
| GET      | `/api/candidates/[id]/reports`     | List interview reports               |
| POST     | `/api/upload/parse`                | Extract text from an uploaded file   |
| GET      | `/api/models`                      | List available Gemini models         |

All `/api` routes require an authenticated session and return `401` otherwise.

## Scripts

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `yarn dev`    | Start the dev server                 |
| `yarn build`  | Production build                     |
| `yarn start`  | Serve the production build           |
| `yarn lint`   | Run ESLint                           |

## License

Proprietary. All rights reserved.
