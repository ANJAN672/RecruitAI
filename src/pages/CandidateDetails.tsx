import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Briefcase, FileText, ArrowLeft, Loader2, CheckCircle, XCircle,
  Heart, BrainCircuit, Globe, ExternalLink, Linkedin, Twitter, Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api, safeJson, parseJSON } from '../lib/api';
import { SkillsList, scoreColorClass } from '../components/shared';
import type { Candidate, InterviewReport } from '../types';

export function CandidateDetails() {
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
  const [notesSaving, setNotesSaving] = React.useState(false);

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

    // Load behavioral notes from API
    api(`/api/candidates/${id}/notes`)
      .then(r => r.json())
      .then(data => { if (data.notes) setBehavioralNotes(data.notes); })
      .catch(() => {
        // Fallback: load from localStorage for backward compatibility
        const saved = localStorage.getItem(`behavioral_${id}`);
        if (saved) setBehavioralNotes(saved);
      });
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
      const data = await safeJson(res);
      if (!res.ok) { setReportError(data.error || 'Failed to generate report.'); return; }
      setReports(prev => [data, ...prev]);
      setInterviewNotes('');
    } catch {
      setReportError('Network error. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const saveBehavioralNotes = async () => {
    setNotesSaving(true);
    try {
      await api(`/api/candidates/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: behavioralNotes }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      // Fallback to localStorage
      localStorage.setItem(`behavioral_${id}`, behavioralNotes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setNotesSaving(false);
    }
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
  const scoreColor = scoreColorClass(candidate.match_score);

  const profileText = candidate.profile_text || '';
  const linkedinUrl = candidate.profile_url || (profileText.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/)?.[0]) || null;
  const twitterUrl = candidate.twitter_url || profileText.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[\w]+/)?.[0] || null;
  const twitterHandle = profileText.match(/(?<![a-zA-Z0-9])@([\w]+)(?=\s|$)/)?.[1] || null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/jobs/${(candidate as any).job_public_id || candidate.job_id}`} className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-6">
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
              {candidate.match_reasoning || '--'}
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
                      rows={8} required value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)}
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
            <div className="space-y-6">
              {candidate.behavioral_summary && (
                <div className="glass-card p-6">
                  <h4 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-purple-500" />
                    AI Behavioral Analysis
                  </h4>
                  <p className="text-sm text-neutral-700 leading-relaxed bg-purple-50/50 border border-purple-100/50 rounded-2xl px-4 py-3">
                    {candidate.behavioral_summary}
                  </p>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
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
                        <span className="text-xs text-neutral-400">Not provided</span>
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
                        <span className="text-xs text-neutral-400">Not provided</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-3">Add LinkedIn / X URLs when ingesting candidates for quick access.</p>
                </div>

                <div className="glass-card p-6">
                  <h4 className="font-medium text-neutral-900 mb-5 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Your Notes
                  </h4>
                  <textarea
                    rows={6}
                    value={behavioralNotes}
                    onChange={e => { setBehavioralNotes(e.target.value); setNotesSaved(false); }}
                    className="input-field resize-none mb-4"
                    placeholder="Notes on cultural fit, communication style, team dynamics, enthusiasm, red flags, etc..."
                  />
                  <button onClick={saveBehavioralNotes} disabled={notesSaving} className="btn-primary w-full">
                    {notesSaved ? <><Check className="mr-2 h-4 w-4" />Saved!</> : notesSaving ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Saving...</> : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
