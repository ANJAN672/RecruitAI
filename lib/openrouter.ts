const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  if (!model) throw new Error("OPENROUTER_MODEL is not set");
  return { apiKey, model };
}

async function chat(
  prompt: string,
  options: { json?: boolean } = {}
): Promise<string> {
  const { apiKey, model } = getConfig();
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      ...(options.json && { response_format: { type: "json_object" } }),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message || res.statusText;
    const e = new Error(msg) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  return text;
}

export async function parseJobDescription(description: string) {
  const prompt = `Extract structured hiring requirements from this job description. Return valid JSON only with keys: role (string), experience (string), hard_skills (string array), soft_skills (string array), certifications (string array).

Job Description:
${description}`;
  const text = await chat(prompt, { json: true });
  return JSON.parse(text || "{}");
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
  const text = await chat(prompt, { json: true });
  return JSON.parse(text || "{}");
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
  const text = await chat(prompt, { json: true });
  return JSON.parse(text || "{}");
}

export async function generateInterviewReport(notes: string) {
  const prompt = `Convert these raw interview notes into a structured report.
Notes:
${notes}

Return valid JSON only: { "strengths": "...", "weaknesses": "...", "recommendation": "Proceed to next round / Reject / Hold" }`;
  const text = await chat(prompt, { json: true });
  return JSON.parse(text || "{}");
}
