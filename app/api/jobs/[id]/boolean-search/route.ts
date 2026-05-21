import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateBooleanSearch } from "@/lib/ai";

// AI generation can take longer than the platform default.
export const maxDuration = 60;

/** GET — return the saved boolean search for this job (does not generate). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase
      .from("boolean_searches")
      .select("query")
      .eq("job_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ query: existing?.query ?? null });
  } catch (e) {
    console.error("GET /api/jobs/[id]/boolean-search", e);
    return NextResponse.json({ error: "Failed to load boolean search" }, { status: 500 });
  }
}

/** POST — generate a fresh boolean search with AI and persist it. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: job, error } = await supabase
      .from("jobs")
      .select("role, hard_skills, experience")
      .eq("id", id)
      .single();
    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const j = job as { role: string; hard_skills: string; experience: string };
    const query = await generateBooleanSearch(j.role ?? "", j.hard_skills ?? "[]", j.experience ?? "");

    await supabase.from("boolean_searches").insert({
      job_id: Number(id),
      user_id: user.id,
      query,
    });

    return NextResponse.json({ query });
  } catch (e) {
    console.error("POST /api/jobs/[id]/boolean-search", e);
    return NextResponse.json({ error: "Failed to generate boolean search" }, { status: 500 });
  }
}
