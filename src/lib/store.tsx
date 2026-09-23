"use client";

// FLOWMINDS'26 — client-side application store.
// Demo persistence: localStorage. In production this layer is backed by
// Firebase Auth/Firestore via the same action interface (see README).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { analyzeAssessment } from "./ai/analyzeAssessment";
import { seedDB } from "./demo/seed";
import {
  Assessment, AuditEntry, CaseRecord, DB, FollowUp, Language, RecommendationType,
  Referral, SpeechFeatures, User,
} from "./types";
import { uid } from "./utils";
import { getFirebaseClient, isFirebaseConfigured } from "@/lib/firebase";
import { getRoleTitle, inferRoleFromEmail, resolveFirebaseRole } from "@/lib/firebase-role";

const STORAGE_KEY = "flowminds_db_v1";

function loadDB(): DB {
  if (typeof window === "undefined") return seedDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* fall through to reseed */
  }
  const fresh = seedDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const nowIso = () => new Date().toISOString();

export interface NewCaseInput {
  language: Language;
  name?: string;
  ageRange: string;
  contactPreference: string;
  location: string;
  category: string;
  channel: CaseRecord["channel"];
  assignedTo?: string;
}

export interface StoreValue {
  db: DB | null;
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  createCase: (input: NewCaseInput) => CaseRecord | null;
  startAssessment: (caseId: string) => void;
  addOfficerMessage: (caseId: string, text: string) => void;
  addSegment: (
    caseId: string,
    text: string,
    mode: "TEXT" | "VOICE",
    opts?: { sttEngine?: string; speechFeatures?: SpeechFeatures }
  ) => void;
  completeAssessment: (caseId: string) => void;
  verifyRecommendation: (
    caseId: string,
    decision: "ACCEPT" | "MODIFY" | "REJECT",
    notes: string,
    modifiedTypes: RecommendationType[]
  ) => void;
  escalateCase: (caseId: string, reason: string) => void;
  createReferral: (caseId: string, type: RecommendationType, provider: string, notes: string) => void;
  updateReferralStatus: (referralId: string, status: Referral["status"]) => void;
  scheduleFollowUp: (
    caseId: string, dueAt: string, mode: FollowUp["mode"], notes: string, assignedTo: string
  ) => void;
  updateFollowUpStatus: (followUpId: string, status: FollowUp["status"]) => void;
  closeCase: (caseId: string, reason: string) => void;
  setUiLanguage: (lang: Language) => void;
  resetDemo: () => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);

  useEffect(() => {
    setDb(loadDB());
  }, []);

  useEffect(() => {
    if (db && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  }, [db]);

  const user = useMemo(() => {
    if (!db || !db.session.userId) return null;
    return db.users.find((u) => u.id === db.session.userId) || null;
  }, [db]);

  const withLog = useCallback(
    (fn: (draft: DB, log: (action: string, details: string, caseId?: string, severity?: AuditEntry["severity"]) => void) => void) => {
      setDb((prev) => {
        if (!prev) return prev;
        const next = clone(prev);
        const actor = next.users.find((u) => u.id === next.session.userId);
        const log = (action: string, details: string, caseId?: string, severity: AuditEntry["severity"] = "INFO") =>
          next.audit.unshift({
            id: uid("aud"), at: nowIso(),
            actorId: actor?.id || "system", actorName: actor?.name || "System",
            action, details, caseId, severity,
          });
        fn(next, log);
        return next;
      });
    },
    []
  );

  const actions = useMemo<StoreValue>(() => {
    const currentUser = (draft: DB) => draft.users.find((u) => u.id === draft.session.userId);

    return {
      db,
      user,

      login: async (email, password) => {
        const trimmedEmail = email.trim();
        const firebaseClient = getFirebaseClient();

        if (isFirebaseConfigured && firebaseClient) {
          try {
            const result = await signInWithEmailAndPassword(firebaseClient.auth, trimmedEmail, password);
            const tokenResult = await result.user.getIdTokenResult();
            const resolvedRole = resolveFirebaseRole(tokenResult.claims.role, result.user.email) || inferRoleFromEmail(result.user.email);

            setDb((prev) => {
              if (!prev) return prev;
              const next = clone(prev);
              const existing = next.users.find((x) => x.email.toLowerCase() === trimmedEmail.toLowerCase());
              const chosenUser = existing || {
                id: `firebase_${result.user.uid}`,
                name: result.user.displayName || trimmedEmail.split("@")[0],
                email: trimmedEmail,
                password: password,
                role: resolvedRole,
                title: getRoleTitle(resolvedRole),
              };

              if (existing) {
                existing.role = resolvedRole;
                existing.title = getRoleTitle(resolvedRole);
              }

              if (!existing) next.users.unshift(chosenUser);
              next.session.userId = chosenUser.id;
              next.audit.unshift({
                id: uid("aud"), at: nowIso(), actorId: chosenUser.id, actorName: chosenUser.name,
                action: "LOGIN_SUCCESS", details: `${chosenUser.role} signed in via Firebase Auth`, severity: "INFO",
              });
              return next;
            });
            return { ok: true };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid Firebase credentials";
            setDb((prev) => {
              if (!prev) return prev;
              const next = clone(prev);
              next.audit.unshift({
                id: uid("aud"), at: nowIso(), actorId: "anonymous", actorName: "Unknown",
                action: "LOGIN_FAILED", details: `Firebase sign-in failed for ${trimmedEmail}: ${message}`, severity: "WARN",
              });
              return next;
            });
            return { ok: false, error: "Invalid Firebase credentials" };
          }
        }

        let result: { ok: boolean; error?: string } = { ok: false, error: "Invalid credentials" };
        setDb((prev) => {
          if (!prev) return prev;
          const next = clone(prev);
          const u = next.users.find((x) => x.email.toLowerCase() === trimmedEmail.toLowerCase());
          if (!u || u.password !== password) {
            next.audit.unshift({
              id: uid("aud"), at: nowIso(), actorId: "anonymous", actorName: "Unknown",
              action: "LOGIN_FAILED", details: `Failed sign-in attempt (${trimmedEmail})`, severity: "WARN",
            });
            return next;
          }
          next.session.userId = u.id;
          next.audit.unshift({
            id: uid("aud"), at: nowIso(), actorId: u.id, actorName: u.name,
            action: "LOGIN_SUCCESS", details: `${u.role} signed in`, severity: "INFO",
          });
          result = { ok: true };
          return next;
        });
        return result;
      },

      logout: async () => {
        const firebaseClient = getFirebaseClient();
        if (isFirebaseConfigured && firebaseClient) {
          await signOut(firebaseClient.auth);
        }
        setDb((prev) => {
          if (!prev) return prev;
          const next = clone(prev);
          const u = currentUser(next);
          if (u)
            next.audit.unshift({
              id: uid("aud"), at: nowIso(), actorId: u.id, actorName: u.name,
              action: "LOGOUT", details: "Session ended", severity: "INFO",
            });
          next.session.userId = null;
          return next;
        });
      },

      createCase: (input) => {
        let created: CaseRecord | null = null;
        setDb((prev) => {
          if (!prev) return prev;
          const next = clone(prev);
          const actor = currentUser(next);
          const seq = next.seq++;
          const code = `FM-2026-${String(seq).padStart(4, "0")}`;
          const c: CaseRecord = {
            id: `case_${seq}`,
            caseCode: code,
            createdAt: nowIso(),
            language: input.language,
            name: input.name?.trim() || undefined,
            ageRange: input.ageRange,
            contactPreference: input.contactPreference,
            location: input.location,
            category: input.category,
            channel: input.channel,
            consent: true,
            status: "OPEN",
            createdBy: actor?.id || "system",
            assignedTo: input.assignedTo || actor?.id,
            lastActivityAt: nowIso(),
          };
          next.cases.unshift(c);
          const log = (action: string, details: string, severity: AuditEntry["severity"] = "INFO") =>
            next.audit.unshift({
              id: uid("aud"), at: nowIso(), actorId: actor?.id || "system",
              actorName: actor?.name || "System", action, details, caseId: c.id, severity,
            });
          log("CASE_CREATED", `Case ${code} created via ${c.channel} — consent recorded`);
          log("CONSENT_RECORDED", "Complainant consent obtained for analysis-assisted handling");
          created = c;
          return next;
        });
        return created;
      },

      startAssessment: (caseId) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c) return;
          let a = draft.assessments.find((x) => x.caseId === caseId && x.status === "ACTIVE");
          if (!a) {
            a = { id: uid("asm"), caseId, segments: [], timeline: [], status: "ACTIVE", startedAt: nowIso() };
            draft.assessments.unshift(a);
          }
          if (c.status !== "ESCALATED" && c.status !== "CLOSED") c.status = "IN_ASSESSMENT";
          c.lastActivityAt = nowIso();
          log("ASSESSMENT_STARTED", `Assessment started (${c.language.toUpperCase()}) — Prototype AI Assessment, Demonstration Mode`, caseId);
        }),

      addOfficerMessage: (caseId, text) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c || !text.trim()) return;
          let a = draft.assessments.find((x) => x.caseId === caseId && x.status === "ACTIVE");
          if (!a) {
            a = { id: uid("asm"), caseId, segments: [], timeline: [], status: "ACTIVE", startedAt: nowIso() };
            draft.assessments.unshift(a);
          }
          const atSec = a.segments.length ? a.segments[a.segments.length - 1].atSec + 8 : 4;
          a.segments.push({ id: uid("seg"), role: "OFFICER", text, language: c.language, mode: "TEXT", atSec });
          c.lastActivityAt = nowIso();
          log("OFFICER_PROMPT_RECORDED", "Officer message recorded in conversation", caseId);
        }),

      addSegment: (caseId, text, mode, opts) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c || !text.trim()) return;
          let a = draft.assessments.find((x) => x.caseId === caseId && x.status === "ACTIVE");
          if (!a) {
            a = { id: uid("asm"), caseId, segments: [], timeline: [], status: "ACTIVE", startedAt: nowIso() };
            draft.assessments.unshift(a);
            log("ASSESSMENT_STARTED", `Assessment started (${c.language.toUpperCase()})`, caseId);
          }
          const priorComplainant = a.segments.filter((s) => s.role === "COMPLAINANT");
          const idx = priorComplainant.length;
          const transcript = [...priorComplainant.map((s) => s.text), text].join(" ");
          const analysis = analyzeAssessment({
            transcript,
            language: c.language,
            speechFeatures: opts?.speechFeatures,
            segmentIndex: idx,
            caseContext: { category: c.category, channel: c.channel },
          });
          const atSec = a.segments.length ? a.segments[a.segments.length - 1].atSec + 22 : 12;
          a.segments.push({
            id: uid("seg"), role: "COMPLAINANT", text, language: c.language, mode,
            sttEngine: opts?.sttEngine, atSec, analysis,
          });
          a.timeline.push({
            t: atSec, distress: analysis.distressScore, fear: analysis.fearScore,
            anxiety: analysis.anxietyScore, safety: analysis.safetyConcernScore,
            svi: analysis.svi, events: analysis.events,
          });
          const prevEsc = priorComplainant.length
            ? priorComplainant[priorComplainant.length - 1].analysis?.escalationRequired
            : false;
          c.svi = analysis.svi;
          c.risk = analysis.riskLevel;
          c.lastActivityAt = nowIso();
          if (c.status === "OPEN" || c.status === "AWAITING_VERIFICATION") c.status = "IN_ASSESSMENT";
          log("SEGMENT_ANALYZED", `Segment ${idx + 1} analyzed — SVI ${analysis.svi} (${analysis.riskLevel})`, caseId,
            analysis.escalationRequired ? "CRITICAL" : "INFO");
          if (analysis.escalationRequired && !prevEsc) {
            log("SAFETY_ALERT_RAISED",
              "Potential immediate safety concern detected — flagged for immediate human attention. No autonomous action taken.",
              caseId, "CRITICAL");
          }
        }),

      completeAssessment: (caseId) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          const a = draft.assessments.find((x) => x.caseId === caseId && x.status === "ACTIVE");
          if (!c || !a) return;
          a.status = "COMPLETED";
          a.completedAt = nowIso();
          const last = a.segments.filter((s) => s.role === "COMPLAINANT").slice(-1)[0];
          a.finalAnalysis = last?.analysis;
          if (last) { c.svi = last.analysis!.svi; c.risk = last.analysis!.riskLevel; }
          c.status = "AWAITING_VERIFICATION";
          c.lastActivityAt = nowIso();
          log("ASSESSMENT_COMPLETED",
            `Assessment completed — SVI ${c.svi ?? "—"}/100 (${c.risk ?? "—"}). Awaiting human verification.`,
            caseId, c.risk === "CRITICAL" || c.risk === "HIGH" ? "WARN" : "INFO");
        }),

      verifyRecommendation: (caseId, decision, notes, modifiedTypes) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          const a = draft.assessments.find((x) => x.caseId === caseId && x.status === "COMPLETED");
          if (!c || !a) return;
          const actor = currentUser(draft);
          a.verification = {
            decision, notes, modifiedRecommendationTypes: modifiedTypes,
            reviewerId: actor?.id || "system", reviewerName: actor?.name || "System", at: nowIso(),
          };
          c.status = decision === "REJECT" ? "OPEN" : "ACTIONED";
          c.lastActivityAt = nowIso();
          log("RECOMMENDATION_VERIFIED",
            `Human review decision: ${decision}. Reviewer notes: ${notes || "—"}`, caseId,
            decision === "REJECT" ? "WARN" : "INFO");
        }),

      escalateCase: (caseId, reason) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c) return;
          c.status = "ESCALATED";
          c.lastActivityAt = nowIso();
          log("CASE_ESCALATED", `Escalated for human attention: ${reason || "critical indicators"}`, caseId, "CRITICAL");
        }),

      createReferral: (caseId, type, provider, notes) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c) return;
          draft.referrals.unshift({
            id: uid("ref"), caseId, type, provider, notes,
            status: "PENDING", createdAt: nowIso(),
            createdBy: currentUser(draft)?.id || "system",
          });
          if (c.status !== "CLOSED" && c.status !== "ESCALATED") c.status = "REFERRED";
          c.lastActivityAt = nowIso();
          log("REFERRAL_CREATED", `Referral created: ${type} → ${provider}`, caseId);
        }),

      updateReferralStatus: (referralId, status) =>
        withLog((draft, log) => {
          const r = draft.referrals.find((x) => x.id === referralId);
          if (!r) return;
          r.status = status;
          log("REFERRAL_STATUS_UPDATED", `Referral ${r.type} marked ${status}`, r.caseId);
        }),

      scheduleFollowUp: (caseId, dueAt, mode, notes, assignedTo) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c) return;
          draft.followUps.unshift({
            id: uid("fu"), caseId, dueAt, mode, notes, status: "SCHEDULED",
            assignedTo, createdAt: nowIso(),
          });
          c.lastActivityAt = nowIso();
          log("FOLLOW_UP_SCHEDULED", `Follow-up scheduled (${mode})`, caseId);
        }),

      updateFollowUpStatus: (followUpId, status) =>
        withLog((draft, log) => {
          const f = draft.followUps.find((x) => x.id === followUpId);
          if (!f) return;
          f.status = status;
          log(status === "COMPLETED" ? "FOLLOW_UP_COMPLETED" : "FOLLOW_UP_UPDATED",
            `Follow-up marked ${status}`, f.caseId, status === "MISSED" ? "WARN" : "INFO");
        }),

      closeCase: (caseId, reason) =>
        withLog((draft, log) => {
          const c = draft.cases.find((x) => x.id === caseId);
          if (!c) return;
          c.status = "CLOSED";
          c.lastActivityAt = nowIso();
          log("CASE_CLOSED", `Case closed: ${reason || "resolved"}`, caseId);
        }),

      setUiLanguage: (lang) =>
        setDb((prev) => (prev ? { ...prev, settings: { ...prev.settings, uiLanguage: lang } } : prev)),

      resetDemo: () => {
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
        setDb(seedDB());
      },
    };
  }, [db, user, withLog]);

  return <Ctx.Provider value={actions}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useCase(caseId: string) {
  const { db } = useStore();
  const c = db?.cases.find((x) => x.id === caseId || x.caseCode === caseId);
  const assessment = db?.assessments.find((a) => a.caseId === c?.id && a.status === "ACTIVE")
    || db?.assessments.find((a) => a.caseId === c?.id);
  return { case: c, assessment };
}
