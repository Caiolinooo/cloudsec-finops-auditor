import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    ARRAY: "ARRAY",
  },
}));

const validAudit = {
  compliance_status: "NON_COMPLIANT",
  risk_level: "CRITICAL",
  summary: "Public bucket violates [POL-S3-001].",
  cited_policies: ["[POL-S3-001] Block Public Access"],
  remediation_steps: ["Enable Block Public Access"],
  estimated_cost_impact: "Breach response dominates storage cost.",
};

describe("generateStructuredAudit", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  const originalFallback = process.env.GEMINI_FALLBACK_MODEL;

  beforeEach(() => {
    generateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";
    process.env.GEMINI_RETRY_DELAY_MS = "1";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
    if (originalFallback === undefined) delete process.env.GEMINI_FALLBACK_MODEL;
    else process.env.GEMINI_FALLBACK_MODEL = originalFallback;
  });

  it("retries the primary model then uses the fallback after capacity errors", async () => {
    const busy = Object.assign(new Error("high demand"), { status: 503 });
    generateContent
      .mockRejectedValueOnce(busy)
      .mockRejectedValueOnce(busy)
      .mockRejectedValueOnce(busy)
      .mockResolvedValueOnce({ text: JSON.stringify(validAudit) });

    const { generateStructuredAudit } = await import("@/lib/gemini/client");
    const result = await generateStructuredAudit("audit this");

    expect(result.model).toBe("gemini-3.6-flash");
    expect(result.result.compliance_status).toBe("NON_COMPLIANT");
    expect(generateContent).toHaveBeenCalledTimes(4);
    expect(generateContent.mock.calls[0]?.[0]?.model).toBe("gemini-3.8-flash");
    expect(generateContent.mock.calls[3]?.[0]?.model).toBe("gemini-3.6-flash");
  });

  it("throws ModelUnavailableError after both models stay unavailable", async () => {
    generateContent.mockRejectedValue(
      Object.assign(new Error("This model is currently experiencing high demand"), {
        status: "UNAVAILABLE",
      }),
    );

    const { generateStructuredAudit, ModelUnavailableError } = await import(
      "@/lib/gemini/client"
    );
    await expect(generateStructuredAudit("audit this")).rejects.toBeInstanceOf(
      ModelUnavailableError,
    );
    expect(generateContent).toHaveBeenCalled();
  });
});
