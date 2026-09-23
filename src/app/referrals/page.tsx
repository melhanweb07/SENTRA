"use client";

import Link from "next/link";
import { useState } from "react";
import { Handshake } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { recommendationLabel } from "@/lib/ai/recommendations";
import { formatDateTime } from "@/lib/utils";
import { Referral } from "@/lib/types";

const NEXT: Record<Referral["status"], Referral["status"] | null> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "COMPLETED",
  COMPLETED: null,
};

export default function ReferralsPage() {
  const { db, user, updateReferralStatus } = useStore();
  const [filter, setFilter] = useState<"ALL" | Referral["status"]>("ALL");
  if (!db || !user) return null;

  const referrals = db.referrals.filter((r) => filter === "ALL" || r.status === filter);

  return (
    <StaffShell>
      <PageHeader title="Referrals" sub={`${db.referrals.length} total · handled by trained staff after verification`} />

      <div className="mb-4 flex gap-2">
        {(["ALL", "PENDING", "ACCEPTED", "COMPLETED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === f ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f === "ALL" ? "All" : f}
          </button>
        ))}
      </div>

      <Card bodyClass="p-0">
        {referrals.length === 0 ? (
          <div className="p-6"><EmptyState title="No referrals" sub="Referrals appear after verification" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Case</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Provider</th>
                  <th className="px-3 py-3 font-medium">Notes</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => {
                  const c = db.cases.find((x) => x.id === r.caseId);
                  return (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        {c ? (
                          <Link href={`/cases/${c.id}`} className="font-mono text-xs font-semibold text-indigo-600 hover:underline">{c.caseCode}</Link>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-slate-700">{recommendationLabel(r.type)}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{r.provider}</td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-xs text-slate-500">{r.notes || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          r.status === "PENDING" ? "border-amber-200 bg-amber-50 text-amber-700"
                          : r.status === "ACCEPTED" ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        {NEXT[r.status] && (
                          <Button size="sm" variant="secondary" onClick={() => updateReferralStatus(r.id, NEXT[r.status]!)}>
                            <Handshake className="h-3.5 w-3.5" /> Mark {NEXT[r.status]!.toLowerCase()}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </StaffShell>
  );
}
