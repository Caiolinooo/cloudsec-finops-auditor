import { NextResponse } from "next/server";
import { isAuditAuthorized } from "@/lib/audit/auth";
import { clientKeyFromHeaders, consumeAuditRateLimit } from "@/lib/audit/rate-limit";
import { MissingApiKeyError, runAudit } from "@/lib/audit/service";
import { UpstreamModelError } from "@/lib/gemini/client";
import {
  AuditEnvelopeSchema,
  AuditRequestSchema,
  MAX_AUDIT_BODY_CHARS,
  type ApiError,
} from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 45;

function errorBody(code: ApiError["code"], error: string, details?: unknown): ApiError {
  return details === undefined ? { error, code } : { error, code, details };
}

export async function POST(request: Request) {
  if (!isAuditAuthorized(request.headers)) {
    return NextResponse.json(
      errorBody("UNAUTHORIZED", "Token de auditoria ausente ou inválido"),
      { status: 401 },
    );
  }

  const limited = consumeAuditRateLimit(clientKeyFromHeaders(request.headers));
  if (!limited.ok) {
    return NextResponse.json(
      errorBody("RATE_LIMITED", "Muitas auditorias neste intervalo. Tente de novo em instantes."),
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(errorBody("INVALID_REQUEST", "O corpo precisa ser JSON"), {
      status: 400,
    });
  }

  if (raw.length > MAX_AUDIT_BODY_CHARS) {
    return NextResponse.json(
      errorBody(
        "PAYLOAD_TOO_LARGE",
        `Corpo da auditoria excede ${MAX_AUDIT_BODY_CHARS} caracteres`,
      ),
      { status: 413 },
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json(errorBody("INVALID_REQUEST", "O corpo precisa ser JSON"), {
      status: 400,
    });
  }

  const parsed = AuditRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      errorBody(
        "INVALID_REQUEST",
        parsed.error.issues[0]?.message ?? "Pedido de auditoria inválido",
        parsed.error.flatten(),
      ),
      { status: 400 },
    );
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
      return NextResponse.json(
        errorBody(
          "MISSING_API_KEY",
          "GEMINI_API_KEY ausente. Grave em .env.local ou nas variáveis do projeto na Vercel.",
        ),
        { status: 503 },
      );
    }
    if (error instanceof UpstreamModelError) {
      return NextResponse.json(
        errorBody("UPSTREAM_MODEL", "O modelo upstream falhou ou devolveu um parecer inválido."),
        { status: 502 },
      );
    }

    return NextResponse.json(errorBody("INTERNAL", "Falha inesperada na auditoria"), {
      status: 500,
    });
  }
}
