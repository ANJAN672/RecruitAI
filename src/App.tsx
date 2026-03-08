import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileText, Search, Plus, ArrowLeft, CheckCircle, XCircle, Clock, BrainCircuit, ChevronRight, Copy, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
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

// --- Components ---

function Dashboard() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newJobTitle, setNewJobTitle] = React.useState('');
  const [newJobDesc, setNewJobDesc] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => setJobs(data));
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newJobTitle, description: newJobDesc })
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs([newJob, ...jobs]);
        setIsCreating(false);
        setNewJobTitle('');
        setNewJobDesc('');
        navigate(`/jobs/${newJob.id}`);
      }
    } catch (error) {
      console.error("Failed to create job", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Requisitions</h1>
          <p className="text-neutral-500 mt-2 text-sm">Manage your open roles and AI-powered sourcing.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary"
        >
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
            className="overflow-hidden mb-10"
          >
            <div className="glass-card p-8">
              <h3 className="text-xl font-medium text-neutral-900 mb-6">Create New Requisition</h3>
              <form onSubmit={handleCreateJob} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={newJobTitle}
                    onChange={e => setNewJobTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Senior Backend Engineer"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">Job Description</label>
                  <textarea
                    id="description"
                    required
                    rows={6}
                    value={newJobDesc}
                    onChange={e => setNewJobDesc(e.target.value)}
                    className="input-field resize-none"
                    placeholder="Paste the full job description here..."
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    {isLoading ? 'Analyzing...' : 'Create & Analyze'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.length === 0 && !isCreating && (
          <div className="col-span-full py-20 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
            <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>No requisitions created yet. Click "New Requisition" to get started.</p>
          </div>
        )}
        {jobs.map((job, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={job.id}
          >
            <Link to={`/jobs/${job.id}`} className="block group">
              <div className="glass-card p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="badge badge-green">Active</div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                <div className="space-y-2 mt-4">
                  <p className="flex items-center text-sm text-neutral-500">
                    <Briefcase className="mr-2 h-4 w-4 opacity-50" />
                    <span className="truncate">{job.role || 'Role not extracted'}</span>
                  </p>
                  <p className="flex items-center text-sm text-neutral-500">
                    <Clock className="mr-2 h-4 w-4 opacity-50" />
                    <span className="truncate">{job.experience || 'Experience not specified'}</span>
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = React.useState<Job | null>(null);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [booleanSearch, setBooleanSearch] = React.useState('');
  const [knowledge, setKnowledge] = React.useState<any>(null);
  const [isGeneratingSearch, setIsGeneratingSearch] = React.useState(false);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = React.useState(false);
  
  // Candidate Ingestion State
  const [isAddingCandidate, setIsAddingCandidate] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState('');
  const [candidateUrl, setCandidateUrl] = React.useState('');
  const [candidateProfile, setCandidateProfile] = React.useState('');
  const [isIngesting, setIsIngesting] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => setJob(data));
      
    fetch(`/api/jobs/${id}/candidates`)
      .then(res => res.json())
      .then(data => setCandidates(data));
  }, [id]);

  const generateBooleanSearch = async () => {
    setIsGeneratingSearch(true);
    try {
      const res = await fetch(`/api/jobs/${id}/boolean-search`);
      const data = await res.json();
      setBooleanSearch(data.query);
    } catch (error) {
      console.error("Failed to generate boolean search", error);
    } finally {
      setIsGeneratingSearch(false);
    }
  };

  const generateKnowledge = async () => {
    setIsGeneratingKnowledge(true);
    try {
      const res = await fetch(`/api/jobs/${id}/knowledge`);
      const data = await res.json();
      setKnowledge(data);
    } catch (error) {
      console.error("Failed to generate knowledge", error);
    } finally {
      setIsGeneratingKnowledge(false);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    try {
      const res = await fetch(`/api/jobs/${id}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName,
          profile_url: candidateUrl,
          profile_text: candidateProfile
        })
      });
      if (res.ok) {
        const newCandidate = await res.json();
        setCandidates([newCandidate, ...candidates].sort((a, b) => b.match_score - a.match_score));
        setIsAddingCandidate(false);
        setCandidateName('');
        setCandidateUrl('');
        setCandidateProfile('');
      }
    } catch (error) {
      console.error("Failed to add candidate", error);
    } finally {
      setIsIngesting(false);
    }
  };

  if (!job) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
    </div>
  );

  const hardSkills = JSON.parse(job.hard_skills || '[]');
  const softSkills = JSON.parse(job.soft_skills || '[]');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requisitions
        </Link>
      </div>

      <div className="glass-card p-8 mb-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 mb-2">{job.title}</h1>
            <p className="text-neutral-500 flex items-center gap-3 text-sm">
              <span className="flex items-center"><Briefcase className="mr-1.5 h-4 w-4" /> {job.role}</span>
              <span className="text-neutral-300">•</span>
              <span className="flex items-center"><Clock className="mr-1.5 h-4 w-4" /> {job.experience}</span>
            </p>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Hard Skills</h4>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill: string, i: number) => (
                  <span key={i} className="badge badge-blue">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2">
        {['overview', 'candidates', 'sourcing', 'interview_guide'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-pill ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="glass-card p-8">
              <h4 className="text-lg font-medium text-neutral-900 mb-6">Original Job Description</h4>
              <div className="prose max-w-none text-sm text-neutral-600 whitespace-pre-wrap font-sans leading-relaxed">
                {job.description}
              </div>
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-medium text-neutral-900">Ranked Candidates</h4>
                <button
                  onClick={() => setIsAddingCandidate(!isAddingCandidate)}
                  className="btn-primary"
                >
                  {isAddingCandidate ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isAddingCandidate ? 'Cancel' : 'Add Candidate'}
                </button>
              </div>

              <AnimatePresence>
                {isAddingCandidate && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-8 bg-neutral-50/50">
                      <form onSubmit={handleAddCandidate} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Candidate Name</label>
                            <input type="text" required value={candidateName} onChange={e => setCandidateName(e.target.value)} className="input-field" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">LinkedIn URL (Optional)</label>
                            <input type="url" value={candidateUrl} onChange={e => setCandidateUrl(e.target.value)} className="input-field" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">Profile Text / Resume Content</label>
                          <textarea required rows={5} value={candidateProfile} onChange={e => setCandidateProfile(e.target.value)} className="input-field resize-none" placeholder="Paste the candidate's resume or LinkedIn profile text here..." />
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={isIngesting} className="btn-primary">
                            {isIngesting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            {isIngesting ? 'Analyzing & Scoring...' : 'Ingest Candidate'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-4">
                {candidates.length === 0 && (
                  <div className="py-16 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                    <Users className="mx-auto h-10 w-10 mb-3 opacity-20" />
                    <p>No candidates added yet.</p>
                  </div>
                )}
                {candidates.map((candidate, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={candidate.id}
                  >
                    <Link to={`/candidates/${candidate.id}`} className="block group">
                      <div className="glass-card p-6 transition-all duration-200 hover:border-neutral-300 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-neutral-900 group-hover:text-blue-600 transition-colors">{candidate.name}</h3>
                            <span className={`badge ${
                              candidate.match_score >= 80 ? 'badge-green' :
                              candidate.match_score >= 60 ? 'badge-yellow' :
                              'badge-red'
                            }`}>
                              {candidate.match_score}% Match
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 opacity-50" />
                            <span className="line-clamp-1">{candidate.experience}</span>
                          </p>
                        </div>
                        <div className="flex-1 text-sm text-neutral-600 bg-neutral-50 p-4 rounded-2xl line-clamp-2">
                          <span className="font-medium text-neutral-900 mr-2">AI Note:</span>
                          {candidate.match_reasoning}
                        </div>
                        <div className="hidden md:flex items-center text-neutral-300 group-hover:text-blue-600 transition-colors">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sourcing' && (
            <div className="glass-card p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h4 className="text-xl font-medium text-neutral-900">Boolean Search Builder</h4>
                  <p className="text-sm text-neutral-500 mt-1">Generate optimized queries for LinkedIn and Naukri.</p>
                </div>
                <button
                  onClick={generateBooleanSearch}
                  disabled={isGeneratingSearch}
                  className="btn-primary"
                >
                  {isGeneratingSearch ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
                  {isGeneratingSearch ? 'Generating...' : 'Generate Query'}
                </button>
              </div>
              
              {booleanSearch ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-neutral-900 rounded-2xl p-6 relative group">
                  <code className="text-emerald-400 text-sm font-mono break-all leading-relaxed">
                    {booleanSearch}
                  </code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(booleanSearch)}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                  <Search className="mx-auto h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm">Click generate to create an optimized boolean search string.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interview_guide' && (
            <div className="glass-card p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h4 className="text-xl font-medium text-neutral-900">Knowledge Assistant</h4>
                  <p className="text-sm text-neutral-500 mt-1">Understand technical concepts and get interview questions.</p>
                </div>
                {!knowledge && (
                  <button
                    onClick={generateKnowledge}
                    disabled={isGeneratingKnowledge}
                    className="btn-primary"
                  >
                    {isGeneratingKnowledge ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    {isGeneratingKnowledge ? 'Analyzing...' : 'Generate Guide'}
                  </button>
                )}
              </div>

              {knowledge ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                  <div>
                    <h5 className="text-lg font-medium text-neutral-900 mb-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm font-bold">1</div>
                      Key Concepts Explained
                    </h5>
                    <div className="grid gap-4 md:grid-cols-2">
                      {knowledge.concepts?.map((c: any, i: number) => (
                        <div key={i} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                          <dt className="text-sm font-semibold text-neutral-900 mb-2">{c.name}</dt>
                          <dd className="text-sm text-neutral-600 leading-relaxed">{c.explanation}</dd>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-px bg-neutral-100"></div>
                  <div>
                    <h5 className="text-lg font-medium text-neutral-900 mb-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 text-sm font-bold">2</div>
                      Suggested Interview Questions
                    </h5>
                    <div className="space-y-4">
                      {knowledge.interview_questions?.map((q: any, i: number) => (
                        <div key={i} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                          <p className="text-base font-medium text-neutral-900 mb-3">Q: {q.question}</p>
                          <div className="bg-white p-4 rounded-xl border border-neutral-100 text-sm text-neutral-600">
                            <span className="font-semibold text-neutral-900 block mb-1">Expected Answer:</span> 
                            {q.expected_answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                  <BrainCircuit className="mx-auto h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm">Generate a guide to get simple explanations of technical concepts.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function CandidateDetails() {
  const { id } = useParams();
  const [candidate, setCandidate] = React.useState<Candidate | null>(null);
  const [reports, setReports] = React.useState<InterviewReport[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [interviewNotes, setInterviewNotes] = React.useState('');

  React.useEffect(() => {
    fetch(`/api/candidates/${id}`)
      .then(res => res.json())
      .then(data => setCandidate(data));
      
    fetch(`/api/candidates/${id}/reports`)
      .then(res => res.json())
      .then(data => setReports(data));
  }, [id]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReport(true);
    try {
      const res = await fetch(`/api/candidates/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: interviewNotes })
      });
      if (res.ok) {
        const newReport = await res.json();
        setReports([newReport, ...reports]);
        setInterviewNotes('');
      }
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!candidate) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
    </div>
  );

  const skills = JSON.parse(candidate.skills || '[]');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-8">
        <Link to={`/jobs/${candidate.job_id}`} className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Requisition
        </Link>
      </div>

      <div className="glass-card p-8 mb-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 mb-2">{candidate.name}</h1>
            <p className="text-neutral-500 text-sm max-w-2xl leading-relaxed">{candidate.experience}</p>
            {candidate.profile_url && (
              <a href={candidate.profile_url} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
                View Original Profile ↗
              </a>
            )}
          </div>
          <div className="flex flex-col items-start md:items-end gap-4">
            <span className={`badge px-4 py-2 text-sm ${
              candidate.match_score >= 80 ? 'badge-green' :
              candidate.match_score >= 60 ? 'badge-yellow' :
              'badge-red'
            }`}>
              {candidate.match_score}% AI Match
            </span>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">AI Match Reasoning</h4>
            <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-2xl">{candidate.match_reasoning}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Extracted Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span key={i} className="badge badge-purple">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interview Report Generator */}
        <div className="glass-card p-8 h-fit sticky top-8">
          <h4 className="text-xl font-medium text-neutral-900 mb-6 flex items-center">
            <FileText className="mr-3 h-5 w-5 text-blue-500" />
            Interview Report Generator
          </h4>
          <form onSubmit={handleGenerateReport}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Raw Interview Notes
              </label>
              <textarea
                rows={8}
                required
                value={interviewNotes}
                onChange={e => setInterviewNotes(e.target.value)}
                className="input-field resize-none"
                placeholder="Paste your rough notes here. E.g. Strong in React, struggled with system design, good communication..."
              />
            </div>
            <button
              type="submit"
              disabled={isGeneratingReport}
              className="btn-primary w-full"
            >
              {isGeneratingReport ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {isGeneratingReport ? 'Generating Report...' : 'Generate Structured Report'}
            </button>
          </form>
        </div>

        {/* Generated Reports */}
        <div className="space-y-6">
          <h4 className="text-xl font-medium text-neutral-900 mb-6">Past Interview Reports</h4>
          {reports.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
              <FileText className="mx-auto h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">No interview reports generated yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={report.id} 
                  className="glass-card p-6"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-mono text-neutral-400">{new Date(report.created_at).toLocaleDateString()}</span>
                    <span className={`badge ${
                      report.recommendation.toLowerCase().includes('proceed') || report.recommendation.toLowerCase().includes('hire')
                        ? 'badge-green'
                        : report.recommendation.toLowerCase().includes('reject')
                        ? 'badge-red'
                        : 'badge-yellow'
                    }`}>
                      {report.recommendation}
                    </span>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <h5 className="text-sm font-semibold text-emerald-800 flex items-center mb-2">
                        <CheckCircle className="mr-2 h-4 w-4" /> Strengths
                      </h5>
                      <p className="text-sm text-emerald-900/80 leading-relaxed whitespace-pre-wrap">{report.strengths}</p>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                      <h5 className="text-sm font-semibold text-red-800 flex items-center mb-2">
                        <XCircle className="mr-2 h-4 w-4" /> Weaknesses
                      </h5>
                      <p className="text-sm text-red-900/80 leading-relaxed whitespace-pre-wrap">{report.weaknesses}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FAFAFA] font-sans text-neutral-900 selection:bg-blue-100 selection:text-blue-900">
        <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex-shrink-0 flex items-center group">
                  <div className="w-8 h-8 bg-neutral-900 rounded-xl flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                    <Briefcase className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold tracking-tight">RecruitAI</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/candidates/:id" element={<CandidateDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
