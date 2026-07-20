import { basename } from "node:path";

export const buildChatTurnResponse = ({
  transcript,
  replyText,
  voice,
  audioFile,
  sessionId,
  benchmarkTimings,
}) => ({
  transcript,
  replyText,
  voice,
  audioUrl: `/audio/${basename(audioFile)}`,
  sessionId,
  mode: "local-stand-in",
  ...(benchmarkTimings ? { benchmarkTimings } : {}),
});
