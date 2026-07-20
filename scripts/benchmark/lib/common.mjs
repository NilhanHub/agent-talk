import { execFile } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import net from "node:net";

const execFileAsync = promisify(execFile);

export const BENCHMARK_ARTIFACT_VERSION = 1;
export const DEFAULT_BENCHMARK_HOST = "127.0.0.1";
export const DEFAULT_BENCHMARK_PORT = 3217;

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export const ensureDir = async (directoryPath) => {
  await mkdir(directoryPath, { recursive: true });
};

export const writeJson = async (filePath, value) => {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const readJson = async (filePath) =>
  JSON.parse(await readFile(filePath, "utf8"));

export const writeText = async (filePath, value) => {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, value, "utf8");
};

export const fileExists = async (filePath) => {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const runCommand = async (command, args, options = {}) => {
  const { cwd = repoRoot, input, env, timeoutMs } = options;

  return execFileAsync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    input,
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20,
  });
};

export const parseRoundArgument = (argv) => {
  const roundIndex = argv.indexOf("--round");

  if (roundIndex === -1) {
    const positional = argv.slice(2).find((value) => /^\d+$/.test(value));
    return positional ? Number(positional) : 1;
  }

  return Number(argv[roundIndex + 1]);
};

export const parsePortArgument = (argv) => {
  const portIndex = argv.indexOf("--port");

  if (portIndex === -1) {
    const positional = argv.slice(2).find((value) => /^\d{4,5}$/.test(value));
    return positional ? Number(positional) : DEFAULT_BENCHMARK_PORT;
  }

  return Number(argv[portIndex + 1]);
};

export const findFreePort = async () =>
  new Promise((resolvePort, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, DEFAULT_BENCHMARK_HOST, () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });

export const sleep = (durationMs) =>
  new Promise((resolveSleep) => setTimeout(resolveSleep, durationMs));

export const waitForHttpReady = async (url, timeoutMs = 20_000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Ignore until the deadline.
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for ${url}`);
};

export const detectChromeExecutable = async () => {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Could not find a Chrome or Edge executable. Set CHROME_PATH.");
};
