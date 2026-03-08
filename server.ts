import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const db = new Database("recruiter.db");

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    role TEXT,
    experience TEXT,
    hard_skills TEXT,
    soft_skills TEXT,
    certifications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    profile_url TEXT,
    profile_text TEXT NOT NULL,
    skills TEXT,
    experience TEXT,
    match_score INTEGER,
    match_reasoning TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs (id)
  );

  CREATE TABLE IF NOT EXISTS interview_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    notes TEXT NOT NULL,
    strengths TEXT,
    weaknesses TEXT,
    recommendation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates (id),
    FOREIGN KEY (job_id) REFERENCES jobs (id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // 1. JD Upload and Parsing
  app.post("/api/jobs", async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      const prompt = `Extract structured hiring requirements from this job description.
Job Description:
${description}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING, description: "The primary role or job title" },
              experience: { type: Type.STRING, description: "Required years of experience" },
              hard_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required technical or hard skills" },
              soft_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required soft skills" },
              certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required or preferred certifications" },
            },
            required: ["role", "experience", "hard_skills", "soft_skills", "certifications"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      const stmt = db.prepare(`
        INSERT INTO jobs (title, description, role, experience, hard_skills, soft_skills, certifications)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        title,
        description,
        parsed.role || "",
        parsed.experience || "",
        JSON.stringify(parsed.hard_skills || []),
        JSON.stringify(parsed.soft_skills || []),
        JSON.stringify(parsed.certifications || [])
      );

      res.json({ id: info.lastInsertRowid, ...parsed });
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  // Get all jobs
  app.get("/api/jobs", (req, res) => {
    const jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
    res.json(jobs);
  });

  // Get job details
  app.get("/api/jobs/:id", (req, res) => {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  });

  // 2. Boolean Search Generation
  app.get("/api/jobs/:id/boolean-search", async (req, res) => {
    try {
      const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id) as any;
      if (!job) return res.status(404).json({ error: "Job not found" });

      const prompt = `Generate a boolean search query for LinkedIn/Naukri based on these requirements:
Role: ${job.role}
Hard Skills: ${job.hard_skills}
Experience: ${job.experience}

Return ONLY the boolean search string, nothing else.`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ query: response.text?.trim() });
    } catch (error) {
      console.error("Error generating boolean search:", error);
      res.status(500).json({ error: "Failed to generate boolean search" });
    }
  });

  // 3. Recruiter Knowledge Assistant
  app.get("/api/jobs/:id/knowledge", async (req, res) => {
    try {
      const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id) as any;
      if (!job) return res.status(404).json({ error: "Job not found" });

      const prompt = `Help a recruiter understand this job description.
Role: ${job.role}
Hard Skills: ${job.hard_skills}

Generate:
1. Brief explanations of the top 3 technical concepts.
2. 3 good interview questions to ask candidates, with expected answers.

Return JSON with:
{
  "concepts": [{ "name": "...", "explanation": "..." }],
  "interview_questions": [{ "question": "...", "expected_answer": "..." }]
}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  }
                }
              },
              interview_questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    expected_answer: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Error generating knowledge:", error);
      res.status(500).json({ error: "Failed to generate knowledge" });
    }
  });

  // 4. Candidate Ingestion and Ranking
  app.post("/api/jobs/:id/candidates", async (req, res) => {
    try {
      const jobId = req.params.id;
      const { name, profile_url, profile_text } = req.body;

      if (!name || !profile_text) {
        return res.status(400).json({ error: "Name and profile text are required" });
      }

      const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
      if (!job) return res.status(404).json({ error: "Job not found" });

      // Extract candidate info and score against JD
      const prompt = `Analyze this candidate profile against the job description.
Job Description:
Role: ${job.role}
Experience: ${job.experience}
Hard Skills: ${job.hard_skills}
Soft Skills: ${job.soft_skills}

Candidate Profile:
${profile_text}

Extract the candidate's skills and experience.
Then, score the candidate from 0 to 100 based on how well they match the job description, and provide a brief reasoning.

Return JSON with:
{
  "skills": ["skill1", "skill2"],
  "experience": "brief summary of experience",
  "match_score": 85,
  "match_reasoning": "Strong match because..."
}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experience: { type: Type.STRING },
              match_score: { type: Type.INTEGER },
              match_reasoning: { type: Type.STRING }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");

      const stmt = db.prepare(`
        INSERT INTO candidates (job_id, name, profile_url, profile_text, skills, experience, match_score, match_reasoning)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        jobId,
        name,
        profile_url || "",
        profile_text,
        JSON.stringify(parsed.skills || []),
        parsed.experience || "",
        parsed.match_score || 0,
        parsed.match_reasoning || ""
      );

      res.json({ id: info.lastInsertRowid, ...parsed });
    } catch (error) {
      console.error("Error ingesting candidate:", error);
      res.status(500).json({ error: "Failed to ingest candidate" });
    }
  });

  // Get candidates for a job
  app.get("/api/jobs/:id/candidates", (req, res) => {
    const candidates = db.prepare("SELECT * FROM candidates WHERE job_id = ? ORDER BY match_score DESC").all(req.params.id);
    res.json(candidates);
  });

  // Get candidate details
  app.get("/api/candidates/:id", (req, res) => {
    const candidate = db.prepare("SELECT * FROM candidates WHERE id = ?").get(req.params.id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    res.json(candidate);
  });

  // 5. Interview Report Generation
  app.post("/api/candidates/:id/report", async (req, res) => {
    try {
      const candidateId = req.params.id;
      const { notes } = req.body;

      if (!notes) {
        return res.status(400).json({ error: "Interview notes are required" });
      }

      const candidate = db.prepare("SELECT * FROM candidates WHERE id = ?").get(candidateId) as any;
      if (!candidate) return res.status(404).json({ error: "Candidate not found" });

      const prompt = `Convert these raw interview notes into a structured interview evaluation report.
Notes:
${notes}

Return JSON with:
{
  "strengths": "Summary of strengths",
  "weaknesses": "Summary of weaknesses",
  "recommendation": "Proceed to next round / Reject / Hold"
}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.STRING },
              weaknesses: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");

      const stmt = db.prepare(`
        INSERT INTO interview_reports (candidate_id, job_id, notes, strengths, weaknesses, recommendation)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        candidateId,
        candidate.job_id,
        notes,
        parsed.strengths || "",
        parsed.weaknesses || "",
        parsed.recommendation || ""
      );

      res.json({ id: info.lastInsertRowid, ...parsed });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Get interview reports for a candidate
  app.get("/api/candidates/:id/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM interview_reports WHERE candidate_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(reports);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
