// FLOWMINDS'26 — Prototype AI Assessment Engine (DETERMINISTIC DEMO MODE).
//
// This is a rule-based signal-detection engine used when live AI inference
// services (Whisper ASR, transformer NLP, prosodic models) are unavailable.
// It is deterministic and explainable: every score traces to matched phrases
// and speech features. It is NOT a clinical instrument.
//
// Production path: Next.js/WebSocket -> FastAPI -> Whisper + speech analysis
// (Librosa) -> NLP/ML -> SVI engine -> Firebase. This module mirrors that
// contract so the frontend can be pointed at the real service later.

import { AnalysisResult, EvidenceCategory, EvidenceItem, Language, SpeechFeatures } from "../types";
import { detectSupportRequest, LEXICON } from "./lexicon";
import { buildRecommendations } from "./recommendations";
import { calculateSVI, riskFromSVI } from "./svi";

export const SAFETY_ALERT_THRESHOLD = 60;

export interface AnalyzeInput {
  transcript: string;
  language: Language;
  speechFeatures?: SpeechFeatures;
  conversationHistory?: { text: string; segmentIndex: number }[];
  caseContext?: { category?: string; channel?: string };
  segmentIndex?: number;
}

const CATEGORY_MULTIPLIER: Record<EvidenceCategory, number> = {
  SAFETY: 2.2,
  FEAR: 4.0,
  DISTRESS: 3.8,
  ANXIETY: 4.2,
  TRAUMA: 4.2,
  ISOLATION: 4.0,
  DEPRESSION: 4.0,
  MEDICAL: 4.2,
  LEGAL: 2.8,
};

function severityOf(weight: number): EvidenceItem["severity"] {
  if (weight >= 8) return "HIGH";
  if (weight >= 5) return "MODERATE";
  return "LOW";
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

export function analyzeAssessment(input: AnalyzeInput): AnalysisResult {
  const { transcript, language, speechFeatures } = input;
  const text = (transcript || "").toLowerCase();

  // ---- 1. Phrase matching (prototype signal detection) ----
  const lex = LEXICON[language] || LEXICON.en;
  const seen = new Set<string>();
  const evidence: EvidenceItem[] = [];
  const sums: Record<EvidenceCategory, number> = {
    SAFETY: 0, FEAR: 0, DISTRESS: 0, ANXIETY: 0, TRAUMA: 0,
    ISOLATION: 0, DEPRESSION: 0, MEDICAL: 0, LEGAL: 0,
  };

  lex.forEach((entry) => {
    if (text.includes(entry.phrase) && !seen.has(entry.phrase)) {
      seen.add(entry.phrase);
      sums[entry.category] += entry.weight;
      evidence.push({
        id: `${entry.category}-${evidence.length}`,
        category: entry.category,
        phrase: entry.phrase,
        weight: entry.weight,
        segmentIndex: input.segmentIndex ?? 0,
        severity: severityOf(entry.weight),
      });
    }
  });

  // Deduplicate across whole conversation: evidence is phrase-level (already
  // distinct). Category score = capped weighted sum.
  const score = (c: EvidenceCategory) =>
    Math.round(clamp(sums[c] * CATEGORY_MULTIPLIER[c] + (c === "LEGAL" ? 0 : 0)));

  let distressScore = score("DISTRESS");
  let fearScore = score("FEAR");
  const anxietyScore = score("ANXIETY");
  const traumaIndicator = score("TRAUMA");
  const depressionIndicator = score("DEPRESSION");
  const safetyConcernScore = score("SAFETY");
  const socialIsolationScore = score("ISOLATION");
  const medicalScore = score("MEDICAL");
  const legalScore = score("LEGAL");

  // ---- 2. Speech / prosodic contribution (demo simulation or measured) ----
  let speechModifier = 0;
  if (speechFeatures) {
    const tremor = speechFeatures.tremor ?? 0;
    const pause = speechFeatures.pauseFrequency ?? 0;
    const variability = speechFeatures.volumeVariability ?? 0;
    distressScore = Math.round(clamp(distressScore + tremor * 14 + variability * 6));
    fearScore = Math.round(clamp(fearScore + tremor * 8));
    speechModifier = Math.round(tremor * 5 + pause * 3);
  }

  // ---- 3. SVI ----
  const { svi, breakdown } = calculateSVI(
    { distressScore, fearScore, anxietyScore, traumaIndicator, depressionIndicator, safetyConcernScore, socialIsolationScore, medicalScore },
    speechModifier
  );
  const riskLevel = riskFromSVI(svi);

  // ---- 4. Timeline events (Dynamic Distress Mapping markers) ----
  const events: string[] = [];
  if (sums.SAFETY > 0) events.push("Threat / safety concern detected");
  if (sums.MEDICAL > 0) events.push("Physical health concern mentioned");
  if (sums.TRAUMA > 0) events.push("Trauma-related disclosure");
  if (detectSupportRequest(text, language)) events.push("Support request");
  if (evidence.length >= 4) events.push("Multiple distress signals");

  // ---- 5. Recommendations (human verification required) ----
  const recommendations = buildRecommendations(
    { distressScore, fearScore, anxietyScore, traumaIndicator, depressionIndicator, safetyConcernScore, socialIsolationScore, medicalScore, legalScore },
    evidence,
    input.caseContext?.category
  );

  return {
    distressScore,
    fearScore,
    anxietyScore,
    traumaIndicator,
    depressionIndicator,
    safetyConcernScore,
    socialIsolationScore,
    medicalScore,
    legalScore,
    evidence: evidence.sort((a, b) => b.weight - a.weight),
    events,
    riskLevel,
    svi,
    sviBreakdown: breakdown,
    recommendations,
    escalationRequired: safetyConcernScore >= SAFETY_ALERT_THRESHOLD,
    speechModifier,
  };
}
