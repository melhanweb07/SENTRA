"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, AudioLines, CheckCircle2, CircleStop, FileText, Mic, Pause, Play,
  Radio, Send, Square, Trash2, Upload, Zap,
} from "lucide-react";
import StaffShell from "@/components/StaffShell";
import { Button, Card, inputClass } from "@/components/ui";
import { EvidenceChip, IndicatorBar, SafetyAlert, SviDial } from "@/components/analysis";
import { DistressTimelineChart } from "@/components/charts";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { DEMO_SCRIPTS, OFFICER_PROMPTS, simulatedSpeechFeatures } from "@/lib/demo/seed";
import { LEXICON } from "@/lib/ai/lexicon";
import { recommendationLabel } from "@/lib/ai/recommendations";
import { CATEGORY_LABELS, cn, fmtClock, languageName } from "@/lib/utils";
import { AnalysisResult, Language, Segment } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchedPhrases(text: string, lang: Language): string[] {
  const lower = text.toLowerCase();
  return (LEXICON[lang] || LEXICON.en).filter((e) => lower.includes(e.phrase)).map((e) => e.phrase);
}

function Highlighted({ text, lang }: { text: string; lang: Language }) {
  const phrases = useMemo(() => matchedPhrases(text, lang), [text, lang]);
  if (!phrases.length) return <>{text}</>;
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        phrases.some((p) => p.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="rounded bg-amber-100 px-0.5 font-medium text-amber-900">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-12 items-end justify-center gap-1 px-4">
      {Array.from({ length: 32 }).map((_, i) => (
        <span
          key={i}
          className={cn("w-1.5 rounded-full transition-all", active ? "bg-indigo-400" : "bg-slate-200")}
          style={
            active
              ? { animation: `pulseBar 1s ease-in-out ${(i % 8) * 0.09}s infinite`, height: "100%" }
              : { height: "20%" }
          }
        />
      ))}
    </div>
  );
}

