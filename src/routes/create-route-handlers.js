import { createAudioRouteHandler } from "./handle-audio-route.js";
import { createChatRouteHandler } from "./handle-chat-route.js";
import { createHomeRouteHandler } from "./handle-home-route.js";
import { createStaticRouteHandler } from "./handle-static-route.js";
import { createVoicesRouteHandler } from "./handle-voices-route.js";

export const createRouteHandlers = ({
  publicDir,
  audioDir,
  edgeTtsService,
  sessionStore,
}) => ({
  home: createHomeRouteHandler({ publicDir }),
  voices: createVoicesRouteHandler({ edgeTtsService }),
  chat: createChatRouteHandler({ edgeTtsService, sessionStore }),
  audio: createAudioRouteHandler({ audioDir }),
  static: createStaticRouteHandler({ publicDir }),
});
