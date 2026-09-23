"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { AnalysisResult, CaseStatus, EvidenceItem, RiskLevel } from "@/lib/types";
import { CATEGORY_LABELS, cn, riskToneClass, STATUS_LABELS, STATUS_TONES } from "@/lib/utils";
import { scoreBand } from "@/lib/ai/svi";
import { Modal } from "@/components/ui";

export function RiskBadge({ risk }: { risk?: RiskLevel | string | null }) {
  if (!risk) return <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">—</span>;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide", riskToneClass(risk))}>
      {risk}
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", STATUS_TONES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

const RISK_COLORS: Record<string, string> = {
  LOW: "#059669", MODERATE: "#d97706", HIGH: "#ea580c", CRITICAL: "#e11d48",
};

export function SviDial({ svi, risk, size = 150 }: { svi: number; risk: RiskLevel | string; size?: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, svi)) / 100;
  const color = RISK_COLORS[risk] || "#64748b";
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <motion.circle
            cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct) }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums text-slate-900">{Math.round(svi)}</span>
          <span className="text-[11px] font-medium text-slate-400">/ 100</span>
        </div>
      </div>
      <span className={cn("mt-2 rounded-full border px-3 py-1 text-xs font-bold tracking-widest", riskToneClass(risk))}>
        {risk}
      </span>
      <p className="mt-2 max-w-[220px] text-center text-[10px] leading-snug text-slate-400">
        Decision-support indicator — human verification required.
      </p>
    </div>
  );
}

const BAR_TONES: Record<string, string> = {
  LOW: "bg-emerald-500", MODERATE: "bg-amber-500", HIGH: "bg-rose-500",
};

export function IndicatorBar({ label, score, note }: { label: string; score: number; note?: string }) {
  const band = scoreBand(score);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-[11px] font-semibold tabular-nums text-slate-500">
          {score} <span className="font-normal text-slate-400">· {band}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cn("h-full rounded-full", BAR_TONES[band])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, score)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {note && <p className="mt-1 text-[10px] text-slate-400">{note}</p>}
    </div>
  );
}

export function EvidenceChip({ item }: { item: EvidenceItem }) {
  const tones: Record<string, string> = {
    SAFETY: "bg-rose-50 text-rose-700 border-rose-200",
    FEAR: "bg-orange-50 text-orange-700 border-orange-200",
    DISTRESS: "bg-amber-50 text-amber-700 border-amber-200",
    ANXIETY: "bg-yellow-50 text-yellow-700 border-yellow-200",
    TRAUMA: "bg-violet-50 text-violet-700 border-violet-200",
    ISOLATION: "bg-sky-50 text-sky-700 border-sky-200",
    DEPRESSION: "bg-indigo-50 text-indigo-700 border-indigo-200",
    MEDICAL: "bg-teal-50 text-teal-700 border-teal-200",
    LEGAL: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]", tones[item.category] || tones.LEGAL)}>
      <span className="font-semibold">{CATEGORY_LABELS[item.category]}</span>
      <span className="text-slate-400">·</span>
      <span className="italic">&ldquo;{item.phrase}&rdquo;</span>
    </span>
  );
}

