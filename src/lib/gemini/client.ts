import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiModels } from "@/lib/config";
import { AuditResultSchema, type AuditResult } from "@/lib/schemas";
import {
  isTransientModelError,
  looksLikeUpstreamDump,
  retryTransient,
} from "./retry";
import { GEMINI_AUDIT_RESPONSE_SCHEMA } from "./schema";

export class MissingApiKeyError extends Error {
  readonly code = "MISSING_API_KEY" as const;

  constructor() {
    super("GEMINI_API_KEY missing");
    this.name = "MissingApiKeyError";
  }
}

export class UpstreamModelError extends Error {
  readonly code = "UPSTREAM_MODEL" as const;

  constructor(message: string) {
    super(message);
    this.name = "UpstreamModelError";
  }
}

export class ModelUnavailableError extends Error {
  readonly code = "MODEL_UNAVAILABLE" as const;

  constructor() {
    super("MODEL_UNAVAILABLE");
    this.name = "ModelUnavailableError";
  }
}

function createClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return new GoogleGenAI({ apiKey });
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate) as unknown;
}

function sanitizeUpstreamMessage(message: string): string {
  if (looksLikeUpstreamDump(message) || message.trim().startsWith("{")) {
    return "UPSTREAM_MODEL";
  }
  return message;
}

async function generateOnce(
  client: GoogleGenAI,
  model: string,
  prompt: string,
): Promise<AuditResult> {
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: GEMINI_AUDIT_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new UpstreamModelError(`Model ${model} returned an empty body`);
  }

  let parsed: unknown;
  try {
    parsed = extractJsonObject(text);
  } catch {
    throw new UpstreamModelError(`Model ${model} returned text that is not JSON`);
  }

  const result = AuditResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new UpstreamModelError(
      `JSON from ${model} failed AuditResult validation`,
    );
  }
  return result.data;
}

export async function generateStructuredAudit(prompt: string): Promise<{
  result: AuditResult;
  model: string;
}> {
  const client = createClient();
  const { primary, fallback } = getGeminiModels();
  const models = primary === fallback ? [primary] : [primary, fallback];

  let lastError: unknown;
  let lastWasCapacity = false;

  for (const model of models) {
    try {
      const result = await retryTransient(
        () => generateOnce(client, model, prompt),
        {
          attempts: 3,
          initialDelayMs: Number(process.env.GEMINI_RETRY_DELAY_MS) || 400,
        },
      );
      return { result, model };
    } catch (error) {
      if (error instanceof MissingApiKeyError) {
        throw error;
      }
      lastError = error;
      lastWasCapacity = isTransientModelError(error);
    }
  }

  if (lastWasCapacity) {
    throw new ModelUnavailableError();
  }

  const message =
    lastError instanceof Error ? lastError.message : "Gemini call failed";
  throw new UpstreamModelError(sanitizeUpstreamMessage(message));
}
