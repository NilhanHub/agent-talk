import { createReply } from "../conversation/index.js";

import { appendSessionTurns } from "./append-session-turns.js";
import { buildChatTurnResponse } from "./build-chat-turn-response.js";
import { normalizeChatRequest } from "./normalize-chat-request.js";

export const runChatTurn = async ({
  transcript,
  voice,
  sessionId,
  benchmark,
  edgeTtsService,
  sessionStore,
}) => {
  const requestStartedAt = performance.now();
  const request = normalizeChatRequest({
    transcript,
    voice,
    sessionId,
  });
  const history = sessionStore.get(request.sessionId);
  const replyStartedAt = performance.now();
  const replyText = createReply({
    transcript: request.transcript,
    history,
  });
  const replyTextReadyMs = performance.now() - replyStartedAt;
  const ttsStartedAt = performance.now();
  const audioFile = await edgeTtsService.synthesizeSpeech({
    text: replyText,
    voice: request.voice,
  });
  const ttsDurationMs = performance.now() - ttsStartedAt;

  appendSessionTurns({
    sessionStore,
    sessionId: request.sessionId,
    transcript: request.transcript,
    replyText,
  });

  return buildChatTurnResponse({
    transcript: request.transcript,
    replyText,
    voice: request.voice,
    audioFile,
    sessionId: request.sessionId,
    benchmarkTimings:
      benchmark?.enabled === true
        ? {
            replyTextReadyMs: Math.round(replyTextReadyMs),
            ttsDurationMs: Math.round(ttsDurationMs),
            totalServerMs: Math.round(performance.now() - requestStartedAt),
            roundId: benchmark.roundId ?? null,
            turnId: benchmark.turnId ?? null,
          }
        : undefined,
  });
};
