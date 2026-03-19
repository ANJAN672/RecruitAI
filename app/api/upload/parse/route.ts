import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { parseUploadedFile, FileParseError } from "@/lib/parse-file";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await parseUploadedFile(file);
    return NextResponse.json({ text });
  } catch (e) {
    if (e instanceof FileParseError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("POST /api/upload/parse", e);
    return NextResponse.json(
      { error: "Failed to parse file" },
      { status: 500 }
    );
  }
}
