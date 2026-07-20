import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createApp } from "../src/app.js";

const makeJsonRequest = async (app, method, path, body) => {
  const request = new Request(`http://localhost${path}`, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const response = await app(request);
  return {
    response,
    json: response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : null,
    text: response.headers.get("content-type")?.includes("text/html")
      ? await response.text()
      : null,
  };
};

test("GET /api/voices returns the available voices", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");

  const app = createApp({
    publicDir,
    edgeTtsService: {
      listVoices: async () => [{ shortName: "en-US-AndrewMultilingualNeural" }],
      synthesizeSpeech: async () => "audio-cache/reply.mp3",
    },
  });

  const { response, json } = await makeJsonRequest(app, "GET", "/api/voices");

  assert.equal(response.status, 200);
  assert.deepEqual(json, {
    defaultVoice: "en-US-AndrewMultilingualNeural",
    voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
  });
});

test("POST /api/chat rejects an empty transcript", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");

  const app = createApp({
    publicDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async () => "audio-cache/reply.mp3",
    },
  });

  const { response, json } = await makeJsonRequest(app, "POST", "/api/chat", {
    transcript: "   ",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(json, {
    error: "Transcript is required.",
  });
});

test("POST /api/chat returns reply text and audio url", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");

  const calls = [];
  const app = createApp({
    publicDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async (payload) => {
        calls.push(payload);
        return "audio-cache/reply-123.mp3";
      },
    },
  });

  const { response, json } = await makeJsonRequest(app, "POST", "/api/chat", {
    transcript: "Hello there",
    voice: "en-US-AndrewNeural",
    sessionId: "session-1",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(json, {
    transcript: "Hello there",
    replyText: "Hey. I'm here with you and ready to talk. What would you like to explore first?",
    voice: "en-US-AndrewNeural",
    audioUrl: "/audio/reply-123.mp3",
    sessionId: "session-1",
    mode: "local-stand-in",
  });
  assert.deepEqual(calls, [
    {
      text: "Hey. I'm here with you and ready to talk. What would you like to explore first?",
      voice: "en-US-AndrewNeural",
    },
  ]);
});

test("POST /api/chat keeps short session memory for conversational callbacks", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  await writeFile(join(publicDir, "index.html"), "<html><body>ok</body></html>");

  const app = createApp({
    publicDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async () => "audio-cache/reply-123.mp3",
    },
  });

  await makeJsonRequest(app, "POST", "/api/chat", {
    transcript: "I want the Andrew voice for this app",
    sessionId: "session-2",
  });
  const { response, json } = await makeJsonRequest(app, "POST", "/api/chat", {
    transcript: "Can you keep that?",
    sessionId: "session-2",
  });

  assert.equal(response.status, 200);
  assert.equal(
    json.replyText,
    "Yes. I can stick with Andrew voice and keep building from there."
  );
});

test("GET / serves the homepage html", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "agent-talk-public-"));
  await writeFile(
    join(publicDir, "index.html"),
    "<!doctype html><html><body><main data-app=\"agent-talk\">Full-duplex</main></body></html>"
  );

  const app = createApp({
    publicDir,
    edgeTtsService: {
      listVoices: async () => [],
      synthesizeSpeech: async () => "audio-cache/reply.mp3",
    },
  });

  const { response, text } = await makeJsonRequest(app, "GET", "/");

  assert.equal(response.status, 200);
  assert.match(text, /data-app="agent-talk"/);
  assert.match(text, /Full-duplex/);
});
