// FLOWMINDS'26 — demo seed data.
// Realistic multi-language cases built by running the REAL prototype analysis
// engine over scripted conversations, so every seeded score is explainable.

import { analyzeAssessment } from "../ai/analyzeAssessment";
import {
  Assessment, AuditEntry, CaseRecord, DB, FollowUp, Language, Referral,
  Segment, SpeechFeatures, TimelinePoint, User,
} from "../types";
import { uid } from "../utils";

const DAY = 86400000;
const HOUR = 3600000;
const nowIso = () => new Date().toISOString();
const ago = (days: number, hours = 0) =>
  new Date(Date.now() - days * DAY - hours * HOUR).toISOString();
const ahead = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();

export const DEMO_USERS: User[] = [
  { id: "u_counsellor", name: "Priya Sharma", email: "counsellor@flowminds.demo", password: "Demo@123", role: "COUNSELLOR", title: "Senior Counsellor" },
  { id: "u_officer", name: "Arjun Mehta", email: "officer@flowminds.demo", password: "Demo@123", role: "SUPPORT_OFFICER", title: "Support Officer" },
  { id: "u_admin", name: "Kavya Iyer", email: "admin@flowminds.demo", password: "Admin@123", role: "ADMIN", title: "State Administrator" },
];

// ---------------------------------------------------------------------------
// Guided demo conversations (per language) used by "Simulate Voice" and seed.
// ---------------------------------------------------------------------------

export const DEMO_SCRIPTS: Record<Language, string[]> = {
  en: [
    "Hello, I need some help please. For the past few weeks I have been very stressed and worried, and I can't sleep properly. I feel anxious and on edge all day.",
    "I have been receiving threats for several weeks and I don't feel safe returning home.",
    "They threatened me again yesterday. They said they would hurt me if I went to the police. I am terrified and afraid of what they might do.",
    "I cannot go home. I think they are following me. I feel like I am in danger all the time.",
    "I haven't been able to sleep. I keep crying every night and I have nightmares. I feel hopeless. I am scared all the time. I feel so alone — nobody believes me. Since the incident I can't stop thinking about what happened. Please tell me what to do.",
  ],
  ta: [
    "வணக்கம், தயவு செய்து எனக்கு உதவி வேண்டும். கடந்த சில வாரங்களாக நான் மிகவும் கவலையாக இருக்கிறேன். தூங்க முடியவில்லை. என்ன செய்வது என்று தெரியவில்லை.",
    "கடந்த சில வாரங்களாக எனக்கு மிரட்டு வருகிறது. வீட்டுக்கு திரும்பினால் நான் பாதுகாப்பாக இல்லை.",
    "நேற்று அவர்கள் என்னை மீண்டும் மிரட்டினார்கள். காவலுக்கு போனால் எனக்கு தீங்கு செய்வார்கள் என்று சொன்னார்கள். நான் பயந்து நடுங்குகிறேன்.",
    "நான் வீட்டுக்கு போக முடியவில்லை. என்னை பின்தொடர்கிறார்கள். எப்போதும் ஆபத்தாக இருக்கிறது.",
    "இரவுகளில் தூங்க முடியவில்லை. தினமும் அழுது கொண்டிருக்கிறேன். அந்த சம்பவத்திற்கு பிறகு நினைவுகள் திரும்ப திரும்ப வருகின்றன. நான் மிகவும் தனிமையில் இருக்கிறேன் — யாரும் நம்புவதில்லை. என்ன செய்வது?",
  ],
  hi: [
    "नमस्ते, कृपया मेरी मदद कीजिए। पिछले कुछ हफ्तों से मैं बहुत चिंता में हूँ और बेचैन रहती हूँ। नींद नहीं आती। समझ नहीं आता क्या करूँ।",
    "कुछ हफ्तों से मुझे धमकी दी जा रही है। घर वापस जाने पर मैं सुरक्षित महसूस नहीं करती।",
    "कल उन्होंने फिर धमकाया। कहा कि पुलिस के पास गई तो मुझे नुकसान पहुँचाएंगे। मैं बहुत डर गई हूँ और कांप रही हूँ।",
    "मैं घर नहीं जा सकती। लगता है वे मेरा पीछा करते हैं। मुझे हर समय खतरे में महसूस होता है।",
    "रात को नींद नहीं आती। मैं रो रही हूँ। घटना के बाद से वो दृश्य बार-बार याद आते हैं। मैं बिल्कुल अकेली हूँ — कोई विश्वास नहीं करता। कृपया बताइए मैं क्या करूँ।",
  ],
};

