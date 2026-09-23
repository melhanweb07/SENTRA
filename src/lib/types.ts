// FLOWMINDS'26 — shared domain types
// Prototype for SIH26093. Decision-support only; human verification required.

export type Role = "COUNSELLOR" | "SUPPORT_OFFICER" | "ADMIN";
export type Language = "en" | "ta" | "hi";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type CaseStatus =
  | "OPEN"
  | "IN_ASSESSMENT"
  | "AWAITING_VERIFICATION"
  | "REFERRED"
  | "ACTIONED"
  | "ESCALATED"
  | "CLOSED";

export type Channel = "NHAA 14566" | "WEB_PORTAL" | "CHATBOT" | "MOBILE_APP" | "IVRS";

export type RecommendationType =
  | "COUNSELLING"
  | "LEGAL_AID"
  | "MEDICAL_ASSISTANCE"
  | "POLICE_INTERVENTION"
  | "WITNESS_PROTECTION"
  | "EMERGENCY_SUPPORT";

export type EvidenceCategory =
  | "SAFETY" | "FEAR" | "DISTRESS" | "ANXIETY" | "TRAUMA"
  | "ISOLATION" | "DEPRESSION" | "MEDICAL" | "LEGAL";

export interface SpeechFeatures {
  speechRate?: number;        // words per minute (relative to baseline 120)
  tremor?: number;             // 0–1 normalised vocal tremor estimate
  pauseFrequency?: number;     // 0–1
  volumeVariability?: number;  // 0–1
  simulated?: boolean;         // true when produced by the demo simulation layer
}

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  phrase: string;
  weight: number;
  segmentIndex: number;
  severity: "LOW" | "MODERATE" | "HIGH";
}

export interface SviContribution {
  dimension: EvidenceCategory;
  score: number;
  weight: number;
  contribution: number;
}

export interface Recommendation {
  type: RecommendationType;
  reason: string;
  evidence: string[];
  strength: number; // 0–100
  requiresHumanVerification: true;
}

export interface AnalysisResult {
  distressScore: number;
  fearScore: number;
  anxietyScore: number;
  traumaIndicator: number;
  depressionIndicator: number;
  safetyConcernScore: number;
  socialIsolationScore: number;
  medicalScore: number;
  legalScore: number;
  evidence: EvidenceItem[];
  events: string[];
  riskLevel: RiskLevel;
  svi: number;
  sviBreakdown: SviContribution[];
  recommendations: Recommendation[];
  escalationRequired: boolean;
  speechModifier: number;
}

export interface Segment {
  id: string;
  role: "COMPLAINANT" | "OFFICER";
  text: string;
  language: Language;
  mode: "TEXT" | "VOICE";
  sttEngine?: string;
  atSec: number;
  analysis?: AnalysisResult; // cumulative analysis after this segment
}

export interface TimelinePoint {
  t: number; // seconds into the conversation
  distress: number;
  fear: number;
  anxiety: number;
  safety: number;
  svi: number;
  events: string[];
}

export interface Verification {
  decision: "ACCEPT" | "MODIFY" | "REJECT";
  notes: string;
  modifiedRecommendationTypes: RecommendationType[];
  reviewerId: string;
  reviewerName: string;
  at: string;
}

export interface CaseRecord {
  id: string;
  caseCode: string; // FM-2026-XXXX
  createdAt: string;
  language: Language;
  name?: string;
  ageRange: string;
  contactPreference: string;
  location: string;
  category: string;
  channel: Channel;
  consent: boolean;
  status: CaseStatus;
  createdBy: string;
  assignedTo?: string;
  svi?: number;
  risk?: RiskLevel;
  lastActivityAt: string;
}

export interface Assessment {
  id: string;
  caseId: string;
  segments: Segment[];
  timeline: TimelinePoint[];
  status: "ACTIVE" | "COMPLETED";
  startedAt: string;
  completedAt?: string;
  verification?: Verification;
  finalAnalysis?: AnalysisResult;
}

export interface Referral {
  id: string;
  caseId: string;
  type: RecommendationType;
  provider: string;
  notes: string;
  status: "PENDING" | "ACCEPTED" | "COMPLETED";
  createdAt: string;
  createdBy: string;
}

export interface FollowUp {
  id: string;
  caseId: string;
  dueAt: string;
  mode: "CALL" | "IN_PERSON" | "VIDEO";
  notes: string;
  status: "SCHEDULED" | "COMPLETED" | "MISSED";
  assignedTo: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  caseId?: string;
  details: string;
  severity: "INFO" | "WARN" | "CRITICAL";
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // demo only — replaced by Firebase Auth in production
  role: Role;
  title: string;
}

export interface Settings {
  safetyThreshold: number; // safety-concern score that triggers a safety alert
  uiLanguage: Language;
}

export interface DB {
  users: User[];
  cases: CaseRecord[];
  assessments: Assessment[];
  referrals: Referral[];
  followUps: FollowUp[];
  audit: AuditEntry[];
  session: { userId: string | null };
  settings: Settings;
  seq: number;
}
