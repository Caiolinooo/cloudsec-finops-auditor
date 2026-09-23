export const PRIMARY_GEMINI_MODEL = "gemini-3.8-flash";
export const FALLBACK_GEMINI_MODEL = "gemini-3.6-flash";

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
