import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateInterviewReport } from "@/lib/ai";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { notes } = await req.json();
    if (!notes) return NextResponse.json({ error: "Interview notes are required" }, { status: 400 });
    const { data: candidate, error: candErr } = await supabase.from("candidates").select("id, job_id").eq("id", candidateId).single();
    if (candErr || !candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    const parsed = await generateInterviewReport(notes);
    const { data: report, error } = await supabase
      .from("interview_reports")
      .insert({
        candidate_id: candidate.id,
        job_id: candidate.job_id,
        notes,
        strengths: parsed.strengths ?? "",
        weaknesses: parsed.weaknesses ?? "",
        recommendation: parsed.recommendation ?? "",
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ id: report.id, ...parsed });
  } catch (e) {
    console.error("POST /api/candidates/[id]/report", e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
