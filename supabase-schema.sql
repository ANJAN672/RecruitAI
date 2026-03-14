-- RecruitAI Supabase Schema
-- Run this in your Supabase project SQL Editor (https://app.supabase.com -> SQL Editor)

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
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

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profile_url TEXT DEFAULT '',
  profile_text TEXT NOT NULL,
  skills TEXT DEFAULT '[]',
  experience TEXT DEFAULT '',
  match_score INTEGER DEFAULT 0,
  match_reasoning TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview reports table
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

-- Enable Row Level Security (optional if using service role key on server)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reports ENABLE ROW LEVEL SECURITY;

-- Policies (service role key bypasses these, but good to have for safety)
CREATE POLICY "Users manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own candidates" ON candidates FOR ALL USING (
  job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own reports" ON interview_reports FOR ALL USING (
  job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())
);

-- NOTE: Also configure OAuth in Supabase Dashboard:
-- Authentication -> Providers -> GitHub (enable, add Client ID & Secret from GitHub OAuth App)
-- Authentication -> Providers -> Google (enable, add Client ID & Secret from Google Cloud Console)
-- Authentication -> URL Configuration -> Add "http://localhost:3000" to allowed redirect URLs
