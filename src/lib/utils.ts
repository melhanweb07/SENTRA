// FLOWMINDS'26 — shared utilities and label maps

import {
  Assessment, AuditEntry, CaseRecord, CaseStatus, Channel, DB, EvidenceCategory,
  FollowUp, Referral, RiskLevel,
} from "./types";

export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  SAFETY: "Safety Concern",
  FEAR: "Fear Indicator",
  DISTRESS: "Distress Signal",
  ANXIETY: "Anxiety Indicator",
  TRAUMA: "Trauma-Related Distress",
  ISOLATION: "Social Isolation",
  DEPRESSION: "Depression Indicator",
  MEDICAL: "Medical Concern",
  LEGAL: "Legal Context",
};

export const STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: "Open",
  IN_ASSESSMENT: "In Assessment",
  AWAITING_VERIFICATION: "Awaiting Verification",
  REFERRED: "Referred",
  ACTIONED: "Actioned",
  ESCALATED: "Escalated",
  CLOSED: "Closed",
};

export const STATUS_TONES: Record<CaseStatus, string> = {
  OPEN: "bg-slate-100 text-slate-700 border-slate-200",
  IN_ASSESSMENT: "bg-indigo-50 text-indigo-700 border-indigo-200",
  AWAITING_VERIFICATION: "bg-amber-50 text-amber-700 border-amber-200",
  REFERRED: "bg-sky-50 text-sky-700 border-sky-200",
  ACTIONED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ESCALATED: "bg-rose-50 text-rose-700 border-rose-200",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  "NHAA 14566": "NHAA Helpline 14566",
  WEB_PORTAL: "Web Portal",
  CHATBOT: "Chatbot",
  MOBILE_APP: "Mobile App",
  IVRS: "IVRS",
};

export const COMPLAINT_CATEGORIES = [
  "Harassment",
  "Domestic Violence",
  "Cybercrime",
  "Stalking",
  "Property Dispute",
  "Workplace Grievance",
  "Consumer Grievance",
  "Other",
];

export const AGE_RANGES = ["Under 18", "18–25", "26–40", "41–60", "60+", "Prefer not to say"];

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function languageName(lang: string): string {
  if (lang === "ta") return "தமிழ் (Tamil)";
  if (lang === "hi") return "हिन्दी (Hindi)";
  return "English";
}

export function riskToneClass(risk?: RiskLevel | string): string {
  switch (risk) {
    case "LOW": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "MODERATE": return "bg-amber-50 text-amber-700 border-amber-200";
    case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200";
    case "CRITICAL": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

// ---------------------------------------------------------------------------
// Case report export (plain-text, human-readable, audit-friendly)
// ---------------------------------------------------------------------------

export function buildReportText(
  c: CaseRecord,
  a: Assessment | undefined,
  referrals: Referral[],
  followUps: FollowUp[],
  audit: AuditEntry[]
): string {
  const L: string[] = [];
  const line = (s = "") => L.push(s);
  line("FLOWMINDS'26 — CASE ASSESSMENT REPORT");
  line("Prototype AI Assessment — Demonstration Mode");
  line("Decision-support indicator only. Human verification required.");
  line("=".repeat(72));
  line(`Case ID        : ${c.caseCode}`);
  line(`Created        : ${formatDateTime(c.createdAt)}`);
  line(`Language       : ${languageName(c.language)}`);
  line(`Channel        : ${CHANNEL_LABELS[c.channel]}`);
  line(`Category       : ${c.category}`);
  line(`Status         : ${STATUS_LABELS[c.status]}`);
  line(`Age range      : ${c.ageRange}`);
  line(`Contact pref.  : ${c.contactPreference}`);
  line(`Location       : ${c.location}`);
  line(`Consent recorded: ${c.consent ? "Yes" : "No"}`);
  line("");
  if (a) {
    line("-".repeat(72));
    line("ASSESSMENT");
    line("-".repeat(72));
    const f = a.finalAnalysis;
    if (f) {
      line(`Stress Vulnerability Index : ${f.svi} / 100  (${f.riskLevel})`);
      line("");
      line("Dimension scores (0–100):");
      line(`  Distress            : ${f.distressScore}`);
      line(`  Fear                : ${f.fearScore}`);
      line(`  Anxiety             : ${f.anxietyScore}`);
      line(`  Trauma indicator    : ${f.traumaIndicator}`);
      line(`  Depression indicator : ${f.depressionIndicator}`);
      line(`  Safety concern      : ${f.safetyConcernScore}`);
      line(`  Social isolation    : ${f.socialIsolationScore}`);
      line(`  Medical concern     : ${f.medicalScore}`);
      line("");
      line("Observed evidence (prototype signal detection):");
      f.evidence.forEach((e) =>
        line(`  [${CATEGORY_LABELS[e.category]} / ${e.severity}] "${e.phrase}"`)
      );
      line("");
      line("Recommendations (all require human verification):");
      f.recommendations.forEach((r, i) =>
        line(`  ${i + 1}. ${r.type} — ${r.reason} (strength ${r.strength})`)
      );
    }
    line("");
    line(`Conversation segments : ${a.segments.length}`);
    line(`Started               : ${formatDateTime(a.startedAt)}`);
    line(`Completed             : ${a.completedAt ? formatDateTime(a.completedAt) : "—"}`);
    if (a.verification) {
      line("");
      line("Human verification:");
      line(`  Decision : ${a.verification.decision}`);
      line(`  Reviewer : ${a.verification.reviewerName}`);
      line(`  Notes    : ${a.verification.notes || "—"}`);
    }
  }
  if (referrals.length) {
    line("");
    line("-".repeat(72));
    line("REFERRALS");
    line("-".repeat(72));
    referrals.forEach((r) =>
      line(`  ${formatDate(r.createdAt)}  ${r.type} → ${r.provider} [${r.status}]`)
    );
  }
  if (followUps.length) {
    line("");
    line("-".repeat(72));
    line("FOLLOW-UPS");
    line("-".repeat(72));
    followUps.forEach((f) =>
      line(`  Due ${formatDateTime(f.dueAt)}  ${f.mode}  [${f.status}]  ${f.notes}`)
    );
  }
  line("");
  line("-".repeat(72));
  line(`AUDIT TRAIL (${audit.length} entries)`);
  line("-".repeat(72));
  audit
    .slice()
    .reverse()
    .forEach((e) =>
      line(`  ${formatDateTime(e.at)}  ${e.action}  by ${e.actorName}${e.caseId ? ` (${e.caseId})` : ""}`)
    );
  line("");
  line("Generated by FLOWMINDS'26 prototype. Not a clinical diagnosis.");
  return L.join("\n");
}

export function countVerificationsPending(db: DB): number {
  return db.cases.filter((c) => c.status === "AWAITING_VERIFICATION").length;
}
