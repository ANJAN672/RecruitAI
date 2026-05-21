"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";

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

export default function CandidateDetails() {
  const params = useParams();
  const id = params.id as string;
  const [candidate, setCandidate] = React.useState<Candidate | null>(null);
  const [reports, setReports] = React.useState<InterviewReport[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [interviewNotes, setInterviewNotes] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/candidates/${id}`)
      .then((res) => res.json())
      .then((data) => setCandidate(data));
    fetch(`/api/candidates/${id}/reports`)
      .then((res) => res.json())
      .then((data) => setReports(Array.isArray(data) ? data : []));
  }, [id]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReport(true);
    try {
      const res = await fetch(`/api/candidates/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: interviewNotes }),
      });
      if (res.ok) {
        const newReport = await res.json();
        setReports([newReport, ...reports]);
        setInterviewNotes("");
      }
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!candidate) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const skills = JSON.parse(candidate.skills || "[]") as string[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="mb-8">
        <Link
          href={`/jobs/${candidate.job_id}`}
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
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
              <a
                href={candidate.profile_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-4 text-sm text-blue-600 hover:underline"
              >
                View Original Profile ↗
              </a>
            )}
          </div>
          <div className="flex flex-col items-start md:items-end gap-4">
            <span
              className={`badge px-4 py-2 text-sm ${
                candidate.match_score >= 80
                  ? "badge-green"
                  : candidate.match_score >= 60
                    ? "badge-yellow"
                    : "badge-red"
              }`}
            >
              {candidate.match_score}% AI Match
            </span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              AI Match Reasoning
            </h4>
            <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 p-4 rounded-2xl">
              {candidate.match_reasoning}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Extracted Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span key={i} className="badge badge-purple">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                onChange={(e) => setInterviewNotes(e.target.value)}
                className="input-field resize-none"
                placeholder="Paste your rough notes here. E.g. Strong in React, struggled with system design, good communication..."
              />
            </div>
            <button type="submit" disabled={isGeneratingReport} className="btn-primary w-full">
              {isGeneratingReport ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {isGeneratingReport ? "Generating Report..." : "Generate Structured Report"}
            </button>
          </form>
        </div>

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
                    <span className="text-xs font-mono text-neutral-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`badge ${
                        report.recommendation.toLowerCase().includes("proceed") ||
                        report.recommendation.toLowerCase().includes("hire")
                          ? "badge-green"
                          : report.recommendation.toLowerCase().includes("reject")
                            ? "badge-red"
                            : "badge-yellow"
                      }`}
                    >
                      {report.recommendation}
                    </span>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                      <h5 className="text-sm font-semibold text-emerald-800 flex items-center mb-2">
                        <CheckCircle className="mr-2 h-4 w-4" /> Strengths
                      </h5>
                      <p className="text-sm text-emerald-900/80 leading-relaxed whitespace-pre-wrap">
                        {report.strengths}
                      </p>
                    </div>
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                      <h5 className="text-sm font-semibold text-red-800 flex items-center mb-2">
                        <XCircle className="mr-2 h-4 w-4" /> Weaknesses
                      </h5>
                      <p className="text-sm text-red-900/80 leading-relaxed whitespace-pre-wrap">
                        {report.weaknesses}
                      </p>
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
