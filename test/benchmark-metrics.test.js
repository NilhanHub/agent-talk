import assert from "node:assert/strict";
import test from "node:test";

import { computeRoundMetrics } from "../scripts/benchmark/lib/metrics.mjs";

test("computeRoundMetrics derives latency, overlap, and turn integrity metrics from events", () => {
  const scenario = {
    roundId: "round-01",
    durationMs: 80_000,
    turns: [
      { id: "turn-1", startMs: 5_000, endMs: 9_000 },
      { id: "turn-2", startMs: 20_000, endMs: 24_000 },
    ],
  };

  const events = [
    { type: "assistant/playback-start", turnId: "turn-1", atMs: 9_300 },
    { type: "assistant/playback-end", turnId: "turn-1", atMs: 12_000 },
    { type: "assistant/playback-start", turnId: "turn-2", atMs: 24_180 },
    { type: "assistant/playback-end", turnId: "turn-2", atMs: 27_000 },
  ];

  const metrics = computeRoundMetrics({ scenario, events });

  assert.equal(metrics.turnCount, 2);
  assert.equal(metrics.missedTurnCount, 0);
  assert.equal(metrics.duplicateTurnCount, 0);
  assert.equal(metrics.turnStartLatency.medianMs, 240);
  assert.equal(metrics.turnStartLatency.p95Ms, 300);
  assert.equal(metrics.overlapLeakageMs, 0);
});

test("computeRoundMetrics marks missing replies and duplicate playback starts", () => {
  const scenario = {
    roundId: "round-02",
    durationMs: 80_000,
    turns: [
      { id: "turn-1", startMs: 3_000, endMs: 7_000 },
      { id: "turn-2", startMs: 10_000, endMs: 12_000 },
    ],
  };

  const events = [
    { type: "assistant/playback-start", turnId: "turn-1", atMs: 7_150 },
    { type: "assistant/playback-start", turnId: "turn-1", atMs: 7_350 },
  ];

  const metrics = computeRoundMetrics({ scenario, events });

  assert.equal(metrics.missedTurnCount, 1);
  assert.equal(metrics.duplicateTurnCount, 1);
  assert.equal(metrics.turnStartLatency.medianMs, 150);
});
