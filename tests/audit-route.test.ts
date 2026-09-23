import { afterEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/audit/route";
import { resetAuditRateLimit } from "@/lib/audit/rate-limit";
import { MAX_AUDIT_BODY_CHARS } from "@/lib/schemas";

function auditRequest(body: string, headers?: HeadersInit): Request {
  return new Request("http://localhost/api/v1/audit", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("POST /api/v1/audit hardening", () => {
  afterEach(() => {
    resetAuditRateLimit();
    delete process.env.AUDIT_ACCESS_TOKEN;
    delete process.env.GEMINI_API_KEY;
  });

  it("rejects oversized bodies before JSON parse", async () => {
    const response = await POST(auditRequest("x".repeat(MAX_AUDIT_BODY_CHARS + 1)));
    expect(response.status).toBe(413);
    const payload = (await response.json()) as { code: string };
    expect(payload.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(auditRequest("{"));
    expect(response.status).toBe(400);
  });

  it("requires the optional access token when configured", async () => {
    process.env.AUDIT_ACCESS_TOKEN = "gate";
    const denied = await POST(
      auditRequest(JSON.stringify({ architecture_scenario: "S3 público com ACL AllUsers." })),
    );
    expect(denied.status).toBe(401);
    const allowed = await POST(
      auditRequest(JSON.stringify({ architecture_scenario: "S3 público com ACL AllUsers." }), {
        authorization: "Bearer gate",
      }),
    );
    expect(allowed.status).not.toBe(401);
  });

  it("rate-limits the same client key", async () => {
    const headers = { "x-forwarded-for": "198.51.100.20" };
    const body = JSON.stringify({ architecture_scenario: "S3 público com ACL AllUsers." });
    for (let i = 0; i < 8; i += 1) {
      await POST(auditRequest(body, headers));
    }
    const blocked = await POST(auditRequest(body, headers));
    expect(blocked.status).toBe(429);
    const payload = (await blocked.json()) as { code: string };
    expect(payload.code).toBe("RATE_LIMITED");
  });
});
