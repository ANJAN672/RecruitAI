import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Plus, ArrowLeft, XCircle, Clock, ChevronRight,
  BrainCircuit, Loader2, RefreshCw, Download, Upload,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api, safeJson, parseJSON } from '../lib/api';
import { SkillsList, scoreColorClass, RankBadge } from '../components/shared';
import { SourcingTab } from '../components/SourcingTab';
import { MarketIntelligenceTab } from '../components/MarketIntelligenceTab';
import type { Candidate, CandidateSubmission } from '../types';
import {
  SUBMISSION_STATUSES, SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS,
} from '../types';

export function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = React.useState<any>(null);
  const [jobError, setJobError] = React.useState('');
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = React.useState('candidates');
  const [knowledge, setKnowledge] = React.useState<any>(null);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = React.useState(false);
  const [knowledgeError, setKnowledgeError] = React.useState('');
  const [knowledgeLoadingCache, setKnowledgeLoadingCache] = React.useState(false);

  // Single candidate form
  const [isAddingCandidate, setIsAddingCandidate] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState('');
  const [candidateEmail, setCandidateEmail] = React.useState('');
  const [candidateUrl, setCandidateUrl] = React.useState('');
  const [candidateTwitter, setCandidateTwitter] = React.useState('');
  const [candidateProfile, setCandidateProfile] = React.useState('');
  const [isIngesting, setIsIngesting] = React.useState(false);
  const [ingestError, setIngestError] = React.useState('');

  // Bulk parsing
  const [showBulk, setShowBulk] = React.useState(false);
  const [bulkProfiles, setBulkProfiles] = React.useState('');
  const [bulkProcessing, setBulkProcessing] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState({ done: 0, total: 0 });
  const [bulkError, setBulkError] = React.useState('');

  // Submissions
  const [submissions, setSubmissions] = React.useState<Record<number, CandidateSubmission>>({});

  // Export
  const [exporting, setExporting] = React.useState(false);

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

    api(`/api/jobs/${id}/submissions`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<number, CandidateSubmission> = {};
          for (const s of data) map[s.candidate_id] = s;
          setSubmissions(map);
        }
      })
      .catch(() => {});
  }, [id]);

  // Knowledge cache
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

  const generateKnowledge = async () => {
    setIsGeneratingKnowledge(true);
    setKnowledgeError('');
    try {
      const res = await api(`/api/jobs/${id}/knowledge`, { method: 'POST' });
      const data = await safeJson(res);
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
        body: JSON.stringify({ name: candidateName, email: candidateEmail, profile_url: candidateUrl, twitter_url: candidateTwitter, profile_text: candidateProfile }),
      });
      const data = await safeJson(res);
      if (!res.ok) { setIngestError(data.error || 'Failed to ingest candidate.'); return; }
      setCandidates(prev => [...prev, data].sort((a, b) => b.match_score - a.match_score));
      setIsAddingCandidate(false);
      setCandidateName(''); setCandidateEmail(''); setCandidateUrl(''); setCandidateTwitter(''); setCandidateProfile('');
    } catch {
      setIngestError('Network error. Please try again.');
    } finally {
      setIsIngesting(false);
    }
  };

  // Bulk parsing
  const handleBulkParse = async () => {
    const profiles = bulkProfiles.split(/\n---\n/).map(p => p.trim()).filter(Boolean);
    if (profiles.length === 0) { setBulkError('Paste profiles separated by --- on a new line.'); return; }
    if (profiles.length > 20) { setBulkError('Maximum 20 profiles per batch.'); return; }

    setBulkProcessing(true);
    setBulkError('');
    setBulkProgress({ done: 0, total: profiles.length });

    const results: Candidate[] = [];
    for (const profileText of profiles) {
      const nameMatch = profileText.match(/^(.+?)[\n\r]/);
      const name = nameMatch ? nameMatch[1].trim().slice(0, 100) : `Candidate ${results.length + 1}`;

      try {
        const res = await api(`/api/jobs/${id}/candidates`, {
          method: 'POST',
          body: JSON.stringify({ name, profile_url: '', twitter_url: '', profile_text: profileText }),
        });
        const data = await safeJson(res);
        if (res.ok) results.push(data);
      } catch {
        // Continue with remaining profiles
      }
      setBulkProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setCandidates(prev => [...prev, ...results].sort((a, b) => b.match_score - a.match_score));
    setBulkProcessing(false);
    setShowBulk(false);
    setBulkProfiles('');
  };

  // Update submission status
  const updateSubmission = async (candidateId: number, status: CandidateSubmission['status']) => {
    try {
      const res = await api(`/api/jobs/${id}/submissions`, {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId, status }),
      });
      const data = await safeJson(res);
      if (res.ok) {
        setSubmissions(prev => ({ ...prev, [candidateId]: data }));
      }
    } catch {
      // silently fail
    }
  };

  // Excel export
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api(`/api/jobs/${id}/candidates/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates-${job?.title?.replace(/[^a-zA-Z0-9]/g, '_') || id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback error
    } finally {
      setExporting(false);
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
  const top10 = candidates.slice(0, 10);

  const tabs = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'sourcing', label: 'Sourcing' },
    { key: 'overview', label: 'JD Overview' },
    { key: 'interview_guide', label: 'Interview Guide' },
    { key: 'market_intelligence', label: 'Market Intelligence' },
    { key: 'tracker', label: 'Submission Tracker' },
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
              {/* Top 10 Matches Summary */}
              {top10.length > 0 && (
                <div className="glass-card p-5">
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Top {Math.min(top10.length, 10)} Matches</h4>
                  <div className="flex flex-wrap gap-2">
                    {top10.map((c, i) => (
                      <Link key={c.id} to={`/candidates/${c.id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100">
                        <RankBadge rank={i + 1} />
                        <span className="text-sm font-medium text-neutral-800 max-w-[120px] truncate">{c.name}</span>
                        <span className={`badge text-xs ${scoreColorClass(c.match_score)}`}>{c.match_score}%</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h4 className="font-medium text-neutral-900">
                  {candidates.length > 0 ? `${candidates.length} Candidate${candidates.length !== 1 ? 's' : ''} — Ranked by Match` : 'Candidates'}
                </h4>
                <div className="flex items-center gap-2">
                  {candidates.length > 0 && (
                    <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">
                      {exporting ? <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" /> : <Download className="mr-2 h-3.5 w-3.5" />}
                      Export Excel
                    </button>
                  )}
                  <button onClick={() => setShowBulk(o => !o)} className="btn-secondary text-sm">
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Bulk Import
                  </button>
                  <button onClick={() => { setIsAddingCandidate(o => !o); setIngestError(''); }} className="btn-primary">
                    {isAddingCandidate ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {isAddingCandidate ? 'Cancel' : 'Add Candidate'}
                  </button>
                </div>
              </div>

              {/* Bulk Import */}
              <AnimatePresence>
                {showBulk && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="glass-card p-6">
                      <h5 className="font-medium text-neutral-900 mb-2 text-sm">Bulk Profile Import</h5>
                      <p className="text-xs text-neutral-500 mb-4">Paste multiple profiles separated by <code className="bg-neutral-100 px-1.5 py-0.5 rounded">---</code> on a new line. First line of each profile is used as the candidate name. Max 20 per batch.</p>
                      {bulkError && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{bulkError}</div>}
                      <textarea
                        rows={10}
                        value={bulkProfiles}
                        onChange={e => setBulkProfiles(e.target.value)}
                        className="input-field resize-none font-mono text-xs mb-4"
                        placeholder={`John Doe\nSenior React Developer with 5 years...\n---\nJane Smith\nFull Stack Engineer specializing in...`}
                      />
                      {bulkProcessing && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>Processing profiles...</span>
                            <span>{bulkProgress.done}/{bulkProgress.total}</span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div className="bg-neutral-900 h-2 rounded-full transition-all duration-300" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowBulk(false)} className="btn-secondary">Cancel</button>
                        <button onClick={handleBulkParse} disabled={bulkProcessing || !bulkProfiles.trim()} className="btn-primary">
                          {bulkProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                          {bulkProcessing ? `Processing ${bulkProgress.done}/${bulkProgress.total}...` : 'Import & Score All'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Single Candidate Form */}
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
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email <span className="text-neutral-400">(for candidate portal)</span></label>
                            <input type="email" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} className="input-field" placeholder="candidate@email.com" />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">LinkedIn URL <span className="text-neutral-400">(optional)</span></label>
                            <input type="url" value={candidateUrl} onChange={e => setCandidateUrl(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/..." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1.5">X / Twitter URL <span className="text-neutral-400">(optional)</span></label>
                            <input type="url" value={candidateTwitter} onChange={e => setCandidateTwitter(e.target.value)} className="input-field" placeholder="https://x.com/username" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Resume / Profile Text *</label>
                          <textarea
                            required rows={6} value={candidateProfile} onChange={e => setCandidateProfile(e.target.value)}
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

              {/* Candidate List */}
              <div className="space-y-3">
                {candidates.length === 0 && !isAddingCandidate && (
                  <div className="py-16 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                    <Users className="mx-auto h-9 w-9 mb-3 opacity-20" />
                    <p className="text-sm">No candidates yet. Add one to start evaluating.</p>
                  </div>
                )}
                {candidates.map((candidate, i) => {
                  const sub = submissions[candidate.id];
                  return (
                    <motion.div key={candidate.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link to={`/candidates/${candidate.id}`} className="block group">
                        <div className="glass-card p-5 transition-all duration-200 hover:shadow-md hover:border-neutral-200">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                {i < 10 && <RankBadge rank={i + 1} />}
                                <h3 className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">{candidate.name}</h3>
                                <span className={`badge flex-shrink-0 ${scoreColorClass(candidate.match_score)}`}>
                                  {candidate.match_score}% match
                                </span>
                                {sub && (
                                  <span className={`${SUBMISSION_STATUS_COLORS[sub.status]} text-xs flex-shrink-0`}>
                                    {SUBMISSION_STATUS_LABELS[sub.status]}
                                  </span>
                                )}
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
                  );
                })}
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

          {/* ── Submission Tracker ── */}
          {activeTab === 'tracker' && (
            <div className="glass-card p-7">
              <h4 className="text-lg font-medium text-neutral-900 mb-2">Submission Tracker</h4>
              <p className="text-sm text-neutral-500 mb-6">Track candidate pipeline status from sourcing to joining.</p>

              {candidates.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
                  <Users className="mx-auto h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm">Add candidates first to track their submission status.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map(candidate => {
                    const sub = submissions[candidate.id];
                    const currentStatus = sub?.status || 'sourced';
                    return (
                      <div key={candidate.id} className="p-4 border border-neutral-100 rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Link to={`/candidates/${candidate.id}`} className="font-medium text-sm text-neutral-900 hover:text-blue-600 transition-colors">
                              {candidate.name}
                            </Link>
                            <span className={`badge text-xs ${scoreColorClass(candidate.match_score)}`}>{candidate.match_score}%</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {SUBMISSION_STATUSES.map(status => (
                            <button
                              key={status}
                              onClick={() => updateSubmission(candidate.id, status)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                                currentStatus === status
                                  ? 'bg-neutral-900 text-white'
                                  : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                              }`}
                            >
                              {SUBMISSION_STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
