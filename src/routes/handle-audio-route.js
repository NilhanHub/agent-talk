import { fileResponse, resolveSafeFile } from "../http/index.js";

export const createAudioRouteHandler = ({ audioDir }) => async (request) => {
  const pathname = new URL(request.url).pathname;
  const audioFile = resolveSafeFile(audioDir, pathname.replace("/audio", ""));

  if (!audioFile) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await fileResponse(audioFile);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }

    throw error;
  }
};
