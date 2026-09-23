"use client";

import { useState } from "react";
import { RotateCcw, ShieldAlert, SlidersHorizontal } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { LANGUAGES } from "@/lib/i18n";
import { Language } from "@/lib/types";
import { SAFETY_ALERT_THRESHOLD } from "@/lib/ai/analyzeAssessment";

export default function SettingsPage() {
  const { db, user, setUiLanguage, resetDemo } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!db || !user) return null;

  return (
    <StaffShell>
      <PageHeader title="Settings" sub="Prototype configuration — demonstration mode" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Interface language" subtitle="Multilingual access — applies across the staff application">
          <div className="space-y-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setUiLanguage(l.code as Language)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                  db.settings.uiLanguage === l.code
                    ? "border-indigo-400 bg-indigo-50 font-semibold text-indigo-800"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{l.native}</span>
                <span className="text-xs text-slate-400">{l.label} · {l.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Conversation analysis supports the same languages; adding one is a lexicon file + dictionary entry.
          </p>
        </Card>

        <Card title="Safety alert threshold" subtitle="When a safety alert is raised for human attention">
          <div className="flex items-center gap-4">
            <SlidersHorizontal className="h-8 w-8 text-slate-300" />
            <div>
              <p className="text-3xl font-bold text-slate-900">{SAFETY_ALERT_THRESHOLD}<span className="text-base font-medium text-slate-400">/100</span></p>
              <p className="text-xs text-slate-500">safety-concern score triggers SAFETY_ALERT</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              A safety alert only flags the case for immediate human review. The system never
              autonomously contacts police or emergency services — human verification is always required.
            </p>
          </div>
        </Card>

        <Card title="AI layer status" subtitle="Demo AI Simulation Layer is active">
          <ul className="space-y-2 text-sm">
            {[
              ["Speech-to-text", "Web Speech API (browser) / Whisper (demo simulation)"],
              ["Text analysis", "Prototype lexicon signal detection (en/ta/hi)"],
              ["Prosodic analysis", "Deterministic simulation (Librosa in production)"],
              ["SVI engine", "Transparent weighted model — see Analytics for weights"],
              ["Recommendation engine", "Rule-based with evidence + strength"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                <span className="text-xs font-semibold text-slate-700">{k}</span>
                <span className="text-right text-xs text-slate-500">{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Production architecture: Next.js → WebSockets → FastAPI → Whisper + speech analysis → NLP/ML →
            SVI engine → Firebase. This prototype implements the same contracts with deterministic fallbacks.
          </p>
        </Card>

        <Card title="Demo data" subtitle="Stored locally in your browser only">
          <p className="text-sm text-slate-600">
            Reset the prototype to its original state — all cases, assessments, referrals, follow-ups and
            audit entries return to the seeded demo set.
          </p>
          {!confirmReset ? (
            <Button variant="secondary" className="mt-4" onClick={() => setConfirmReset(true)}>
              <RotateCcw className="h-4 w-4" /> Reset demo data
            </Button>
          ) : (
            <div className="mt-4 flex gap-2">
              <Button variant="danger" onClick={() => { resetDemo(); setConfirmReset(false); }}>
                Confirm reset
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          )}
        </Card>
      </div>
    </StaffShell>
  );
}
