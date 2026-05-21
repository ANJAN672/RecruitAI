/**
 * OpenAI provider — uses the Chat Completions REST API directly (no SDK dependency).
 * Configured via OPENAI_API_KEY and (optionally) OPENAI_MODEL.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  return { apiKey, model };
}

async function chat(prompt: string, options: { json?: boolean } = {}): Promise<string> {
  const { apiKey, model } = getConfig();
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: options.json
            ? "You respond with valid JSON only — no markdown, no commentary."
            : "You are a concise recruiting assistant.",
        },
        { role: "user", content: prompt },
      ],
      ...(options.json && { response_format: { type: "json_object" } }),
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const e = new Error(`OpenAI ${res.status}: ${body.slice(0, 300)}`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function parseJobDescription(description: string) {
  const prompt = `Extract structured hiring requirements from this job description. Return valid JSON only with keys: role (string), experience (string), hard_skills (string array), soft_skills (string array), certifications (string array).

Job Description:
${description}`;
  return JSON.parse((await chat(prompt, { json: true })) || "{}");
}

export async function generateBooleanSearch(role: string, hardSkills: string, experience: string) {
  const prompt = `Generate a boolean search query for LinkedIn/Naukri based on these requirements:
Role: ${role}
Hard Skills: ${hardSkills}
Experience: ${experience}

Return ONLY the boolean search string, nothing else.`;
  return chat(prompt);
}

export async function generateKnowledge(role: string, hardSkills: string) {
  const prompt = `Help a recruiter understand this job description.
Role: ${role}
Hard Skills: ${hardSkills}

Generate:
1. Brief explanations of the top 3 technical concepts.
2. 3 good interview questions to ask candidates, with expected answers.

Return valid JSON only: { "concepts": [{ "name": "...", "explanation": "..." }], "interview_questions": [{ "question": "...", "expected_answer": "..." }] }`;
  return JSON.parse((await chat(prompt, { json: true })) || "{}");
}

export async function scoreCandidate(
  profileText: string,
  job: { role: string; experience: string; hard_skills: string; soft_skills: string }
) {
  const prompt = `Score this candidate against the job. Be concise.
Job: ${job.role}, ${job.experience}, Skills: ${job.hard_skills}
Candidate:
${profileText}

Return valid JSON only: { "skills": [...], "experience": "brief summary", "match_score": 0-100, "match_reasoning": "1-2 sentences" }`;
  return JSON.parse((await chat(prompt, { json: true })) || "{}");
}

export async function generateInterviewReport(notes: string) {
  const prompt = `Convert these raw interview notes into a structured report.
Notes:
${notes}

Return valid JSON only: { "strengths": "...", "weaknesses": "...", "recommendation": "Proceed to next round / Reject / Hold" }`;
  return JSON.parse((await chat(prompt, { json: true })) || "{}");
}
