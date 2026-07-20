import assert from "node:assert/strict";
import test from "node:test";

import { createRoundPaths } from "../scripts/benchmark/lib/round-paths.mjs";

test("createRoundPaths builds the canonical artifact layout for a round", () => {
  const paths = createRoundPaths({
    rootDir: "D:/AI/GPT_Codex/AGENT_TALK",
    roundId: "round-01",
  });

  assert.equal(paths.roundDir.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01");
  assert.equal(paths.masterWav.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01/master.wav");
  assert.equal(paths.listenMp3.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01/listen.mp3");
  assert.equal(paths.eventsJson.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01/events.json");
  assert.equal(paths.metricsJson.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01/metrics.json");
  assert.equal(paths.analysisMd.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01/analysis.md");
  assert.equal(paths.scenarioJson.replaceAll("\\", "/"), "D:/AI/GPT_Codex/AGENT_TALK/artifacts/benchmark/round-01/scenario.json");
});
