import { basename, dirname, join } from "node:path";

import { ensureDir, fileExists, runCommand } from "./common.mjs";

export const getAudioDurationMs = async (filePath) => {
  const { stdout } = await runCommand("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  return Math.round(Number.parseFloat(stdout.trim()) * 1000);
};

export const buildDelayedMixTrack = async ({
  durationMs,
  segments,
  outputPath,
}) => {
  await ensureDir(dirname(outputPath));

  const usableSegments = [];

  for (const segment of segments) {
    if (!(await fileExists(segment.filePath))) {
      continue;
    }

    const availableDurationMs = await getAudioDurationMs(segment.filePath);
    const durationLimitMs =
      segment.durationMs === undefined
        ? availableDurationMs
        : Math.min(availableDurationMs, Math.max(0, segment.durationMs));

    usableSegments.push({
      ...segment,
      durationMs: durationLimitMs,
    });
  }

  if (usableSegments.length === 0) {
    await runCommand("ffmpeg", [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=24000:cl=mono:d=${(durationMs / 1000).toFixed(3)}`,
      "-ar",
      "24000",
      "-ac",
      "1",
      "-t",
      (durationMs / 1000).toFixed(3),
      outputPath,
    ]);

    return outputPath;
  }

  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=24000:cl=mono:d=${(durationMs / 1000).toFixed(3)}`,
  ];
  const filterParts = [];
  const mixLabels = ["[0:a]"];

  usableSegments.forEach((segment, index) => {
    args.push("-i", segment.filePath);
    filterParts.push(
      `[${index + 1}:a]atrim=0:${(segment.durationMs / 1000).toFixed(3)},adelay=${Math.max(0, Math.round(segment.startMs))}|${Math.max(0, Math.round(segment.startMs))}[segment${index}]`
    );
    mixLabels.push(`[segment${index}]`);
  });

  filterParts.push(
    `${mixLabels.join("")}amix=inputs=${mixLabels.length}:normalize=0:dropout_transition=0[mixed]`
  );

  args.push(
    "-filter_complex",
    filterParts.join(";"),
    "-map",
    "[mixed]",
    "-ar",
    "24000",
    "-ac",
    "1",
    "-t",
    (durationMs / 1000).toFixed(3),
    outputPath
  );

  await runCommand("ffmpeg", args);

  return outputPath;
};

export const buildStereoMaster = async ({
  leftPath,
  rightPath,
  masterPath,
  listenMp3Path,
}) => {
  await ensureDir(dirname(masterPath));
  await runCommand("ffmpeg", [
    "-y",
    "-i",
    leftPath,
    "-i",
    rightPath,
    "-filter_complex",
    "[0:a][1:a]amerge=inputs=2[stereo]",
    "-map",
    "[stereo]",
    "-ac",
    "2",
    masterPath,
  ]);

  await runCommand("ffmpeg", [
    "-y",
    "-i",
    masterPath,
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "2",
    listenMp3Path,
  ]);

  return {
    masterPath,
    listenMp3Path,
  };
};

export const resolveAudioCacheFile = ({ rootDir, audioUrl }) =>
  join(rootDir, "audio-cache", basename(audioUrl));

export const buildAssistantSegmentsFromEvents = ({ events, rootDir }) => {
  const sorted = [...events].sort((left, right) => left.atMs - right.atMs);
  const segments = [];
  let active = null;

  for (const event of sorted) {
    if (event.type === "assistant/playback-start") {
      if (active) {
        segments.push(active);
      }

      active = {
        turnId: event.turnId,
        startMs: Math.max(0, Math.round(event.atMs)),
        filePath: resolveAudioCacheFile({
          rootDir,
          audioUrl: event.audioUrl,
        }),
      };
      continue;
    }

    if (
      active &&
      (event.type === "assistant/playback-end" ||
        event.type === "assistant/playback-pause" ||
        event.type === "assistant/barge-in-stop")
    ) {
      segments.push({
        ...active,
        durationMs: Math.max(0, Math.round(event.atMs - active.startMs)),
      });
      active = null;
    }
  }

  if (active) {
    segments.push(active);
  }

  return segments;
};
