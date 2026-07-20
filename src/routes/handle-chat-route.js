import { runChatTurn } from "../chat-turn/index.js";
import { jsonResponse } from "../http/index.js";

export const createChatRouteHandler = ({ edgeTtsService, sessionStore }) => async (request) => {
  const body = await request.json();

  try {
    const payload = await runChatTurn({
      transcript: body?.transcript,
      voice: body?.voice,
      sessionId: body?.sessionId,
      benchmark: body?.benchmark,
      edgeTtsService,
      sessionStore,
    });

    return jsonResponse(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "Transcript is required.") {
      return jsonResponse(
        {
          error: "Transcript is required.",
        },
        { status: 400 }
      );
    }

    throw error;
  }
};
