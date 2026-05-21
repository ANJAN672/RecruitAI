"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, XCircle, Loader2, Clock, Upload } from "lucide-react";
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

export default function Dashboard() {
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newJobTitle, setNewJobTitle] = React.useState("");
  const [newJobDesc, setNewJobDesc] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [jobFile, setJobFile] = React.useState<File | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/parse", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNewJobDesc(data.text);
        setJobFile(file);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to parse file.");
      }
    } catch (error) {
      alert("Failed to upload file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newJobTitle, description: newJobDesc }),
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs([newJob, ...jobs]);
        setIsCreating(false);
        setNewJobTitle("");
        setNewJobDesc("");
        setJobFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.push(`/jobs/${newJob.id}`);
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
        <button onClick={() => { if (isCreating) { setNewJobTitle(""); setNewJobDesc(""); setJobFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; } setIsCreating(!isCreating); }} className="btn-primary">
          {isCreating ? <XCircle className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {isCreating ? "Cancel" : "New Requisition"}
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
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
                    onChange={(e) => setNewJobTitle(e.target.value)}
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
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    className="input-field resize-none"
                    placeholder="Paste the full job description here..."
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isParsing}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      {isParsing ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {isParsing ? "Parsing..." : "Or upload a PDF/DOCX"}
                    </button>
                    {jobFile && !isParsing && (
                      <span className="flex items-center gap-1 text-sm text-neutral-500">
                        {jobFile.name}
                        <button
                          type="button"
                          onClick={() => {
                            setJobFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-neutral-400 hover:text-neutral-600 ml-1"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => { setIsCreating(false); setNewJobTitle(""); setNewJobDesc(""); setJobFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    {isLoading ? "Analyzing..." : "Create & Analyze"}
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
            <p>No requisitions created yet. Click &quot;New Requisition&quot; to get started.</p>
          </div>
        )}
        {jobs.map((job, i) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={job.id}>
            <Link href={`/jobs/${job.id}`} className="block group">
              <div className="glass-card p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="badge badge-green">Active</div>
                  <span className="text-xs text-neutral-400 font-mono">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {job.title}
                </h3>
                <div className="space-y-2 mt-4">
                  <p className="flex items-center text-sm text-neutral-500">
                    <Briefcase className="mr-2 h-4 w-4 opacity-50" />
                    <span className="truncate">{job.role || "Role not extracted"}</span>
                  </p>
                  <p className="flex items-center text-sm text-neutral-500">
                    <Clock className="mr-2 h-4 w-4 opacity-50" />
                    <span className="truncate">{job.experience || "Experience not specified"}</span>
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
