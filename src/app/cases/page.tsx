"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, EmptyState, PageHeader, inputClass } from "@/components/ui";
import { RiskBadge, StatusBadge } from "@/components/analysis";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { formatDateTime, languageName } from "@/lib/utils";
import { CaseStatus, RiskLevel } from "@/lib/types";

export default function CasesPage() {
  const { db, user } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | CaseStatus>("ALL");
  const [risk, setRisk] = useState<"ALL" | RiskLevel>("ALL");
  const [langF, setLangF] = useState("ALL");

  const visible = useMemo(() => {
    if (!db || !user) return [];
    const base =
      user.role === "ADMIN"
        ? db.cases
        : db.cases.filter((c) => c.createdBy === user.id || c.assignedTo === user.id || !c.assignedTo);
    return base
      .filter((c) =>
        status === "ALL" ? true : c.status === status)
      .filter((c) => (risk === "ALL" ? true : c.risk === risk))
      .filter((c) => (langF === "ALL" ? true : c.language === langF))
      .filter((c) =>
        q.trim()
          ? (c.caseCode + " " + (c.name || "") + " " + c.category).toLowerCase().includes(q.toLowerCase())
          : true
      )
      .sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1));
  }, [db, user, q, status, risk, langF]);

  if (!db || !user) return null;
  const lang = db.settings.uiLanguage;

  return (
    <StaffShell>
      <PageHeader
        title={t(lang, "cases.title")}
        sub={`${visible.length} case${visible.length === 1 ? "" : "s"} visible · role-based access active`}
        actions={
          <Link href="/cases/new">
            <Button><Plus className="h-4 w-4" /> {t(lang, "nav.newCase")}</Button>
          </Link>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "common.search")}
            className={inputClass + " pl-9"}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputClass}>
          <option value="ALL">All statuses</option>
          {(["OPEN", "IN_ASSESSMENT", "AWAITING_VERIFICATION", "REFERRED", "ACTIONED", "ESCALATED", "CLOSED"] as CaseStatus[]).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)} className={inputClass}>
          <option value="ALL">All risk levels</option>
          {(["LOW", "MODERATE", "HIGH", "CRITICAL"] as RiskLevel[]).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={langF} onChange={(e) => setLangF(e.target.value)} className={inputClass}>
          <option value="ALL">All languages</option>
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>

      <Card bodyClass="p-0">
        {visible.length === 0 ? (
          <div className="p-6"><EmptyState title="No cases match the filters" sub="Try clearing the search or filters" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Case ID</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.date")}</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.language")}</th>
                  <th className="px-3 py-3 font-medium">SVI</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.risk")}</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.status")}</th>
                  <th className="px-3 py-3 font-medium">{t(lang, "common.assignedOfficer")}</th>
                  <th className="px-5 py-3 font-medium">{t(lang, "common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const officer = db.users.find((u) => u.id === c.assignedTo);
                  return (
                    <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/cases/${c.id}`} className="font-mono text-xs font-semibold text-indigo-600 hover:underline">
                          {c.caseCode}
                        </Link>
                        {c.name && <p className="mt-0.5 text-[11px] text-slate-400">{c.name}</p>}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{c.category}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatDateTime(c.createdAt)}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{languageName(c.language).split(" ")[0]}</td>
                      <td className="px-3 py-3 text-xs font-bold tabular-nums text-slate-800">{c.svi ?? "—"}</td>
                      <td className="px-3 py-3"><RiskBadge risk={c.risk} /></td>
                      <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-3 text-xs text-slate-600">{officer?.name || "Unassigned"}</td>
                      <td className="px-5 py-3">
                        <Link href={`/cases/${c.id}`}><Button size="sm" variant="secondary"><FolderKanban className="h-3.5 w-3.5" /> {t(lang, "common.view")}</Button></Link>
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
