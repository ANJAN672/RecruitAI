import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.0-flash";

export function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export async function parseJobDescription(description: string) {
  const ai = getAI();
  const prompt = `Extract structured hiring requirements from this job description.\nJob Description:\n${description}`;
  const response = await ai.models.generateContent({
    model: getModel(),
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
  return JSON.parse(response.text || "{}");
}

export async function generateBooleanSearch(role: string, hardSkills: string, experience: string) {
  const ai = getAI();
  const prompt = `Generate a boolean search query for LinkedIn/Naukri based on these requirements:\nRole: ${role}\nHard Skills: ${hardSkills}\nExperience: ${experience}\n\nReturn ONLY the boolean search string, nothing else.`;
  const response = await ai.models.generateContent({
    model: getModel(),
    contents: prompt,
  });
  return response.text?.trim() ?? "";
}

export async function generateKnowledge(role: string, hardSkills: string) {
  const ai = getAI();
  const prompt = `Help a recruiter understand this job description.\nRole: ${role}\nHard Skills: ${hardSkills}\n\nGenerate:\n1. Brief explanations of the top 3 technical concepts.\n2. 3 good interview questions to ask candidates, with expected answers.\n\nReturn JSON with:\n{ "concepts": [{ "name": "...", "explanation": "..." }], "interview_questions": [{ "question": "...", "expected_answer": "..." }] }`;
  const response = await ai.models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          concepts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, explanation: { type: Type.STRING } } } },
          interview_questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, expected_answer: { type: Type.STRING } } } },
        },
      },
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function scoreCandidate(profileText: string, job: { role: string; experience: string; hard_skills: string; soft_skills: string }) {
  const ai = getAI();
  const prompt = `Score this candidate against the job. Be concise.\nJob: ${job.role}, ${job.experience}, Skills: ${job.hard_skills}\nCandidate:\n${profileText}\n\nReturn JSON: { "skills": [...], "experience": "brief summary", "match_score": 0-100, "match_reasoning": "1-2 sentences" }`;
  const response = await ai.models.generateContent({
    model: getModel(),
    contents: prompt,
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
      },
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function generateInterviewReport(notes: string) {
  const ai = getAI();
  const prompt = `Convert these raw interview notes into a structured report.\nNotes:\n${notes}\n\nReturn JSON: { "strengths": "...", "weaknesses": "...", "recommendation": "Proceed to next round / Reject / Hold" }`;
  const response = await ai.models.generateContent({
    model: getModel(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strengths: { type: Type.STRING },
          weaknesses: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
      },
    },
  });
  return JSON.parse(response.text || "{}");
}
