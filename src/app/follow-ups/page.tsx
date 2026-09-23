"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

export default function FollowUpsPage() {
  const { db, user, updateFollowUpStatus } = useStore();
  const [filter, setFilter] = useState<"ALL" | "SCHEDULED" | "COMPLETED" | "MISSED">("ALL");
  if (!db || !user) return null;

  const list = db.followUps
    .filter((f) => filter === "ALL" || f.status === filter)
    .sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1));

  return (
    <StaffShell>
      <PageHeader title="Follow-ups" sub={`${db.followUps.filter((f) => f.status === "SCHEDULED").length} scheduled · ${db.followUps.filter((f) => f.status === "MISSED").length} missed`} />

      <div className="mb-4 flex gap-2">
        {(["ALL", "SCHEDULED", "COMPLETED", "MISSED"] as const).map((f) => (
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
        {list.length === 0 ? (
          <div className="p-6"><EmptyState title="No follow-ups" sub="Schedule one from a case report" /></div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {list.map((f) => {
              const c = db.cases.find((x) => x.id === f.caseId);
              const assignee = db.users.find((u) => u.id === f.assignedTo);
              const overdue = f.status === "SCHEDULED" && new Date(f.dueAt).getTime() < Date.now();
              return (
                <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    f.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600"
                    : f.status === "MISSED" ? "bg-rose-50 text-rose-600"
                    : overdue ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                  )}>
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      {c ? (
                        <Link href={`/cases/${c.id}`} className="font-mono text-xs font-semibold text-indigo-600 hover:underline">{c.caseCode}</Link>
                      ) : "—"}
                      <span className="ml-2 text-xs text-slate-500">{f.mode.replace("_", " ")}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Due {formatDateTime(f.dueAt)} ({timeAgo(f.dueAt) === "just now" ? "now" : timeAgo(f.dueAt)}) · {assignee?.name || "Unassigned"}
                    </p>
                    {f.notes && <p className="mt-0.5 truncate text-xs text-slate-400">{f.notes}</p>}
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                    f.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : f.status === "MISSED" ? "border-rose-200 bg-rose-50 text-rose-700"
                    : overdue ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}>
                    {f.status}{overdue && f.status === "SCHEDULED" ? " · OVERDUE" : ""}
                  </span>
                  <div className="flex gap-2">
                    {f.status === "SCHEDULED" && (
                      <>
                        <Button size="sm" variant="success" onClick={() => updateFollowUpStatus(f.id, "COMPLETED")}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => updateFollowUpStatus(f.id, "MISSED")}>Mark missed</Button>
                      </>
                    )}
                    {f.status === "MISSED" && (
                      <Button size="sm" variant="secondary" onClick={() => updateFollowUpStatus(f.id, "SCHEDULED")}>Reschedule</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </StaffShell>
  );
}
