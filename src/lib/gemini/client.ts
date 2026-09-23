import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiModels } from "@/lib/config";
import { AuditResultSchema, type AuditResult } from "@/lib/schemas";
import { GEMINI_AUDIT_RESPONSE_SCHEMA } from "./schema";

export class MissingApiKeyError extends Error {
  readonly code = "MISSING_API_KEY" as const;

  constructor() {
    super("GEMINI_API_KEY ausente");
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
    throw new UpstreamModelError(`Modelo ${model} devolveu corpo vazio`);
  }

  let parsed: unknown;
  try {
    parsed = extractJsonObject(text);
  } catch {
    throw new UpstreamModelError(`Modelo ${model} devolveu texto que não é JSON`);
  }

  const result = AuditResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new UpstreamModelError(
      `JSON de ${model} falhou na validação do AuditResult: ${result.error.message}`,
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
  for (const model of models) {
    try {
      const result = await generateOnce(client, model, prompt);
      return { result, model };
    } catch (error) {
      lastError = error;
      if (error instanceof MissingApiKeyError) {
        throw error;
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Falha na chamada ao Gemini";
  throw new UpstreamModelError(message);
}
