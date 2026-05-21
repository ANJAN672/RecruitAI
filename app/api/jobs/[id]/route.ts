import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/jobs/[id]", e);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
