const sortNumbers = (values) => [...values].sort((left, right) => left - right);

const percentile = (values, ratio) => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = sortNumbers(values);
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
};

const median = (values) => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = sortNumbers(values);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[midpoint];
  }

  return Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2);
};

const indexEventsByTurn = (events, type) =>
  events
    .filter((event) => event.type === type && event.turnId)
    .reduce((lookup, event) => {
      const items = lookup.get(event.turnId) ?? [];
      items.push(event);
      lookup.set(event.turnId, items);
      return lookup;
    }, new Map());

const pairPlaybackIntervals = (events) => {
  const startsByTurn = indexEventsByTurn(events, "assistant/playback-start");
  const ends = events.filter(
    (event) =>
      event.type === "assistant/playback-end" ||
      event.type === "assistant/playback-pause" ||
      event.type === "assistant/barge-in-stop"
  );

  return Array.from(startsByTurn.entries()).flatMap(([turnId, starts]) =>
    starts.map((startEvent, index) => {
      const endEvent = ends.find(
        (candidate) =>
          candidate.turnId === turnId &&
          candidate.atMs >= startEvent.atMs &&
          candidate.atMs >= (starts[index - 1]?.atMs ?? -Infinity)
      );

      return {
        turnId,
        startAtMs: startEvent.atMs,
        endAtMs: endEvent?.atMs ?? null,
      };
    })
  );
};

export const computeRoundMetrics = ({ scenario, events }) => {
  const playbackStartsByTurn = indexEventsByTurn(events, "assistant/playback-start");
  const playbackEndsByTurn = indexEventsByTurn(events, "assistant/playback-end");
  const playbackIntervals = pairPlaybackIntervals(events);
  const latencies = [];
  const perTurn = [];
  let missedTurnCount = 0;
  let duplicateTurnCount = 0;
  let truncatedReplyCount = 0;
  let overlapLeakageMs = 0;

  for (const turn of scenario.turns) {
    const starts = playbackStartsByTurn.get(turn.id) ?? [];
    const ends = playbackEndsByTurn.get(turn.id) ?? [];
    const firstStart = starts[0];
    const turnLatencyMs = firstStart ? Math.max(0, firstStart.atMs - turn.endMs) : null;

    if (turnLatencyMs !== null) {
      latencies.push(turnLatencyMs);
    }

    if (!firstStart) {
      missedTurnCount += 1;
    }

    if (starts.length > 1) {
      duplicateTurnCount += starts.length - 1;
    }

    if (starts.length > 0 && ends.length === 0) {
      truncatedReplyCount += 1;
    }

    perTurn.push({
      turnId: turn.id,
      latencyMs: turnLatencyMs,
      playbackStartCount: starts.length,
      playbackEndCount: ends.length,
      missed: starts.length === 0,
      duplicated: starts.length > 1,
      truncated: starts.length > 0 && ends.length === 0,
    });
  }

  for (const interval of playbackIntervals) {
    const nextTurn = scenario.turns.find((turn) => turn.startMs > interval.startAtMs);

    if (!nextTurn || interval.endAtMs === null) {
      continue;
    }

    if (interval.endAtMs > nextTurn.startMs) {
      overlapLeakageMs += interval.endAtMs - nextTurn.startMs;
    }
  }

  return {
    roundId: scenario.roundId,
    durationMs: scenario.durationMs,
    turnCount: scenario.turns.length,
    turns: perTurn,
    turnStartLatency: {
      samplesMs: latencies,
      medianMs: median(latencies),
      p95Ms: percentile(latencies, 0.95),
      minMs: latencies.length ? Math.min(...latencies) : 0,
      maxMs: latencies.length ? Math.max(...latencies) : 0,
    },
    bargeInStopLatencyMs: {
      samplesMs: [],
      medianMs: 0,
      p95Ms: 0,
    },
    overlapLeakageMs,
    duplicateTurnCount,
    missedTurnCount,
    emptyTurnCount: scenario.turns.filter((turn) => !(turn.transcript ?? "").trim()).length,
    truncatedReplyCount,
  };
};
