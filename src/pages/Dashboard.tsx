import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, XCircle, Loader2, Clock, Users, TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api, safeJson, parseJSON } from '../lib/api';
import { SkillsList } from '../components/shared';
import type { Job } from '../types';

export function Dashboard() {
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
      const data = await safeJson(res);
      if (!res.ok) { setCreateError(data.error || 'Failed to create job.'); return; }
      setJobs(prev => [data, ...prev]);
      setIsCreating(false);
      setNewJobTitle('');
      setNewJobDesc('');
      navigate(`/jobs/${data.public_id}`);
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
                <Link to={`/jobs/${job.public_id}`} className="block group h-full">
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
                    {/* Candidate count and top match */}
                    {(job.candidate_count !== undefined && job.candidate_count > 0) && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                          <Users className="h-3.5 w-3.5 opacity-50" />
                          {job.candidate_count} candidate{job.candidate_count !== 1 ? 's' : ''}
                        </span>
                        {job.top_match_score !== undefined && job.top_match_score > 0 && (
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <TrendingUp className="h-3.5 w-3.5 opacity-50" />
                            Top: {job.top_match_score}%
                          </span>
                        )}
                      </div>
                    )}
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
