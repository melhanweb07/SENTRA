import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import type { ReactNode } from "react";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <BrainCircuit className="h-5 w-5" />
          </span>
          FLOWMINDS&rsquo;26
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-300">
          <Link href="/how-it-works" className="hover:text-white">How it works</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/login" className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-400">Login</Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-400">{subtitle}</p>}
        <div className="mt-10 space-y-6 leading-relaxed text-slate-300 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        FLOWMINDS&rsquo;26 — Prototype for Smart India Hackathon 2026 (SIH26093). Decision-support only; human verification required.
      </footer>
    </div>
  );
}