// Lower-intensity scripts for resolved / low-risk seed cases.
export const LOW_SCRIPTS: Record<Language, string[]> = {
  en: [
    "I want to file a complaint about a property dispute in my area. The other party has sent a legal notice.",
    "It is causing me some stress, but mainly I need legal advice on the next steps.",
  ],
  ta: [
    "என் பகுதியில் உள்ள ஒரு சொத்து தகராறு குறித்து புகார் அளிக்க விரும்புகிறேன்.",
    "இது சில கவலையை தருகிறது, ஆனால் முக்கியமாக அடுத்த கட்டங்களுக்கு சட்ட ஆலோசனை தேவை.",
  ],
  hi: [
    "मैं अपने क्षेत्र की एक संपत्ति विवाद से जुड़ी शिकायत दर्ज कराना चाहती हूँ।",
    "इससे मुझे कुछ चिंता होती है, लेकिन मुख्य रूप से मुझे अगले कदमों के लिए कानूनी सलाह चाहिए।",
  ],
};

export const OFFICER_PROMPTS: Record<Language, string[]> = {
  en: [
    "Thank you for reaching out. You are in a safe space — please take your time and tell me what happened.",
    "I understand. That must be very difficult. Can you tell me more about what has been happening?",
    "I hear you. Your safety is important to us. Please continue.",
    "Thank you for trusting me with this. Please go on.",
    "You have been very brave in sharing this. Is there anything more you would like to tell me?",
  ],
  ta: [
    "தொடர்பு கொண்டதற்கு நன்றி. நீங்கள் பாதுகாப்பான இடத்தில் இருக்கிறீர்கள் — நிதானமாக சொல்லுங்கள்.",
    "புரிகிறது. இது மிகவும் கஷ்டமான சூழ்நிலை. மேலும் விவரமாக சொல்ல முடியுமா?",
    "உங்கள் பாதுகாப்பு எங்களுக்கு முக்கியம். தொடரவும்.",
    "இதை என்னுடன் பகிர்ந்ததற்கு நன்றி. தொடரவும்.",
    "இதை பகிர்ந்ததற்கு நீங்கள் மிகவும் தைரியமாக இருக்கிறீர்கள்.",
  ],
  hi: [
    "संपर्क करने के लिए धन्यवाद। आप सुरक्षित जगह पर हैं — ठीक से बताइए।",
    "समझ गई। यह बहुत कठिन होगा। क्या आप और बता सकती हैं?",
    "आपकी सुरक्षा हमारे लिए महत्वपूर्ण है। कृपया जारी रखें।",
    "यह साझा करने के लिए धन्यवाद। कृपया बताते रहिए।",
    "यह साझा करने के लिए आप बहुत साहसी हैं।",
  ],
};

// Simulated prosodic features for a voice segment (demo simulation layer).
export function simulatedSpeechFeatures(segmentIndex: number): SpeechFeatures {
  return {
    speechRate: 110 - segmentIndex * 6,
    tremor: Math.min(1, 0.25 + segmentIndex * 0.15),
    pauseFrequency: Math.min(1, 0.2 + segmentIndex * 0.12),
    volumeVariability: Math.min(1, 0.25 + segmentIndex * 0.1),
    simulated: true,
  };
}

