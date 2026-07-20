import { join } from "node:path";

import { createApp } from "./src/app.js";
import { createNodeServer } from "./src/http/index.js";
import { createEdgeTtsService } from "./src/audio/index.js";

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(process.cwd(), "public");
const edgeTtsService = createEdgeTtsService();
const app = createApp({ publicDir, edgeTtsService });
const server = createNodeServer(app);

server.listen(port, () => {
  console.log(`Agent Talk is running at http://localhost:${port}`);
});
