import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { runAudit } from "../src/lib/audit/service";
import { scoreFaithfulness } from "../src/lib/audit/faithfulness";
import { isGeminiConfigured } from "../src/lib/config";
import publicS3 from "./fixtures/public-s3.json";

const THRESHOLD = 0.85;
const artifactPath = join(process.cwd(), "evals", ".tmp-last-run.json");

async function main(): Promise<void> {
  if (!isGeminiConfigured()) {
    console.log(
      "GEMINI_API_KEY is not set — skipping live faithfulness eval (unit tests still cover retrieval + schema).",
    );
    process.exit(0);
  }

  const run = await runAudit({
    architecture_scenario: publicS3.architecture_scenario,
  });

  const breakdown = scoreFaithfulness(run.audit, run.retrieved);
  const retrievedIds = [...new Set(run.retrieved.map((hit) => hit.policyId))];
  const missingExpected = publicS3.expected_policy_ids.filter(
    (id) => !retrievedIds.includes(id),
  );

  const artifact = {
    fixture: publicS3.id,
    model: run.model,
    latency_ms: run.latency_ms,
    threshold: THRESHOLD,
    breakdown,
    retrieved_policy_ids: retrievedIds,
    missing_expected_policies: missingExpected,
    input: publicS3.architecture_scenario,
    actual_output: JSON.stringify(run.audit, null, 2),
    retrieval_context: run.retrieved.map((hit) => hit.text),
    audit: run.audit,
  };

  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify({ artifactPath, breakdown, retrievedIds }, null, 2));

  if (missingExpected.length > 0) {
    throw new Error(
      `Retrieval missed expected policies: ${missingExpected.join(", ")}`,
    );
  }

  if (breakdown.score < THRESHOLD) {
    throw new Error(
      `Faithfulness score ${breakdown.score} is below threshold ${THRESHOLD}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
