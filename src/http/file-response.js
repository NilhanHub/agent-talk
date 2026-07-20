import { readFile } from "node:fs/promises";
import { extname } from "node:path";

import { CONTENT_TYPES } from "./content-types.js";

export const fileResponse = async (filePath) => {
  const body = await readFile(filePath);
  const contentType = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
    },
  });
};
