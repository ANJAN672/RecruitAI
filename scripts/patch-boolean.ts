import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

async function patch() {
  // Get all jobs
  const { data: jobs } = await supabase.from("jobs").select("*");
  if (!jobs?.length) { console.log("No jobs"); return; }

  for (const job of jobs) {
    // Get latest boolean search for this job
    const { data: latest } = await supabase
      .from("boolean_searches")
      .select("id, query")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!latest) { console.log(`Job ${job.id}: no boolean search, skipping`); continue; }

    let existing: any = {};
    try { existing = JSON.parse(latest.query); } catch { console.log(`Job ${job.id}: invalid JSON in query, skipping`); continue; }
    if (existing.indeed_boolean) { console.log(`Job ${job.id}: already has new fields, skipping`); continue; }

    const hardSkills: string[] = JSON.parse(job.hard_skills || "[]");
    console.log(`Job ${job.id} (${job.title}): generating new boolean fields...`);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate boolean search queries for these job platforms.

Role: ${job.role}
Key Skills: ${hardSkills.slice(0, 6).join(", ")}
Experience: ${job.experience}

Return JSON with exactly 4 fields. Each is a simple boolean string for direct platform search. MAXIMUM 2 AND groups per query. Example format: ("Role Title" OR "Alt Title") AND ("Skill1" OR "Skill2")`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            indeed_boolean: { type: Type.STRING },
            dice_boolean: { type: Type.STRING },
            careerbuilder_boolean: { type: Type.STRING },
            monster_boolean: { type: Type.STRING },
          },
          required: ["indeed_boolean", "dice_boolean", "careerbuilder_boolean", "monster_boolean"],
        },
      },
    });

    const newFields = JSON.parse(response.text || "{}");
    const merged = { ...existing, ...newFields };

    const { error } = await supabase
      .from("boolean_searches")
      .update({ query: JSON.stringify(merged) })
      .eq("id", latest.id);

    if (error) {
      console.error(`Job ${job.id}: update failed:`, error.message);
    } else {
      console.log(`Job ${job.id}: patched ✓`);
      console.log("  indeed:", newFields.indeed_boolean);
      console.log("  dice:", newFields.dice_boolean);
    }
  }
  console.log("\nDone.");
}

patch().catch(console.error);
