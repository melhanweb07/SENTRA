"use client";

import StaffShell from "@/components/StaffShell";
import { Card, PageHeader, StatCard } from "@/components/ui";
import {
  CasesOverTimeChart, LanguageDistributionChart, ReferralStatusChart, RiskDistributionChart,
} from "@/components/charts";
import { useStore } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/utils";
import { EvidenceCategory } from "@/lib/types";
import { SVI_WEIGHTS } from "@/lib/ai/svi";

export default function AnalyticsPage() {
  const { db, user } = useStore();
  if (!db || !user) return null;

  const cases = db.cases;
  const assessed = cases.filter((c) => c.svi !== undefined);
  const avgSvi = assessed.length
    ? Math.round(assessed.reduce((s, c) => s + (c.svi || 0), 0) / assessed.length)
    : 0;
  const verified = db.assessments.filter((a) => a.verification).length;
  const today = new Date().toDateString();
  const assessmentsToday = db.assessments.filter((a) => new Date(a.startedAt).toDateString() === today);

  // Aggregate indicator averages across completed assessments
  const dims: { key: keyof typeof SVI_WEIGHTS & EvidenceCategory; label: string }[] = [
    { key: "SAFETY", label: "Safety Concern" },
    { key: "DISTRESS", label: "Distress" },
    { key: "FEAR", label: "Fear" },
    { key: "ANXIETY", label: "Anxiety" },
    { key: "TRAUMA", label: "Trauma-related" },
    { key: "ISOLATION", label: "Social Isolation" },
    { key: "DEPRESSION", label: "Depression indicators" },
  ];
  const analyses = db.assessments
    .map((a) => a.finalAnalysis || a.segments.filter((s) => s.role === "COMPLAINANT").slice(-1)[0]?.analysis)
    .filter(Boolean);
  const avg = (pick: (a: NonNullable<typeof analyses[number]>) => number) =>
    analyses.length ? Math.round(analyses.reduce((s, a) => s + pick(a!), 0) / analyses.length) : 0;

  return (
    <StaffShell>
      <PageHeader title="Analytics" sub="System-wide overview — prototype demo data" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<span className="text-sm font-bold">Σ</span>} label="Average SVI (assessed)" value={avgSvi} />
        <StatCard icon={<span className="text-sm font-bold">{assessed.length}</span>} label="Assessed cases" value={assessed.length} tone="sky" />
        <StatCard icon={<span className="text-sm font-bold">✓</span>} label="Human verifications" value={verified} tone="emerald" />
        <StatCard icon={<span className="text-sm font-bold">⏱</span>} label="Assessments today" value={assessmentsToday.length} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Case intake — last 7 days">
          <CasesOverTimeChart cases={cases} />
        </Card>
        <Card title="Risk distribution" subtitle="Assessed cases by SVI risk level">
          <RiskDistributionChart cases={cases} />
        </Card>
        <Card title="Language distribution" subtitle="Multilingual access — English, Tamil, Hindi">
          <LanguageDistributionChart cases={cases} />
        </Card>
        <Card title="Referral outcomes">
          <ReferralStatusChart referrals={db.referrals} />
        </Card>
      </div>

      <Card className="mt-6" title="Average indicator levels" subtitle="Across all recorded assessments (prototype engine)">
        <div className="space-y-3">
          {dims.map((d) => {
            const score =
              d.key === "SAFETY" ? avg((a) => a.safetyConcernScore)
              : d.key === "DISTRESS" ? avg((a) => a.distressScore)
              : d.key === "FEAR" ? avg((a) => a.fearScore)
              : d.key === "ANXIETY" ? avg((a) => a.anxietyScore)
              : d.key === "TRAUMA" ? avg((a) => a.traumaIndicator)
              : d.key === "ISOLATION" ? avg((a) => a.socialIsolationScore)
              : avg((a) => a.depressionIndicator);
            return (
              <div key={d.key} className="flex items-center gap-4">
                <span className="w-40 text-xs font-medium text-slate-600">{d.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.max(2, score)}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-bold tabular-nums text-slate-700">{score}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6" title="SVI model transparency" subtitle="Weights used by the prototype Stress Vulnerability Index">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(SVI_WEIGHTS) as EvidenceCategory[]).filter((k) => SVI_WEIGHTS[k] > 0).map((k) => (
            <div key={k} className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">{CATEGORY_LABELS[k]}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-indigo-600">
                {(SVI_WEIGHTS[k] * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Weights are prototype configuration, shown for transparency. In production they are calibrated
          and clinically reviewed; the SVI remains a decision-support indicator requiring human verification.
        </p>
      </Card>
    </StaffShell>
  );
}
