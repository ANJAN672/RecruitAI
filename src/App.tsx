import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, Briefcase, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { JobDetails } from './pages/JobDetails';
import { CandidateDetails } from './pages/CandidateDetails';
import { CandidatePortal } from './pages/CandidatePortal';
import { api } from './lib/api';

function RoleSelector() {
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = React.useState<'recruiter' | 'candidate' | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await api('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          role: selected,
        }),
      });
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to save role. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 bg-neutral-900 rounded-2xl flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">RecruitAI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="glass-card p-8">
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Welcome to RecruitAI</h1>
            <p className="text-sm text-neutral-500 mb-6">How will you be using the platform?</p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSelected('recruiter')}
                className={`flex flex-col items-center gap-3 px-4 py-6 rounded-2xl border-2 text-sm font-medium transition-all ${
                  selected === 'recruiter'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:shadow-sm'
                }`}
              >
                <Briefcase className="w-7 h-7" />
                <span className="font-semibold text-base">Recruiter</span>
                <span className={`text-xs ${selected === 'recruiter' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  Source, screen & submit candidates
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelected('candidate')}
                className={`flex flex-col items-center gap-3 px-4 py-6 rounded-2xl border-2 text-sm font-medium transition-all ${
                  selected === 'candidate'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:shadow-sm'
                }`}
              >
                <Users className="w-7 h-7" />
                <span className="font-semibold text-base">Candidate</span>
                <span className={`text-xs ${selected === 'candidate' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  Track your applications & status
                </span>
              </button>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selected || saving}
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              {saving ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
    </div>
  );

  if (!user) return <AuthPage />;

  if (!profile) return <RoleSelector />;

  const isCandidate = profile.role === 'candidate';

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main>
        <Routes>
          {isCandidate ? (
            <>
              <Route path="/" element={<CandidatePortal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/candidates/:id" element={<CandidateDetails />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
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
