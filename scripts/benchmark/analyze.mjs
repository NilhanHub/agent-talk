import { buildAnalysis } from "./lib/analysis.mjs";
import { parseRoundArgument, readJson, writeJson, writeText, repoRoot } from "./lib/common.mjs";
import { computeRoundMetrics } from "./lib/metrics.mjs";
import { createRoundPaths } from "./lib/round-paths.mjs";

const roundNumber = parseRoundArgument(process.argv);
const roundId = `round-${String(roundNumber).padStart(2, "0")}`;
const roundPaths = createRoundPaths({
  rootDir: repoRoot,
  roundId,
});
const scenario = await readJson(roundPaths.scenarioJson);
const eventBundle = await readJson(roundPaths.eventsJson);
const semanticConfidence = process.env.OPENAI_API_KEY
  ? "hybrid-cloud-ready"
  : "reduced-no-openai-api-key";
const metrics = computeRoundMetrics({
  scenario,
  events: eventBundle.events,
});
const analysis = buildAnalysis({
  scenario,
  metrics,
  semanticConfidence,
});

await writeJson(roundPaths.metricsJson, {
  schemaVersion: 1,
  semanticConfidence,
  metrics,
});
await writeText(roundPaths.analysisMd, analysis.report);

console.log(
  JSON.stringify(
    {
      roundId,
      metricsJson: roundPaths.metricsJson,
      analysisMd: roundPaths.analysisMd,
    },
    null,
    2
  )
);
