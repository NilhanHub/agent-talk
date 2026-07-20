import { DEFAULT_VOICE } from "../audio/index.js";
import { jsonResponse } from "../http/index.js";

export const createVoicesRouteHandler = ({ edgeTtsService }) => async () => {
  const voices = await edgeTtsService.listVoices();

  return jsonResponse({
    defaultVoice: DEFAULT_VOICE,
    voices,
  });
};
