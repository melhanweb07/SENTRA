"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const { db, user } = useStore();
  const [q, setQ] = useState("");
  const [severity, setSeverity] = useState<"ALL" | "INFO" | "WARN" | "CRITICAL">("ALL");

  const entries = useMemo(() => {
    if (!db) return [];
    return db.audit
      .filter((a) => (severity === "ALL" ? true : a.severity === severity))
      .filter((a) =>
        q.trim()
          ? (a.action + " " + a.details + " " + a.actorName).toLowerCase().includes(q.toLowerCase())
          : true
      );
  }, [db, q, severity]);

  if (!db || !user) return null;

  return (
    <StaffShell>
      <PageHeader
        title="Audit Logs"
        sub={`${db.audit.length} total entries — every action recorded with actor and timestamp`}
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, actors, details…" className={inputClass + " pl-9"} />
        </div>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)} className={inputClass}>
          <option value="ALL">All severities</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ScrollText className="h-4 w-4" /> {entries.length} matching entries
        </div>
      </div>

      <Card bodyClass="p-0">
        {entries.length === 0 ? (
          <div className="p-6"><EmptyState title="No matching audit entries" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-3 py-3 font-medium">Actor</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                  <th className="px-3 py-3 font-medium">Case</th>
                  <th className="px-3 py-3 font-medium">Details</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((a) => {
                  const c = db.cases.find((x) => x.id === a.caseId);
                  return (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-5 py-2.5 text-xs text-slate-500">{formatDateTime(a.at)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-medium text-slate-700">{a.actorName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-slate-800">{a.action.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {c ? (
                          <Link href={`/cases/${c.id}`} className="font-mono text-indigo-600 hover:underline">{c.caseCode}</Link>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="max-w-[420px] px-3 py-2.5 text-xs text-slate-600">{a.details}</td>
                      <td className="px-5 py-2.5">
                        <span className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                          a.severity === "CRITICAL" ? "border-rose-200 bg-rose-50 text-rose-700"
                          : a.severity === "WARN" ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                        )}>{a.severity}</span>
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
