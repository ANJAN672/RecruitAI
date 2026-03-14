import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  next();
}

function parseSkills(raw: string): string[] {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

function buildSearchResponse(q: any) {
  return {
    found: true,
    linkedin_boolean: q.linkedin_boolean,
    naukri_keywords: q.naukri_keywords,
    xray_linkedin: q.xray_linkedin,
    xray_naukri: q.xray_naukri,
    xray_indeed: q.xray_indeed || "",
    xray_dice: q.xray_dice || "",
    xray_careerbuilder: q.xray_careerbuilder || "",
    xray_monster: q.xray_monster || "",
    linkedin_search_url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(q.linkedin_boolean)}`,
    naukri_search_url: `https://resdex.naukri.com/recruiter/search/profiles?q=${encodeURIComponent(q.naukri_keywords)}`,
    google_xray_linkedin_url: `https://www.google.com/search?q=${encodeURIComponent(q.xray_linkedin)}`,
    google_xray_naukri_url: `https://www.google.com/search?q=${encodeURIComponent(q.xray_naukri)}`,
  };
}

const app = express();
app.use(express.json({ limit: "2mb" }));

// ── Public config (no auth) ───────────────────────────────────────────
app.get("/api/config", (_req, res) => {
  res.json({
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// ── Jobs ──────────────────────────────────────────────────────────────

app.post("/api/jobs", requireAuth, async (req: any, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: `Extract structured hiring requirements from this job description.\n\nJob Description:\n${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, description: "Primary role / job title" },
            experience: { type: Type.STRING, description: "Required years of experience" },
            hard_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required technical skills" },
            soft_skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required soft skills" },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Required or preferred certifications" },
          },
          required: ["role", "experience", "hard_skills", "soft_skills", "certifications"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        user_id: req.user.id,
        title,
        description,
        role: parsed.role || "",
        experience: parsed.experience || "",
        hard_skills: JSON.stringify(parsed.hard_skills || []),
        soft_skills: JSON.stringify(parsed.soft_skills || []),
        certifications: JSON.stringify(parsed.certifications || []),
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error creating job:", err);
    res.status(500).json({ error: "Failed to create job" });
  }
});

app.get("/api/jobs", requireAuth, async (req: any, res) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get("/api/jobs/:id", requireAuth, async (req: any, res) => {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();
  if (error || !data) return res.status(404).json({ error: "Job not found" });
  res.json(data);
});

// ── Sourcing ─────────────────────────────────────────────────────────

app.get("/api/jobs/:id/boolean-search", requireAuth, async (req: any, res) => {
  const { data: job } = await supabase.from("jobs").select("id").eq("id", req.params.id).eq("user_id", req.user.id).single();
  if (!job) return res.status(404).json({ error: "Job not found" });

  const { data: cached } = await supabase
    .from("boolean_searches")
    .select("query")
    .eq("job_id", req.params.id)
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cached?.query) return res.json({ found: false });

  try {
    const parsed = JSON.parse(cached.query);
    return res.json(buildSearchResponse(parsed));
  } catch {
    return res.json({ found: false });
  }
});

app.post("/api/jobs/:id/boolean-search", requireAuth, async (req: any, res) => {
  try {
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error || !job) return res.status(404).json({ error: "Job not found" });

    const hardSkills: string[] = JSON.parse(job.hard_skills || "[]");

    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: `You are an expert technical recruiter and sourcing specialist.

Job Details:
- Role: ${job.role}
- Key Skills: ${hardSkills.slice(0, 6).join(", ")}
- Experience Required: ${job.experience}

Generate optimized candidate search queries. Return JSON with these 8 fields:

1. linkedin_boolean: A SIMPLE and EFFECTIVE boolean for LinkedIn People Search. MAXIMUM 2 AND groups. Format: (role synonyms OR ...) AND (1-2 top skills OR ...). Keep short so LinkedIn returns results. Example: ("React Developer" OR "Frontend Engineer") AND ("React" OR "TypeScript")

2. naukri_keywords: Simple space-separated keywords for Naukri ResdEx. Job title + 3-4 key skills. No operators. Example: DevOps Engineer Docker Kubernetes AWS Terraform

3. xray_linkedin: Google X-ray for LinkedIn. Start with: site:linkedin.com/in then role + 2 skills. Keep short.

4. xray_naukri: Google X-ray for Naukri. Start with: site:naukri.com then role + 1-2 skills in quotes. Do NOT use /profile. Example: site:naukri.com "DevOps Engineer" "Docker" "Kubernetes"

5. xray_indeed: Google X-ray for Indeed resumes. Start with: site:indeed.com/r then role + 1-2 skills in quotes.

6. xray_dice: Google X-ray for Dice profiles. Start with: site:dice.com then role + 1-2 skills in quotes.

7. xray_careerbuilder: Google X-ray for CareerBuilder resumes. Start with: site:careerbuilder.com/resume then role + 1-2 skills in quotes.

8. xray_monster: Google X-ray for Monster resumes. Start with: site:monster.com/resume then role + 1-2 skills in quotes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            linkedin_boolean: { type: Type.STRING },
            naukri_keywords: { type: Type.STRING },
            xray_linkedin: { type: Type.STRING },
            xray_naukri: { type: Type.STRING },
            xray_indeed: { type: Type.STRING },
            xray_dice: { type: Type.STRING },
            xray_careerbuilder: { type: Type.STRING },
            xray_monster: { type: Type.STRING },
          },
          required: ["linkedin_boolean", "naukri_keywords", "xray_linkedin", "xray_naukri", "xray_indeed", "xray_dice", "xray_careerbuilder", "xray_monster"],
        },
      },
    });

    const queries = JSON.parse(response.text || "{}");

    await supabase.from("boolean_searches").insert({
      job_id: parseInt(req.params.id),
      user_id: req.user.id,
      query: JSON.stringify(queries),
    });

    res.json(buildSearchResponse(queries));
  } catch (err) {
    console.error("Error generating boolean search:", err);
    res.status(500).json({ error: "Failed to generate boolean search" });
  }
});

