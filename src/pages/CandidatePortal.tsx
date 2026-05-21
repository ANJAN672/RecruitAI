import React from 'react';
import { Briefcase, Clock, Loader2, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';
import { api } from '../lib/api';
import { scoreColorClass } from '../components/shared';
import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS } from '../types';
import type { SubmissionStatus } from '../types';

interface CandidateApplication {
  id: number;
  job_title: string;
  job_role: string;
  job_experience: string;
  match_score: number;
  match_reasoning: string;
  behavioral_summary: string;
  submission_status: SubmissionStatus | null;
  created_at: string;
}

export function CandidatePortal() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = React.useState<CandidateApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedApp, setSelectedApp] = React.useState<CandidateApplication | null>(null);

  React.useEffect(() => {
    api('/api/candidate-portal/applications')
      .then(r => r.json())
      .then(data => setApplications(Array.isArray(data) ? data : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  const displayName = profile?.full_name || user?.email || 'Candidate';

  const statusSteps: SubmissionStatus[] = ['sourced', 'screened', 'submitted', 'interview', 'offered', 'joined'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Welcome, {displayName}</h1>
        <p className="text-neutral-500 mt-1 text-sm">Track your applications and profile matches.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-neutral-300" /></div>
      ) : applications.length === 0 ? (
        <div className="py-20 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
          <FileText className="mx-auto h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm">No applications found yet. Your recruiter will add your profile to open positions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                className="w-full text-left glass-card p-5 transition-all hover:shadow-md hover:border-neutral-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <h3 className="font-medium text-neutral-900">{app.job_title}</h3>
                      <span className={`badge flex-shrink-0 ${scoreColorClass(app.match_score)}`}>
                        {app.match_score}% match
                      </span>
                      {app.submission_status && (
                        <span className={`${SUBMISSION_STATUS_COLORS[app.submission_status]} text-xs flex-shrink-0`}>
                          {SUBMISSION_STATUS_LABELS[app.submission_status]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      {app.job_role && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 opacity-50" />{app.job_role}</span>}
                      {app.job_experience && <span className="flex items-center gap-1"><Clock className="h-3 w-3 opacity-50" />{app.job_experience}</span>}
                      <span className="text-neutral-400">Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-neutral-300 flex-shrink-0 mt-1 transition-transform ${selectedApp?.id === app.id ? 'rotate-90' : ''}`} />
                </div>

                {/* Pipeline Progress */}
                {app.submission_status && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-1">
                      {statusSteps.map((step, si) => {
                        const currentIdx = statusSteps.indexOf(app.submission_status as SubmissionStatus);
                        const isActive = si <= currentIdx;
                        const isRejected = app.submission_status === 'rejected';
                        return (
                          <React.Fragment key={step}>
                            <div className={`flex-1 h-1.5 rounded-full transition-colors ${
                              isRejected ? 'bg-red-200' : isActive ? 'bg-emerald-400' : 'bg-neutral-100'
                            }`} />
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      {statusSteps.map(step => (
                        <span key={step} className="text-[10px] text-neutral-400">{SUBMISSION_STATUS_LABELS[step]}</span>
                      ))}
                    </div>
                  </div>
                )}
              </button>

              {/* Expanded Details */}
              {selectedApp?.id === app.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-5 mt-2 space-y-4">
                    {app.match_reasoning && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Match Analysis</h5>
                        <p className="text-sm text-neutral-700 bg-neutral-50 px-4 py-3 rounded-xl">{app.match_reasoning}</p>
                      </div>
                    )}
                    {app.behavioral_summary && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Behavioral Profile</h5>
                        <p className="text-sm text-neutral-700 bg-purple-50/50 px-4 py-3 rounded-xl">{app.behavioral_summary}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
