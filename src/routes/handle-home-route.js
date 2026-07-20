import { join } from "node:path";

import { fileResponse } from "../http/index.js";

export const createHomeRouteHandler = ({ publicDir }) => () =>
  fileResponse(join(publicDir, "index.html"));
