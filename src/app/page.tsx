import Link from "next/link";
import { BrainCircuit, ShieldCheck, Languages, LineChart, Scale, UserCheck, ArrowRight, PhoneCall, MessageSquare, Mic, BarChart3, FileSearch, HandHeart, CalendarClock, ScrollText } from "lucide-react";

const workflow = [
  { icon: PhoneCall, title: "Victim / Complainant", desc: "Reaches a counsellor via helpline 14566, web portal, chatbot, app or IVRS." },
  { icon: Mic, title: "Voice / Text Interaction", desc: "Multilingual conversation — speech-to-text with live transcript." },
  { icon: BrainCircuit, title: "Real-Time Analysis", desc: "Prototype signal detection across distress, fear, anxiety, trauma, safety and isolation." },
  { icon: BarChart3, title: "Stress Vulnerability Index", desc: "Explainable 0–100 SVI with Low / Moderate / High / Critical levels." },
  { icon: LineChart, title: "Dynamic Distress Mapping", desc: "Distress tracked across the whole conversation on a live timeline." },
  { icon: FileSearch, title: "Explainable Evidence", desc: "Every indicator is traceable to an observed phrase or speech feature." },
  { icon: HandHeart, title: "Support Recommendation", desc: "Counselling, legal aid, medical, police, witness protection, emergency." },
  { icon: UserCheck, title: "Human Verification", desc: "Trained personnel review, modify or reject — AI never acts alone." },
  { icon: Scale, title: "Referral & Follow-up", desc: "Referrals to verified service providers with scheduled follow-ups." },
  { icon: ScrollText, title: "Audit", desc: "Every action recorded — accountable, privacy-first by design." },
];

const innovations = [
  {
    icon: LineChart,
    title: "Dynamic Distress Mapping",
    desc: "Distress is tracked throughout the conversation, not just at the end — revealing escalation as it happens.",
  },
  {
    icon: FileSearch,
    title: "Explainable Risk Alerts",
    desc: "No unexplained AI scores. Every alert shows the observable indicators behind it.",
  },
  {
    icon: ShieldCheck,
    title: "Safety-Aware Escalation",
    desc: "Critical safety indicators are flagged for immediate human attention — never auto-dispatched.",
  },
  {
    icon: UserCheck,
    title: "Human-in-the-Loop",
    desc: "AI recommends. Trained personnel verify. Humans decide the action.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <BrainCircuit className="h-5 w-5" />
            </span>
            FLOWMINDS&rsquo;26
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <Link href="/how-it-works" className="hover:text-white">How it works</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Staff Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.25),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
            Smart India Hackathon 2026 · Problem Statement SIH26093
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            AI-Powered Real-Time Stress & Vulnerability Assessment
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            A decision-support layer for first-contact grievance handling. It listens, analyses and
            explains — <span className="text-white font-medium">trained personnel verify and act</span>.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 font-medium hover:bg-indigo-400">
              Enter the demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 font-medium hover:border-slate-500">
              How it works
            </Link>
          </div>
          <p className="mt-8 text-xs text-slate-500">
            Prototype AI Assessment — Demonstration Mode. Not a clinical diagnosis; all recommendations require human verification.
          </p>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-t border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold">The end-to-end workflow</h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Victim → Interaction → Real-Time Analysis → SVI → Risk → Evidence → Recommendation → Verification → Referral → Follow-up → Audit
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {workflow.map((w, i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <w.icon className="h-6 w-6 text-indigo-400" />
                <p className="mt-3 text-sm font-semibold text-slate-200">{w.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innovations */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold">Core innovations</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {innovations.map((f, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                  <f.icon className="h-5 w-5 text-indigo-400" />
                </span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                <Languages className="h-5 w-5 text-indigo-400" />
              </span>
              <div>
                <p className="font-semibold">Multilingual Access</p>
                <p className="mt-1 text-sm text-slate-400">English, Tamil and Hindi today — extensible to any language through a modular lexicon and i18n layer.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                <CalendarClock className="h-5 w-5 text-indigo-400" />
              </span>
              <div>
                <p className="font-semibold">Follow-up & Audit</p>
                <p className="mt-1 text-sm text-slate-400">Scheduled follow-ups and a complete audit trail keep every case accountable.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 text-center text-sm text-slate-500">
        <p>FLOWMINDS&rsquo;26 — Prototype for Smart India Hackathon 2026 (SIH26093)</p>
        <p className="mt-1 text-xs">AI provides recommendations; trained personnel verify and act. Not a medical or legal service.</p>
      </footer>
    </div>
  );
}
