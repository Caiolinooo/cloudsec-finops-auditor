import { NextResponse } from "next/server";
import { MissingApiKeyError, runAudit } from "@/lib/audit/service";
import { apiErrorMessage } from "@/lib/copy";
import {
  ModelUnavailableError,
  UpstreamModelError,
} from "@/lib/gemini/client";
import { parseLocale } from "@/lib/i18n";
import {
  AuditEnvelopeSchema,
  AuditRequestSchema,
  type ApiError,
} from "@/lib/schemas";

export const runtime = "nodejs";

function readLocale(payload: unknown): ReturnType<typeof parseLocale> {
  if (payload && typeof payload === "object" && "locale" in payload) {
    return parseLocale((payload as { locale?: unknown }).locale);
  }
  return parseLocale(undefined);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    const locale = parseLocale(undefined);
    const body: ApiError = {
      error: apiErrorMessage("INVALID_REQUEST", locale),
      code: "INVALID_REQUEST",
    };
    return NextResponse.json(body, { status: 400 });
  }

  const locale = readLocale(json);
  const parsed = AuditRequestSchema.safeParse(json);
  if (!parsed.success) {
    const body: ApiError = {
      error: apiErrorMessage("INVALID_REQUEST", locale),
      code: "INVALID_REQUEST",
      details: parsed.error.flatten(),
    };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    const result = await runAudit({
      ...parsed.data,
      locale: parsed.data.locale ?? locale,
    });
    const envelope = AuditEnvelopeSchema.parse({
      latency_ms: result.latency_ms,
      audit: result.audit,
    });
    return NextResponse.json(envelope);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      const body: ApiError = {
        error: apiErrorMessage("MISSING_API_KEY", locale),
        code: "MISSING_API_KEY",
      };
      return NextResponse.json(body, { status: 503 });
    }
    if (error instanceof ModelUnavailableError) {
      const body: ApiError = {
        error: apiErrorMessage("MODEL_UNAVAILABLE", locale),
        code: "MODEL_UNAVAILABLE",
      };
      return NextResponse.json(body, { status: 503 });
    }
    if (error instanceof UpstreamModelError) {
      const body: ApiError = {
        error: apiErrorMessage(
          /validat|JSON|empty|vazio|formato/i.test(error.message)
            ? "PARSE_ERROR"
            : "UPSTREAM_MODEL",
          locale,
        ),
        code: /validat|JSON|empty|vazio|formato/i.test(error.message)
          ? "PARSE_ERROR"
          : "UPSTREAM_MODEL",
      };
      return NextResponse.json(body, { status: 502 });
    }

    const body: ApiError = {
      error: apiErrorMessage("INTERNAL", locale),
      code: "INTERNAL",
    };
    return NextResponse.json(body, { status: 500 });
  }
}
