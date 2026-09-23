"use client";

import { useEffect, useState } from "react";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { useStore } from "@/lib/store";
import { DEMO_USERS } from "@/lib/demo/seed";
import { FollowUp, RecommendationType } from "@/lib/types";
import { recommendationLabel } from "@/lib/ai/recommendations";

const PROVIDERS: Record<string, string[]> = {
  COUNSELLING: ["District Counselling Centre", "Tele-MANAS 14416", "NGO Partner — Counselling"],
  LEGAL_AID: ["District Legal Services Authority (DLSA)", "State Legal Aid Cell"],
  MEDICAL_ASSISTANCE: ["District Hospital", "Mobile Medical Unit"],
  POLICE_INTERVENTION: ["Zonal Police Liaison Unit", "Local Police Station"],
  WITNESS_PROTECTION: ["Witness Protection Coordination Cell"],
  EMERGENCY_SUPPORT: ["State Emergency Response Team", "181 Women & Child Helpline"],
};

export function ReferralModal({
  open, onClose, caseId, defaultType, recommendedTypes,
}: {
  open: boolean; onClose: () => void; caseId: string;
  defaultType?: RecommendationType; recommendedTypes?: RecommendationType[];
}) {
  const { createReferral } = useStore();
  const [type, setType] = useState<RecommendationType>(defaultType || "COUNSELLING");
  const [provider, setProvider] = useState(PROVIDERS[defaultType || "COUNSELLING"][0]);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      const t = defaultType || recommendedTypes?.[0] || "COUNSELLING";
      setType(t);
      setProvider(PROVIDERS[t]?.[0] || "");
      setNotes("");
      setDone(false);
    }
  }, [open, defaultType, recommendedTypes]);

  const submit = () => {
    if (!provider) return;
    createReferral(caseId, type, provider, notes);
    setDone(true);
    setTimeout(onClose, 700);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Referral">
      {done ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Referral created and recorded in the audit log.
        </p>
      ) : (
        <div className="space-y-4">
          <Field label="Referral type">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as RecommendationType); setProvider(PROVIDERS[e.target.value][0]); }}
              className={inputClass}
            >
              {(recommendedTypes?.length ? recommendedTypes : (Object.keys(PROVIDERS) as RecommendationType[])).map((rt) => (
                <option key={rt} value={rt}>
                  {recommendationLabel(rt)}
                  {recommendedTypes?.includes(rt) ? " — recommended" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service provider">
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass}>
              {(PROVIDERS[type] || []).map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Context for the receiving provider…" className={inputClass} />
          </Field>
          <p className="text-[11px] text-slate-400">
            Referrals are created by trained staff after verification. This action is audit-logged.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>Create Referral</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function FollowUpModal({
  open, onClose, caseId,
}: { open: boolean; onClose: () => void; caseId: string }) {
  const { db, scheduleFollowUp, user } = useStore();
  const [mode, setMode] = useState<FollowUp["mode"]>("CALL");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      const d = new Date(Date.now() + 24 * 3600 * 1000);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setWhen(d.toISOString().slice(0, 16));
      setNotes("");
      setAssignedTo(user?.id || "");
      setDone(false);
    }
  }, [open, user]);

  const submit = () => {
    if (!when) return;
    scheduleFollowUp(caseId, new Date(when).toISOString(), mode, notes, assignedTo);
    setDone(true);
    setTimeout(onClose, 700);
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule Follow-up">
      {done ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Follow-up scheduled and recorded in the audit log.
        </p>
      ) : (
        <div className="space-y-4">
          <Field label="Mode">
            <select value={mode} onChange={(e) => setMode(e.target.value as FollowUp["mode"])} className={inputClass}>
              <option value="CALL">Phone call</option>
              <option value="VIDEO">Video call</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </Field>
          <Field label="Due at">
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Assign to">
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputClass}>
              {(db?.users || DEMO_USERS).map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Purpose of the follow-up…" className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit}>Schedule Follow-up</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
