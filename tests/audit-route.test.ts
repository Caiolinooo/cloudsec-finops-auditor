import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/audit/route";

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/v1/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/v1/audit errors", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/audit", {
        method: "POST",
        body: "{",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_REQUEST",
    });
  });

  it("localizes INVALID_REQUEST", async () => {
    const en = await post({ architecture_scenario: "short", locale: "en" });
    const pt = await post({ architecture_scenario: "short", locale: "pt" });
    expect(en.status).toBe(400);
    expect(pt.status).toBe(400);
    await expect(en.json()).resolves.toMatchObject({
      code: "INVALID_REQUEST",
      error: expect.stringMatching(/at least 12 characters/i),
    });
    await expect(pt.json()).resolves.toMatchObject({
      code: "INVALID_REQUEST",
      error: expect.stringMatching(/12 caracteres/i),
    });
  });

  it("localizes MISSING_API_KEY without dumping internals", async () => {
    delete process.env.GEMINI_API_KEY;
    const scenario =
      "Production S3 bucket customer-data-prod is public via AllUsers ACL.";
    const en = await post({ architecture_scenario: scenario, locale: "en" });
    const pt = await post({ architecture_scenario: scenario, locale: "pt" });
    expect(en.status).toBe(503);
    expect(pt.status).toBe(503);
    const enBody = await en.json();
    const ptBody = await pt.json();
    expect(enBody).toMatchObject({ code: "MISSING_API_KEY" });
    expect(ptBody).toMatchObject({ code: "MISSING_API_KEY" });
    expect(enBody.error).toMatch(/missing/i);
    expect(ptBody.error).toMatch(/ausente/i);
    expect(JSON.stringify(enBody)).not.toMatch(/UNAVAILABLE/);
  });
});
