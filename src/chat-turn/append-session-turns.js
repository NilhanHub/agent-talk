import { summarizeTopic } from "../conversation/index.js";

export const appendSessionTurns = ({
  sessionStore,
  sessionId,
  transcript,
  replyText,
}) =>
  sessionStore.append(
    sessionId,
    {
      role: "user",
      content: transcript,
      topic: summarizeTopic(transcript),
    },
    {
      role: "assistant",
      content: replyText,
    }
  );
