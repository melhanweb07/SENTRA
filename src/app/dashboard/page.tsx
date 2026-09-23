"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Radio, TrendingUp } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, EmptyState, StatCard } from "@/components/ui";
import { RiskBadge, StatusBadge } from "@/components/analysis";
import { RiskDistributionChart } from "@/components/charts";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { cn, formatDateTime, languageName, riskToneClass, timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { db, user } = useStore();
  if (!db || !user) return null;

  const lang = db.settings.uiLanguage;
  const cases = user.role === "ADMIN" ? db.cases : db.cases.filter(
    (c) => c.createdBy === user.id || c.assignedTo === user.id || !c.assignedTo
  );
  const today = new Date().toDateString();
  const activeCases = cases.filter((c) => !["CLOSED"].includes(c.status));
  const assessmentsToday = db.assessments.filter((a) => new Date(a.startedAt).toDateString() === today);
  const highCritical = cases.filter((c) => c.risk === "HIGH" || c.risk === "CRITICAL");
  const pendingVerification = cases.filter((c) => c.status === "AWAITING_VERIFICATION");
  const pendingReferrals = db.referrals.filter((r) => r.status === "PENDING");
  const followUpsDue = db.followUps.filter(
    (f) => f.status === "SCHEDULED" && new Date(f.dueAt).getTime() <= Date.now() + 24 * 3600 * 1000
  );

  const live = db.assessments.find((a) => a.status === "ACTIVE");
  const liveCase = live ? db.cases.find((c) => c.id === live.caseId) : undefined;
  const lastPoint = live?.timeline[live.timeline.length - 1];
  const recent = [...cases].sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1)).slice(0, 6);
  const alerts = db.audit.filter((a) => a.severity === "CRITICAL").slice(0, 4);

  return (
    <StaffShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t(lang, "nav.dashboard")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Welcome back, {user.name.split(" ")[0]} — {user.title}
          </p>
        </div>
        <Link href="/cases/new">
          <Button>+ New Case</Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<Radio className="h-4 w-4" />} label={t(lang, "dashboard.activeCases")} value={activeCases.length} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={t(lang, "dashboard.assessmentsToday")} value={assessmentsToday.length} tone="sky" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label={t(lang, "dashboard.highCritical")} value={highCritical.length} tone="rose" />
        <StatCard icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>} label={t(lang, "dashboard.pendingVerification")} value={pendingVerification.length} tone="amber" />
        <StatCard icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>} label={t(lang, "dashboard.pendingReferrals")} value={pendingReferrals.length} tone="indigo" />
        <StatCard icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>} label={t(lang, "dashboard.followUpsDue")} value={followUpsDue.length} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Live assessment activity */}
        <Card
          className="lg:col-span-2"
          title={t(lang, "dashboard.liveActivity")}
          subtitle={liveCase ? "Assessment in progress — updates in real time as segments arrive" : "No active assessment right now"}
          actions={
            liveCase && (
              <Link href={`/assessment/${liveCase.id}/live`}>
                <Button size="sm" variant="secondary">Open <ArrowRight className="h-3.5 w-3.5" /></Button>
              </Link>
            )
          }
        >
          {liveCase && lastPoint ? (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-slate-800">{liveCase.caseCode} · {liveCase.category}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {languageName(liveCase.language)} · {liveCase.channel} · started {timeAgo(liveCase.createdAt)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {live.segments.filter((s) => s.role === "COMPLAINANT").length} segments analysed
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Current SVI</p>
                <p className="text-3xl font-bold tabular-nums text-slate-900">{lastPoint.svi}</p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <RiskBadge risk={liveCase.risk} />
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", riskToneClass(lastPoint.svi >= 75 ? "CRITICAL" : lastPoint.svi >= 50 ? "HIGH" : lastPoint.svi >= 25 ? "MODERATE" : "LOW"))}>
                  Distress {lastPoint.distress}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState title="No live assessment" sub="Start one from a case or create a new case" />
          )}
        </Card>

        {/* Critical alerts */}
        <Card title={t(lang, "dashboard.criticalAlerts")} subtitle="Safety alerts & critical events">
          {alerts.length === 0 ? (
            <EmptyState title="No critical alerts" />
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => {
                const c = db.cases.find((x) => x.id === a.caseId);
                return (
                  <li key={a.id} className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-rose-800">{a.action.replace(/_/g, " ")}</p>
                        <p className="mt-0.5 text-xs text-rose-700">{a.details}</p>
                        <p className="mt-1 text-[10px] text-rose-400">{a.actorName} · {timeAgo(a.at)}</p>
                      </div>
                    </div>
                    {c && (
                      <div className="mt-2 flex gap-2">
                        <Link href={`/cases/${c.id}`}><Button size="sm" variant="secondary">Review Case</Button></Link>
                        <Link href={`/assessment/${c.id}`}><Button size="sm" variant="danger">Escalate</Button></Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent cases */}
        <Card
          className="lg:col-span-2"
          title={t(lang, "dashboard.recentCases")}
          actions={<Link href="/cases"><Button size="sm" variant="ghost">View all <ArrowRight className="h-3.5 w-3.5" /></Button></Link>}
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Case ID</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.date")}</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.language")}</th>
                  <th className="px-3 py-3 font-medium">SVI</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.risk")}</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.status")}</th>
                  <th className="px-5 py-3 font-medium">{t(lang, "common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => {
                  const officer = db.users.find((u) => u.id === c.assignedTo);
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">
                        <Link href={`/cases/${c.id}`}>{c.caseCode}</Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatDateTime(c.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{languageName(c.language).split(" ")[0]}</td>
                      <td className="px-3 py-3 text-xs font-bold tabular-nums text-slate-800">{c.svi ?? "—"}</td>
                      <td className="px-3 py-3"><RiskBadge risk={c.risk} /></td>
                      <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3">
                        <Link href={`/cases/${c.id}`}>
                          <Button size="sm" variant="secondary">View</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Risk distribution */}
        <Card title={t(lang, "dashboard.riskDistribution")} subtitle="All assessed cases">
          <RiskDistributionChart cases={cases} />
        </Card>
      </div>
    </StaffShell>
  );
}
