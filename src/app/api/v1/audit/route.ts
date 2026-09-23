import { NextResponse } from "next/server";
import { MissingApiKeyError, runAudit } from "@/lib/audit/service";
import { UpstreamModelError } from "@/lib/gemini/client";
import { AuditEnvelopeSchema, AuditRequestSchema, type ApiError } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    const body: ApiError = {
      error: "O corpo precisa ser JSON",
      code: "INVALID_REQUEST",
    };
    return NextResponse.json(body, { status: 400 });
  }

  const parsed = AuditRequestSchema.safeParse(json);
  if (!parsed.success) {
    const body: ApiError = {
      error: parsed.error.issues[0]?.message ?? "Pedido de auditoria inválido",
      code: "INVALID_REQUEST",
      details: parsed.error.flatten(),
    };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    const result = await runAudit(parsed.data);
    const envelope = AuditEnvelopeSchema.parse({
      latency_ms: result.latency_ms,
      audit: result.audit,
    });
    return NextResponse.json(envelope);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      const body: ApiError = {
        error:
          "GEMINI_API_KEY ausente. Grave em .env.local ou nas variáveis do projeto na Vercel.",
        code: "MISSING_API_KEY",
      };
      return NextResponse.json(body, { status: 503 });
    }
    if (error instanceof UpstreamModelError) {
      const body: ApiError = {
        error: error.message,
        code: error.message.includes("validation") ? "PARSE_ERROR" : "UPSTREAM_MODEL",
      };
      return NextResponse.json(body, { status: 502 });
    }

    const body: ApiError = {
      error: error instanceof Error ? error.message : "Falha inesperada na auditoria",
      code: "INTERNAL",
    };
    return NextResponse.json(body, { status: 500 });
  }
}
