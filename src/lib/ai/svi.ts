// FLOWMINDS'26 — Stress Vulnerability Index (SVI) calculation.
// Transparent weighted linear combination — chosen so that every point of the
// score is traceable to a dimension and ultimately to observable evidence.

import { EvidenceCategory, RiskLevel, SviContribution } from "../types";

export const SVI_WEIGHTS: Record<EvidenceCategory, number> = {
  SAFETY: 0.26,
  DISTRESS: 0.16,
  FEAR: 0.14,
  ANXIETY: 0.1,
  TRAUMA: 0.12,
  ISOLATION: 0.1,
  DEPRESSION: 0.12,
  MEDICAL: 0,
  LEGAL: 0,
};

export interface SviScores {
  safetyConcernScore: number;
  distressScore: number;
  fearScore: number;
  anxietyScore: number;
  traumaIndicator: number;
  socialIsolationScore: number;
  depressionIndicator: number;
  medicalScore: number;
}

export function calculateSVI(scores: SviScores, speechModifier = 0) {
  const dim: Record<EvidenceCategory, number> = {
    SAFETY: scores.safetyConcernScore,
    DISTRESS: scores.distressScore,
    FEAR: scores.fearScore,
    ANXIETY: scores.anxietyScore,
    TRAUMA: scores.traumaIndicator,
    ISOLATION: scores.socialIsolationScore,
    DEPRESSION: scores.depressionIndicator,
    MEDICAL: scores.medicalScore,
    LEGAL: 0,
  };

  const breakdown: SviContribution[] = (Object.keys(SVI_WEIGHTS) as EvidenceCategory[]).map((d) => ({
    dimension: d,
    score: Math.round(dim[d]),
    weight: SVI_WEIGHTS[d],
    contribution: Math.round(dim[d] * SVI_WEIGHTS[d] * 10) / 10,
  }));

  const base = breakdown.reduce((acc, b) => acc + b.contribution, 0);
  const svi = Math.max(0, Math.min(100, Math.round(base + speechModifier)));

  return { svi, breakdown, speechModifier };
}

export function riskFromSVI(svi: number): RiskLevel {
  if (svi >= 75) return "CRITICAL";
  if (svi >= 50) return "HIGH";
  if (svi >= 25) return "MODERATE";
  return "LOW";
}

export function riskTone(risk: RiskLevel): string {
  switch (risk) {
    case "LOW": return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "MODERATE": return "text-amber-700 bg-amber-50 border-amber-200";
    case "HIGH": return "text-orange-700 bg-orange-50 border-orange-200";
    case "CRITICAL": return "text-rose-700 bg-rose-50 border-rose-200";
  }
}

export function riskChartColor(risk: RiskLevel): string {
  switch (risk) {
    case "LOW": return "#059669";
    case "MODERATE": return "#d97706";
    case "HIGH": return "#ea580c";
    case "CRITICAL": return "#e11d48";
  }
}

export function scoreBand(score: number): "LOW" | "MODERATE" | "HIGH" {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MODERATE";
  return "LOW";
}
