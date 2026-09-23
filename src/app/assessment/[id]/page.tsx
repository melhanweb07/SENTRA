"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, ChevronRight, Download, Eye, Handshake, CalendarClock, Printer, Radio,
} from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, PageHeader } from "@/components/ui";
import { EvidenceCard, IndicatorBar, RiskBadge, SafetyAlert, SviDial, StatusBadge } from "@/components/analysis";
import { DistressTimelineChart } from "@/components/charts";
import { FollowUpModal, ReferralModal } from "@/components/CaseModals";
import { useStore } from "@/lib/store";
import { recommendationLabel } from "@/lib/ai/recommendations";
import { CATEGORY_LABELS, buildReportText, cn, fmtClock, formatDateTime, languageName } from "@/lib/utils";
import { EvidenceCategory, RecommendationType, SviContribution } from "@/lib/types";

const DIMENSION_CARDS: { key: EvidenceCategory; title: string; empty: string }[] = [
  { key: "SAFETY", title: "Safety Concern", empty: "No strong isolation or safety indicator detected." },
  { key: "FEAR", title: "Fear Indicator", empty: "No strong fear indicator detected." },
  { key: "DISTRESS", title: "Distress Signal", empty: "No strong distress signal detected." },
  { key: "ANXIETY", title: "Anxiety Indicator", empty: "No strong anxiety indicator detected." },
  { key: "TRAUMA", title: "Trauma-Related Distress", empty: "No strong trauma-related indicator detected." },
  { key: "ISOLATION", title: "Social Isolation", empty: "No strong isolation indicator detected." },
  { key: "DEPRESSION", title: "Depression Indicator", empty: "No strong depression indicator detected." },
];