export function buildDemoAssessment(
  caseId: string,
  language: Language,
  script: string[],
  category: string,
  startedAt: string,
  upTo?: number,
  complete = true
): Assessment {
  const prompts = OFFICER_PROMPTS[language] || OFFICER_PROMPTS.en;
  const segments: Segment[] = [];
  const timeline: TimelinePoint[] = [];
  const take = upTo ? script.slice(0, upTo) : script;

  let t = 12;
  segments.push({ id: uid("seg"), role: "OFFICER", text: prompts[0], language, mode: "TEXT", atSec: t });

  take.forEach((text, i) => {
    t += 22;
    const transcriptSoFar = take.slice(0, i + 1).join(" ");
    const analysis = analyzeAssessment({
      transcript: transcriptSoFar,
      language,
      speechFeatures: simulatedSpeechFeatures(i),
      segmentIndex: i,
      caseContext: { category },
    });
    segments.push({ id: uid("seg"), role: "COMPLAINANT", text, language, mode: "VOICE", sttEngine: "Whisper (demo simulation)", atSec: t, analysis });
    timeline.push({
      t,
      distress: analysis.distressScore,
      fear: analysis.fearScore,
      anxiety: analysis.anxietyScore,
      safety: analysis.safetyConcernScore,
      svi: analysis.svi,
      events: analysis.events,
    });
    if (i < take.length - 1) {
      t += 8;
      segments.push({ id: uid("seg"), role: "OFFICER", text: prompts[(i + 1) % prompts.length], language, mode: "TEXT", atSec: t });
    }
  });

  const last = segments.filter((s) => s.role === "COMPLAINANT").slice(-1)[0];
  return {
    id: uid("asm"),
    caseId,
    segments,
    timeline,
    status: complete ? "COMPLETED" : "ACTIVE",
    startedAt,
    completedAt: complete ? nowIso() : undefined,
    finalAnalysis: complete ? last?.analysis : undefined,
  };
}

// ---------------------------------------------------------------------------

interface MkCase {
  seq: number;
  language: Language;
  category: string;
  channel: CaseRecord["channel"];
  status: CaseRecord["status"];
  daysAgo: number;
  hoursAgo?: number;
  name?: string;
  age: string;
  contact: string;
  location: string;
  createdBy: string;
  assignedTo?: string;
}

