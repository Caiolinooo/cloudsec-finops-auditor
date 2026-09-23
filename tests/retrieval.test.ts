import { describe, expect, it } from "vitest";
import { CORE_PRESET_IDS, SCENARIO_PRESETS, getPreset } from "@/lib/presets";
import { loadPolicies } from "@/lib/rag/load-policies";
import { retrievePolicies } from "@/lib/rag/retrieve";

const PUBLIC_S3 = getPreset("public-s3-acl")!.architecture_scenario;
const IAM_ADMIN = getPreset("iam-admin-keys")!.architecture_scenario;
const GLACIER = getPreset("glacier-lifecycle")!.architecture_scenario;

describe("policy corpus", () => {
  it("loads markdown files including the required seed clauses", () => {
    const docs = loadPolicies();
    const ids = docs.map((doc) => doc.id);
    expect(ids).toEqual(
      expect.arrayContaining(["POL-S3-001", "POL-S3-002", "POL-IAM-005"]),
    );
    expect(docs.length).toBeGreaterThanOrEqual(12);
    expect(docs.every((doc) => doc.text.length > 80)).toBe(true);
  });
});

describe("hybrid retrieval", () => {
  it("ranks the public S3 customer-data case on POL-S3-001", () => {
    const hits = retrievePolicies(PUBLIC_S3, { k: 6 });
    expect(hits.map((hit) => hit.policyId)).toContain("POL-S3-001");
    expect(hits[0]?.policyId).toBe("POL-S3-001");
  });

  it("retrieves AdministratorAccess as POL-IAM-005", () => {
    const hits = retrievePolicies(IAM_ADMIN, { k: 6 });
    expect(hits.map((hit) => hit.policyId)).toContain("POL-IAM-005");
  });

  it("retrieves Glacier / 90-day lifecycle as POL-S3-002", () => {
    const hits = retrievePolicies(GLACIER, { k: 6 });
    expect(hits.map((hit) => hit.policyId)).toContain("POL-S3-002");
  });

  it("keeps the three core scenarios among the presets", () => {
    const ids = SCENARIO_PRESETS.map((preset) => preset.id);
    expect(ids).toEqual(expect.arrayContaining([...CORE_PRESET_IDS]));
    expect(SCENARIO_PRESETS.length).toBeGreaterThanOrEqual(3);
  });
});