export default function AssessmentReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, user, verifyRecommendation } = useStore();

  const [decision, setDecision] = useState<"ACCEPT" | "MODIFY" | "REJECT">("ACCEPT");
  const [notes, setNotes] = useState("");
  const [modified, setModified] = useState<RecommendationType[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const c = db?.cases.find((x) => x.id === id || x.caseCode === id);
  const assessment = useMemo(
    () => db?.assessments.find((a) => a.caseId === c?.id),
    [db, c]
  );
  const analysis = useMemo(() => {
    if (!assessment) return undefined;
    return assessment.finalAnalysis || assessment.segments.filter((s) => s.role === "COMPLAINANT").slice(-1)[0]?.analysis;
  }, [assessment]);

  useEffect(() => {
    if (analysis && !modified.length) setModified(analysis.recommendations.map((r) => r.type));
  }, [analysis]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!db || !user) return null;
  if (!c) {
    return <StaffShell><Card title="Case not found">No case matches this link.</Card></StaffShell>;
  }

  const referrals = db.referrals.filter((r) => r.caseId === c.id);
  const followUps = db.followUps.filter((f) => f.caseId === c.id);
  const audit = db.audit.filter((a) => a.caseId === c.id).slice().reverse();
  const verification = assessment?.verification;
  const recommendedTypes = analysis?.recommendations.map((r) => r.type) || [];

  const exportReport = () => {
    const text = buildReportText(c, assessment, referrals, followUps, audit);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.caseCode}-assessment-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitVerification = () => {
    verifyRecommendation(c.id, decision, notes, decision === "MODIFY" ? modified : recommendedTypes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const band = (s: number) => (s >= 60 ? "HIGH" : s >= 30 ? "MODERATE" : "LOW") as "HIGH" | "MODERATE" | "LOW";

  return (
    <StaffShell>
      <PageHeader
        title={`Assessment Report — ${c.caseCode}`}
        sub={`${c.category} · ${languageName(c.language)} · ${c.channel}`}
        actions={
          <>
            {assessment?.status === "ACTIVE" && (
              <Link href={`/assessment/${c.id}/live`}>
                <Button variant="warn" size="sm"><Radio className="h-3.5 w-3.5 animate-pulse" /> Resume live console</Button>
              </Link>
            )}
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</Button>
            <Button size="sm" onClick={exportReport} disabled={!assessment}>
              <Download className="h-3.5 w-3.5" /> Export Report
            </Button>
          </>
        }
      />

      {!assessment ? (
        <Card title="No assessment yet">
          <p className="mb-4 text-sm text-slate-600">This case has no recorded assessment. Start one to begin real-time analysis.</p>
          <Link href={`/assessment/${c.id}/live`}><Button>Start Assessment <ArrowRight className="h-4 w-4" /></Button></Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary row */}
          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-3" title="Stress Vulnerability Index" bodyClass="p-5">
              <SviDial svi={analysis?.svi ?? 0} risk={analysis?.riskLevel ?? "LOW"} />
            </Card>

            <Card className="lg:col-span-5" title="Observable indicators" subtitle="Prototype signal detection — cumulative over the conversation">
              {analysis ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <IndicatorBar label="Distress" score={analysis.distressScore} />
                  <IndicatorBar label="Fear" score={analysis.fearScore} />
                  <IndicatorBar label="Anxiety" score={analysis.anxietyScore} />
                  <IndicatorBar label="Trauma-related" score={analysis.traumaIndicator} />
                  <IndicatorBar label="Depression indicators" score={analysis.depressionIndicator} />
                  <IndicatorBar label="Safety concern" score={analysis.safetyConcernScore} />
                  <IndicatorBar label="Social isolation" score={analysis.socialIsolationScore} />
                  <IndicatorBar label="Medical concern" score={analysis.medicalScore} />
                </div>
              ) : (
                <p className="text-sm text-slate-500">No analysis recorded.</p>
              )}
            </Card>

            <Card className="lg:col-span-4" title="Explanation chain" subtitle="How evidence became this score">
              <div className="space-y-2 text-xs">
                {[
                  { label: "OBSERVATION", desc: "Phrases & speech features detected in the conversation" },
                  { label: "INDICATOR", desc: "Signals mapped to distress, fear, safety… dimensions" },
                  { label: "RISK CONTRIBUTION", desc: "Dimension score × transparent weight" },
                  { label: "SVI", desc: "Sum of contributions → 0–100 with risk level" },
                ].map((s, i, arr) => (
                  <div key={i}>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="font-bold tracking-wide text-slate-700">{s.label}</span>
                      <span className="text-[10px] text-slate-400">{s.desc}</span>
                    </div>
                    {i < arr.length - 1 && <ChevronRight className="mx-auto h-3.5 w-3.5 rotate-90 text-slate-300" />}
                  </div>
                ))}
              </div>
              {analysis && (
                <table className="mt-3 w-full text-[11px]">
                  <tbody>
                    {analysis.sviBreakdown.filter((b: SviContribution) => b.weight > 0).map((b) => (
                      <tr key={b.dimension} className="border-t border-slate-100">
                        <td className="py-1 text-slate-600">{CATEGORY_LABELS[b.dimension]}</td>
                        <td className="py-1 text-right tabular-nums text-slate-400">{b.score} × {b.weight}</td>
                        <td className="py-1 text-right font-semibold tabular-nums text-slate-800">+{b.contribution}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200">
                      <td className="py-1 font-semibold text-slate-700" colSpan={2}>SVI</td>
                      <td className="py-1 text-right font-bold tabular-nums text-indigo-700">{analysis.svi}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                Prototype explanation layer — not a claim of causal psychological inference.
              </p>
            </Card>
          </div>

          {analysis?.escalationRequired && <SafetyAlert visible />}

          {/* WHY THIS ASSESSMENT */}
          <Card title="Why this assessment?" subtitle="Every indicator traced to observed evidence">
            {analysis && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {DIMENSION_CARDS.map((d) => {
                  const score = {
                    SAFETY: analysis.safetyConcernScore, FEAR: analysis.fearScore, DISTRESS: analysis.distressScore,
                    ANXIETY: analysis.anxietyScore, TRAUMA: analysis.traumaIndicator,
                    ISOLATION: analysis.socialIsolationScore, DEPRESSION: analysis.depressionIndicator,
                  }[d.key] as number;
                  const ev = analysis.evidence.filter((e) => e.category === d.key);
                  return (
                    <EvidenceCard
                      key={d.key}
                      title={d.title}
                      band={band(score)}
                      evidence={ev.map((e) => `Observed phrase "${e.phrase}" (weight ${e.weight}, segment ${e.segmentIndex + 1})`)}
                    />
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recommendations + verification */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="AI Recommendation" subtitle="Decision support — requires human verification">
              {analysis && analysis.recommendations.length ? (
                <ul className="space-y-3">
                  {analysis.recommendations.map((r) => (
                    <li key={r.type} className="rounded-xl border border-slate-200 p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">{recommendationLabel(r.type)}</p>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">strength {r.strength}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{r.reason}</p>
                      {r.evidence.length > 0 && (
                        <p className="mt-1.5 text-[11px] italic text-slate-400">Evidence: {r.evidence.join(", ")}</p>
                      )}
                      <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-600">
                        <Eye className="h-3 w-3" /> requiresHumanVerification: true
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No recommendations recorded.</p>
              )}
            </Card>

            <Card
              title="Human Review"
              subtitle="Trained personnel verify before any action"
              actions={verification && <StatusBadge status={c.status} />}
            >
              {verification ? (
                <div className="space-y-3">
                  <div className={cn(
                    "rounded-xl border p-4",
                    verification.decision === "REJECT" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
                  )}>
                    <p className="text-sm font-bold text-slate-800">
                      Decision: {verification.decision} <CheckCircle2 className="ml-1 inline h-4 w-4 text-emerald-600" />
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Reviewed by <strong>{verification.reviewerName}</strong> on {formatDateTime(verification.at)}
                    </p>
                    {verification.notes && (
                      <p className="mt-2 rounded-lg bg-white/70 p-2.5 text-xs italic text-slate-600">
                        “{verification.notes}”
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-slate-500">
                      Final actions: {verification.modifiedRecommendationTypes.map(recommendationLabel).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setRefOpen(true)}><Handshake className="h-3.5 w-3.5" /> Create Referral</Button>
                    <Button size="sm" variant="secondary" onClick={() => setFuOpen(true)}><CalendarClock className="h-3.5 w-3.5" /> Schedule Follow-up</Button>
                  </div>
                  {(referrals.length > 0 || followUps.length > 0) && (
                    <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                      {referrals.map((r) => (
                        <p key={r.id} className="flex justify-between text-slate-600">
                          <span>Referral · {recommendationLabel(r.type)} → {r.provider}</span>
                          <span className="font-medium">{r.status}</span>
                        </p>
                      ))}
                      {followUps.map((f) => (
                        <p key={f.id} className="flex justify-between text-slate-600">
                          <span>Follow-up · {f.mode} · due {formatDateTime(f.dueAt)}</span>
                          <span className="font-medium">{f.status}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Reviewer decision:</p>
                  <div className="space-y-2">
                    {(["ACCEPT", "MODIFY", "REJECT"] as const).map((d) => (
                      <label key={d} className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition",
                        decision === d ? "border-indigo-400 bg-indigo-50 font-medium" : "border-slate-200 hover:bg-slate-50"
                      )}>
                        <input type="radio" name="decision" checked={decision === d} onChange={() => setDecision(d)} className="accent-indigo-600" />
                        {d === "ACCEPT" ? "Accept recommendation" : d === "MODIFY" ? "Modify recommendation" : "Reject recommendation"}
                      </label>
                    ))}
                  </div>

                  {decision === "MODIFY" && (
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="mb-2 text-xs font-medium text-slate-600">Select final actions:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys({
                          COUNSELLING: 1, LEGAL_AID: 1, MEDICAL_ASSISTANCE: 1,
                          POLICE_INTERVENTION: 1, WITNESS_PROTECTION: 1, EMERGENCY_SUPPORT: 1,
                        }) as RecommendationType[]).map((rt) => (
                          <label key={rt} className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox" checked={modified.includes(rt)}
                              onChange={(e) =>
                                setModified((m) => (e.target.checked ? [...m, rt] : m.filter((x) => x !== rt)))
                              }
                              className="accent-indigo-600"
                            />
                            {recommendationLabel(rt)}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-600">Reviewer notes:</p>
                    <textarea
                      value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                      placeholder="Reasoning for the decision (recorded in the audit log)…"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    {saved && <span className="text-xs font-medium text-emerald-600">✓ Verification recorded</span>}
                    <Button onClick={submitVerification} className="ml-auto">
                      <CheckCircle2 className="h-4 w-4" /> Submit verification
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Timeline + transcript */}
          <Card title="Dynamic Distress Mapping" subtitle="Distress across the conversation">
            <DistressTimelineChart timeline={assessment.timeline} />
          </Card>

          <Card
            title="Conversation transcript"
            subtitle={`${assessment.segments.length} segments`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => setShowTranscript((s) => !s)}>
                {showTranscript ? "Hide" : "Show"}
              </Button>
            }
          >
            {showTranscript ? (
              <div className="max-h-72 space-y-2 overflow-y-auto text-xs">
                {assessment.segments.map((s) => (
                  <div key={s.id} className={cn("rounded-lg border p-2.5", s.role === "OFFICER" ? "border-slate-200 bg-slate-50" : "border-indigo-100 bg-indigo-50/60")}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {s.role === "OFFICER" ? "Officer" : "Complainant"} · {fmtClock(s.atSec)} · {s.mode}
                      {s.sttEngine ? ` · ${s.sttEngine}` : ""}
                    </p>
                    <p className="leading-relaxed text-slate-700">{s.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Transcript hidden — expand to view.</p>
            )}
          </Card>
        </div>
      )}

      <ReferralModal open={refOpen} onClose={() => setRefOpen(false)} caseId={c.id} recommendedTypes={recommendedTypes} />
      <FollowUpModal open={fuOpen} onClose={() => setFuOpen(false)} caseId={c.id} />
    </StaffShell>
  );
}
