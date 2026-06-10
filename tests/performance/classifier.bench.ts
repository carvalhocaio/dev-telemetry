import { bench, describe } from "vitest";
import { classify, computeMetrics, WEIGHTS } from "@dev-telemetry/core";
import { capCommitMessage, capPrBody } from "@dev-telemetry/github";

/**
 * Performance benchmarks — ensure critical hot-path functions stay fast.
 * Run with: bun run test:bench (from /tests)
 */

describe("classify — percentile to level", () => {
  bench("classify(0.5)", () => {
    classify(0.5);
  });

  bench("classify 1000x in a loop", () => {
    for (let i = 0; i < 1000; i++) {
      classify(i / 1000);
    }
  });
});

describe("field caps — string truncation", () => {
  const msg4k = "commit message content ".repeat(200);
  const body32k = "PR body with lots of text ".repeat(1300);

  bench("capCommitMessage — 4 KB string", () => {
    capCommitMessage(msg4k);
  });

  bench("capPrBody — 32 KB string", () => {
    capPrBody(body32k);
  });
});
