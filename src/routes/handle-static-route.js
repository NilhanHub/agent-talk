import { fileResponse, resolveSafeFile } from "../http/index.js";

export const createStaticRouteHandler = ({ publicDir }) => async (request) => {
  const pathname = new URL(request.url).pathname;
  const staticFile = resolveSafeFile(publicDir, pathname);

  if (!staticFile) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await fileResponse(staticFile);
  } catch {
    return new Response("Not found", { status: 404 });
  }
};
