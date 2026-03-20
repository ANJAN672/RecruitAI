# RecruitAI

AI-powered recruitment intelligence platform that automates the hiring pipeline from JD understanding to candidate submission.

## Features

- **AI JD Parsing** — Paste any job description, get structured requirements in seconds
- **Multi-Platform Boolean Search** — Auto-generated search queries for LinkedIn, Naukri, Indeed, Dice, CareerBuilder, Monster + Google X-ray
- **AI Candidate Scoring** — Match candidates against JD requirements (0-100 score) with reasoning
- **Bulk Profile Import** — Parse and score up to 20 candidate profiles in a single batch
- **Behavioral Analysis** — AI-generated behavioral summary for every candidate
- **Interview Guide** — Technical concepts explained for non-technical recruiters + interview Q&As
- **Interview Report Generator** — Convert rough interview notes into structured evaluations
- **Market Intelligence** — Salary benchmarks (India + US), market demand, and vetted training institutions
- **Submission Tracker** — Pipeline tracking from Sourced to Joined with status updates
- **Excel Export** — Download candidate data as .xlsx for client submissions
- **Top Match Ranking** — Visual ranking with badges for top 10 candidates per job
- **Role-Based Auth** — Separate Recruiter and Candidate dashboards with OAuth support
- **Candidate Portal** — Candidates can log in to track their application status

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TailwindCSS 4, Framer Motion, React Router 7 |
| Backend | Node.js, Express.js, TypeScript |
| Database | Supabase (PostgreSQL with RLS) |
| AI Engine | OpenAI GPT-4o-mini |
| Auth | Supabase Auth (OAuth + Email/Password) |
| Hosting | Vercel (Serverless) |
| Build | Vite 6, TypeScript 5.8 |

## Setup

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
APP_URL=http://localhost:3000
```

### 3. Set up the database

1. Go to your Supabase project dashboard
2. Open the **SQL Editor**
3. Paste the contents of `supabase-schema.sql` and run it
4. Go to **Authentication > Providers** and enable GitHub/Google OAuth if desired
5. Add your app URL to **Authentication > URL Configuration > Redirect URLs**

### 4. Run locally

```bash
yarn dev
```

The app will be available at `http://localhost:3000`.

### 5. Deploy to Vercel

```bash
vercel deploy
```

Set the same environment variables in your Vercel project settings.

## Project Structure

```
├── app.ts                    # Express API (all backend endpoints)
├── server.ts                 # Development server (Vite + Express)
├── api/index.ts              # Vercel serverless entry point
├── supabase-schema.sql       # Complete database schema
├── src/
│   ├── App.tsx               # Router and app shell
│   ├── types.ts              # TypeScript interfaces
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── api.ts            # API helper functions
│   ├── components/
│   │   ├── AuthProvider.tsx   # Auth context and session management
│   │   ├── AuthPage.tsx       # Login/signup with role selection
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── SourcingTab.tsx    # Boolean search generation
│   │   ├── MarketIntelligenceTab.tsx
│   │   └── shared.tsx         # Reusable UI components
│   └── pages/
│       ├── Dashboard.tsx      # Recruiter dashboard (job listing)
│       ├── JobDetails.tsx     # Job details with all tabs
│       ├── CandidateDetails.tsx
│       └── CandidatePortal.tsx # Candidate self-service portal
├── vercel.json               # Vercel deployment config
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | OAuth provider availability |
| POST | `/api/profile` | Create/update user profile |
| POST | `/api/jobs` | Create job with AI parsing |
| GET | `/api/jobs` | List jobs with candidate counts |
| GET | `/api/jobs/:id` | Get job details |
| GET/POST | `/api/jobs/:id/boolean-search` | Boolean search queries |
| GET/POST | `/api/jobs/:id/knowledge` | Interview guide |
| POST | `/api/jobs/:id/candidates` | Ingest and score candidate |
| GET | `/api/jobs/:id/candidates` | List candidates (ranked) |
| GET | `/api/jobs/:id/candidates/export` | Excel download |
| GET/POST | `/api/jobs/:id/submissions` | Submission tracker |
| GET | `/api/candidates/:id` | Candidate details |
| POST | `/api/candidates/:id/report` | Generate interview report |
| GET | `/api/candidates/:id/reports` | List reports |
| GET/POST | `/api/candidates/:id/notes` | Recruiter notes |
| GET/POST | `/api/jobs/:id/market-intelligence` | Market data |
| GET | `/api/candidate-portal/applications` | Candidate self-service |

## License

Proprietary. All rights reserved.
