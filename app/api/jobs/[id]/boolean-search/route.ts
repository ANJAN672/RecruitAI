import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateBooleanSearch } from "@/lib/ai";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if we already have a saved boolean search for this job
    const { data: existing } = await supabase
      .from("boolean_searches")
      .select("query")
      .eq("job_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (existing?.query) {
      return NextResponse.json({ query: existing.query });
    }

    const { data: job, error } = await supabase.from("jobs").select("*").eq("id", id).single();
    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const j = job as { role: string; hard_skills: string; experience: string };
    const query = await generateBooleanSearch(j.role ?? "", j.hard_skills ?? "[]", j.experience ?? "");

    // Persist the generated query
    await supabase.from("boolean_searches").insert({
      job_id: Number(id),
      user_id: user.id,
      query,
    });

    return NextResponse.json({ query });
  } catch (e) {
    console.error("GET /api/jobs/[id]/boolean-search", e);
    return NextResponse.json({ error: "Failed to generate boolean search" }, { status: 500 });
  }
}
