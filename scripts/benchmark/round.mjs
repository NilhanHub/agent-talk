import { parsePortArgument, parseRoundArgument } from "./lib/common.mjs";
import { runBenchmarkRound } from "./lib/round-execution.mjs";

const roundNumber = parseRoundArgument(process.argv);
const port = parsePortArgument(process.argv);

const result = await runBenchmarkRound({
  roundNumber,
  port,
});

console.log(
  JSON.stringify(
    {
      roundId: result.scenario.roundId,
      masterWav: result.roundPaths.masterWav,
      listenMp3: result.roundPaths.listenMp3,
      metricsJson: result.roundPaths.metricsJson,
      analysisMd: result.roundPaths.analysisMd,
    },
    null,
    2
  )
);
