import { join } from "node:path";

import { createEdgeTtsService } from "../../../src/audio/index.js";

import { buildAnalysis } from "./analysis.mjs";
import {
  buildAssistantSegmentsFromEvents,
  buildDelayedMixTrack,
  buildStereoMaster,
  getAudioDurationMs,
} from "./audio-timeline.mjs";
import {
  BENCHMARK_ARTIFACT_VERSION,
  ensureDir,
  fileExists,
  findFreePort,
  repoRoot,
  writeJson,
  writeText,
} from "./common.mjs";
import { runBrowserBenchmarkRound } from "./browser-round.mjs";
import { computeRoundMetrics } from "./metrics.mjs";
import { createRoundPaths } from "./round-paths.mjs";
import { getScenarioByRound } from "./scenario-catalog.mjs";
import { startBenchmarkServer } from "./server-process.mjs";

const createUserSegmentPath = (roundDir, turnId) => join(roundDir, "stems", `${turnId}.mp3`);

const resolveScenarioForPlayback = async ({ scenario, roundDir }) => {
  const edgeTts = createEdgeTtsService();
  const turns = [];

  for (const turn of scenario.turns) {
    const outFile = createUserSegmentPath(roundDir, turn.id);

    if (!(await fileExists(outFile))) {
      await edgeTts.synthesizeSpeech({
        text: turn.transcript,
        voice: scenario.userVoice.shortName,
        outFile,
      });
    }

    const durationMs = await getAudioDurationMs(outFile);

    turns.push({
      ...turn,
      audioFile: outFile,
      endMs: turn.startMs + durationMs,
    });
  }

  return {
    ...scenario,
    turns,
  };
};

export const runBenchmarkRound = async ({
  roundNumber,
  port,
} = {}) => {
  const rootDir = repoRoot;
  const scenario = getScenarioByRound(roundNumber);
  const roundPaths = createRoundPaths({
    rootDir,
    roundId: scenario.roundId,
  });

  await ensureDir(join(roundPaths.roundDir, "stems"));

  const resolvedScenario = await resolveScenarioForPlayback({
    scenario,
    roundDir: roundPaths.roundDir,
  });
  const userTrackPath = join(roundPaths.roundDir, "user-track.wav");
  const assistantTrackPath = join(roundPaths.roundDir, "assistant-track.wav");

  await buildDelayedMixTrack({
    durationMs: resolvedScenario.durationMs,
    segments: resolvedScenario.turns.map((turn) => ({
      filePath: turn.audioFile,
      startMs: turn.startMs,
    })),
    outputPath: userTrackPath,
  });

  const server = await startBenchmarkServer({
    port: port ?? (await findFreePort()),
  });

  let browserResult;

  try {
    browserResult = await runBrowserBenchmarkRound({
      baseUrl: server.baseUrl,
      scenario: resolvedScenario,
    });
  } finally {
    await server.stop();
  }

  const events = browserResult.events;
  const assistantSegments = buildAssistantSegmentsFromEvents({
    events,
    rootDir,
  });

  await buildDelayedMixTrack({
    durationMs: resolvedScenario.durationMs,
    segments: assistantSegments,
    outputPath: assistantTrackPath,
  });

  await buildStereoMaster({
    leftPath: userTrackPath,
    rightPath: assistantTrackPath,
    masterPath: roundPaths.masterWav,
    listenMp3Path: roundPaths.listenMp3,
  });

  const metrics = computeRoundMetrics({
    scenario: resolvedScenario,
    events,
  });
  const semanticConfidence = process.env.OPENAI_API_KEY
    ? "hybrid-cloud-ready"
    : "reduced-no-openai-api-key";
  const analysis = buildAnalysis({
    scenario: resolvedScenario,
    metrics,
    semanticConfidence,
  });

  await writeJson(roundPaths.eventsJson, {
    schemaVersion: BENCHMARK_ARTIFACT_VERSION,
    roundId: resolvedScenario.roundId,
    events,
    health: browserResult.health,
  });
  await writeJson(roundPaths.scenarioJson, resolvedScenario);
  await writeJson(roundPaths.metricsJson, {
    schemaVersion: BENCHMARK_ARTIFACT_VERSION,
    semanticConfidence,
    metrics,
  });
  await writeText(roundPaths.analysisMd, analysis.report);

  return {
    roundPaths,
    scenario: resolvedScenario,
    metrics,
    analysis,
  };
};
