"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { CaseStatus, EvidenceItem, RiskLevel } from "@/lib/types";
import { CATEGORY_LABELS, cn, riskToneClass, STATUS_LABELS, STATUS_TONES } from "@/lib/utils";
import { scoreBand } from "@/lib/ai/svi";

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
