import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createApp } from "../src/app.js";

test("GET /audio/*.mp3 serves an existing audio file", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  const audioDir = await mkdtemp(join(tmpdir(), "agent-talk-audio-"));
  const audioPath = join(audioDir, "reply.mp3");

  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");
  await writeFile(audioPath, Buffer.from([1, 2, 3, 4]));

  const app = createApp({
    publicDir,
    audioDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async () => "audio-cache/reply.mp3",
    },
  });

  const response = await app(new Request("http://localhost/audio/reply.mp3"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), Buffer.from([1, 2, 3, 4]));
});

test("GET /audio rejects traversal-style paths", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  const audioDir = await mkdtemp(join(tmpdir(), "agent-talk-audio-"));

  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");

  const app = createApp({
    publicDir,
    audioDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async () => "audio-cache/reply.mp3",
    },
  });

  const response = await app(
    new Request("http://localhost/audio/%2e%2e/%2e%2e/package.json")
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found");
});

test("GET /audio returns 404 for a missing file", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  const audioDir = await mkdtemp(join(tmpdir(), "agent-talk-audio-"));

  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");

  const app = createApp({
    publicDir,
    audioDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async () => "audio-cache/reply.mp3",
    },
  });

  const response = await app(new Request("http://localhost/audio/missing.mp3"));

  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Not found");
});
