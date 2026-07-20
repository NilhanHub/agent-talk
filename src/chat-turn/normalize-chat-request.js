import { randomUUID } from "node:crypto";

import { DEFAULT_VOICE } from "../audio/index.js";

export const normalizeChatRequest = ({
  transcript,
  voice,
  sessionId,
}) => {
  const nextTranscript = `${transcript ?? ""}`.trim();

  if (!nextTranscript) {
    throw new Error("Transcript is required.");
  }

  return {
    transcript: nextTranscript,
    voice: `${voice ?? DEFAULT_VOICE}`.trim() || DEFAULT_VOICE,
    sessionId: `${sessionId ?? ""}`.trim() || randomUUID(),
  };
};
