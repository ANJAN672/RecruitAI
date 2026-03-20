/**
 * AI: try Gemini first; on failure fall back to OpenRouter when OPENROUTER_API_KEY is set.
 */

const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
const hasOpenRouter = !!process.env.OPENROUTER_API_KEY?.trim();

async function withFallback<T>(
  geminiFn: () => Promise<T>,
  openrouterFn: () => Promise<T>
): Promise<T> {
  if (hasGemini) {
    try {
      return await geminiFn();
    } catch (e) {
      if (hasOpenRouter) {
        return await openrouterFn();
      }
      throw e;
    }
  }
  if (hasOpenRouter) return await openrouterFn();
  throw new Error("Set GEMINI_API_KEY or OPENROUTER_API_KEY");
}

export async function parseJobDescription(description: string) {
  const gemini = () => import("@/lib/gemini").then((m) => m.parseJobDescription(description));
  const openrouter = () => import("@/lib/openrouter").then((m) => m.parseJobDescription(description));
  return withFallback(gemini, openrouter);
}

export async function generateBooleanSearch(role: string, hardSkills: string, experience: string) {
  const gemini = () =>
    import("@/lib/gemini").then((m) => m.generateBooleanSearch(role, hardSkills, experience));
  const openrouter = () =>
    import("@/lib/openrouter").then((m) => m.generateBooleanSearch(role, hardSkills, experience));
  return withFallback(gemini, openrouter);
}

export async function generateKnowledge(role: string, hardSkills: string) {
  const gemini = () => import("@/lib/gemini").then((m) => m.generateKnowledge(role, hardSkills));
  const openrouter = () =>
    import("@/lib/openrouter").then((m) => m.generateKnowledge(role, hardSkills));
  return withFallback(gemini, openrouter);
}

export async function scoreCandidate(
  profileText: string,
  job: { role: string; experience: string; hard_skills: string; soft_skills: string }
) {
  const gemini = () => import("@/lib/gemini").then((m) => m.scoreCandidate(profileText, job));
  const openrouter = () =>
    import("@/lib/openrouter").then((m) => m.scoreCandidate(profileText, job));
  return withFallback(gemini, openrouter);
}

export async function generateInterviewReport(notes: string) {
  const gemini = () => import("@/lib/gemini").then((m) => m.generateInterviewReport(notes));
  const openrouter = () =>
    import("@/lib/openrouter").then((m) => m.generateInterviewReport(notes));
  return withFallback(gemini, openrouter);
}
