import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import {
  Briefcase, Users, FileText, Search, Plus, ArrowLeft,
  CheckCircle, XCircle, Clock, BrainCircuit, ChevronRight,
  Copy, Loader2, LogOut, Eye, EyeOff, Check, ExternalLink,
  Linkedin, Globe, RefreshCw, TrendingUp, Heart, Twitter,
  DollarSign, BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────

interface Job {
  id: number;
  title: string;
  description: string;
  role: string;
  experience: string;
  hard_skills: string;
  soft_skills: string;
  certifications: string;
  created_at: string;
}

interface Candidate {
  id: number;
  job_id: number;
  name: string;
  profile_url: string;
  profile_text: string;
  skills: string;
  experience: string;
  match_score: number;
  match_reasoning: string;
  created_at: string;
}

interface InterviewReport {
  id: number;
  candidate_id: number;
  job_id: number;
  notes: string;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  created_at: string;
}

interface SearchQueries {
  linkedin_boolean: string;
  naukri_keywords: string;
  indeed_boolean: string;
  dice_boolean: string;
  careerbuilder_boolean: string;
  monster_boolean: string;
  xray_linkedin: string;
  xray_naukri: string;
  xray_indeed: string;
  xray_dice: string;
  xray_careerbuilder: string;
  xray_monster: string;
  found?: boolean;
}

interface AppConfig {
  github: boolean;
  google: boolean;
}

// ── Auth Context ──────────────────────────────────────────────────────────

const AuthContext = React.createContext<{
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
} | null>(null);

function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── API helper ────────────────────────────────────────────────────────────

async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

function parseJSON<T>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}

// Expandable skills list — shows first N, click "+X" to see all
function SkillsList({ skills, variant = 'blue', max = 4 }: { skills: string[]; variant?: string; max?: number }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!skills.length) return null;
  const shown = expanded ? skills : skills.slice(0, max);
  const hidden = skills.length - max;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s, i) => <span key={i} className={`badge badge-${variant} text-xs`}>{s}</span>)}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="badge text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          +{hidden} more
        </button>
      )}
      {expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="badge text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          show less
        </button>
      )}
    </div>
  );
}

