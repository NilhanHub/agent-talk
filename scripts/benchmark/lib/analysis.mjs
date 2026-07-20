const hasIssue = (value) => value > 0;

const pushIssue = (bucket, severity, summary, recommendation) => {
  bucket.push({
    severity,
    summary,
    recommendation,
  });
};

export const buildAnalysis = ({ scenario, metrics, semanticConfidence }) => {
  const correctness = [];
  const latency = [];
  const overlap = [];
  const audioQuality = [];

  if (hasIssue(metrics.missedTurnCount)) {
    pushIssue(
      correctness,
      "high",
      `${metrics.missedTurnCount} turn(s) never produced audible playback.`,
      "Investigate request dispatch, reply generation, and playback start instrumentation for dropped turns."
    );
  }

  if (hasIssue(metrics.duplicateTurnCount)) {
    pushIssue(
      correctness,
      "medium",
      `${metrics.duplicateTurnCount} duplicate playback start event(s) were observed.`,
      "Audit replay, stale-response, and player re-entry behavior for duplicate send or duplicate play triggers."
    );
  }

  if (hasIssue(metrics.truncatedReplyCount)) {
    pushIssue(
      correctness,
      "medium",
      `${metrics.truncatedReplyCount} reply segment(s) appear truncated.`,
      "Check interruption, autoplay, and audio element state transitions around pause/end."
    );
  }

  if (metrics.turnStartLatency.medianMs > 100) {
    pushIssue(
      latency,
      metrics.turnStartLatency.medianMs > 500 ? "high" : "medium",
      `Median turn-start latency is ${metrics.turnStartLatency.medianMs} ms.`,
      "Profile recognition completion, request dispatch, TTS startup, and playback startup in that order."
    );
  }

  if (metrics.turnStartLatency.p95Ms > 100) {
    pushIssue(
      latency,
      metrics.turnStartLatency.p95Ms > 750 ? "high" : "medium",
      `P95 turn-start latency is ${metrics.turnStartLatency.p95Ms} ms.`,
      "Look for cold-start behavior, process spawn cost, and any long-tail response outliers."
    );
  }

  if (hasIssue(metrics.overlapLeakageMs)) {
    pushIssue(
      overlap,
      metrics.overlapLeakageMs > 500 ? "high" : "medium",
      `${metrics.overlapLeakageMs} ms of assistant overlap leaked into later user turns.`,
      "Tighten interruption handling and ensure playback stop occurs before the next request is allowed to repaint or continue."
    );
  }

  if (metrics.turnCount > 0 && metrics.turnStartLatency.samplesMs.length === 0) {
    pushIssue(
      audioQuality,
      "high",
      "No measurable assistant playback starts were captured.",
      "Verify autoplay policy, player play events, and benchmark event wiring."
    );
  }

  const improveNext = [
    ...(correctness[0] ? [correctness[0].recommendation] : []),
    ...(latency[0] ? [latency[0].recommendation] : []),
    ...(overlap[0] ? [overlap[0].recommendation] : []),
    ...(audioQuality[0] ? [audioQuality[0].recommendation] : []),
  ].slice(0, 2);

  const classify = (issues) =>
    issues.length === 0
      ? "- cleared"
      : issues
          .map(
            (issue) =>
              `- ${issue.severity}: ${issue.summary} Improvement: ${issue.recommendation}`
          )
          .join("\n");

  const report = [
    `# Benchmark Analysis: ${scenario.roundId}`,
    "",
    `- Scenario: ${scenario.title}`,
    `- Group: ${scenario.groupId}`,
    `- Duration: ${scenario.durationMs} ms`,
    `- Semantic confidence: ${semanticConfidence}`,
    "",
    "## Correctness",
    classify(correctness),
    "",
    "## Latency",
    classify(latency),
    "",
    "## Overlap",
    classify(overlap),
    "",
    "## Audio Quality",
    classify(audioQuality),
    "",
    "## Improve Next",
    improveNext.length === 0
      ? "- No urgent issues detected in this round."
      : improveNext.map((item) => `- ${item}`).join("\n"),
    "",
    "## Summary",
    `- Median latency: ${metrics.turnStartLatency.medianMs} ms`,
    `- P95 latency: ${metrics.turnStartLatency.p95Ms} ms`,
    `- Missed turns: ${metrics.missedTurnCount}`,
    `- Duplicate turns: ${metrics.duplicateTurnCount}`,
    `- Truncated replies: ${metrics.truncatedReplyCount}`,
    `- Overlap leakage: ${metrics.overlapLeakageMs} ms`,
  ];

  return {
    report: `${report.join("\n")}\n`,
    improveNext,
    issueBuckets: {
      correctness,
      latency,
      overlap,
      audioQuality,
    },
  };
};
