import { join } from "node:path";

import { createRouteHandlers, dispatchRequest } from "./routes/index.js";
import { createSessionStore } from "./sessions/index.js";

export const createApp = ({
  publicDir,
  edgeTtsService,
  audioDir = edgeTtsService.audioDir ?? join(process.cwd(), "audio-cache"),
} = {}) => {
  if (!publicDir) {
    throw new Error("publicDir is required");
  }

  if (!edgeTtsService) {
    throw new Error("edgeTtsService is required");
  }

  const sessionStore = createSessionStore();
  const handlers = createRouteHandlers({
    publicDir,
    audioDir,
    edgeTtsService,
    sessionStore,
  });

  return (request) => dispatchRequest({ request, handlers });
};
