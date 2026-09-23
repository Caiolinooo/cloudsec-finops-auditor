import { afterEach, describe, expect, it } from "vitest";
import {
  FALLBACK_GEMINI_MODEL,
  PRIMARY_GEMINI_MODEL,
  getGeminiModels,
} from "@/lib/config";

describe("gemini model defaults", () => {
  const originalModel = process.env.GEMINI_MODEL;
  const originalFallback = process.env.GEMINI_FALLBACK_MODEL;

  afterEach(() => {
    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
    if (originalFallback === undefined) {
      delete process.env.GEMINI_FALLBACK_MODEL;
    } else {
      process.env.GEMINI_FALLBACK_MODEL = originalFallback;
    }
  });

  it("uses current Flash IDs when env overrides are absent", () => {
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_FALLBACK_MODEL;
    expect(PRIMARY_GEMINI_MODEL).toBe("gemini-3.8-flash");
    expect(FALLBACK_GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(getGeminiModels()).toEqual({
      primary: "gemini-3.8-flash",
      fallback: "gemini-3.6-flash",
    });
  });

  it("respects GEMINI_MODEL and GEMINI_FALLBACK_MODEL", () => {
    process.env.GEMINI_MODEL = "gemini-3.1-pro-preview";
    process.env.GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";
    expect(getGeminiModels()).toEqual({
      primary: "gemini-3.1-pro-preview",
      fallback: "gemini-3.6-flash",
    });
  });
});