// ── Knowledge Assistant ───────────────────────────────────────────────

app.get("/api/jobs/:id/knowledge", requireAuth, async (req: any, res) => {
  const { data: job } = await supabase.from("jobs").select("id").eq("id", req.params.id).eq("user_id", req.user.id).single();
  if (!job) return res.status(404).json({ error: "Job not found" });

  const { data: cached } = await supabase
    .from("knowledge_guides")
    .select("concepts, interview_questions")
    .eq("job_id", req.params.id)
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cached?.concepts) return res.json({ found: false });
  return res.json({ found: true, ...cached });
});

app.post("/api/jobs/:id/knowledge", requireAuth, async (req: any, res) => {
  try {
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error || !job) return res.status(404).json({ error: "Job not found" });

    const skillsList = parseSkills(job.hard_skills).slice(0, 6).join(", ");

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "stepfun/step-3.5-flash:free",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a senior technical recruiter creating interview guides for non-technical HR recruiters. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: `Create an interview guide for this role.

Role: ${job.role}
Key Skills: ${skillsList}

Return a JSON object with exactly this structure:
{
  "concepts": [
    {
      "name": "Concept Name",
      "explanation": "3-5 sentence plain-English explanation with no jargon so a non-technical recruiter can understand and ask about it."
    }
  ],
  "interview_questions": [
    {
      "question": "A behavioral or situational interview question.",
      "expected_answer": "Written in first person as if a strong candidate is answering out loud. Use real technical details, tools, metrics, and concrete scenarios. 4-6 sentences starting with 'In my previous role...' or 'When I faced this...'"
    }
  ]
}

Generate exactly 4 concepts and 4 interview questions. Every expected_answer MUST be written as a natural first-person candidate response. Do NOT write it as a recruiter evaluation guide. Never output empty strings.`,
          },
        ],
      }),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      throw new Error(`OpenRouter error ${orRes.status}: ${errText}`);
    }

    const orJson = await orRes.json();
    const rawContent = orJson.choices?.[0]?.message?.content || "{}";

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error("Invalid JSON from OpenRouter");
    }

    if (Array.isArray(parsed.interview_questions)) {
      parsed.interview_questions = parsed.interview_questions.map((q: any) => ({
        ...q,
        expected_answer: q.expected_answer?.trim() || "In my previous role, I demonstrated strong hands-on experience with this skill by working on real production systems, delivering measurable improvements, and collaborating closely with cross-functional teams to solve complex problems.",
      }));
    }

    await supabase.from("knowledge_guides").insert({
      job_id: parseInt(req.params.id),
      user_id: req.user.id,
      concepts: parsed.concepts ?? [],
      interview_questions: parsed.interview_questions ?? [],
    });

    res.json({ found: true, ...parsed });
  } catch (err) {
    console.error("Error generating knowledge:", err);
    res.status(500).json({ error: "Failed to generate knowledge" });
  }
});

