-- Migration: Add user_profiles, candidate_notes, candidate_submissions tables
-- Date: 2026-03-15

-- ── User Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'recruiter' CHECK (role IN ('recruiter', 'candidate')),
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON user_profiles FOR ALL USING (auth.uid() = id);

-- ── Candidate Notes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidate_notes (
  id BIGSERIAL PRIMARY KEY,
  candidate_id BIGINT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, user_id)
);

ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own candidate notes" ON candidate_notes FOR ALL USING (auth.uid() = user_id);

-- ── Candidate Submissions ─────────────────────────────────────────────
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

ALTER TABLE candidate_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own submissions" ON candidate_submissions FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_submissions_job ON candidate_submissions(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_candidate ON candidate_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_match_score ON candidates(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_reports_candidate ON interview_reports(candidate_id);
CREATE INDEX IF NOT EXISTS idx_boolean_searches_job ON boolean_searches(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_guides_job ON knowledge_guides(job_id, user_id);
CREATE INDEX IF NOT EXISTS idx_market_intel_job ON market_intelligence(job_id, user_id);

-- ── Add RLS policies for existing tables that may be missing them ─────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boolean_searches' AND policyname = 'Users manage own boolean searches') THEN
    CREATE POLICY "Users manage own boolean searches" ON boolean_searches FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_guides' AND policyname = 'Users manage own knowledge guides') THEN
    CREATE POLICY "Users manage own knowledge guides" ON knowledge_guides FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_intelligence' AND policyname = 'Users manage own market intelligence') THEN
    CREATE POLICY "Users manage own market intelligence" ON market_intelligence FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