export function seedDB(): DB {
  const cases: CaseRecord[] = [];
  const assessments: Assessment[] = [];
  const referrals: Referral[] = [];
  const followUps: FollowUp[] = [];
  const audit: AuditEntry[] = [];

  const nameOf = (id: string) => DEMO_USERS.find((u) => u.id === id)?.name || "System";
  const log = (at: string, actorId: string, action: string, details: string, caseId?: string, severity: AuditEntry["severity"] = "INFO") =>
    audit.push({ id: uid("aud"), at, actorId, actorName: nameOf(actorId), action, details, caseId, severity });

  const mk = (o: MkCase): CaseRecord => {
    const createdAt = ago(o.daysAgo, o.hoursAgo ?? 0);
    const code = `FM-2026-${String(o.seq).padStart(4, "0")}`;
    const c: CaseRecord = {
      id: `case_${o.seq}`,
      caseCode: code,
      createdAt,
      language: o.language,
      name: o.name,
      ageRange: o.age,
      contactPreference: o.contact,
      location: o.location,
      category: o.category,
      channel: o.channel,
      consent: true,
      status: o.status,
      createdBy: o.createdBy,
      assignedTo: o.assignedTo,
      lastActivityAt: createdAt,
    };
    cases.push(c);
    log(createdAt, o.createdBy, "CASE_CREATED", `Case ${code} created via ${o.channel}`, c.id);
    log(createdAt, o.createdBy, "CONSENT_RECORDED", "Complainant consent obtained for analysis-assisted handling", c.id);
    return c;
  };

  const attach = (c: CaseRecord, a: Assessment, startedAt: string) => {
    assessments.push(a);
    log(startedAt, c.createdBy, "ASSESSMENT_STARTED", `Assessment started (${c.language.toUpperCase()})`, c.id);
    const escalated = a.timeline.some((p) => p.safety >= 60);
    if (escalated) {
      log(startedAt, c.createdBy, "SAFETY_ALERT_RAISED", "Potential immediate safety concern detected — flagged for human attention", c.id, "CRITICAL");
    }
  };

  // ---- 0107: fresh intake, no assessment yet (judge can start one) ----
  mk({ seq: 107, language: "en", category: "Harassment", channel: "NHAA 14566", status: "OPEN", daysAgo: 0, hoursAgo: 1, name: "R. Krishnan", age: "26–40", contact: "Phone call", location: "Coimbatore, TN", createdBy: "u_counsellor", assignedTo: "u_counsellor" });

  // ---- 0101: live in assessment (partial conversation, judge continues) ----
  {
    const c = mk({ seq: 101, language: "en", category: "Stalking", channel: "MOBILE_APP", status: "IN_ASSESSMENT", daysAgo: 0, hoursAgo: 2, name: "Anonymous-101", age: "18–25", contact: "In-app chat", location: "Chennai, TN", createdBy: "u_counsellor", assignedTo: "u_counsellor" });
    const started = ago(0, 1);
    const a = buildDemoAssessment(c.id, "en", DEMO_SCRIPTS.en, c.category, started, 3, false);
    attach(c, a, started);
    const last = a.timeline[a.timeline.length - 1];
    c.svi = last.svi; c.risk = last.svi >= 50 ? "HIGH" : last.svi >= 25 ? "MODERATE" : "LOW";
    c.lastActivityAt = started;
  }

  // ---- 0102: awaiting human verification (Tamil, HIGH) ----
  {
    const c = mk({ seq: 102, language: "ta", category: "Harassment", channel: "NHAA 14566", status: "AWAITING_VERIFICATION", daysAgo: 0, hoursAgo: 5, age: "26–40", contact: "Helpline callback", location: "Madurai, TN", createdBy: "u_counsellor", assignedTo: "u_counsellor" });
    const started = ago(0, 4);
    const a = buildDemoAssessment(c.id, "ta", DEMO_SCRIPTS.ta, c.category, started);
    attach(c, a, started);
    c.svi = a.finalAnalysis!.svi; c.risk = a.finalAnalysis!.riskLevel;
    log(a.completedAt!, c.createdBy, "ASSESSMENT_COMPLETED", `Assessment completed — SVI ${c.svi} (${c.risk}). Awaiting human verification.`, c.id, c.risk === "CRITICAL" ? "CRITICAL" : "WARN");
  }

  // ---- 0103: awaiting verification (Hindi, HIGH) ----
  {
    const c = mk({ seq: 103, language: "hi", category: "Domestic Violence", channel: "NHAA 14566", status: "AWAITING_VERIFICATION", daysAgo: 1, age: "26–40", contact: "Helpline callback", location: "Lucknow, UP", createdBy: "u_counsellor", assignedTo: "u_officer" });
    const started = ago(1, 2);
    const a = buildDemoAssessment(c.id, "hi", DEMO_SCRIPTS.hi, c.category, started);
    attach(c, a, started);
    c.svi = a.finalAnalysis!.svi; c.risk = a.finalAnalysis!.riskLevel;
    log(a.completedAt!, c.createdBy, "ASSESSMENT_COMPLETED", `Assessment completed — SVI ${c.svi} (${c.risk}). Awaiting human verification.`, c.id, "WARN");
  }

  // ---- 0104: referred (English, LOW, legal aid) ----
  {
    const c = mk({ seq: 104, language: "en", category: "Property Dispute", channel: "CHATBOT", status: "REFERRED", daysAgo: 1, hoursAgo: 6, age: "41–60", contact: "Email", location: "Pune, MH", createdBy: "u_counsellor", assignedTo: "u_officer" });
    const started = ago(1, 5);
    const a = buildDemoAssessment(c.id, "en", LOW_SCRIPTS.en, c.category, started);
    attach(c, a, started);
    c.svi = a.finalAnalysis!.svi; c.risk = a.finalAnalysis!.riskLevel;
    a.verification = { decision: "ACCEPT", notes: "Assessment matches my reading — legal aid referral appropriate.", modifiedRecommendationTypes: ["LEGAL_AID"], reviewerId: "u_officer", reviewerName: nameOf("u_officer"), at: ago(1, 4) };
    log(ago(1, 4), "u_officer", "RECOMMENDATION_VERIFIED", "AI recommendation accepted by support officer", c.id);
    referrals.push({ id: uid("ref"), caseId: c.id, type: "LEGAL_AID", provider: "District Legal Services Authority (DLSA)", notes: "Property dispute — legal consultation required", status: "PENDING", createdAt: ago(1, 3), createdBy: "u_officer" });
    log(ago(1, 3), "u_officer", "REFERRAL_CREATED", "Referral created: LEGAL_AID → District Legal Services Authority (DLSA)", c.id);
  }

  // ---- 0105: actioned & referral completed (Tamil, LOW) ----
  {
    const c = mk({ seq: 105, language: "ta", category: "Property Dispute", channel: "IVRS", status: "ACTIONED", daysAgo: 2, age: "41–60", contact: "Phone call", location: "Salem, TN", createdBy: "u_counsellor", assignedTo: "u_counsellor" });
    const started = ago(2, 4);
    const a = buildDemoAssessment(c.id, "ta", LOW_SCRIPTS.ta, c.category, started);
    attach(c, a, started);
    c.svi = a.finalAnalysis!.svi; c.risk = a.finalAnalysis!.riskLevel;
    a.verification = { decision: "ACCEPT", notes: "Low risk confirmed. Legal aid referral completed.", modifiedRecommendationTypes: ["LEGAL_AID"], reviewerId: "u_counsellor", reviewerName: nameOf("u_counsellor"), at: ago(2, 3) };
    log(ago(2, 3), "u_counsellor", "RECOMMENDATION_VERIFIED", "AI recommendation accepted by counsellor", c.id);
    referrals.push({ id: uid("ref"), caseId: c.id, type: "LEGAL_AID", provider: "Taluk Legal Services Committee", notes: "Guidance on property documentation", status: "COMPLETED", createdAt: ago(2, 2), createdBy: "u_counsellor" });
    log(ago(2, 2), "u_counsellor", "REFERRAL_CREATED", "Referral created: LEGAL_AID → Taluk Legal Services Committee", c.id);
    log(ago(1, 0), "u_counsellor", "REFERRAL_STATUS_UPDATED", "Referral marked COMPLETED by provider", c.id);
    followUps.push({ id: uid("fu"), caseId: c.id, dueAt: ago(1, 0), mode: "CALL", notes: "Confirm legal consultation attended", status: "MISSED", assignedTo: "u_counsellor", createdAt: ago(2, 1) });
    log(ago(1, 0), "u_counsellor", "FOLLOW_UP_MISSED", "Follow-up call not answered — reschedule", c.id, "WARN");
    followUps.push({ id: uid("fu"), caseId: c.id, dueAt: ahead(24), mode: "CALL", notes: "Second attempt — confirm legal consultation attended", status: "SCHEDULED", assignedTo: "u_counsellor", createdAt: ago(0, 22) });
    log(ago(0, 22), "u_counsellor", "FOLLOW_UP_SCHEDULED", "Follow-up scheduled (CALL, +24h)", c.id);
  }

  // ---- 0106: closed (Hindi, LOW) ----
  {
    const c = mk({ seq: 106, language: "hi", category: "Workplace Grievance", channel: "WEB_PORTAL", status: "CLOSED", daysAgo: 3, age: "26–40", contact: "Email", location: "Jaipur, RJ", createdBy: "u_counsellor", assignedTo: "u_officer" });
    const started = ago(3, 5);
    const a = buildDemoAssessment(c.id, "hi", LOW_SCRIPTS.hi, c.category, started);
    attach(c, a, started);
    c.svi = a.finalAnalysis!.svi; c.risk = a.finalAnalysis!.riskLevel;
    a.verification = { decision: "ACCEPT", notes: "Low risk. Advised legal-aid signposting; complainant satisfied.", modifiedRecommendationTypes: ["LEGAL_AID"], reviewerId: "u_officer", reviewerName: nameOf("u_officer"), at: ago(3, 4) };
    log(ago(3, 4), "u_officer", "RECOMMENDATION_VERIFIED", "AI recommendation accepted by support officer", c.id);
    followUps.push({ id: uid("fu"), caseId: c.id, dueAt: ago(2, 0), mode: "CALL", notes: "Confirm grievance resolution", status: "COMPLETED", assignedTo: "u_officer", createdAt: ago(3, 3) });
    log(ago(2, 0), "u_officer", "FOLLOW_UP_COMPLETED", "Follow-up completed — complainant confirmed resolution", c.id);
    log(ago(1, 12), "u_officer", "CASE_CLOSED", "Case closed after successful resolution", c.id);
    c.lastActivityAt = ago(1, 12);
  }

  // ---- 0099: escalated critical (English, safety alerts, referrals) ----
  {
    const c = mk({ seq: 99, language: "en", category: "Domestic Violence", channel: "NHAA 14566", status: "ESCALATED", daysAgo: 5, age: "26–40", contact: "Helpline callback", location: "Generalised — North Zone", createdBy: "u_counsellor", assignedTo: "u_officer" });
    const started = ago(5, 6);
    const a = buildDemoAssessment(c.id, "en", DEMO_SCRIPTS.en, c.category, started);
    attach(c, a, started);
    c.svi = a.finalAnalysis!.svi; c.risk = a.finalAnalysis!.riskLevel;
    log(a.completedAt!, c.createdBy, "ASSESSMENT_COMPLETED", `Assessment completed — SVI ${c.svi} (${c.risk}).`, c.id, "CRITICAL");
    a.verification = { decision: "MODIFY", notes: "Agreed with police intervention; added witness protection given explicit intimidation. Emergency support dispatched with supervisor approval.", modifiedRecommendationTypes: ["POLICE_INTERVENTION", "WITNESS_PROTECTION", "EMERGENCY_SUPPORT", "COUNSELLING"], reviewerId: "u_officer", reviewerName: nameOf("u_officer"), at: ago(5, 5) };
    log(ago(5, 5), "u_officer", "RECOMMENDATION_VERIFIED", "Recommendation MODIFIED and approved by support officer (added witness protection)", c.id, "WARN");
    referrals.push({ id: uid("ref"), caseId: c.id, type: "EMERGENCY_SUPPORT", provider: "State Emergency Response Team", notes: "Immediate safety concern — coordinated with supervisor", status: "COMPLETED", createdAt: ago(5, 4), createdBy: "u_officer" });
    log(ago(5, 4), "u_officer", "REFERRAL_CREATED", "Referral created: EMERGENCY_SUPPORT → State Emergency Response Team", c.id, "CRITICAL");
    referrals.push({ id: uid("ref"), caseId: c.id, type: "POLICE_INTERVENTION", provider: "Zonal Police Liaison Unit", notes: "Threat assessment by trained personnel", status: "PENDING", createdAt: ago(5, 4), createdBy: "u_officer" });
    log(ago(5, 4), "u_officer", "REFERRAL_CREATED", "Referral created: POLICE_INTERVENTION → Zonal Police Liaison Unit", c.id, "WARN");
    log(ago(5, 4), "u_officer", "CASE_ESCALATED", "Escalated by support officer after critical safety alert verification", c.id, "CRITICAL");
    followUps.push({ id: uid("fu"), caseId: c.id, dueAt: ago(2, 0), mode: "IN_PERSON", notes: "Safety check-in after emergency response", status: "COMPLETED", assignedTo: "u_officer", createdAt: ago(5, 3) });
    log(ago(2, 0), "u_officer", "FOLLOW_UP_COMPLETED", "In-person follow-up completed — complainant safe", c.id);
    followUps.push({ id: uid("fu"), caseId: c.id, dueAt: ahead(4), mode: "CALL", notes: "Scheduled welfare check", status: "SCHEDULED", assignedTo: "u_officer", createdAt: ago(2, 0) });
    log(ago(2, 0), "u_officer", "FOLLOW_UP_SCHEDULED", "Follow-up scheduled (CALL, +4h)", c.id);
    c.lastActivityAt = ago(2, 0);
  }

  // ---- 0102 follow-up scheduled (due today) ----
  followUps.push({ id: uid("fu"), caseId: "case_102", dueAt: ahead(2), mode: "VIDEO", notes: "Verification pending — confirm support needs", status: "SCHEDULED", assignedTo: "u_counsellor", createdAt: ago(0, 3) });
  log(ago(0, 3), "u_counsellor", "FOLLOW_UP_SCHEDULED", "Follow-up scheduled (VIDEO, +2h) for FM-2026-0102", "case_102");

  // Session activity
  log(ago(0, 6), "u_counsellor", "LOGIN_SUCCESS", "Counsellor signed in", undefined);
  log(ago(0, 7), "u_admin", "LOGIN_SUCCESS", "Administrator signed in", undefined);

  audit.sort((x, y) => (x.at < y.at ? 1 : -1));

  return {
    users: DEMO_USERS,
    cases,
    assessments,
    referrals,
    followUps,
    audit,
    session: { userId: null },
    settings: { safetyThreshold: 60, uiLanguage: "en" },
    seq: 108,
  };
}
