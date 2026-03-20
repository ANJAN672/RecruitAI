-- RecruitAI Supabase Schema (Complete)
-- Run this in your Supabase project SQL Editor (https://app.supabase.com -> SQL Editor)

-- ── User Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'recruiter' CHECK (role IN ('recruiter', 'candidate')),
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Jobs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID DEFAULT gen_random_uuid() UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  role TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  hard_skills TEXT DEFAULT '[]',
  soft_skills TEXT DEFAULT '[]',
  certifications TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Candidates ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  profile_url TEXT DEFAULT '',
  twitter_url TEXT DEFAULT '',
  profile_text TEXT NOT NULL,
  skills TEXT DEFAULT '[]',
  experience TEXT DEFAULT '',
  match_score INTEGER DEFAULT 0,
  match_reasoning TEXT DEFAULT '',
  behavioral_summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Interview Reports ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_reports (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  strengths TEXT DEFAULT '',
  weaknesses TEXT DEFAULT '',
  recommendation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Boolean Searches ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boolean_searches (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Knowledge Guides ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_guides (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concepts JSONB DEFAULT '[]',
  interview_questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Market Intelligence ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_intelligence (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Candidate Notes (recruiter notes per candidate, persisted to DB) ──
CREATE TABLE IF NOT EXISTS candidate_notes (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, user_id)
);

-- ── Candidate Submissions (pipeline tracking) ─────────────────────────
CREATE TABLE IF NOT EXISTS candidate_submissions (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT DEFAULT '',
  status TEXT DEFAULT 'sourced' CHECK (status IN ('sourced', 'screened', 'submitted', 'interview', 'offered', 'joined', 'rejected')),
  submitted_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, job_id, user_id)
);

-- ── Row Level Security ────────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE boolean_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_submissions ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────
-- (Service role key bypasses these, but good to have for safety)

CREATE POLICY "Users manage own profile" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own candidates" ON candidates FOR ALL USING (
  job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own reports" ON interview_reports FOR ALL USING (
  job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own boolean searches" ON boolean_searches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own knowledge guides" ON knowledge_guides FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own market intelligence" ON market_intelligence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own candidate notes" ON candidate_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own submissions" ON candidate_submissions FOR ALL USING (auth.uid() = user_id);

-- ── Indexes for Performance ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_match_score ON candidates(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_interview_reports_candidate ON interview_reports(candidate_id);
CREATE INDEX IF NOT EXISTS idx_boolean_searches_job ON boolean_searches(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_guides_job ON knowledge_guides(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_market_intel_job ON market_intelligence(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_job ON candidate_submissions(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_candidate ON candidate_submissions(candidate_id);

-- ── Migration: Add missing columns to existing tables ─────────────────
-- Run these if you already have the old schema and need to add new columns:
--
-- ALTER TABLE candidates ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT '';
-- ALTER TABLE candidates ADD COLUMN IF NOT EXISTS behavioral_summary TEXT DEFAULT '';

-- ── NOTE: Also configure OAuth in Supabase Dashboard ──────────────────
-- Authentication -> Providers -> GitHub (enable, add Client ID & Secret from GitHub OAuth App)
-- Authentication -> Providers -> Google (enable, add Client ID & Secret from Google Cloud Console)
-- Authentication -> URL Configuration -> Add your app URL to allowed redirect URLs