// ── OAuth Icons ───────────────────────────────────────────────────────────

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Password validation ───────────────────────────────────────────────────

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function PasswordRules({ password }: { password: string }) {
  if (!password) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <div key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-600' : 'text-neutral-400'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${ok ? 'bg-emerald-100' : 'bg-neutral-100'}`}>
              {ok ? <Check className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 block" />}
            </div>
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────

function AuthPage() {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [config, setConfig] = React.useState<AppConfig>({ github: false, google: false });

  const isSignup = mode === 'signup';
  const passwordValid = PASSWORD_RULES.every(r => r.test(password));

  React.useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => { /* keep defaults */ });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (isSignup && !passwordValid) {
      setError('Please meet all password requirements.');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccessMsg('Account created! Check your email to confirm, then log in.');
        setMode('login');
        setPassword('');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (err) setError(err.message);
  };

  const hasOAuth = config.github || config.google;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-neutral-900 rounded-2xl flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">RecruitAI</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="glass-card p-8">
              <h1 className="text-xl font-semibold text-neutral-900 mb-1">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-sm text-neutral-500 mb-7">
                {isSignup ? 'Start sourcing candidates with AI.' : 'Sign in to your RecruitAI workspace.'}
              </p>

              {hasOAuth && (
                <>
                  <div className="space-y-2.5 mb-5">
                    {config.github && (
                      <button
                        onClick={() => handleOAuth('github')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-neutral-900 text-white rounded-2xl font-medium text-sm hover:bg-neutral-800 transition-colors"
                      >
                        <GitHubIcon />
                        Continue with GitHub
                      </button>
                    )}
                    {config.google && (
                      <button
                        onClick={() => handleOAuth('google')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-neutral-200 text-neutral-800 rounded-2xl font-medium text-sm hover:bg-neutral-50 transition-colors"
                      >
                        <GoogleIcon />
                        Continue with Google
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-neutral-100" />
                    <span className="text-xs text-neutral-400 font-medium">or with email</span>
                    <div className="flex-1 h-px bg-neutral-100" />
                  </div>
                </>
              )}

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field pr-11"
                      placeholder={isSignup ? 'Create a strong password' : 'Your password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isSignup && <PasswordRules password={password} />}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {isSignup ? (loading ? 'Creating account...' : 'Create account') : (loading ? 'Signing in...' : 'Sign in')}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-neutral-500">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setSuccessMsg(''); setPassword(''); }}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
      } ${className}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">RecruitAI</span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                {initial}
              </div>
              <span className="text-sm text-neutral-600 hidden sm:block max-w-[160px] truncate">{user?.email}</span>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-2 w-52 bg-white border border-neutral-100 rounded-2xl shadow-xl shadow-neutral-100/50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-neutral-50">
                    <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-neutral-400" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────

function Dashboard() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newJobTitle, setNewJobTitle] = React.useState('');
  const [newJobDesc, setNewJobDesc] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [fetchLoading, setFetchLoading] = React.useState(true);
  const [createError, setCreateError] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    api('/api/jobs')
      .then(r => r.json())
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setFetchLoading(false));
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCreateError('');
    try {
      const res = await api('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ title: newJobTitle, description: newJobDesc }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed to create job.'); return; }
      setJobs(prev => [data, ...prev]);
      setIsCreating(false);
      setNewJobTitle('');
      setNewJobDesc('');
      navigate(`/jobs/${data.id}`);
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Requisitions</h1>
          <p className="text-neutral-500 mt-1 text-sm">Manage open roles and AI-powered sourcing.</p>
        </div>
        <button onClick={() => { setIsCreating(o => !o); setCreateError(''); }} className="btn-primary">
          {isCreating ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isCreating ? 'Cancel' : 'New Requisition'}
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="glass-card p-7">
              <h3 className="text-lg font-medium text-neutral-900 mb-5">Create New Requisition</h3>
              {createError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{createError}</div>
              )}
              <form onSubmit={handleCreateJob} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Job Title</label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={e => setNewJobTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Senior Backend Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Job Description</label>
                  <textarea
                    required
                    rows={7}
                    value={newJobDesc}
                    onChange={e => setNewJobDesc(e.target.value)}
                    className="input-field resize-none"
                    placeholder="Paste the full job description here. AI will extract requirements automatically."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    {isLoading ? 'Analyzing JD...' : 'Create & Analyze'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fetchLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.length === 0 && !isCreating && (
            <div className="col-span-full py-20 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
              <Briefcase className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">No requisitions yet. Create one to get started.</p>
            </div>
          )}
          {jobs.map((job, i) => {
            const skills = parseJSON<string[]>(job.hard_skills, []);
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="h-full">
                <Link to={`/jobs/${job.id}`} className="block group h-full">
                  <div className="glass-card p-5 h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex justify-between items-start mb-3">
                      <span className="badge badge-green text-xs">Active</span>
                      <span className="text-xs text-neutral-400 font-mono">
                        {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">{job.title}</h3>
                    <div className="space-y-1.5">
                      {job.role && (
                        <p className="flex items-center text-xs text-neutral-500 gap-2">
                          <Briefcase className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                          <span className="truncate">{job.role}</span>
                        </p>
                      )}
                      {job.experience && (
                        <p className="flex items-center text-xs text-neutral-500 gap-2">
                          <Clock className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
                          <span className="truncate">{job.experience}</span>
                        </p>
                      )}
                    </div>
                    {skills.length > 0 && (
                      <div className="mt-3">
                        <SkillsList skills={skills} variant="blue" max={3} />
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ── Sourcing Tab ──────────────────────────────────────────────────────────

function SourcingTab({ jobId }: { jobId: string }) {
  const [queries, setQueries] = React.useState<SearchQueries | null>(null);
  const [loadingCache, setLoadingCache] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [xrayTab, setXrayTab] = React.useState('LinkedIn');

  // On mount: fast cache fetch. If stale (has record but missing new fields), auto-regenerate.
  React.useEffect(() => {
    api(`/api/jobs/${jobId}/boolean-search`)
      .then(r => r.json())
      .then(data => {
        if (data.found) {
          setQueries(data);
          setLoadingCache(false);
        } else if (data.stale) {
          // Has old record missing new fields → silently regenerate, show spinner
          api(`/api/jobs/${jobId}/boolean-search`, { method: 'POST' })
            .then(r => r.json())
            .then(fresh => { if (fresh.found) setQueries(fresh); })
            .catch(() => {})
            .finally(() => setLoadingCache(false));
        } else {
          setLoadingCache(false);
        }
      })
      .catch(() => setLoadingCache(false));
  }, [jobId]);

  // Button handler: POST → generate + store
  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api(`/api/jobs/${jobId}/boolean-search`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setQueries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-card p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">Sourcing Toolkit</h4>
          <p className="text-sm text-neutral-500 mt-1">Boolean searches for LinkedIn, Naukri, Indeed, Dice, CareerBuilder, Monster + Google X-ray.</p>
        </div>
            <button onClick={generate} disabled={generating || loadingCache} className="btn-primary">
            {generating
              ? <Loader2 className="animate-spin mr-2 h-4 w-4" />
              : queries ? <RefreshCw className="mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
            {generating ? 'Generating...' : queries ? 'Regenerate' : 'Generate Queries'}
          </button>
      </div>

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {loadingCache && (
        <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
      )}

      {!queries && !loadingCache && (
        <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
          <Search className="mx-auto h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Click generate to build optimized search queries.</p>
        </div>
      )}

      {queries && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* ── Direct Platform Searches ── */}
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Direct Platform Searches</p>

          {[
            {
              label: 'LinkedIn', query: queries.linkedin_boolean,
              icon: <Linkedin className="w-4 h-4 text-blue-600" />, textColor: 'text-emerald-400',
              btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
              btnLabel: 'Search LinkedIn',
              onSearch: () => window.open(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(queries.linkedin_boolean)}`, '_blank', 'noopener,noreferrer'),
              hint: null,
            },
            {
              label: 'Naukri', query: queries.naukri_keywords,
              icon: <Globe className="w-4 h-4 text-orange-500" />, textColor: 'text-orange-300',
              btnClass: 'bg-orange-500 hover:bg-orange-600 text-white',
              btnLabel: 'Search Naukri',
              onSearch: () => { navigator.clipboard.writeText(queries.naukri_keywords).catch(() => {}); window.open('https://resdex.naukri.com/', '_blank', 'noopener,noreferrer'); },
              hint: 'Keywords copied to clipboard — paste in ResdEx search bar.',
            },
            {
              label: 'Indeed', query: queries.indeed_boolean,
              icon: <Search className="w-4 h-4 text-indigo-500" />, textColor: 'text-indigo-400',
              btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
              btnLabel: 'Search Indeed',
              onSearch: () => window.open(`https://www.indeed.com/jobs?q=${encodeURIComponent(queries.indeed_boolean)}`, '_blank', 'noopener,noreferrer'),
              hint: null,
            },
            {
              label: 'Dice', query: queries.dice_boolean,
              icon: <Globe className="w-4 h-4 text-red-500" />, textColor: 'text-red-400',
              btnClass: 'bg-red-600 hover:bg-red-700 text-white',
              btnLabel: 'Search Dice',
              onSearch: () => window.open(`https://www.dice.com/jobs?q=${encodeURIComponent(queries.dice_boolean)}`, '_blank', 'noopener,noreferrer'),
              hint: null,
            },
            {
              label: 'CareerBuilder', query: queries.careerbuilder_boolean,
              icon: <Briefcase className="w-4 h-4 text-green-600" />, textColor: 'text-emerald-400',
              btnClass: 'bg-green-700 hover:bg-green-800 text-white',
              btnLabel: 'Search CareerBuilder',
              onSearch: () => window.open(`https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(queries.careerbuilder_boolean)}`, '_blank', 'noopener,noreferrer'),
              hint: null,
            },
            {
              label: 'Monster', query: queries.monster_boolean,
              icon: <Users className="w-4 h-4 text-purple-500" />, textColor: 'text-purple-400',
              btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
              btnLabel: 'Search Monster',
              onSearch: () => window.open(`https://www.monster.com/jobs/search/?q=${encodeURIComponent(queries.monster_boolean)}`, '_blank', 'noopener,noreferrer'),
              hint: null,
            },
          ].map(({ label, query, icon, textColor, btnClass, btnLabel, onSearch, hint }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-sm font-medium text-neutral-800">{label}{label === 'Naukri' ? ' Keywords' : ' Boolean'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={query} />
                  <button
                    onClick={onSearch}
                    disabled={!query}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-40 ${btnClass}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    {btnLabel}
                  </button>
                </div>
              </div>
              {hint && <p className="text-xs text-neutral-400 mb-2">{hint}</p>}
              <div className="bg-neutral-900 rounded-2xl p-4 overflow-x-auto">
                <code className={`${textColor} text-sm font-mono leading-relaxed whitespace-pre-wrap break-words`}>
                  {query || 'Regenerate to get query'}
                </code>
              </div>
            </div>
          ))}

          {/* ── Google X-ray Searches ── */}
          {(() => {
            const xrayPlatforms = [
              { label: 'LinkedIn', query: queries.xray_linkedin, textColor: 'text-blue-400' },
              { label: 'Naukri', query: queries.xray_naukri, textColor: 'text-orange-300' },
              { label: 'Indeed', query: queries.xray_indeed, textColor: 'text-indigo-400' },
              { label: 'Dice', query: queries.xray_dice, textColor: 'text-red-400' },
              { label: 'CareerBuilder', query: queries.xray_careerbuilder, textColor: 'text-emerald-400' },
              { label: 'Monster', query: queries.xray_monster, textColor: 'text-purple-400' },
            ];
            const active = xrayPlatforms.find(p => p.label === xrayTab) || xrayPlatforms[0];
            return (
              <div className="pt-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Google X-ray Searches</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {xrayPlatforms.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setXrayTab(p.label)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${xrayTab === p.label ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="bg-neutral-900 rounded-2xl p-4 overflow-x-auto mb-2">
                  <code className={`${active.textColor} text-sm font-mono leading-relaxed whitespace-pre-wrap break-words`}>
                    {active.query || 'Regenerate to get query'}
                  </code>
                </div>
                <div className="flex justify-end gap-2">
                  {active.query && <CopyButton text={active.query} />}
                  <button
                    onClick={() => active.query && window.open(`https://www.google.com/search?q=${encodeURIComponent(active.query)}`, '_blank', 'noopener,noreferrer')}
                    disabled={!active.query}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Search Google
                  </button>
                </div>
              </div>
            );
          })()}

        </motion.div>
      )}
    </div>
  );
}

// ── Market Intelligence Tab ───────────────────────────────────────────────

interface MarketIntel {
  salary: { india: string; us: string; global_note: string };
  demand: string;
  training: Array<{ name: string; provider: string; type: string; location: string; url: string }>;
}

function MarketIntelligenceTab({ jobId }: { jobId: string }) {
  const [data, setData] = React.useState<MarketIntel | null>(null);
  const [loadingCache, setLoadingCache] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api(`/api/jobs/${jobId}/market-intelligence`)
      .then(r => r.json())
      .then(json => {
        if (json.found) {
          setData(json);
          setLoadingCache(false);
        } else if (json.stale) {
          api(`/api/jobs/${jobId}/market-intelligence`, { method: 'POST' })
            .then(r => r.json())
            .then(fresh => { if (fresh.found) setData(fresh); })
            .catch(() => {})
            .finally(() => setLoadingCache(false));
        } else {
          setLoadingCache(false);
        }
      })
      .catch(() => setLoadingCache(false));
  }, [jobId]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api(`/api/jobs/${jobId}/market-intelligence`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass-card p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-lg font-medium text-neutral-900">Market Intelligence</h4>
          <p className="text-sm text-neutral-500 mt-1">Salary benchmarks and training resources for this role.</p>
        </div>
        <button onClick={generate} disabled={generating || loadingCache} className="btn-primary flex-shrink-0">
          {generating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : data ? <RefreshCw className="mr-2 h-4 w-4" /> : <TrendingUp className="mr-2 h-4 w-4" />}
          {generating ? 'Generating...' : data ? 'Regenerate' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>}

      {loadingCache && (
        <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
      )}

      {!data && !loadingCache && !generating && (
        <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
          <TrendingUp className="mx-auto h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Generate market intelligence to see salary benchmarks and training resources.</p>
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Salary */}
          <div>
            <h5 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Salary Benchmarks
            </h5>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">India</p>
                <p className="text-xl font-semibold text-emerald-800">{data.salary?.india || '—'}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">United States</p>
                <p className="text-xl font-semibold text-blue-800">{data.salary?.us || '—'}</p>
              </div>
            </div>
            {data.salary?.global_note && (
              <p className="text-xs text-neutral-500 mt-2 px-1">{data.salary.global_note}</p>
            )}
          </div>

          {/* Demand */}
          {data.demand && (
            <div>
              <h5 className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Market Demand
              </h5>
              <p className="text-sm text-neutral-600 leading-relaxed bg-blue-50/50 border border-blue-100/50 rounded-2xl px-4 py-3">{data.demand}</p>
            </div>
          )}

          {/* Training */}
          {data.training?.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-500" /> Academic & Professional Institutions
              </h5>
              <div className="space-y-2">
                {data.training.map((t, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3.5 bg-white border border-neutral-100 rounded-xl hover:border-neutral-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 leading-snug">{t.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {t.provider}
                        {t.location && <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium ${t.location === 'India' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{t.location}</span>}
                      </p>
                    </div>
                    {t.url && (
                      <button onClick={() => window.open(t.url, '_blank', 'noopener,noreferrer')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 flex-shrink-0 mt-0.5">
                        Visit <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Job Details ───────────────────────────────────────────────────────────

function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = React.useState<Job | null>(null);
  const [jobError, setJobError] = React.useState('');
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = React.useState('candidates');
  const [knowledge, setKnowledge] = React.useState<any>(null);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = React.useState(false);
  const [knowledgeError, setKnowledgeError] = React.useState('');

  // Candidate form
  const [isAddingCandidate, setIsAddingCandidate] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState('');
  const [candidateUrl, setCandidateUrl] = React.useState('');
  const [candidateProfile, setCandidateProfile] = React.useState('');
  const [isIngesting, setIsIngesting] = React.useState(false);
  const [ingestError, setIngestError] = React.useState('');

  React.useEffect(() => {
    if (!id) return;
    api(`/api/jobs/${id}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) { setJobError(data.error || 'Job not found'); return; }
        setJob(data);
      })
      .catch(() => setJobError('Failed to load job.'));

    api(`/api/jobs/${id}/candidates`)
      .then(r => r.json())
      .then(data => setCandidates(Array.isArray(data) ? data : []))
      .catch(() => setCandidates([]));
  }, [id]);

  const [knowledgeLoadingCache, setKnowledgeLoadingCache] = React.useState(false);

  // Auto-load cached knowledge when tab opens. If stale, auto-regenerate silently.
  React.useEffect(() => {
    if (activeTab !== 'interview_guide' || knowledge !== null || knowledgeLoadingCache) return;
    setKnowledgeLoadingCache(true);
    api(`/api/jobs/${id}/knowledge`)
      .then(r => r.json())
      .then(data => {
        if (data.found) {
          setKnowledge(data);
          setKnowledgeLoadingCache(false);
        } else if (data.stale) {
          api(`/api/jobs/${id}/knowledge`, { method: 'POST' })
            .then(r => r.json())
            .then(fresh => { if (fresh.found) setKnowledge(fresh); })
            .catch(() => {})
            .finally(() => setKnowledgeLoadingCache(false));
        } else {
          setKnowledgeLoadingCache(false);
        }
      })
      .catch(() => setKnowledgeLoadingCache(false));
  }, [activeTab, id]);

  // Button: POST → generate + store
  const generateKnowledge = async () => {
    setIsGeneratingKnowledge(true);
    setKnowledgeError('');
    try {
      const res = await api(`/api/jobs/${id}/knowledge`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setKnowledge(data);
    } catch (err: any) {
      setKnowledgeError(err.message || 'Failed to generate. Try again.');
    } finally {
      setIsGeneratingKnowledge(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestError('');
    try {
      const res = await api(`/api/jobs/${id}/candidates`, {
        method: 'POST',
        body: JSON.stringify({ name: candidateName, profile_url: candidateUrl, profile_text: candidateProfile }),
      });
      const data = await res.json();
      if (!res.ok) { setIngestError(data.error || 'Failed to ingest candidate.'); return; }
      setCandidates(prev => [...prev, data].sort((a, b) => b.match_score - a.match_score));
      setIsAddingCandidate(false);
      setCandidateName(''); setCandidateUrl(''); setCandidateProfile('');
    } catch {
      setIngestError('Network error. Please try again.');
    } finally {
      setIsIngesting(false);
    }
  };

  if (jobError) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
        <ArrowLeft className="mr-1.5 h-4 w-4" />Requisitions
      </Link>
      <div className="glass-card p-8 text-center text-neutral-500">{jobError}</div>
    </div>
  );

  if (!job) return (
    <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
  );

  const hardSkills = parseJSON<string[]>(job.hard_skills, []);

  const tabs = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'sourcing', label: 'Sourcing' },
    { key: 'overview', label: 'JD Overview' },
    { key: 'interview_guide', label: 'Interview Guide' },
    { key: 'market_intelligence', label: 'Market Intelligence' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
        <ArrowLeft className="mr-1.5 h-4 w-4" />Requisitions
      </Link>

      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-neutral-900 leading-tight mb-2">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
              {job.role && <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{job.role}</span>}
              {job.experience && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{job.experience}</span>}
            </div>
          </div>
          {hardSkills.length > 0 && (
            <div className="max-w-xs md:max-w-sm">
              <SkillsList skills={hardSkills} variant="blue" max={6} />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-0.5">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`nav-pill whitespace-nowrap ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ── Candidates ── */}
          {activeTab === 'candidates' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-neutral-900">
                  {candidates.length > 0 ? `${candidates.length} Candidate${candidates.length !== 1 ? 's' : ''} — Ranked by Match` : 'Candidates'}
                </h4>
                <button onClick={() => { setIsAddingCandidate(o => !o); setIngestError(''); }} className="btn-primary">
                  {isAddingCandidate ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isAddingCandidate ? 'Cancel' : 'Add Candidate'}
                </button>
              </div>

              <AnimatePresence>
                {isAddingCandidate && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="glass-card p-6">
                      <h5 className="font-medium text-neutral-900 mb-4 text-sm">Ingest Candidate Profile</h5>
                      {ingestError && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{ingestError}</div>
                      )}
                      <form onSubmit={handleAddCandidate} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name *</label>
                            <input type="text" required value={candidateName} onChange={e => setCandidateName(e.target.value)} className="input-field" placeholder="Full name" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">LinkedIn URL <span className="text-neutral-400">(optional)</span></label>
                            <input type="url" value={candidateUrl} onChange={e => setCandidateUrl(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/..." />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Resume / Profile Text *</label>
                          <textarea
                            required
                            rows={6}
                            value={candidateProfile}
                            onChange={e => setCandidateProfile(e.target.value)}
                            className="input-field resize-none"
                            placeholder="Paste the candidate's resume or LinkedIn profile text. AI will score the match automatically."
                          />
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={isIngesting} className="btn-primary">
                            {isIngesting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            {isIngesting ? 'Scoring with AI...' : 'Ingest & Score'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {candidates.length === 0 && !isAddingCandidate && (
                  <div className="py-16 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                    <Users className="mx-auto h-9 w-9 mb-3 opacity-20" />
                    <p className="text-sm">No candidates yet. Add one to start evaluating.</p>
                  </div>
                )}
                {candidates.map((candidate, i) => (
                  <motion.div key={candidate.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link to={`/candidates/${candidate.id}`} className="block group">
                      <div className="glass-card p-5 transition-all duration-200 hover:shadow-md hover:border-neutral-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                              <h3 className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">{candidate.name}</h3>
                              <span className={`badge flex-shrink-0 ${candidate.match_score >= 80 ? 'badge-green' : candidate.match_score >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                                {candidate.match_score}% match
                              </span>
                            </div>
                            {candidate.experience && (
                              <p className="text-xs text-neutral-500 flex items-start gap-1.5 mb-2">
                                <Briefcase className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-50" />
                                <span className="line-clamp-1">{candidate.experience}</span>
                              </p>
                            )}
                            {candidate.match_reasoning && (
                              <p className="text-xs text-neutral-600 bg-neutral-50 px-3 py-2 rounded-xl line-clamp-2">
                                <span className="font-medium text-neutral-700">AI: </span>{candidate.match_reasoning}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sourcing ── */}
          {activeTab === 'sourcing' && <SourcingTab jobId={id!} />}

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="glass-card p-7">
              <h4 className="font-medium text-neutral-900 mb-5">Original Job Description</h4>
              <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">{job.description}</div>
            </div>
          )}

          {/* ── Market Intelligence ── */}
          {activeTab === 'market_intelligence' && <MarketIntelligenceTab jobId={id!} />}

          {/* ── Interview Guide ── */}
          {activeTab === 'interview_guide' && (
            <div className="glass-card p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
                <div>
                  <h4 className="font-medium text-neutral-900">Knowledge Assistant</h4>
                  <p className="text-sm text-neutral-500 mt-1">Technical concepts explained + interview questions.</p>
                </div>
                <button onClick={generateKnowledge} disabled={isGeneratingKnowledge || knowledgeLoadingCache} className="btn-primary flex-shrink-0">
                  {isGeneratingKnowledge
                    ? <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    : knowledge ? <RefreshCw className="mr-2 h-4 w-4" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  {isGeneratingKnowledge ? 'Analyzing...' : knowledge ? 'Regenerate' : 'Generate Guide'}
                </button>
              </div>

              {knowledgeError && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">{knowledgeError}</div>
              )}

              {(isGeneratingKnowledge || knowledgeLoadingCache) && !knowledge && (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
              )}

              {knowledge ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div>
                    <h5 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
                      Key Concepts
                    </h5>
                    <div className="grid gap-3 md:grid-cols-2">
                      {knowledge.concepts?.map((c: any, i: number) => (
                        <div key={i} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                          <dt className="text-sm font-semibold text-neutral-900 mb-1.5">{c.name}</dt>
                          <dd className="text-sm text-neutral-600 leading-relaxed">{c.explanation}</dd>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-neutral-100" />
                  <div>
                    <h5 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">2</span>
                      Interview Questions
                    </h5>
                    <div className="space-y-4">
                      {knowledge.interview_questions?.map((q: any, i: number) => (
                        <div key={i} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                          <p className="font-medium text-neutral-900 mb-3 text-sm">Q{i + 1}: {q.question}</p>
                          <div className="bg-white p-3.5 rounded-xl border border-neutral-100 text-sm text-neutral-600">
                            <span className="font-semibold text-neutral-800 block mb-1">Expected:</span>
                            {q.expected_answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : !isGeneratingKnowledge && !knowledgeLoadingCache && (
                <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
                  <BrainCircuit className="mx-auto h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm">Generate a guide to get concept explanations and interview questions.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Candidate Details ─────────────────────────────────────────────────────

function CandidateDetails() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = React.useState<Candidate | null>(null);
  const [candError, setCandError] = React.useState('');
  const [reports, setReports] = React.useState<InterviewReport[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [interviewNotes, setInterviewNotes] = React.useState('');
  const [reportError, setReportError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'report' | 'behavioral'>('report');
  const [behavioralNotes, setBehavioralNotes] = React.useState('');
  const [notesSaved, setNotesSaved] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    api(`/api/candidates/${id}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) { setCandError(data.error || 'Candidate not found'); return; }
        setCandidate(data);
      })
      .catch(() => setCandError('Failed to load candidate.'));

    api(`/api/candidates/${id}/reports`)
      .then(r => r.json())
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports([]));

    // Load behavioral notes from localStorage
    const saved = localStorage.getItem(`behavioral_${id}`);
    if (saved) setBehavioralNotes(saved);
  }, [id]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReport(true);
    setReportError('');
    try {
      const res = await api(`/api/candidates/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ notes: interviewNotes }),
      });
      const data = await res.json();
      if (!res.ok) { setReportError(data.error || 'Failed to generate report.'); return; }
      setReports(prev => [data, ...prev]);
      setInterviewNotes('');
    } catch {
      setReportError('Network error. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const saveBehavioralNotes = () => {
    localStorage.setItem(`behavioral_${id}`, behavioralNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  if (candError) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
        <ArrowLeft className="mr-1.5 h-4 w-4" />Dashboard
      </Link>
      <div className="glass-card p-8 text-center text-neutral-500">{candError}</div>
    </div>
  );

  if (!candidate) return (
    <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
  );

  const skills = parseJSON<string[]>(candidate.skills, []);
  const scoreColor = candidate.match_score >= 80 ? 'badge-green' : candidate.match_score >= 60 ? 'badge-yellow' : 'badge-red';

  // Extract social links from profile_text and profile_url
  const profileText = candidate.profile_text || '';
  const linkedinUrl = candidate.profile_url || (profileText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/)?.[0]) || null;
  const twitterUrl = profileText.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[\w]+/)?.[0] || null;
  const instagramUrl = profileText.match(/https?:\/\/(?:www\.)?instagram\.com\/[\w.]+/)?.[0] || null;
  const twitterHandle = profileText.match(/(?<![a-zA-Z0-9])@([\w]+)(?=\s|$)/)?.[1] || null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/jobs/${candidate.job_id}`} className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
        <ArrowLeft className="mr-1.5 h-4 w-4" />Back to Requisition
      </Link>

      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-semibold text-neutral-900">{candidate.name}</h1>
              <span className={`badge ${scoreColor} text-sm`}>{candidate.match_score}% AI Match</span>
            </div>
            {candidate.experience && (
              <p className="text-sm text-neutral-600 leading-relaxed mb-3 max-w-2xl">{candidate.experience}</p>
            )}
            {candidate.profile_url && (
              <a href={candidate.profile_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
                View LinkedIn Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-neutral-100 grid md:grid-cols-2 gap-5">
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">AI Match Reasoning</h4>
            <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 px-4 py-3 rounded-xl">
              {candidate.match_reasoning || '—'}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">Extracted Skills</h4>
            {skills.length > 0
              ? <SkillsList skills={skills} variant="purple" max={12} />
              : <span className="text-sm text-neutral-400">None extracted</span>
            }
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setActiveTab('report')} className={`nav-pill ${activeTab === 'report' ? 'active' : ''}`}>
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />Interview Report
        </button>
        <button onClick={() => setActiveTab('behavioral')} className={`nav-pill ${activeTab === 'behavioral' ? 'active' : ''}`}>
          <Heart className="w-3.5 h-3.5 inline mr-1.5" />Behavioral & Socials
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>

          {activeTab === 'report' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 h-fit lg:sticky lg:top-[72px]">
                <h4 className="font-medium text-neutral-900 mb-5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Interview Report Generator
                </h4>
                {reportError && (
                  <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{reportError}</div>
                )}
                <form onSubmit={handleGenerateReport}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Raw Interview Notes</label>
                    <textarea
                      rows={8}
                      required
                      value={interviewNotes}
                      onChange={e => setInterviewNotes(e.target.value)}
                      className="input-field resize-none"
                      placeholder="Paste your rough notes — e.g. Strong in React, struggled with system design, good communication..."
                    />
                  </div>
                  <button type="submit" disabled={isGeneratingReport} className="btn-primary w-full">
                    {isGeneratingReport && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    {isGeneratingReport ? 'Generating Report...' : 'Generate Structured Report'}
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-medium text-neutral-900 mb-5">
                  {reports.length > 0 ? `${reports.length} Report${reports.length !== 1 ? 's' : ''}` : 'Interview Reports'}
                </h4>
                {reports.length === 0 ? (
                  <div className="py-14 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                    <FileText className="mx-auto h-8 w-8 mb-3 opacity-20" />
                    <p className="text-sm">No reports yet. Generate one from the left.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report, i) => {
                      const rec = report.recommendation.toLowerCase();
                      const recColor = rec.includes('proceed') || rec.includes('hire') || rec.includes('recommend') ? 'badge-green' : rec.includes('reject') || rec.includes('not recommend') ? 'badge-red' : 'badge-yellow';
                      const recLabel = rec.includes('proceed') || rec.includes('hire') || rec.includes('recommend') ? 'Proceed' : rec.includes('reject') ? 'Reject' : 'Hold';
                      return (
                        <motion.div key={report.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-neutral-400 font-mono">
                              {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className={`badge ${recColor}`}>{recLabel}</span>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-emerald-50/60 border border-emerald-100/60 px-4 py-3 rounded-xl">
                              <h5 className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                                <CheckCircle className="h-3.5 w-3.5" />Strengths
                              </h5>
                              <p className="text-sm text-emerald-900/80 leading-relaxed whitespace-pre-wrap">{report.strengths}</p>
                            </div>
                            <div className="bg-red-50/60 border border-red-100/60 px-4 py-3 rounded-xl">
                              <h5 className="text-xs font-semibold text-red-800 flex items-center gap-1.5 mb-1.5">
                                <XCircle className="h-3.5 w-3.5" />Areas of Concern
                              </h5>
                              <p className="text-sm text-red-900/80 leading-relaxed whitespace-pre-wrap">{report.weaknesses}</p>
                            </div>
                            <div className="bg-blue-50/60 border border-blue-100/60 px-4 py-3 rounded-xl">
                              <h5 className="text-xs font-semibold text-blue-800 flex items-center gap-1.5 mb-1.5">
                                <CheckCircle className="h-3.5 w-3.5" />Recommendation
                              </h5>
                              <p className="text-sm text-blue-900/80 leading-relaxed whitespace-pre-wrap">{report.recommendation}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'behavioral' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Social Links */}
              <div className="glass-card p-6">
                <h4 className="font-medium text-neutral-900 mb-5 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Social Profiles
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-neutral-700">LinkedIn</span>
                    </div>
                    {linkedinUrl ? (
                      <button onClick={() => window.open(linkedinUrl, '_blank', 'noopener,noreferrer')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View Profile <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Not found in profile</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <Twitter className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-medium text-neutral-700">X / Twitter</span>
                    </div>
                    {twitterUrl ? (
                      <button onClick={() => window.open(twitterUrl, '_blank', 'noopener,noreferrer')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View Profile <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : twitterHandle ? (
                      <button onClick={() => window.open(`https://x.com/${twitterHandle}`, '_blank', 'noopener,noreferrer')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        @{twitterHandle} <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Not found in profile</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="text-sm font-medium text-neutral-700">Instagram</span>
                    </div>
                    {instagramUrl ? (
                      <button onClick={() => window.open(instagramUrl, '_blank', 'noopener,noreferrer')} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View Profile <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Not found in profile</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-3">Links extracted from profile text. Add them manually in the profile if missing.</p>
              </div>

              {/* Cultural Fit Notes */}
              <div className="glass-card p-6">
                <h4 className="font-medium text-neutral-900 mb-5 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Cultural Fit & Behavioral Notes
                </h4>
                <textarea
                  rows={8}
                  value={behavioralNotes}
                  onChange={e => { setBehavioralNotes(e.target.value); setNotesSaved(false); }}
                  className="input-field resize-none mb-4"
                  placeholder="Notes on cultural fit, communication style, team dynamics, enthusiasm, red flags, etc..."
                />
                <button onClick={saveBehavioralNotes} className="btn-primary w-full">
                  {notesSaved ? <><Check className="mr-2 h-4 w-4" />Saved!</> : 'Save Notes'}
                </button>
                <p className="text-xs text-neutral-400 mt-2 text-center">Saved locally to this browser.</p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/candidates/:id" element={<CandidateDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
