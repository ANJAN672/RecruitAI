import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { scoreCandidate } from "@/lib/ai";

/** Strip LinkedIn / general page noise from pasted profile text */
function cleanProfileText(raw: string): string {
  let text = raw
    // Remove common LinkedIn UI strings
    .replace(/People also viewed[\s\S]*$/i, "")
    .replace(/More profiles for you[\s\S]*$/i, "")
    .replace(/You might like[\s\S]*$/i, "")
    .replace(/People you may know[\s\S]*$/i, "")
    .replace(/Show all\s*$/gim, "")
    .replace(/LinkedIn Corporation.*$/gim, "")
    .replace(/About\s+Accessibility\s+Talent Solutions[\s\S]*$/i, "")
    .replace(/\b\d+\s*followers?\b/gi, "")
    .replace(/Follow\s+Message/gi, "")
    .replace(/Try Premium.*$/gim, "")
    .replace(/Manage your account.*$/gim, "")
    .replace(/Select language[\s\S]*$/i, "")
    // Collapse whitespace
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  // Cap at ~4000 chars to keep AI fast
  if (text.length > 4000) text = text.slice(0, 4000);
  return text;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("job_id", id)
      .order("match_score", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("GET /api/jobs/[id]/candidates", e);
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, profile_url, profile_text } = await req.json();
    if (!name || !profile_text) {
      return NextResponse.json({ error: "Name and profile text are required" }, { status: 400 });
    }
    const { data: job, error: jobErr } = await supabase.from("jobs").select("*").eq("id", jobId).single();
    if (jobErr || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const j = job as { role: string; experience: string; hard_skills: string; soft_skills: string };
    // Strip LinkedIn page noise to reduce token count and speed up AI scoring
    const cleanedProfile = cleanProfileText(profile_text);
    const parsed = await scoreCandidate(cleanedProfile, j);
    const { data: candidate, error } = await supabase
      .from("candidates")
      .insert({
        job_id: Number(jobId),
        name,
        profile_url: profile_url ?? "",
        profile_text,
        skills: JSON.stringify(parsed.skills ?? []),
        experience: parsed.experience ?? "",
        match_score: parsed.match_score ?? 0,
        match_reasoning: parsed.match_reasoning ?? "",
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(candidate);
  } catch (e) {
    console.error("POST /api/jobs/[id]/candidates", e);
    return NextResponse.json({ error: "Failed to ingest candidate" }, { status: 500 });
  }
}