// "WHY THIS ASSESSMENT?" evidence card
export function EvidenceCard({
  title, band, evidence,
}: { title: string; band: "LOW" | "MODERATE" | "HIGH"; evidence: string[] }) {
  const tone =
    band === "HIGH" ? "border-rose-200 bg-rose-50/60"
    : band === "MODERATE" ? "border-amber-200 bg-amber-50/60"
    : "border-emerald-200 bg-emerald-50/60";
  return (
    <div className={cn("rounded-xl border p-4", tone)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <span className="text-[11px] font-bold tracking-wide text-slate-600">{band}</span>
      </div>
      {evidence.length ? (
        <ul className="mt-2 space-y-1">
          {evidence.map((e, i) => (
            <li key={i} className="text-xs leading-relaxed text-slate-600">• {e}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs italic text-slate-500">No strong indicator detected.</p>
      )}
    </div>
  );
}

export function ExplainabilityModal({
  open, onClose, analysis,
}: {
  open: boolean; onClose: () => void; analysis?: AnalysisResult;
}) {
  if (!open || !analysis) return null;

  const rows = analysis.sviBreakdown.filter((b) => b.weight > 0).map((b) => {
    const matched = analysis.evidence.filter((item) => item.category === b.dimension).slice(0, 2);
    return {
      label: CATEGORY_LABELS[b.dimension] || b.dimension,
      value: b.contribution,
      source: matched.length ? matched.map((item) => item.phrase).join(" • ") : "Rule-based evidence contribution",
    };
  });

  return (
    <Modal open={open} onClose={onClose} title={`WHY SVI = ${analysis.svi}?`} wide>
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-500">
          Rule-based evidence contribution • Decision-support indicator • Human verification required.
        </p>

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">{row.label}</span>
                <span className="text-sm font-bold tabular-nums text-indigo-700">+{row.value}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{row.source}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-800">TOTAL</span>
            <span className="text-lg font-bold tabular-nums text-indigo-700">{analysis.svi} / 100</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function SafetyIndicatorsPanel({ analysis }: { analysis?: AnalysisResult }) {
  const indicators = [
    {
      label: "Potential immediate danger",
      status: analysis?.escalationRequired ? "DETECTED" : "POSSIBLE",
      detail: analysis?.escalationRequired ? "Potential immediate safety concern detected — human verification required." : "No immediate safety escalation recorded in this demo sequence.",
    },
    {
      label: "Threat / intimidation",
      status: analysis && analysis.safetyConcernScore >= 35 ? "DETECTED" : "POSSIBLE",
      detail: analysis && analysis.safetyConcernScore >= 35
        ? "Safety-related statement or threat-related language detected. Review evidence before action."
        : "Threat-related signals are not dominant in this scenario.",
    },
    {
      label: "Potential self-harm indicator",
      status: analysis && analysis.depressionIndicator >= 30 ? "POTENTIAL INDICATOR" : "NO STRONG SIGNAL",
      detail: analysis && analysis.depressionIndicator >= 30
        ? "Potential self-harm indicator detected — human verification required."
        : "No strong self-harm indicator detected in the current simulated interaction.",
    },
    {
      label: "Social isolation",
      status: analysis && analysis.socialIsolationScore >= 30 ? "POSSIBLE" : "LOW",
      detail: analysis && analysis.socialIsolationScore >= 30
        ? "Isolation indicators were present and should be reviewed with case context."
        : "Social isolation indicators were limited in this scenario.",
    },
    {
      label: "Severe vulnerability",
      status: analysis && analysis.distressScore >= 60 ? "DETECTED" : "MODERATE",
      detail: analysis && analysis.distressScore >= 60
        ? "Multiple vulnerability indicators were present alongside elevated distress."
        : "Moderate vulnerability indicators observed; human review remains required.",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Safety Indicators</h3>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
          Human verification required
        </span>
      </div>
      <div className="space-y-3">
        {indicators.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">{item.label}</span>
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                item.status === "DETECTED" || item.status === "POTENTIAL INDICATOR" ? "border-rose-200 bg-rose-50 text-rose-700" :
                item.status === "POSSIBLE" || item.status === "MODERATE" ? "border-amber-200 bg-amber-50 text-amber-700" :
                "border-slate-200 bg-slate-100 text-slate-600"
              )}>{item.status}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SafetyAlert({ visible, compact }: { visible: boolean; compact?: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "rounded-xl border border-rose-300 bg-rose-50 p-4",
            compact ? "" : "shadow-sm"
          )}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-bold text-rose-800">🚨 SAFETY ALERT</p>
              <p className="mt-0.5 text-sm text-rose-700">
                Potential immediate safety concern detected.
              </p>
              {!compact && (
                <p className="mt-2 text-xs leading-relaxed text-rose-600">
                  This alert requires <strong>human verification</strong>. The system will not contact
                  police or emergency services autonomously. A trained reviewer must decide the action.
                </p>
              )}
            </div>
            <ShieldCheck className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DemoModeNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-[11px] leading-relaxed text-slate-400">
      {children ?? "Prototype signal detection — deterministic demonstration, not clinically validated AI."}
    </p>
  );
}
