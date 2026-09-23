import { NextResponse } from "next/server";
import { getGeminiModels, isGeminiConfigured } from "@/lib/config";

export const runtime = "nodejs";

export function GET() {
  const models = getGeminiModels();
  return NextResponse.json({
    status: "ok",
    service: "cloudsec-finops-auditor",
    gemini_configured: isGeminiConfigured(),
    models,
  });
}
