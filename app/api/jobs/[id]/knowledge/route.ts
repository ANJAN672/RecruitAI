import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateKnowledge } from "@/lib/ai";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if we already have a saved knowledge guide for this job
    const { data: existing } = await supabase
      .from("knowledge_guides")
      .select("concepts, interview_questions")
      .eq("job_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (existing) {
      return NextResponse.json(existing);
    }

    const { data: job, error } = await supabase.from("jobs").select("role, hard_skills").eq("id", id).single();
    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    const j = job as { role: string; hard_skills: string };
    const result = await generateKnowledge(j.role ?? "", j.hard_skills ?? "[]");

    // Persist the generated knowledge guide
    await supabase.from("knowledge_guides").insert({
      job_id: Number(id),
      user_id: user.id,
      concepts: result.concepts ?? [],
      interview_questions: result.interview_questions ?? [],
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/jobs/[id]/knowledge", e);
    return NextResponse.json({ error: "Failed to generate knowledge" }, { status: 500 });
  }
}
