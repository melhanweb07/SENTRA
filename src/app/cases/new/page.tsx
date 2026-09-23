"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, ShieldCheck } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, Field, PageHeader, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { LANGUAGES } from "@/lib/i18n";
import { AGE_RANGES, CHANNEL_LABELS, COMPLAINT_CATEGORIES } from "@/lib/utils";
import { Channel, Language } from "@/lib/types";

const CONSENT_TEXT =
  "I understand that this interaction may be analyzed to support case prioritization and human assistance.";

export default function NewCasePage() {
  const { db, user, createCase } = useStore();
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState(AGE_RANGES[2]);
  const [contactPreference, setContactPreference] = useState("Phone call");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0]);
  const [channel, setChannel] = useState<Channel>("NHAA 14566");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  if (!db || !user) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return setError("Please provide a generalised location.");
    if (!consent) return setError("Explicit consent is required before any analysis can proceed.");
    const c = createCase({
      language, name: name || undefined, ageRange, contactPreference,
      location: location.trim(), category, channel,
    });
    if (c) router.push(`/assessment/${c.id}/live`);
  };

  return (
    <StaffShell>
      <PageHeader
        title="New Case"
        sub="Privacy-first intake — minimal data, explicit consent, audit-logged."
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Complainant & case details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Case ID" hint="Generated automatically on submission">
                <input disabled value="FM-2026-••••" className={inputClass + " bg-slate-50 text-slate-400"} />
              </Field>
              <Field label="Date & time" hint="Recorded automatically">
                <input disabled value={new Date().toLocaleString("en-IN")} className={inputClass + " bg-slate-50 text-slate-400"} />
              </Field>
              <Field label="Preferred language">
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className={inputClass}>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.native} — {l.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Name (optional)" hint="Complainant may remain anonymous">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous" className={inputClass} />
              </Field>
              <Field label="Age range">
                <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={inputClass}>
                  {AGE_RANGES.map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Contact preference">
                <select value={contactPreference} onChange={(e) => setContactPreference(e.target.value)} className={inputClass}>
                  {["Phone call", "Helpline callback", "SMS", "Email", "In-app chat", "No preference"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location (generalised)" hint="City / district only — precise location only if strictly necessary">
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Coimbatore, TN" className={inputClass} />
              </Field>
              <Field label="Complaint category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  {COMPLAINT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Channel" hint="How the complainant reached us">
                <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className={inputClass}>
                  {(Object.keys(CHANNEL_LABELS) as Channel[]).map((ch) => (
                    <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          <Card title="Consent for analysis" subtitle="Required before any assessment can begin">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox" checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setError(""); }}
                className="mt-0.5 h-4 w-4 rounded accent-indigo-600"
              />
              <span className="text-sm leading-relaxed text-slate-700">
                &ldquo;{CONSENT_TEXT}&rdquo;
              </span>
            </label>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <p className="text-xs leading-relaxed text-indigo-800">
                Data minimisation: only age range and a generalised location are collected. Consent is
                recorded in the audit log. The complainant can withdraw at any time.
              </p>
            </div>
          </Card>

          {error && (
            <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!consent || !location.trim()}>
              Submit Complaint & Start Assessment <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/cases")}>Cancel</Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card title="What happens next">
            <ol className="space-y-3 text-sm text-slate-600">
              {[
                "The case is created and logged.",
                "You enter the live assessment console.",
                "The complainant describes the situation by text or voice.",
                "Prototype signal detection updates indicators in real time.",
                "The SVI, evidence and recommendations appear as the conversation develops.",
                "You review and verify — the human decision step.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Privacy-first by design</p>
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500">
                  <li>• Consent before analysis</li>
                  <li>• Role-based access to case data</li>
                  <li>• Full audit trail of every action</li>
                  <li>• AI recommends — humans verify and act</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </StaffShell>
  );
}
