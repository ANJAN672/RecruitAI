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

// Fallback to OpenRouter when Gemini rate-limits (429)
async function generateWithFallback(prompt: string, schema: any): Promise<any> {
  // Try Gemini first
  try {
    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    if (err?.status !== 429) throw err;
    console.warn("Gemini rate-limited, falling back to OpenRouter...");
  }

  // Fallback: OpenRouter
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
        { role: "system", content: "Respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!orRes.ok) throw new Error(`OpenRouter error ${orRes.status}`);
  const orJson = await orRes.json();
  return JSON.parse(orJson.choices?.[0]?.message?.content || "{}");
}

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

// All fields required in a complete boolean search record.
// If any are missing from cache, GET returns found:false → forces fresh POST regeneration.
const BOOLEAN_REQUIRED_FIELDS = [
  "linkedin_boolean", "naukri_keywords",
  "indeed_boolean", "dice_boolean", "careerbuilder_boolean", "monster_boolean",
  "xray_linkedin", "xray_naukri", "xray_indeed", "xray_dice", "xray_careerbuilder", "xray_monster",
];

function isCacheComplete(q: any): boolean {
  return BOOLEAN_REQUIRED_FIELDS.every(f => typeof q[f] === "string" && q[f].trim() !== "");
}

// Server-side enforcement: limit AND groups and OR terms so platform searches always work.
// AI prompts request limits but sometimes ignore them — this guarantees compliance.
function sanitizeBoolean(query: string, maxAndGroups = 2, maxOrTerms = 3): string {
  if (!query) return query;
  const groups = query.split(/\s+AND\s+/i);
  const limited = groups.slice(0, maxAndGroups);
  const sanitized = limited.map(group => {
    const match = group.match(/\((.+)\)/);
    if (!match) return group.trim();
    const terms = match[1].split(/\s+OR\s+/i);
    const limitedTerms = terms.slice(0, maxOrTerms);
    return `(${limitedTerms.join(" OR ")})`;
  });
  return sanitized.join(" AND ");
}

function buildSearchResponse(q: any) {
  return {
    found: true,
    linkedin_boolean: sanitizeBoolean(q.linkedin_boolean || ""),
    naukri_keywords: q.naukri_keywords || "",
    indeed_boolean: sanitizeBoolean(q.indeed_boolean || ""),
    dice_boolean: sanitizeBoolean(q.dice_boolean || ""),
    careerbuilder_boolean: sanitizeBoolean(q.careerbuilder_boolean || ""),
    monster_boolean: sanitizeBoolean(q.monster_boolean || ""),
    xray_linkedin: q.xray_linkedin || "",
    xray_naukri: q.xray_naukri || "",
    xray_indeed: q.xray_indeed || "",
    xray_dice: q.xray_dice || "",
    xray_careerbuilder: q.xray_careerbuilder || "",
    xray_monster: q.xray_monster || "",
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

    const parsed = await generateWithFallback(
      `Extract structured hiring requirements from this job description. Return JSON with: role (string), experience (string), hard_skills (array of strings), soft_skills (array of strings), certifications (array of strings).\n\nJob Description:\n${description}`,
      {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING },
          experience: { type: Type.STRING },
          hard_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          soft_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["role", "experience", "hard_skills", "soft_skills", "certifications"],
      }
    );

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

  if (!cached?.query) return res.json({ found: false, stale: false });

  try {
    const parsed = JSON.parse(cached.query);
    // Cache exists but missing new fields → stale: true → UI auto-regenerates silently
    if (!isCacheComplete(parsed)) return res.json({ found: false, stale: true });
    return res.json(buildSearchResponse(parsed));
  } catch {
    return res.json({ found: false, stale: false });
  }
});

