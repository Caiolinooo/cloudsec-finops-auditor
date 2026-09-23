#!/usr/bin/env python3
"""DeepEval FaithfulnessMetric on evals/.tmp-last-run.json (from `npm run eval`)."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

THRESHOLD = 0.85
ARTIFACT = Path(__file__).resolve().parent / ".tmp-last-run.json"


def skip(reason: str) -> int:
    print(reason)
    return 0


def main() -> int:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return skip("GEMINI_API_KEY missing — skipping DeepEval job.")

    if not ARTIFACT.exists():
        return skip(
            f"{ARTIFACT.name} not found. Run `npm run eval` first so DeepEval "
            "judges the real audit path, not a stub."
        )

    artifact = json.loads(ARTIFACT.read_text())
    input_text = artifact.get("input")
    actual_output = artifact.get("actual_output")
    context = artifact.get("retrieval_context") or []
    if not input_text or not actual_output or not context:
        print("Artifact is missing input/actual_output/retrieval_context", file=sys.stderr)
        return 1

    # DeepEval 3.x: GeminiModel + FaithfulnessMetric
    from deepeval.metrics import FaithfulnessMetric
    from deepeval.test_case import LLMTestCase

    try:
        from deepeval.models import GeminiModel

        model = GeminiModel(model_name="gemini-2.0-flash", api_key=api_key)
    except Exception as exc:  # pragma: no cover - import surface varies by version
        print(f"Unable to construct DeepEval GeminiModel ({exc}).", file=sys.stderr)
        return 1

    metric = FaithfulnessMetric(threshold=THRESHOLD, model=model, include_reason=True)
    test_case = LLMTestCase(
        input=input_text,
        actual_output=actual_output,
        retrieval_context=context,
    )
    metric.measure(test_case)

    print(
        json.dumps(
            {
                "metric": "FaithfulnessMetric",
                "score": metric.score,
                "threshold": THRESHOLD,
                "reason": getattr(metric, "reason", None),
                "success": bool(metric.is_successful()),
            },
            indent=2,
        )
    )

    if metric.score is None:
        print("DeepEval returned no score", file=sys.stderr)
        return 1
    if metric.score < THRESHOLD:
        print(
            f"DeepEval faithfulness {metric.score} < {THRESHOLD}",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
