"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Briefcase,
  Users,
  Search,
  Plus,
  XCircle,
  ArrowLeft,
  Loader2,
  BrainCircuit,
  ChevronRight,
  Copy,
  Clock,
  ExternalLink,
  Globe,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

export default function JobDetails() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = React.useState<Job | null>(null);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [booleanSearch, setBooleanSearch] = React.useState("");
  const [knowledge, setKnowledge] = React.useState<{
    concepts?: { name: string; explanation: string }[];
    interview_questions?: { question: string; expected_answer: string }[];
  } | null>(null);
  const [isGeneratingSearch, setIsGeneratingSearch] = React.useState(false);
  const [isGeneratingKnowledge, setIsGeneratingKnowledge] = React.useState(false);

  const [isAddingCandidate, setIsAddingCandidate] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState("");
  const [candidateUrl, setCandidateUrl] = React.useState("");
  const [candidateProfile, setCandidateProfile] = React.useState("");
  const [isIngesting, setIsIngesting] = React.useState(false);

  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = React.useState(false);
  const resumeFileInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_PROFILE_WORDS = 2000;

  const countWords = (text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordCount = countWords(candidateProfile);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }

    setIsParsingResume(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/parse", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to parse resume");
      }
      const data = await res.json();
      let text = data.text ?? "";
      // Truncate to MAX_PROFILE_WORDS if the parsed text exceeds it
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (words.length > MAX_PROFILE_WORDS) {
        text = words.slice(0, MAX_PROFILE_WORDS).join(" ");
      }
      setCandidateProfile(text);
      setResumeFile(file);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to parse resume");
    } finally {
      setIsParsingResume(false);
      // Reset the input so the same file can be re-selected if needed
      if (resumeFileInputRef.current) {
        resumeFileInputRef.current.value = "";
      }
    }
  };

  React.useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => setJob(data));
    fetch(`/api/jobs/${id}/candidates`)
      .then((res) => res.json())
      .then((data) => setCandidates(Array.isArray(data) ? data : []));
    // Load saved boolean search if it exists
    fetch(`/api/jobs/${id}/boolean-search`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.query) setBooleanSearch(data.query); })
      .catch(() => {});
    // Load saved knowledge guide if it exists
    fetch(`/api/jobs/${id}/knowledge`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.concepts || data?.interview_questions) setKnowledge(data); })
      .catch(() => {});
  }, [id]);

  const generateBooleanSearch = async () => {
    setIsGeneratingSearch(true);
    try {
      const res = await fetch(`/api/jobs/${id}/boolean-search`);
      const data = await res.json();
      setBooleanSearch(data.query ?? "");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candidateName,
          profile_url: candidateUrl,
          profile_text: candidateProfile,
        }),
      });
      if (res.ok) {
        const newCandidate = await res.json();
        setCandidates(
          [newCandidate, ...candidates].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
        );
        setIsAddingCandidate(false);
        setCandidateName("");
        setCandidateUrl("");
        setCandidateProfile("");
        setResumeFile(null);
      }
    } catch (error) {
      console.error("Failed to add candidate", error);
    } finally {
      setIsIngesting(false);
    }
  };

  // Simplify a boolean query to just key terms for platform URLs
  // Boolean operators don't work in LinkedIn/Naukri URL params
  const simplifyForUrl = (query: string) => {
    return query
      .replace(/\(|\)/g, "")           // remove parentheses
      .replace(/\bAND\b/gi, " ")       // remove AND
      .replace(/\bOR\b/gi, " ")        // remove OR
      .replace(/\bNOT\b/gi, " ")       // remove NOT
      .replace(/"/g, "")               // remove quotes
      .replace(/\s+/g, " ")            // collapse whitespace
      .trim();
  };

  // Open candidate search on LinkedIn — use role title for reliable results
  const openLinkedInSearch = () => {
    // LinkedIn free search works best with simple role titles, not boolean
    const roleQuery = job?.role ?? "";
    const q = encodeURIComponent(roleQuery);
    window.open(`https://www.linkedin.com/search/results/people/?keywords=${q}&origin=GLOBAL_SEARCH_HEADER`, "_blank", "noopener,noreferrer");
  };

  // Open Naukri search — use slug-based URL format
  const openNaukriSearch = () => {
    const roleQuery = job?.role ?? "";
    const slug = roleQuery.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    window.open(`https://www.naukri.com/${slug}-jobs`, "_blank", "noopener,noreferrer");
  };

  // Google X-Ray search — this is where the full boolean query actually works
  const openGoogleXRay = () => {
    const query = booleanSearch || `${job?.role ?? ""} ${job?.experience ?? ""}`;
    const googleQuery = encodeURIComponent(`site:linkedin.com/in/ ${simplifyForUrl(query)}`);
    window.open(`https://www.google.com/search?q=${googleQuery}`, "_blank", "noopener,noreferrer");
  };
  const copyQuery = () => {
    navigator.clipboard.writeText(booleanSearch);
  };

  if (!job) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const hardSkills = JSON.parse(job.hard_skills || "[]") as string[];
  const softSkills = JSON.parse(job.soft_skills || "[]") as string[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requisitions
        </Link>
      </div>

      <div className="glass-card p-8 mb-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900 mb-2">{job.title}</h1>
            <p className="text-neutral-500 flex items-center gap-3 text-sm">
              <span className="flex items-center">
                <Briefcase className="mr-1.5 h-4 w-4" /> {job.role}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="flex items-center">
                <Clock className="mr-1.5 h-4 w-4" /> {job.experience}
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Hard Skills</h4>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill, i) => (
                  <span key={i} className="badge badge-blue">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2">
        {["overview", "candidates", "sourcing", "interview_guide"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-pill ${activeTab === tab ? "active" : ""}`}
          >
            {tab.replace("_", " ")}
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
          {activeTab === "overview" && (
            <div className="glass-card p-8">
              <h4 className="text-lg font-medium text-neutral-900 mb-6">Original Job Description</h4>
              <div className="prose max-w-none text-sm text-neutral-600 whitespace-pre-wrap font-sans leading-relaxed">
                {job.description}
              </div>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-xl font-medium text-neutral-900">Ranked Candidates</h4>
                <button
                  onClick={() => {
                    if (isAddingCandidate) {
                      setCandidateName("");
                      setCandidateUrl("");
                      setCandidateProfile("");
                      setResumeFile(null);
                    }
                    setIsAddingCandidate(!isAddingCandidate);
                  }}
                  className="btn-primary"
                >
                  {isAddingCandidate ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isAddingCandidate ? "Cancel" : "Add Candidate"}
                </button>
              </div>

              <AnimatePresence>
                {isAddingCandidate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass-card p-8 bg-neutral-50/50">
                      <form onSubmit={handleAddCandidate} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Candidate Name</label>
                            <input
                              type="text"
                              required
                              value={candidateName}
                              onChange={(e) => setCandidateName(e.target.value)}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">LinkedIn URL (Optional)</label>
                            <input
                              type="url"
                              value={candidateUrl}
                              onChange={(e) => setCandidateUrl(e.target.value)}
                              className="input-field"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Profile Text / Resume Content
                          </label>
                          <textarea
                            required
                            rows={5}
                            value={candidateProfile}
                            onChange={(e) => setCandidateProfile(e.target.value)}
                            className="input-field resize-none"
                            placeholder="Paste the candidate's resume or LinkedIn profile text here..."
                          />
                          <p className={`text-xs mt-1 ${wordCount > MAX_PROFILE_WORDS ? "text-red-500" : "text-neutral-400"}`}>
                            {wordCount} / {MAX_PROFILE_WORDS} words
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <input
                              ref={resumeFileInputRef}
                              type="file"
                              accept=".pdf,.docx"
                              className="hidden"
                              onChange={handleResumeUpload}
                            />
                            <button
                              type="button"
                              onClick={() => resumeFileInputRef.current?.click()}
                              disabled={isParsingResume}
                              className="btn-secondary text-sm inline-flex items-center gap-1.5"
                            >
                              {isParsingResume ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              {isParsingResume ? "Parsing..." : "Or upload a PDF/DOCX"}
                            </button>
                            {resumeFile && (
                              <span className="text-sm text-neutral-500 inline-flex items-center gap-1.5">
                                {resumeFile.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResumeFile(null);
                                    setCandidateProfile("");
                                    if (resumeFileInputRef.current) {
                                      resumeFileInputRef.current.value = "";
                                    }
                                  }}
                                  className="text-neutral-400 hover:text-neutral-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button type="submit" disabled={isIngesting || wordCount > MAX_PROFILE_WORDS} className="btn-primary">
                            {isIngesting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            {isIngesting ? "Analyzing & Scoring..." : "Ingest Candidate"}
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
                    <Link href={`/candidates/${candidate.id}`} className="block group">
                      <div className="glass-card p-6 transition-all duration-200 hover:border-neutral-300 hover:shadow-md">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-medium text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                            {candidate.name}
                          </h3>
                          <span
                            className={`badge shrink-0 ${
                              candidate.match_score >= 80
                                ? "badge-green"
                                : candidate.match_score >= 60
                                  ? "badge-yellow"
                                  : "badge-red"
                            }`}
                          >
                            {candidate.match_score}% Match
                          </span>
                          <div className="ml-auto hidden md:flex items-center text-neutral-300 group-hover:text-blue-600 transition-colors shrink-0">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                        <p className="text-sm text-neutral-500 flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4 opacity-50 shrink-0" />
                          <span className="line-clamp-2">{candidate.experience}</span>
                        </p>
                        <div className="text-sm text-neutral-600 bg-neutral-50 p-4 rounded-2xl line-clamp-2">
                          <span className="font-medium text-neutral-900 mr-2">AI Note:</span>
                          {candidate.match_reasoning}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "sourcing" && (
            <div className="glass-card p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h4 className="text-xl font-medium text-neutral-900">Boolean Search & Candidate Search</h4>
                  <p className="text-sm text-neutral-500 mt-1">
                    Generate a query, then search directly on LinkedIn or Naukri (no API key required).
                  </p>
                </div>
                <button
                  onClick={generateBooleanSearch}
                  disabled={isGeneratingSearch}
                  className="btn-primary"
                >
                  {isGeneratingSearch ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingSearch ? "Generating..." : "Generate Query"}
                </button>
              </div>

              {booleanSearch ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="bg-neutral-900 rounded-2xl p-6 relative group">
                    <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-3">Generated Boolean Query (copy for LinkedIn Recruiter / Google X-Ray)</p>
                    <code className="text-emerald-400 text-sm font-mono break-all leading-relaxed">
                      {booleanSearch}
                    </code>
                    <button
                      onClick={copyQuery}
                      className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-3">Search candidates directly:</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={openLinkedInSearch}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        LinkedIn People
                      </button>
                      <button
                        type="button"
                        onClick={openNaukriSearch}
                        className="btn-secondary inline-flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Naukri Jobs
                      </button>
                      <button
                        type="button"
                        onClick={openGoogleXRay}
                        className="btn-secondary inline-flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        Google X-Ray
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-3">LinkedIn &amp; Naukri use your job role for search. Use the copy button or Google X-Ray for the full boolean query.</p>
                  </div>
                </motion.div>
              ) : (
                <div className="py-12 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl">
                  <Search className="mx-auto h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm">Click generate to create an optimized boolean search string, then use it on LinkedIn or Naukri.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "interview_guide" && (
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
                    {isGeneratingKnowledge ? (
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    ) : (
                      <BrainCircuit className="mr-2 h-4 w-4" />
                    )}
                    {isGeneratingKnowledge ? "Analyzing..." : "Generate Guide"}
                  </button>
                )}
              </div>

              {knowledge ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                  <div>
                    <h5 className="text-lg font-medium text-neutral-900 mb-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm font-bold">
                        1
                      </div>
                      Key Concepts Explained
                    </h5>
                    <div className="grid gap-4 md:grid-cols-2">
                      {knowledge.concepts?.map((c, i) => (
                        <div key={i} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                          <dt className="text-sm font-semibold text-neutral-900 mb-2">{c.name}</dt>
                          <dd className="text-sm text-neutral-600 leading-relaxed">{c.explanation}</dd>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-px bg-neutral-100" />
                  <div>
                    <h5 className="text-lg font-medium text-neutral-900 mb-6 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 text-sm font-bold">
                        2
                      </div>
                      Suggested Interview Questions
                    </h5>
                    <div className="space-y-4">
                      {knowledge.interview_questions?.map((q, i) => (
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
