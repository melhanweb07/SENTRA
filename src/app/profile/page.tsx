"use client";

import { ShieldCheck } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Card, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  COUNSELLOR: [
    "Create cases", "Conduct assessments", "Review AI results", "Verify recommendations",
    "Create referrals", "Schedule follow-ups",
  ],
  SUPPORT_OFFICER: ["View assigned cases", "Review assessments", "Handle referrals", "Update follow-ups"],
  ADMIN: ["View all cases", "View analytics", "View audit logs", "Manage users", "View system activity"],
};

export default function ProfilePage() {
  const { db, user } = useStore();
  if (!db || !user) return null;

  const myCases = db.cases.filter((c) => c.createdBy === user.id || c.assignedTo === user.id);
  const myVerifications = db.assessments.filter((a) => a.verification?.reviewerId === user.id);
  const myAudit = db.audit.filter((a) => a.actorId === user.id).slice(0, 8);

  return (
    <StaffShell>
      <PageHeader title="Profile" sub="Your demo account and role" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700">
              {user.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <p className="mt-3 text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.title}</p>
            <span className="mt-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {user.role}
            </span>
            <p className="mt-3 font-mono text-xs text-slate-400">{user.email}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-900">{myCases.length}</p>
              <p className="text-[11px] text-slate-500">cases</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-900">{myVerifications.length}</p>
              <p className="text-[11px] text-slate-500">verifications</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Role permissions" subtitle="Role-based access control — active in this prototype">
            <div className="space-y-3">
              {(Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).map((role) => (
                <div key={role} className={`rounded-xl border p-3.5 ${role === user.role ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200"}`}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    {role === user.role && <ShieldCheck className="h-4 w-4 text-indigo-500" />}
                    {role}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{ROLE_PERMISSIONS[role].join(" · ")}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent activity" subtitle="Your latest audited actions">
            {myAudit.length ? (
              <ul className="space-y-2 text-xs">
                {myAudit.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                    <span className="font-medium text-slate-700">{a.action.replace(/_/g, " ")}</span>
                    <span className="whitespace-nowrap text-slate-400">{new Date(a.at).toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-slate-400">No activity recorded yet.</p>
            )}
          </Card>
        </div>
      </div>
    </StaffShell>
  );
}
