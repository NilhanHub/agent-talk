import { spawn } from "node:child_process";
import { once } from "node:events";

import {
  DEFAULT_BENCHMARK_HOST,
  repoRoot,
  waitForHttpReady,
} from "./common.mjs";

export const startBenchmarkServer = async ({ port }) => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  await waitForHttpReady(`http://${DEFAULT_BENCHMARK_HOST}:${port}/`);

  return {
    baseUrl: `http://${DEFAULT_BENCHMARK_HOST}:${port}`,
    async stop() {
      if (child.exitCode !== null) {
        return;
      }

      child.kill();
      await once(child, "exit");
    },
    get stderr() {
      return stderr;
    },
  };
};
