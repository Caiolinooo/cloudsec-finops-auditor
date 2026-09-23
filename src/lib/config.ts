export const PRIMARY_GEMINI_MODEL = "gemini-2.5-flash";
export const FALLBACK_GEMINI_MODEL = "gemini-2.0-flash";

export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || undefined;
}

export function getGeminiModels(): { primary: string; fallback: string } {
  return {
    primary: process.env.GEMINI_MODEL?.trim() || PRIMARY_GEMINI_MODEL,
    fallback: process.env.GEMINI_FALLBACK_MODEL?.trim() || FALLBACK_GEMINI_MODEL,
  };
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

/** When set, POST /api/v1/audit requires Bearer or x-audit-token. UI stays public if unset. */
export function getAuditAccessToken(): string | undefined {
  const token = process.env.AUDIT_ACCESS_TOKEN?.trim();
  return token || undefined;
}
