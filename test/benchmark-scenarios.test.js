import assert from "node:assert/strict";
import test from "node:test";

import {
  BENCHMARK_GROUPS,
  getScenarioByRound,
  getScenarioCatalog,
} from "../scripts/benchmark/lib/scenario-catalog.mjs";

test("benchmark scenario catalog defines 20 deterministic rounds across 5 groups", () => {
  const scenarios = getScenarioCatalog();

  assert.equal(scenarios.length, 20);
  assert.deepEqual(
    BENCHMARK_GROUPS.map((group) => group.id),
    ["baseline", "barge-in", "chunked", "recovery", "mixed-stress"]
  );

  for (const scenario of scenarios) {
    assert.match(scenario.roundId, /^round-\d{2}$/);
    assert.ok(scenario.durationMs >= 75_000, `${scenario.roundId} is too short`);
    assert.ok(scenario.durationMs <= 90_000, `${scenario.roundId} is too long`);
    assert.ok(scenario.turns.length >= 4, `${scenario.roundId} should have multiple turns`);
    assert.ok(scenario.turns.every((turn) => typeof turn.transcript === "string" && turn.transcript.length > 0));
  }
});

test("getScenarioByRound returns a stable scenario shape for a round number", () => {
  const scenario = getScenarioByRound(1);

  assert.equal(scenario.roundNumber, 1);
  assert.equal(scenario.roundId, "round-01");
  assert.equal(scenario.userVoice.shortName, "en-US-AvaMultilingualNeural");
  assert.ok(Array.isArray(scenario.turns));
});