app.post("/api/jobs/:id/boolean-search", requireAuth, async (req: any, res) => {
  try {
    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", req.params.id).eq("user_id", req.user.id).single();
    if (error || !job) return res.status(404).json({ error: "Job not found" });

    const hardSkills: string[] = JSON.parse(job.hard_skills || "[]");

    const queries = await generateWithFallback(
      `You are an expert technical recruiter and sourcing specialist.

Job Details:
- Role: ${job.role}
- Key Skills: ${hardSkills.slice(0, 6).join(", ")}
- Experience Required: ${job.experience}

Generate optimized candidate search queries. Return JSON with these 12 fields:

DIRECT PLATFORM BOOLEAN SEARCHES (for searching directly on each platform):
1. linkedin_boolean: LinkedIn People Search boolean. MAXIMUM 2 AND groups, MAXIMUM 3 OR terms per group. Never use single-letter terms (use "R programming" not "R"). Example: ("React Developer" OR "Frontend Engineer") AND ("React" OR "TypeScript")
2. naukri_keywords: Simple space-separated keywords for Naukri ResdEx. Job title + 3-4 skills. No operators.
3. indeed_boolean: Indeed job search boolean. Same format as linkedin_boolean. MAXIMUM 2 AND groups.
4. dice_boolean: Dice.com search boolean. Same format as linkedin_boolean. MAXIMUM 2 AND groups.
5. careerbuilder_boolean: CareerBuilder search boolean. Same format as linkedin_boolean. MAXIMUM 2 AND groups.
6. monster_boolean: Monster.com search boolean. Same format as linkedin_boolean. MAXIMUM 2 AND groups.

GOOGLE X-RAY SEARCHES (for finding profiles/resumes via Google):
7. xray_linkedin: site:linkedin.com/in then role + 2 skills in quotes.
8. xray_naukri: site:naukri.com then role + 1-2 skills in quotes. Do NOT use /profile.
9. xray_indeed: site:indeed.com/r then role + 1-2 skills in quotes.
10. xray_dice: site:dice.com then role + 1-2 skills in quotes.
11. xray_careerbuilder: site:careerbuilder.com then role + 1-2 skills in quotes. Do NOT use /resume path.
12. xray_monster: site:monster.com then role + 1-2 skills in quotes.

Return JSON with exactly these 12 string fields: linkedin_boolean, naukri_keywords, indeed_boolean, dice_boolean, careerbuilder_boolean, monster_boolean, xray_linkedin, xray_naukri, xray_indeed, xray_dice, xray_careerbuilder, xray_monster.`,
      {
        type: Type.OBJECT,
        properties: {
          linkedin_boolean: { type: Type.STRING },
          naukri_keywords: { type: Type.STRING },
          indeed_boolean: { type: Type.STRING },
          dice_boolean: { type: Type.STRING },
          careerbuilder_boolean: { type: Type.STRING },
          monster_boolean: { type: Type.STRING },
          xray_linkedin: { type: Type.STRING },
          xray_naukri: { type: Type.STRING },
          xray_indeed: { type: Type.STRING },
          xray_dice: { type: Type.STRING },
          xray_careerbuilder: { type: Type.STRING },
          xray_monster: { type: Type.STRING },
        },
        required: ["linkedin_boolean", "naukri_keywords", "indeed_boolean", "dice_boolean", "careerbuilder_boolean", "monster_boolean", "xray_linkedin", "xray_naukri", "xray_indeed", "xray_dice", "xray_careerbuilder", "xray_monster"],
      }
    );

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

  if (!cached?.concepts) return res.json({ found: false, stale: false });
  // Validate structure — concepts and interview_questions must be non-empty arrays
  const valid =
    Array.isArray(cached.concepts) && cached.concepts.length > 0 &&
    Array.isArray(cached.interview_questions) && cached.interview_questions.length > 0 &&
    cached.interview_questions.every((q: any) => q.question && q.expected_answer?.trim());
  if (!valid) return res.json({ found: false, stale: true });
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
    const { name, profile_url, twitter_url, profile_text } = req.body;

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

    const parsed = await generateWithFallback(
      `Analyze this candidate profile against the job requirements. Provide both a technical match assessment AND a behavioral/cultural analysis.

Job Requirements:
- Role: ${job.role}
- Experience: ${job.experience}
- Hard Skills: ${job.hard_skills}
- Soft Skills: ${job.soft_skills}

Candidate Profile:
${profile_text}

1. Extract skills, summarize experience, score match 0-100, and give 1-2 sentence reasoning.
2. Write a behavioral_summary: Analyze communication style, leadership indicators, collaboration signals, career trajectory, red flags, and cultural fit signals visible in the profile text. 3-5 sentences.

Return JSON with fields: skills (array of strings), experience (string), match_score (integer 0-100), match_reasoning (string), behavioral_summary (string).`,
      {
        type: Type.OBJECT,
        properties: {
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experience: { type: Type.STRING },
          match_score: { type: Type.INTEGER },
          match_reasoning: { type: Type.STRING },
          behavioral_summary: { type: Type.STRING },
        },
        required: ["skills", "experience", "match_score", "match_reasoning", "behavioral_summary"],
      }
    );

    const { data, error } = await supabase
      .from("candidates")
      .insert({
        job_id: parseInt(jobId),
        name,
        profile_url: profile_url || "",
        twitter_url: twitter_url || "",
        profile_text,
        skills: JSON.stringify(parsed.skills || []),
        experience: parsed.experience || "",
        match_score: parsed.match_score || 0,
        match_reasoning: parsed.match_reasoning || "",
        behavioral_summary: parsed.behavioral_summary || "",
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

    const parsed = await generateWithFallback(
      `Convert these raw interview notes into a structured evaluation report.

Notes:
${notes}

Produce a professional summary of strengths, weaknesses, and a clear recommendation.

Return JSON with fields: strengths (string), weaknesses (string), recommendation (string).`,
      {
        type: Type.OBJECT,
        properties: {
          strengths: { type: Type.STRING },
          weaknesses: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ["strengths", "weaknesses", "recommendation"],
      }
    );

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

  if (!cached?.data) return res.json({ found: false, stale: false });
  // Validate structure — salary, demand, training must all be present
  const d = cached.data;
  const valid = d.salary?.india && d.salary?.us && d.demand && Array.isArray(d.training) && d.training.length > 0;
  if (!valid) return res.json({ found: false, stale: true });
  return res.json({ found: true, ...d });
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

For the "training" array, provide exactly 6 entries. These MUST be real-world ACADEMIC UNIVERSITIES, GOVERNMENT INSTITUTES, or OFFICIAL PROFESSIONAL STANDARDS BODIES only.

STRICTLY FORBIDDEN — do NOT include any of these or anything like them:
- Online course platforms: Udemy, Coursera, edX, Pluralsight, LinkedIn Learning, Skillshare, Alison, Khan Academy
- Bootcamps or coding schools: freeCodeCamp, Codecademy, Scrimba, The Odin Project, Guru99, W3Schools
- Any platform whose primary business is selling online video courses

REQUIRED — only these types of institutions:
- Indian: IIT Bombay, IIT Delhi, IIT Madras, IIT Kanpur, NIT Trichy, CDAC (Centre for Development of Advanced Computing), NASSCOM FutureSkills Prime, CSI (Computer Society of India), IETE, C-DAC ACTS Pune
- Global: MIT (Massachusetts Institute of Technology), Stanford University, Carnegie Mellon University, Linux Foundation, IEEE (Institute of Electrical and Electronics Engineers), ACM (Association for Computing Machinery), The Open Group, Red Hat Academy, CompTIA, PMI (Project Management Institute)

Each entry must be a real institution with a verifiable official URL. Focus on institutions that have programs or certifications directly relevant to: ${skillsList}`,
          },
        ],
      }),
    });

    if (!orRes.ok) throw new Error(`OpenRouter error ${orRes.status}`);
    const orJson = await orRes.json();
    const rawContent = orJson.choices?.[0]?.message?.content || "{}";

    let parsed: any = {};
    try { parsed = JSON.parse(rawContent); } catch { throw new Error("Invalid JSON"); }

    // Filter out edtech platforms the model keeps returning despite instructions
    const BANNED_PROVIDERS = [
      "udemy", "coursera", "edx", "pluralsight", "linkedin learning", "skillshare",
      "alison", "khan academy", "freecodecamp", "codecademy", "scrimba", "odin project",
      "guru99", "w3schools", "test automation university", "simplilearn", "great learning",
      "unacademy", "byju", "whitehat", "coding ninjas",
    ];
    if (Array.isArray(parsed.training)) {
      parsed.training = parsed.training.filter((t: any) => {
        const provider = (t.provider || "").toLowerCase();
        const name = (t.name || "").toLowerCase();
        return !BANNED_PROVIDERS.some(b => provider.includes(b) || name.includes(b));
      });
    }

    const { error: insertErr } = await supabase.from("market_intelligence").insert({
      job_id: parseInt(req.params.id),
      user_id: req.user.id,
      data: parsed,
    });
    if (insertErr) console.warn("market_intelligence insert failed:", insertErr.message);

    res.json({ found: true, ...parsed });
  } catch (err) {
    console.error("Error generating market intelligence:", err);
    res.status(500).json({ error: "Failed to generate market intelligence" });
  }
});

export default app;
