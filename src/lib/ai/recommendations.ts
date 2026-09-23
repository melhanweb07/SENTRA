// FLOWMINDS'26 — Support Recommendation Engine (prototype).
// Maps detected indicators to support recommendations. Every recommendation
// requires human verification — the system never acts autonomously.

import { AnalysisResult, EvidenceItem, Recommendation, RecommendationType } from "../types";

interface Scores {
  distressScore: number;
  fearScore: number;
  anxietyScore: number;
  traumaIndicator: number;
  depressionIndicator: number;
  safetyConcernScore: number;
  socialIsolationScore: number;
  medicalScore: number;
  legalScore: number;
}

const LABELS: Record<RecommendationType, string> = {
  COUNSELLING: "Counselling",
  LEGAL_AID: "Legal Aid",
  MEDICAL_ASSISTANCE: "Medical Assistance",
  POLICE_INTERVENTION: "Police Intervention",
  WITNESS_PROTECTION: "Witness Protection",
  EMERGENCY_SUPPORT: "Emergency Support",
};

export function recommendationLabel(t: RecommendationType): string {
  return LABELS[t];
}

function evidenceFor(evidence: EvidenceItem[], categories: string[], limit = 3): string[] {
  return evidence
    .filter((e) => categories.includes(e.category))
    .slice(0, limit)
    .map((e) => `"${e.phrase}"`);
}

export function buildRecommendations(
  scores: Scores,
  evidence: EvidenceItem[],
  caseCategory?: string
): Recommendation[] {
  const recs: Recommendation[] = [];
  const legalContext = ["harassment", "domestic violence", "cybercrime", "property dispute", "workplace grievance", "stalking"].includes(
    (caseCategory || "").toLowerCase()
  );

  if (scores.safetyConcernScore >= 75) {
    recs.push({
      type: "EMERGENCY_SUPPORT",
      reason: "Potential immediate safety concern detected. Trained personnel must review as a priority.",
      evidence: evidenceFor(evidence, ["SAFETY"]),
      strength: Math.min(100, Math.round(scores.safetyConcernScore)),
      requiresHumanVerification: true,
    });
  }
  if (scores.safetyConcernScore >= 45) {
    recs.push({
      type: "POLICE_INTERVENTION",
      reason: "Potential safety/security concern requires trained-person review.",
      evidence: evidenceFor(evidence, ["SAFETY"]),
      strength: Math.min(95, Math.round(scores.safetyConcernScore * 0.9)),
      requiresHumanVerification: true,
    });
  }
  if (scores.safetyConcernScore >= 35 && scores.fearScore >= 30) {
    recs.push({
      type: "WITNESS_PROTECTION",
      reason: "Potential threat/intimidation indicators alongside expressed fear.",
      evidence: evidenceFor(evidence, ["SAFETY", "FEAR"]),
      strength: Math.min(90, Math.round((scores.safetyConcernScore + scores.fearScore) / 2 * 0.85)),
      requiresHumanVerification: true,
    });
  }
  if (scores.medicalScore >= 30) {
    recs.push({
      type: "MEDICAL_ASSISTANCE",
      reason: "Potential physical/health-related concerns mentioned.",
      evidence: evidenceFor(evidence, ["MEDICAL"]),
      strength: Math.min(95, Math.round(scores.medicalScore)),
      requiresHumanVerification: true,
    });
  }
  if (scores.legalScore >= 30 || legalContext) {
    recs.push({
      type: "LEGAL_AID",
      reason: "Complaint involves legal/grievance-related concerns.",
      evidence: evidenceFor(evidence, ["LEGAL"]),
      strength: scores.legalScore >= 30 ? Math.min(90, Math.round(scores.legalScore * 1.2)) : 55,
      requiresHumanVerification: true,
    });
  }
  const emotional = Math.max(
    scores.distressScore,
    scores.anxietyScore,
    scores.traumaIndicator,
    scores.depressionIndicator
  );
  if (emotional >= 30) {
    recs.push({
      type: "COUNSELLING",
      reason: "Elevated distress indicators.",
      evidence: evidenceFor(evidence, ["DISTRESS", "ANXIETY", "TRAUMA", "DEPRESSION", "FEAR"]),
      strength: Math.min(95, Math.round(emotional)),
      requiresHumanVerification: true,
    });
  }

  return recs.sort((a, b) => b.strength - a.strength);
}

export function finalRecommendations(analysis: AnalysisResult): Recommendation[] {
  return analysis.recommendations;
}
