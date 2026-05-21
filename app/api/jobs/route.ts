import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { parseJobDescription } from "@/lib/ai";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/jobs", e);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }
    const parsed = await parseJobDescription(description);
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title,
        description,
        role: parsed.role ?? "",
        experience: parsed.experience ?? "",
        hard_skills: JSON.stringify(parsed.hard_skills ?? []),
        soft_skills: JSON.stringify(parsed.soft_skills ?? []),
        certifications: JSON.stringify(parsed.certifications ?? []),
        user_id: user.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error("POST /api/jobs", e);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
