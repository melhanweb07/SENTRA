import { NextResponse } from "next/server";
import { getCasesFromStore } from "@/lib/firebase-data";

export async function GET() {
  const result = await getCasesFromStore();

  return NextResponse.json({
    mode: result.source,
    count: result.count,
    cases: result.data,
  });
}
