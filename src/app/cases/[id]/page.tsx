"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, CalendarClock, Handshake, Lock, Radio, ScrollText, ShieldCheck, XCircle,
} from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, PageHeader } from "@/components/ui";
import { RiskBadge, SviDial, StatusBadge } from "@/components/analysis";
import { DistressTimelineChart } from "@/components/charts";
import { FollowUpModal, ReferralModal } from "@/components/CaseModals";
import { useStore } from "@/lib/store";
import { recommendationLabel } from "@/lib/ai/recommendations";
import { CHANNEL_LABELS, formatDateTime, languageName } from "@/lib/utils";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, user, escalateCase, closeCase } = useStore();
  const [refOpen, setRefOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const c = db?.cases.find((x) => x.id === id || x.caseCode === id);
  if (!db || !user) return null;
  if (!c) {
    return <StaffShell><Card title="Case not found">No case matches this link.</Card></StaffShell>;
  }

  const assessment = db.assessments.find((a) => a.caseId === c.id);
  const analysis = assessment?.finalAnalysis ||
    assessment?.segments.filter((s) => s.role === "COMPLAINANT").slice(-1)[0]?.analysis;
  const referrals = db.referrals.filter((r) => r.caseId === c.id);
  const followUps = db.followUps.filter((f) => f.caseId === c.id);
  const audit = db.audit.filter((a) => a.caseId === c.id);
  const officer = db.users.find((u) => u.id === c.assignedTo);

  return (
    <StaffShell>
      <PageHeader
        title={c.caseCode}
        sub={`${c.category} · ${languageName(c.language)} · created ${formatDateTime(c.createdAt)}`}
        actions={
          <>
            {c.status !== "CLOSED" ? (
              assessment?.status === "ACTIVE" ? (
                <Link href={`/assessment/${c.id}/live`}>
                  <Button variant="warn"><Radio className="h-4 w-4 animate-pulse" /> Resume live assessment</Button>
                </Link>
              ) : (
                <Link href={`/assessment/${c.id}/live`}>
                  <Button>{assessment ? "New Assessment" : "Start Assessment"} <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              )
            ) : null}
            {assessment && (
              <Link href={`/assessment/${c.id}`}>
                <Button variant="secondary">View Report</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={c.status} />
        <RiskBadge risk={c.risk} />
        {c.svi !== undefined && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">SVI {c.svi}</span>
        )}
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
          Assigned: {officer?.name || "Unassigned"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column — case facts */}
        <div className="space-y-4">
          <Card title="Case record">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Case ID", c.caseCode],
                ["Created", formatDateTime(c.createdAt)],
                ["Language", languageName(c.language)],
                ["Channel", CHANNEL_LABELS[c.channel]],
                ["Name", c.name || "Anonymous"],
                ["Age range", c.ageRange],
                ["Contact preference", c.contactPreference],
                ["Location", c.location],
                ["Category", c.category],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="text-right text-xs font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-[11px] text-emerald-800">Consent recorded — analysis-assisted handling approved</p>
            </div>
          </Card>

          <Card title="Actions">
            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => setRefOpen(true)}>
                <Handshake className="h-4 w-4" /> Create Referral
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setFuOpen(true)}>
                <CalendarClock className="h-4 w-4" /> Schedule Follow-up
              </Button>
              {c.status !== "ESCALATED" && c.status !== "CLOSED" && (
                <Button
                  variant="danger" className="w-full"
                  onClick={() => escalateCase(c.id, `Escalated by ${user.name} from case view`)}
                >
                  <ArrowRight className="h-4 w-4" /> Escalate
                </Button>
              )}
              {c.status !== "CLOSED" && (
                <Button variant="ghost" className="w-full" onClick={() => setConfirmClose(true)}>
                  <XCircle className="h-4 w-4" /> Close Case
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Middle + right */}
        <div className="space-y-4 lg:col-span-2">
          {analysis ? (
            <Card title="Latest assessment summary" subtitle={assessment?.verification ? "Human verification recorded" : "Awaiting human verification"}>
              <div className="flex flex-wrap items-center gap-6">
                <SviDial svi={analysis.svi} risk={analysis.riskLevel} size={130} />
                <div className="min-w-[220px] flex-1 space-y-2">
                  {analysis.recommendations.slice(0, 4).map((r) => (
                    <div key={r.type} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                      <span className="font-medium text-slate-700">{recommendationLabel(r.type)}</span>
                      <span className="text-slate-400">strength {r.strength}</span>
                    </div>
                  ))}
                  {analysis.recommendations.length === 0 && (
                    <p className="text-xs italic text-slate-400">No recommendations recorded.</p>
                  )}
                  {assessment?.verification && (
                    <p className="text-[11px] text-slate-500">
                      Verified: <strong>{assessment.verification.decision}</strong> by {assessment.verification.reviewerName}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card title="No assessment yet">
              <p className="text-sm text-slate-600">Start an assessment to begin real-time analysis of this case.</p>
              <Link href={`/assessment/${c.id}/live`} className="mt-3 inline-block">
                <Button>Start Assessment <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </Card>
          )}

          {assessment && assessment.timeline.length > 0 && (
            <Card title="Distress timeline">
              <DistressTimelineChart timeline={assessment.timeline} />
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Referrals" subtitle={`${referrals.length} recorded`}>
              {referrals.length ? (
                <ul className="space-y-2 text-xs">
                  {referrals.map((r) => (
                    <li key={r.id} className="rounded-lg border border-slate-200 p-2.5">
                      <p className="font-semibold text-slate-700">{recommendationLabel(r.type)}</p>
                      <p className="text-slate-500">{r.provider}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{r.status} · {formatDateTime(r.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-slate-400">No referrals yet.</p>
              )}
            </Card>

            <Card title="Follow-ups" subtitle={`${followUps.length} recorded`}>
              {followUps.length ? (
                <ul className="space-y-2 text-xs">
                  {followUps.map((f) => (
                    <li key={f.id} className="rounded-lg border border-slate-200 p-2.5">
                      <p className="font-semibold text-slate-700">{f.mode} · due {formatDateTime(f.dueAt)}</p>
                      <p className="text-slate-500">{f.notes}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{f.status}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-slate-400">No follow-ups yet.</p>
              )}
            </Card>
          </div>

          <Card title="Case audit trail" subtitle={`${audit.length} entries — newest first`} bodyClass="p-0">
            <ul className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
              {audit.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-2.5">
                  <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700">
                      {a.action.replace(/_/g, " ")}
                      {a.severity !== "INFO" && (
                        <span className={`ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold ${a.severity === "CRITICAL" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {a.severity}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">{a.details}</p>
                    <p className="text-[10px] text-slate-400">{a.actorName} · {formatDateTime(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <ReferralModal open={refOpen} onClose={() => setRefOpen(false)} caseId={c.id}
        recommendedTypes={analysis?.recommendations.map((r) => r.type)} />
      <FollowUpModal open={fuOpen} onClose={() => setFuOpen(false)} caseId={c.id} />

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setConfirmClose(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Lock className="h-5 w-5" /> Close case?</h3>
            <p className="mt-2 text-sm text-slate-600">
              The case will be marked closed. The full record and audit trail are retained.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmClose(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { closeCase(c.id, "Resolution confirmed by " + user.name); setConfirmClose(false); }}>
                Close case
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
