import { afterEach, describe, expect, it } from "vitest";
import { isAuditAuthorized } from "@/lib/audit/auth";
import {
  clientKeyFromHeaders,
  consumeAuditRateLimit,
  resetAuditRateLimit,
} from "@/lib/audit/rate-limit";
import { charNgrams } from "@/lib/rag/tokenize";

describe("audit rate limit", () => {
  afterEach(() => {
    resetAuditRateLimit();
  });

  it("allows a burst then rejects the same key", () => {
    const now = 1_700_000_000_000;
    for (let i = 0; i < 8; i += 1) {
      expect(consumeAuditRateLimit("10.0.0.1", now + i).ok).toBe(true);
    }
    const blocked = consumeAuditRateLimit("10.0.0.1", now + 8);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
    expect(consumeAuditRateLimit("10.0.0.2", now).ok).toBe(true);
  });

  it("reads the first x-forwarded-for hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.9");
  });
});

describe("audit access token", () => {
  afterEach(() => {
    delete process.env.AUDIT_ACCESS_TOKEN;
  });

  it("is open when AUDIT_ACCESS_TOKEN is unset", () => {
    delete process.env.AUDIT_ACCESS_TOKEN;
    expect(isAuditAuthorized(new Headers())).toBe(true);
  });

  it("accepts a matching bearer token", () => {
    process.env.AUDIT_ACCESS_TOKEN = "s3cret-token";
    expect(
      isAuditAuthorized(new Headers({ authorization: "Bearer s3cret-token" })),
    ).toBe(true);
    expect(isAuditAuthorized(new Headers({ "x-audit-token": "s3cret-token" }))).toBe(
      true,
    );
    expect(isAuditAuthorized(new Headers({ authorization: "Bearer wrong" }))).toBe(
      false,
    );
    expect(isAuditAuthorized(new Headers())).toBe(false);
  });
});

describe("charNgrams cap", () => {
  it("does not materialize more grams than maxGrams", () => {
    const grams = charNgrams("a".repeat(50_000), 3, 400);
    expect(grams).toHaveLength(400);
  });
});
