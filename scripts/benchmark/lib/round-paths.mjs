import { join } from "node:path";

export const createRoundPaths = ({ rootDir, roundId }) => {
  const roundDir = join(rootDir, "artifacts", "benchmark", roundId);

  return {
    roundDir,
    masterWav: join(roundDir, "master.wav"),
    listenMp3: join(roundDir, "listen.mp3"),
    eventsJson: join(roundDir, "events.json"),
    metricsJson: join(roundDir, "metrics.json"),
    analysisMd: join(roundDir, "analysis.md"),
    scenarioJson: join(roundDir, "scenario.json"),
  };
};
