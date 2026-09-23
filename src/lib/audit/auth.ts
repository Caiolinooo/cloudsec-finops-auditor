import { timingSafeEqual } from "node:crypto";
import { getAuditAccessToken } from "@/lib/config";

function extractPresentedToken(headers: Headers): string | undefined {
  const authorization = headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }
  const headerToken = headers.get("x-audit-token")?.trim();
  return headerToken || undefined;
}

function tokensEqual(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function isAuditAuthorized(headers: Headers): boolean {
  const expected = getAuditAccessToken();
  if (!expected) return true;
  const presented = extractPresentedToken(headers);
  if (!presented) return false;
  return tokensEqual(presented, expected);
}
