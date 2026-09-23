import { NextResponse } from "next/server";
import { loadPolicies, summarizePolicies } from "@/lib/rag/load-policies";

export const runtime = "nodejs";

export function GET() {
  const policies = summarizePolicies(loadPolicies());
  return NextResponse.json({ count: policies.length, policies });
}
