import { NextResponse } from "next/server";

/**
 * GET /api/models — List Gemini models that support generateContent.
 * Uses GEMINI_API_KEY from env. Use this to pick a valid GEMINI_MODEL.
 */
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
    );
    if (!res.ok) {
      const t = await res.text();
      return NextResponse.json(
        { error: "Google API error", status: res.status, details: t },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }
    const data = (await res.json()) as {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
        displayName?: string;
      }>;
    };
    const models = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({
        id: m.name?.replace(/^models\//, "") ?? "",
        name: m.name ?? "",
        displayName: m.displayName ?? m.name ?? "",
      }))
      .filter((m) => m.id);
    return NextResponse.json({ models });
  } catch (e) {
    console.error("List models error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list models" },
      { status: 500 }
    );
  }
}
