import { describe, expect, it, vi } from "vitest";
import {
  isTransientModelError,
  looksLikeUpstreamDump,
  retryTransient,
} from "@/lib/gemini/retry";

describe("isTransientModelError", () => {
  it("treats Google UNAVAILABLE JSON as transient", () => {
    const message = JSON.stringify({
      error: {
        code: 503,
        message: "This model is currently experiencing high demand. Please try again later.",
        status: "UNAVAILABLE",
      },
    });
    expect(isTransientModelError(new Error(message))).toBe(true);
    expect(looksLikeUpstreamDump(message)).toBe(true);
  });

  it("treats HTTP 429 / RESOURCE_EXHAUSTED as transient", () => {
    expect(isTransientModelError({ status: 429 })).toBe(true);
    expect(isTransientModelError({ status: "RESOURCE_EXHAUSTED" })).toBe(true);
    expect(isTransientModelError({ error: { code: 503, status: "UNAVAILABLE" } })).toBe(
      true,
    );
  });

  it("does not retry parse or validation failures", () => {
    expect(
      isTransientModelError(new Error("Model gemini-3.8-flash returned text that is not JSON")),
    ).toBe(false);
    expect(
      isTransientModelError(new Error("JSON from gemini-3.8-flash failed AuditResult validation")),
    ).toBe(false);
  });
});

describe("retryTransient", () => {
  it("retries capacity errors with exponential backoff then succeeds", async () => {
    const sleep = vi.fn(async () => undefined);
    const operation = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("busy"), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error("busy"), { status: "UNAVAILABLE" }))
      .mockResolvedValueOnce("ok");

    await expect(
      retryTransient(operation, { attempts: 3, initialDelayMs: 400, sleep }),
    ).resolves.toBe("ok");

    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 400);
    expect(sleep).toHaveBeenNthCalledWith(2, 800);
  });

  it("does not retry non-transient errors", async () => {
    const sleep = vi.fn(async () => undefined);
    const operation = vi.fn().mockRejectedValue(new Error("not JSON"));

    await expect(
      retryTransient(operation, { attempts: 3, initialDelayMs: 400, sleep }),
    ).rejects.toThrow("not JSON");

    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
