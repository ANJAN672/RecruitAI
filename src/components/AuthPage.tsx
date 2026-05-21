import React from 'react';
import { Briefcase, Loader2, Eye, EyeOff, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { GitHubIcon, GoogleIcon, PasswordRules, isPasswordValid } from './shared';
import { api } from '../lib/api';
import type { AppConfig } from '../types';

export function AuthPage() {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState<'recruiter' | 'candidate'>('recruiter');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [config, setConfig] = React.useState<AppConfig>({ github: false, google: false });

  const isSignup = mode === 'signup';
  const passwordValid = isPasswordValid(password);

  React.useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {});
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
        const { data: authData, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;

        if (authData.user) {
          await api('/api/profile', {
            method: 'POST',
            body: JSON.stringify({ full_name: fullName, role }),
          });
        }

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
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">{error}</div>
              )}
              {successMsg && (
                <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700">{successMsg}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="input-field"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">I am a</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRole('recruiter')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                            role === 'recruiter'
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                          }`}
                        >
                          <Briefcase className="w-4 h-4" />
                          Recruiter
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('candidate')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                            role === 'candidate'
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          Candidate
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
