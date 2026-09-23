export const TRANSIENT_HTTP_CODES = new Set([429, 503, 500, 502, 504]);
export const TRANSIENT_STATUSES = new Set([
  "UNAVAILABLE",
  "RESOURCE_EXHAUSTED",
  "ABORTED",
]);

const TRANSIENT_TEXT =
  /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|try again later|\b429\b|\b503\b/i;

export function looksLikeUpstreamDump(message: string): boolean {
  return (
    /"status"\s*:\s*"(UNAVAILABLE|RESOURCE_EXHAUSTED)"/i.test(message)
    || /"code"\s*:\s*503/.test(message)
    || /This model is currently experiencing high demand/i.test(message)
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseJsonObject(text: string): unknown | undefined {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    return undefined;
  }
}

function collectStatusTokens(error: unknown, depth = 0): unknown[] {
  if (depth > 4 || error == null) return [];
  const tokens: unknown[] = [];
  const record = asRecord(error);
  if (record) {
    tokens.push(record.status, record.code, record.statusCode, record.status_code);
    if ("error" in record) {
      tokens.push(...collectStatusTokens(record.error, depth + 1));
    }
  }
  if (error instanceof Error) {
    tokens.push(...collectStatusTokens(parseJsonObject(error.message), depth + 1));
  }
  if (typeof error === "string") {
    tokens.push(...collectStatusTokens(parseJsonObject(error), depth + 1));
  }
  return tokens;
}

export function isTransientModelError(error: unknown): boolean {
  for (const token of collectStatusTokens(error)) {
    if (typeof token === "number" && TRANSIENT_HTTP_CODES.has(token)) {
      return true;
    }
    if (typeof token === "string") {
      const numeric = Number(token);
      if (Number.isInteger(numeric) && TRANSIENT_HTTP_CODES.has(numeric)) {
        return true;
      }
      if (TRANSIENT_STATUSES.has(token.toUpperCase())) {
        return true;
      }
    }
  }

  const text = error instanceof Error ? error.message : String(error ?? "");
  return TRANSIENT_TEXT.test(text);
}

export type RetrySleep = (ms: number) => Promise<void>;

export type RetryTransientOptions = {
  attempts?: number;
  initialDelayMs?: number;
  sleep?: RetrySleep;
};

export async function retryTransient<T>(
  operation: () => Promise<T>,
  options: RetryTransientOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 400;
  const sleep: RetrySleep =
    options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const lastAttempt = attempt === attempts - 1;
      if (!isTransientModelError(error) || lastAttempt) {
        throw error;
      }
      await sleep(initialDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}