// ── Candidates ────────────────────────────────────────────────────────

app.post("/api/jobs/:id/candidates", requireAuth, async (req: any, res) => {
  try {
    const jobId = req.params.id;
    const { name, profile_url, profile_text } = req.body;

    if (!name || !profile_text) {
      return res.status(400).json({ error: "Name and profile text are required" });
    }

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", req.user.id)
      .single();

    if (jobErr || !job) return res.status(404).json({ error: "Job not found" });

    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: `Analyze this candidate profile against the job requirements and score the match.

Job Requirements:
- Role: ${job.role}
- Experience: ${job.experience}
- Hard Skills: ${job.hard_skills}
- Soft Skills: ${job.soft_skills}

Candidate Profile:
${profile_text}

Extract the candidate's skills, summarize their experience, score the match from 0-100, and give a concise 1-2 sentence reasoning for the score.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: { type: Type.STRING },
            match_score: { type: Type.INTEGER },
            match_reasoning: { type: Type.STRING },
          },
          required: ["skills", "experience", "match_score", "match_reasoning"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    const { data, error } = await supabase
      .from("candidates")
      .insert({
        job_id: parseInt(jobId),
        name,
        profile_url: profile_url || "",
        profile_text,
        skills: JSON.stringify(parsed.skills || []),
        experience: parsed.experience || "",
        match_score: parsed.match_score || 0,
        match_reasoning: parsed.match_reasoning || "",
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ ...data, ...parsed });
  } catch (err) {
    console.error("Error ingesting candidate:", err);
    res.status(500).json({ error: "Failed to ingest candidate" });
  }
});

app.get("/api/jobs/:id/candidates", requireAuth, async (req: any, res) => {
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .single();

  if (!job) return res.status(404).json({ error: "Job not found" });

  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("job_id", req.params.id)
    .order("match_score", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get("/api/candidates/:id", requireAuth, async (req: any, res) => {
  const { data, error } = await supabase
    .from("candidates")
    .select("*, jobs!inner(user_id)")
    .eq("id", req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Candidate not found" });
  if ((data.jobs as any).user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { jobs: _jobs, ...candidate } = data as any;
  res.json(candidate);
});

// ── Interview Reports ──────────────────────────────────────────────────

app.post("/api/candidates/:id/report", requireAuth, async (req: any, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ error: "Interview notes are required" });

    const { data: candidate, error: candErr } = await supabase
      .from("candidates")
      .select("*, jobs!inner(user_id)")
      .eq("id", req.params.id)
      .single();

    if (candErr || !candidate) return res.status(404).json({ error: "Candidate not found" });
    if ((candidate.jobs as any).user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: `Convert these raw interview notes into a structured evaluation report.

Notes:
${notes}

Produce a professional summary of strengths, weaknesses, and a clear recommendation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.STRING },
            weaknesses: { type: Type.STRING },
            recommendation: { type: Type.STRING },
          },
          required: ["strengths", "weaknesses", "recommendation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    const { data, error } = await supabase
      .from("interview_reports")
      .insert({
        candidate_id: parseInt(req.params.id),
        job_id: candidate.job_id,
        notes,
        strengths: parsed.strengths || "",
        weaknesses: parsed.weaknesses || "",
        recommendation: parsed.recommendation || "",
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ ...data, ...parsed });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

app.get("/api/candidates/:id/reports", requireAuth, async (req: any, res) => {
  const { data: candidate } = await supabase
    .from("candidates")
    .select("*, jobs!inner(user_id)")
    .eq("id", req.params.id)
    .single();

  if (!candidate || (candidate.jobs as any).user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { data, error } = await supabase
    .from("interview_reports")
    .select("*")
    .eq("candidate_id", req.params.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// ── Market Intelligence ───────────────────────────────────────────────

app.get("/api/jobs/:id/market-intelligence", requireAuth, async (req: any, res) => {
  const { data: job } = await supabase.from("jobs").select("id").eq("id", req.params.id).eq("user_id", req.user.id).single();
  if (!job) return res.status(404).json({ error: "Job not found" });

  const { data: cached } = await supabase
    .from("market_intelligence")
    .select("data")
    .eq("job_id", req.params.id)
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cached?.data) return res.json({ found: false });
  return res.json({ found: true, ...cached.data });
});

app.post("/api/jobs/:id/market-intelligence", requireAuth, async (req: any, res) => {
  try {
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error || !job) return res.status(404).json({ error: "Job not found" });

    const skillsList = parseSkills(job.hard_skills).slice(0, 8).join(", ");

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "stepfun/step-3.5-flash:free",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a compensation and HR market research specialist. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: `Generate market intelligence for this role.

Role: ${job.role}
Experience Required: ${job.experience}
Key Skills: ${skillsList}

Return a JSON object with exactly this structure:
{
  "salary": {
    "india": "₹X-Y LPA",
    "us": "$X,000-$Y,000/year",
    "global_note": "One sentence on global variance"
  },
  "demand": "2-3 sentence summary of current market demand for this role and skills",
  "training": [
    {
      "name": "Institution or program name",
      "provider": "Full institution name",
      "location": "India or Global",
      "type": "University / Government Institute / Professional Body / Certification Authority",
      "url": "https://real-url.com"
    }
  ]
}

For the "training" array, provide exactly 6 real-world INSTITUTIONS and BODIES (not edtech platforms like Udemy/Coursera):
- 3 Indian institutions: e.g. IITs, NITs, CDAC, NASSCOM FutureSkills, NIIT, Aptech, GNIIT, Jetking, ISRO, government skill programs (PMKVY), professional bodies (CSI, IETE)
- 3 global institutions: e.g. MIT, Stanford, Carnegie Mellon, Linux Foundation, IEEE, ACM, The Open Group, CompTIA, AWS Training, Microsoft Learn official programs, Red Hat Academy
Each entry must be a real institution with a real URL. Focus on institutions that have programs directly relevant to: ${skillsList}`,
          },
        ],
      }),
    });

    if (!orRes.ok) throw new Error(`OpenRouter error ${orRes.status}`);
    const orJson = await orRes.json();
    const rawContent = orJson.choices?.[0]?.message?.content || "{}";

    let parsed: any = {};
    try { parsed = JSON.parse(rawContent); } catch { throw new Error("Invalid JSON"); }

    supabase.from("market_intelligence").insert({
      job_id: parseInt(req.params.id),
      user_id: req.user.id,
      data: parsed,
    }).then(({ error }) => {
      if (error) console.warn("market_intelligence insert skipped:", error.message);
    });

    res.json({ found: true, ...parsed });
  } catch (err) {
    console.error("Error generating market intelligence:", err);
    res.status(500).json({ error: "Failed to generate market intelligence" });
  }
});

export default app;
