import { join } from "node:path";

import { parsePortArgument, repoRoot, writeText } from "./lib/common.mjs";
import { runBenchmarkRound } from "./lib/round-execution.mjs";

const port = parsePortArgument(process.argv);
const campaignRows = [];

for (let roundNumber = 1; roundNumber <= 20; roundNumber += 1) {
  const result = await runBenchmarkRound({
    roundNumber,
    port: port + roundNumber - 1,
  });

  campaignRows.push({
    roundId: result.scenario.roundId,
    medianLatencyMs: result.metrics.turnStartLatency.medianMs,
    p95LatencyMs: result.metrics.turnStartLatency.p95Ms,
    missedTurnCount: result.metrics.missedTurnCount,
    duplicateTurnCount: result.metrics.duplicateTurnCount,
    overlapLeakageMs: result.metrics.overlapLeakageMs,
    improveNext: result.analysis.improveNext,
  });
}

const reportLines = [
  "# Benchmark Campaign Report",
  "",
  ...campaignRows.flatMap((row) => [
    `## ${row.roundId}`,
    `- Median latency: ${row.medianLatencyMs} ms`,
    `- P95 latency: ${row.p95LatencyMs} ms`,
    `- Missed turns: ${row.missedTurnCount}`,
    `- Duplicate turns: ${row.duplicateTurnCount}`,
    `- Overlap leakage: ${row.overlapLeakageMs} ms`,
    ...(row.improveNext.length === 0
      ? ["- Improve next: no urgent issues."]
      : row.improveNext.map((item) => `- Improve next: ${item}`)),
    "",
  ]),
];

await writeText(
  join(repoRoot, "artifacts", "benchmark", "campaign-report.md"),
  `${reportLines.join("\n")}\n`
);

console.log(JSON.stringify(campaignRows, null, 2));
