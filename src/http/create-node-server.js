import { createServer } from "node:http";

import { createWebRequest } from "./create-web-request.js";
import { sendNodeResponse } from "./send-node-response.js";

export const createNodeServer = (app) =>
  createServer(async (req, res) => {
    try {
      const request = createWebRequest(req);
      const response = await app(request);
      sendNodeResponse(res, response);
    } catch (error) {
      res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          error: "Internal server error.",
          detail: error instanceof Error ? error.message : String(error),
        })
      );
    }
  });