const STT_LANG: Record<Language, string> = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LiveAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { db, user, addSegment, addOfficerMessage, completeAssessment, escalateCase, startAssessment } = useStore();

  const [mode, setMode] = useState<"TEXT" | "VOICE">("TEXT");
  const [draft, setDraft] = useState("");
  const [paused, setPaused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [sttNote, setSttNote] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [demoRunning, setDemoRunning] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmEscalate, setConfirmEscalate] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recognitionRef = useRef<any>(null);

  const caseId = id;
  const c = db?.cases.find((x) => x.id === caseId || x.caseCode === caseId);
  const assessment = db?.assessments.find((a) => a.caseId === c?.id && a.status === "ACTIVE");
  const hasCompleted = db?.assessments.some((a) => a.caseId === c?.id && a.status === "COMPLETED") ?? false;
  const lang = c?.language || "en";
  const uiLang = db?.settings.uiLanguage || "en";
  const script = DEMO_SCRIPTS[lang];

  const analysis: AnalysisResult | undefined = useMemo(() => {
    const segs = assessment?.segments.filter((s) => s.role === "COMPLAINANT") || [];
    return segs.length ? segs[segs.length - 1].analysis : undefined;
  }, [assessment]);

  // Route to the report if already completed; start assessment if none exists
  useEffect(() => {
    if (db && c && hasCompleted && !assessment) {
      router.replace(`/assessment/${c.id}`);
    }
  }, [db, c, hasCompleted, assessment, router]);

  // Auto-scroll conversation
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [assessment?.segments.length]);

  // Recording timer
  useEffect(() => {
    if (!recording) return;
    const iv = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [recording]);

  // Cleanup on unmount
  useEffect(() => {
    demoRef.current = false;
    return () => {
      demoRef.current = false;
      timersRef.current.forEach(clearTimeout);
      try { recognitionRef.current?.stop(); } catch { /* noop */ }
    };
  }, []);

  if (!db || !user) return null;
  if (!c) {
    return (
      <StaffShell>
        <Card title="Case not found">No case matches this link.</Card>
      </StaffShell>
    );
  }
  if (c.status === "CLOSED") {
    return (
      <StaffShell>
        <Card title="Case closed">
          <p className="text-sm text-slate-600">This case is closed. View the record instead.</p>
          <Link href={`/cases/${c.id}`} className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">Go to case →</Link>
        </Card>
      </StaffShell>
    );
  }

  const segments: Segment[] = assessment?.segments || [];
  const complainantCount = segments.filter((s) => s.role === "COMPLAINANT").length;

  // ------------------ actions ------------------

  const sendText = () => {
    if (!draft.trim() || paused) return;
    addSegment(c.id, draft.trim(), "TEXT");
    setDraft("");
  };

  const commitTranscript = (text: string, engine: string) => {
    if (!text.trim()) return;
    addSegment(c.id, text.trim(), "VOICE", {
      sttEngine: engine,
      speechFeatures: simulatedSpeechFeatures(complainantCount),
    });
    setTranscript("");
    setInterim("");
    setUploadName("");
    setSttNote("");
  };

  const stopRecording = () => {
    setRecording(false);
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  };

  const startRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecSecs(0);
    setRecording(true);
    if (SR) {
      try {
        const rec = new SR();
        rec.lang = STT_LANG[lang];
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (e: any) => {
          let finalText = "";
          let interimText = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalText += r[0].transcript;
            else interimText += r[0].transcript;
          }
          if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
          setInterim(interimText);
        };
        rec.onerror = () => setSttNote("Browser STT error — falling back to demo simulation.");
        recognitionRef.current = rec;
        rec.start();
        setSttNote("Browser speech-to-text active (Web Speech API)");
        return;
      } catch { /* fall through */ }
    }
    setSttNote("Live STT unavailable in this browser — using Demo AI Simulation Layer");
  };

  const simulateOne = () => {
    const idx = Math.min(complainantCount, script.length - 1);
    if (idx >= script.length) return;
    setRecSecs(0);
    setRecording(true);
    setSttNote("Demo AI Simulation Layer — simulated voice input");
    timersRef.current.push(
      setTimeout(() => {
        setRecording(false);
        setSttNote("Speech-to-Text (demo simulation) — transcript ready");
        setTranscript(script[idx]);
      }, 2200)
    );
  };

  const playGuidedDemo = () => {
    if (demoRunning) { demoRef.current = false; setDemoRunning(false); timersRef.current.forEach(clearTimeout); timersRef.current = []; setRecording(false); return; }
    demoRef.current = true;
    setDemoRunning(true);
    setMode("VOICE");
    const step = (i: number) => {
      if (!demoRef.current) return;
      if (i >= script.length) { demoRef.current = false; setDemoRunning(false); return; }
      addOfficerMessage(c.id, OFFICER_PROMPTS[lang][Math.min(i, OFFICER_PROMPTS[lang].length - 1)]);
      setRecSecs(0);
      setRecording(true);
      setSttNote("Demo AI Simulation Layer — simulated voice input");
      timersRef.current.push(
        setTimeout(() => {
          if (!demoRef.current) { setRecording(false); return; }
          setRecording(false);
          commitTranscriptFor(script[i], i);
          timersRef.current.push(setTimeout(() => step(i + 1), 2000));
        }, 2400)
      );
    };
    step(complainantCount >= script.length ? script.length : complainantCount);
  };

  const commitTranscriptFor = (text: string, i: number) => {
    addSegment(c.id, text, "VOICE", {
      sttEngine: "Whisper (demo simulation)",
      speechFeatures: simulatedSpeechFeatures(i),
    });
    setTranscript("");
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadName(f.name);
    setSttNote(`Uploaded: ${f.name} — transcription via demo simulation`);
    const idx = Math.min(complainantCount, script.length - 1);
    setTranscript(script[idx]);
    e.target.value = "";
  };

  const endAssessment = () => {
    setConfirmEnd(false);
    completeAssessment(c.id);
    router.push(`/assessment/${c.id}`);
  };

  // ------------------ render ------------------

  return (
    <StaffShell>
      {/* Header strip */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-card">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-mono font-bold text-indigo-600">{c.caseCode}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{c.category}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{languageName(lang)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">{c.channel}</span>
          {segments.length > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-500" /> Live
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : t(uiLang, "assessment.pause")}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmEnd(true)} disabled={segments.length === 0}>
            <Square className="h-3.5 w-3.5" /> {t(uiLang, "assessment.endAssessment")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* LEFT — Conversation */}
        <Card
          className="xl:col-span-4"
          title={t(uiLang, "assessment.conversation")}
          subtitle={`${complainantCount} complainant segments`}
          actions={
            <button
              onClick={playGuidedDemo}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                demoRunning
                  ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              )}
            >
              {demoRunning ? <CircleStop className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {demoRunning ? "Stop demo" : "Run guided demo"}
            </button>
          }
          bodyClass="p-0"
        >
          <div ref={scrollRef} className="max-h-[380px] space-y-3 overflow-y-auto p-4">
            {segments.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs leading-relaxed text-slate-400">
                The conversation will appear here. Use text mode, voice mode, or the guided demo
                (&ldquo;{script[0].slice(0, 60)}…&rdquo;).
              </p>
            )}
            {segments.map((s) =>
              s.role === "OFFICER" ? (
                <div key={s.id} className="flex justify-start">
                  <div className="max-w-[85%] rounded-xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600">
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Officer · {fmtClock(s.atSec)}</p>
                    {s.text}
                  </div>
                </div>
              ) : (
                <div key={s.id} className="flex justify-end">
                  <div className="max-w-[90%] rounded-xl rounded-br-sm border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                      Complainant · {fmtClock(s.atSec)} · {s.mode === "VOICE" ? <Mic className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                    </p>
                    <Highlighted text={s.text} lang={lang} />
                    {s.analysis && s.analysis.events.length > 0 && (
                      <p className="mt-1.5 border-t border-indigo-100 pt-1.5 text-[10px] text-rose-600">
                        {s.analysis.events.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">
              {(["TEXT", "VOICE"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition",
                    mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {m === "TEXT" ? "Text Mode" : "Voice Mode"}
                </button>
              ))}
            </div>

            {mode === "TEXT" ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
                  rows={3}
                  placeholder="Please describe what happened…"
                  disabled={paused}
                  className={inputClass}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">Enter to send · Shift+Enter for a new line</p>
                  <Button size="sm" onClick={sendText} disabled={paused || !draft.trim()}>
                    <Send className="h-3.5 w-3.5" /> {t(uiLang, "assessment.send")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Waveform active={recording} />
                <div className="flex items-center justify-between text-xs">
                  <span className={cn("font-medium", recording ? "text-rose-600" : "text-slate-400")}>
                    {recording ? "● Recording" : "Microphone idle"} · {fmtClock(recSecs)}
                  </span>
                  <span className="text-slate-400">{languageName(lang)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!recording ? (
                    <Button size="sm" variant={sttNote.includes("Demo") ? "warn" : "primary"} onClick={startRecording} disabled={paused}>
                      <Mic className="h-3.5 w-3.5" /> {t(uiLang, "assessment.startRecording")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="danger" onClick={stopRecording}>
                      <Square className="h-3.5 w-3.5" /> {t(uiLang, "assessment.stopRecording")}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={simulateOne} disabled={recording || paused}>
                    <AudioLines className="h-3.5 w-3.5" /> Simulate voice input
                  </Button>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" /> Upload audio
                    <input type="file" accept="audio/*" className="hidden" onChange={onUpload} />
                  </label>
                </div>
                {sttNote && <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">{sttNote}</p>}
                {uploadName && <p className="text-[11px] text-slate-400">File: {uploadName}</p>}

                {/* Speech-to-Text flow */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <Mic className="h-3 w-3" /> Voice input <ArrowRight className="h-3 w-3" /> Speech-to-Text
                  </div>
                  <div className="mt-2 min-h-[56px] rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-700">
                    {transcript || interim ? (
                      <>
                        <Highlighted text={transcript || interim} lang={lang} />
                        {interim && !transcript && <span className="ml-1 animate-pulse text-slate-400">…</span>}
                      </>
                    ) : (
                      <span className="text-slate-400">Transcript will appear here…</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {transcript ? "Highlighted phrases = detected signals" : "Whisper ASR in production · demo simulation here"}
                    </span>
                    <div className="flex gap-2">
                      {transcript && (
                        <Button size="sm" variant="ghost" onClick={() => { setTranscript(""); setSttNote(""); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" onClick={() => commitTranscript(transcript, "Whisper (demo simulation)")} disabled={!transcript || paused}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Add to conversation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* CENTER — Live analysis */}
        <Card
          className="xl:col-span-4"
          title={t(uiLang, "assessment.liveAnalysis")}
          subtitle="Prototype signal detection — updates with every segment"
        >
          <SafetyAlert visible={!!analysis?.escalationRequired} />
          {!analysis ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">Awaiting first segment…</p>
              <p className="mt-1 text-xs text-slate-400">Indicators appear as the conversation develops.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <IndicatorBar label="Distress" score={analysis.distressScore} />
                <IndicatorBar label="Fear" score={analysis.fearScore} />
                <IndicatorBar label="Anxiety" score={analysis.anxietyScore} />
                <IndicatorBar label="Trauma-related distress" score={analysis.traumaIndicator} />
                <IndicatorBar label="Depression indicators" score={analysis.depressionIndicator} />
                <IndicatorBar label="Safety concern" score={analysis.safetyConcernScore} />
                <IndicatorBar label="Social isolation" score={analysis.socialIsolationScore} />
                <IndicatorBar label="Medical concern" score={analysis.medicalScore} />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Detected signals — why these scores
                </p>
                {analysis.evidence.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.evidence.slice(0, 10).map((e) => (
                      <EvidenceChip key={e.id} item={e} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400">No distress-related signals detected yet.</p>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Prototype signal detection — deterministic keyword & phrase matching plus simulated
                speech features. Not a clinical diagnosis.
              </p>
            </div>
          )}
        </Card>

        {/* RIGHT — SVI + risk + recommendations */}
        <Card
          className="xl:col-span-4"
          title="Stress Vulnerability Index"
          subtitle="Live — recomputed after every segment"
        >
          {analysis ? (
            <div className="space-y-4">
              <SviDial svi={analysis.svi} risk={analysis.riskLevel} />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">SVI contribution</p>
                <div className="space-y-1.5">
                  {analysis.sviBreakdown.filter((b) => b.weight > 0).map((b) => (
                    <div key={b.dimension} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{CATEGORY_LABELS[b.dimension]}</span>
                      <span className="tabular-nums text-slate-500">
                        {b.score} × {b.weight} = <strong className="text-slate-800">+{b.contribution}</strong>
                      </span>
                    </div>
                  ))}
                  {analysis.speechModifier > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Speech features (simulated)</span>
                      <span className="tabular-nums text-slate-500"><strong className="text-slate-800">+{analysis.speechModifier}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Recommended support (AI — requires verification)
                </p>
                {analysis.recommendations.length ? (
                  <ul className="space-y-2">
                    {analysis.recommendations.map((r) => (
                      <li key={r.type} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800">{recommendationLabel(r.type)}</p>
                          <span className="text-[10px] font-bold text-slate-400">{r.strength}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{r.reason}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-indigo-400" style={{ width: `${r.strength}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-slate-400">No recommendations yet.</p>
                )}
              </div>

              {analysis.escalationRequired && (
                <Button variant="danger" className="w-full" onClick={() => setConfirmEscalate(true)}>
                  <AlertTriangle className="h-4 w-4" /> Escalate for human attention
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-medium text-slate-500">SVI: awaiting input</p>
              <p className="mt-1 text-xs text-slate-400">The index appears once the conversation begins.</p>
            </div>
          )}
        </Card>

        {/* BOTTOM — Dynamic Distress Mapping */}
        <Card
          className="xl:col-span-12"
          title={t(uiLang, "assessment.distressTimeline")}
          subtitle="Dynamic Distress Mapping — distress tracked across the conversation. ● markers = events (threat, safety concern, support request…)"
        >
          <DistressTimelineChart timeline={assessment?.timeline || []} />
        </Card>
      </div>

      {/* Modals */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setConfirmEnd(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">End assessment?</h3>
            <p className="mt-2 text-sm text-slate-600">
              The final SVI ({analysis?.svi ?? "—"} — {analysis?.riskLevel ?? "—"}) and recommendations will
              be recorded and sent for human verification.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmEnd(false)}>Continue assessment</Button>
              <Button variant="danger" onClick={endAssessment}>End & generate report</Button>
            </div>
          </div>
        </div>
      )}

      {confirmEscalate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setConfirmEscalate(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-base font-semibold text-rose-700">
              <AlertTriangle className="h-5 w-5" /> Escalate for human attention
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This flags the case for immediate supervisory review. The system will not contact police or
              emergency services — a trained human decides all actions.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmEscalate(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  escalateCase(c.id, "Safety alert raised during live assessment — escalated by " + user.name);
                  setConfirmEscalate(false);
                }}
              >
                Escalate case
              </Button>
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
