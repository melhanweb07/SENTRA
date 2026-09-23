import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { seedDB } from "@/lib/demo/seed";
import { CaseRecord, DB } from "@/lib/types";

const CASES_COLLECTION = "cases";

export async function getCasesFromStore(): Promise<{ source: "firebase" | "demo"; data: Partial<CaseRecord>[]; count: number }> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    const db = seedDB();
    return {
      source: "demo",
      data: db.cases.map((c) => ({
        id: c.id,
        caseCode: c.caseCode,
        status: c.status,
        language: c.language,
        category: c.category,
        channel: c.channel,
        svi: c.svi ?? null,
        risk: c.risk ?? null,
      })),
      count: db.cases.length,
    };
  }

  const snapshot = await adminDb.collection(CASES_COLLECTION).get();
  const cases = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Partial<CaseRecord>));

  return {
    source: "firebase",
    data: cases,
    count: cases.length,
  };
}

export async function saveAnalysisResult(caseId: string, payload: Record<string, unknown>) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return { saved: false, source: "demo" };
  }

  await adminDb.collection(CASES_COLLECTION).doc(caseId).set(
    {
      updatedAt: new Date().toISOString(),
      analysis: payload,
    },
    { merge: true }
  );

  return { saved: true, source: "firebase" };
}

export async function getDbSnapshot(): Promise<DB> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return seedDB();
  }

  const snapshot = await adminDb.collection("cases").get();
  const cases = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) })) as CaseRecord[];

  return {
    users: [],
    cases,
    assessments: [],
    referrals: [],
    followUps: [],
    audit: [],
    session: { userId: null },
    settings: { safetyThreshold: 60, uiLanguage: "en" },
    seq: cases.length,
  };
}
