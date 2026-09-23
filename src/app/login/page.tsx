"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, LogIn, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEMO_USERS } from "@/lib/demo/seed";
import { cn } from "@/lib/utils";

const roleBlurbs: Record<string, string> = {
  COUNSELLOR: "Create cases, conduct assessments, verify recommendations, refer and schedule follow-ups.",
  SUPPORT_OFFICER: "View assigned cases, handle referrals, update follow-ups.",
  ADMIN: "View all cases, analytics, audit logs and system activity.",
};

export default function LoginPage() {
  const { login, db } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const em = creds?.email ?? email;
    const pw = creds?.password ?? password;
    const res = await login(em, pw);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500">
            <BrainCircuit className="h-7 w-7 text-white" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white">FLOWMINDS&rsquo;26</h1>
          <p className="mt-1 text-sm text-slate-400">Staff sign-in — role-based access</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          {db === null ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading demo environment…</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@flowminds.demo"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              {error && (
                <p className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  <ShieldAlert className="h-4 w-4" /> {error}
                </p>
              )}
              <button
                type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
              Demo credentials — click to sign in
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => submit(undefined, { email: u.email, password: u.password })}
                  disabled={db === null}
                  className={cn(
                    "w-full rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2.5 text-left hover:border-indigo-500/50 hover:bg-slate-800",
                    "disabled:opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{u.name} · {u.role}</span>
                    <span className="text-[10px] font-mono text-slate-500">{u.email}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{roleBlurbs[u.role]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">← Back to overview</Link>
          <span className="mx-2">·</span>
          Demo accounts only — no real credentials are stored.
        </p>
      </div>
    </div>
  );
}
