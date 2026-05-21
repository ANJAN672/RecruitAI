/**
 * AI router — tries configured providers in priority order (OpenAI → Gemini → OpenRouter)
 * and falls back to the next one if a provider fails. A provider is "configured" when
 * its API key env var is set.
 */

import type * as OpenAIProvider from "@/lib/openai";

/** Shared surface every provider module must implement. */
type AIModule = Pick<
  typeof OpenAIProvider,
  | "parseJobDescription"
  | "generateBooleanSearch"
  | "generateKnowledge"
  | "scoreCandidate"
  | "generateInterviewReport"
>;

const providers: { name: string; available: boolean; load: () => Promise<AIModule> }[] = [
  { name: "OpenAI", available: !!process.env.OPENAI_API_KEY?.trim(), load: () => import("@/lib/openai") },
  { name: "Gemini", available: !!process.env.GEMINI_API_KEY?.trim(), load: () => import("@/lib/gemini") },
  { name: "OpenRouter", available: !!process.env.OPENROUTER_API_KEY?.trim(), load: () => import("@/lib/openrouter") },
];

async function withFallback<T>(call: (m: AIModule) => Promise<T>): Promise<T> {
  const active = providers.filter((p) => p.available);
  if (active.length === 0) {
    throw new Error(
      "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY."
    );
  }
  let lastError: unknown;
  for (const provider of active) {
    try {
      return await call(await provider.load());
    } catch (e) {
      lastError = e;
      console.error(`AI provider "${provider.name}" failed:`, e);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All AI providers failed");
}

export function parseJobDescription(description: string) {
  return withFallback((m) => m.parseJobDescription(description));
}

export function generateBooleanSearch(role: string, hardSkills: string, experience: string) {
  return withFallback((m) => m.generateBooleanSearch(role, hardSkills, experience));
}

export function generateKnowledge(role: string, hardSkills: string) {
  return withFallback((m) => m.generateKnowledge(role, hardSkills));
}

export function scoreCandidate(
  profileText: string,
  job: { role: string; experience: string; hard_skills: string; soft_skills: string }
) {
  return withFallback((m) => m.scoreCandidate(profileText, job));
}

export function generateInterviewReport(notes: string) {
  return withFallback((m) => m.generateInterviewReport(notes));
}
