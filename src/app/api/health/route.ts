import { NextResponse } from "next/server";
import { getGeminiModels, isGeminiConfigured } from "@/lib/config";
import { loadPolicies } from "@/lib/rag/load-policies";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "cloudsec-finops-auditor",
    gemini_configured: isGeminiConfigured(),
    policy_count: loadPolicies().length,
    models: getGeminiModels(),
  });
}
