import { NextResponse } from "next/server";
import { analyzeAssessment } from "@/lib/ai/analyzeAssessment";
import { Language, SpeechFeatures } from "@/lib/types";
import { saveAnalysisResult } from "@/lib/firebase-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, language, speechFeatures, caseContext, caseId } = body as {
      transcript: string;
      language: Language;
      speechFeatures?: SpeechFeatures;
      caseContext?: { category?: string; channel?: string };
      caseId?: string;
    };

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const analysis = analyzeAssessment({
      transcript,
      language: language || "en",
      speechFeatures,
      caseContext,
    });

    if (caseId) {
      await saveAnalysisResult(caseId, { transcript, language, analysis, caseContext });
    }

    return NextResponse.json({
      mode: caseId ? "firebase-backed" : "prototype-demo",
      disclaimer: "Prototype AI Assessment — Demonstration Mode. Not clinically validated. Human verification required.",
      analysis,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
