import { Readable } from "node:stream";

export const sendNodeResponse = (nodeResponse, webResponse) => {
  nodeResponse.writeHead(
    webResponse.status,
    Object.fromEntries(webResponse.headers.entries())
  );

  if (!webResponse.body) {
    nodeResponse.end();
    return;
  }

  Readable.fromWeb(webResponse.body).pipe(nodeResponse);
};
