# Supabase setup for RecruitAI

Your project: **Anjan-TL's Project**  
URL: `https://pzclhklgiqnobgjnaahw.supabase.co`  
Project ref: `pzclhklgiqnobgjnaahw`

## 1. Create tables (choose one)

### Option A – SQL Editor (no CLI)

1. In [Supabase Dashboard](https://supabase.com/dashboard) open your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `supabase/migrations/20250308000000_initial_schema.sql`.
4. Click **Run**. You should see “Success. No rows returned.”

### Option B – Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref pzclhklgiqnobgjnaahw
npx supabase db push
```

## 2. Get API keys for the app

1. In the dashboard go to **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You do **not** need the database password for the Next.js app; the anon key is enough.

## 3. Set env and run

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=https://pzclhklgiqnobgjnaahw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_key_here
```

Then:

```bash
npm run dev
```

Open http://localhost:3000, create a requisition, and check **Table Editor** in Supabase to see the `jobs` row.
