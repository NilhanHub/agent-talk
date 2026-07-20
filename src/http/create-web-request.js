import { Readable } from "node:stream";

export const createWebRequest = (nodeRequest) =>
  new Request(`http://${nodeRequest.headers.host}${nodeRequest.url}`, {
    method: nodeRequest.method,
    headers: nodeRequest.headers,
    body:
      nodeRequest.method === "GET" || nodeRequest.method === "HEAD"
        ? undefined
        : Readable.toWeb(nodeRequest),
    duplex: "half",
  });
