import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createAgentTalkController } from "../../public/controller/index.js";
import { handleRecognitionResult } from "../../public/recognition/handle-recognition-result.js";
import { createApp } from "../../src/app.js";
import { parseVoiceListOutput } from "../../src/audio/parse-voice-list-output.js";
import { createSessionStore } from "../../src/sessions/create-session-store.js";

const createButton = () => ({
  disabled: false,
  listeners: new Map(),
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  },
});

const createToggle = () => ({
  checked: true,
  listeners: new Map(),
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  },
});

const createPlayer = () => ({
  src: "",
  paused: false,
  currentTime: 0,
  load() {},
  async play() {},
  pause() {
    this.paused = true;
  },
});

const createElements = () => ({
  voiceSelect: { value: "", options: [] },
  duplexToggle: createToggle(),
  listenButton: createButton(),
  stopButton: createButton(),
  statusText: { textContent: "" },
  modeText: { textContent: "" },
  heardText: { textContent: "" },
  replyText: { textContent: "" },
  player: createPlayer(),
});

const renderVoiceOptions = (elements, data) => {
  elements.voiceSelect.options = data.voices;
  elements.voiceSelect.value = data.defaultVoice;
};

const makeOkResponse = (
  replyText,
  voice = "en-US-AndrewMultilingualNeural",
  audioUrl = "/audio/reply.mp3"
) => ({
  response: { ok: true },
  data: {
    replyText,
    mode: "local-stand-in",
    voice,
    audioUrl,
  },
});

test("probe: stale response cannot overwrite a newer reply when the older request ignores abort", async () => {
  const elements = createElements();
  const resolvers = new Map();

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: ({ transcript }) =>
      new Promise((resolve) => {
        resolvers.set(transcript, resolve);
      }),
    playReplyAudio: async () => {},
    createRecognition: () => null,
    renderVoiceOptions,
  });

  await controller.init();

  const firstRequest = controller.sendTranscript("first request");
  const secondRequest = controller.sendTranscript("second request");

  resolvers
    .get("second request")(makeOkResponse("Second reply", "voice-2", "/audio/reply-2.mp3"));
  await secondRequest;

  resolvers
    .get("first request")(makeOkResponse("First reply", "voice-1", "/audio/reply-1.mp3"));
  await firstRequest;

  assert.equal(elements.heardText.textContent, "second request");
  assert.equal(elements.replyText.textContent, "Second reply");
  assert.equal(elements.statusText.textContent, "Reply ready in voice-2. Still listening.");
});

test("probe: recognition.start() throwing rolls the controller back out of listening mode", async () => {
  const elements = createElements();
  const recognition = {
    start() {
      throw new Error("Mic start failed");
    },
    stop() {},
  };

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: async () => makeOkResponse("unused"),
    playReplyAudio: async () => {},
    createRecognition: () => recognition,
    renderVoiceOptions,
  });

  await controller.init();

  controller.startListening();
  assert.equal(controller.runtime.listening, false);
  assert.equal(elements.listenButton.disabled, false);
  assert.equal(elements.stopButton.disabled, true);
  assert.equal(elements.statusText.textContent, "Mic start failed");
});

test("probe: recognition error followed by onend does not auto-restart or hide the error state", async () => {
  const elements = createElements();
  const recognition = {
    startCalls: 0,
    stop() {},
    start() {
      this.startCalls += 1;
    },
  };

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: async () => makeOkResponse("unused"),
    playReplyAudio: async () => {},
    createRecognition: () => recognition,
    renderVoiceOptions,
  });

  await controller.init();
  controller.startListening();

  recognition.onerror({ error: "not-allowed" });
  recognition.onend();
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(recognition.startCalls, 1);
  assert.equal(controller.runtime.listening, false);
  assert.equal(elements.statusText.textContent, "Microphone error: not-allowed");
});

test("probe: multi-final recognition results merge into one transcript send", async () => {
  const calls = [];
  const elements = createElements();
  const runtime = {
    elements,
  };

  const onResult = handleRecognitionResult({
    runtime,
    sendTranscript: async (transcript) => {
      calls.push(transcript);
    },
    setStatus: (targetElements, message) => {
      targetElements.statusText.textContent = message;
    },
  });

  await onResult({
    resultIndex: 0,
    results: [
      { isFinal: true, 0: { transcript: "Hello there" } },
      { isFinal: true, 0: { transcript: "Hello there" } },
    ],
  });

  assert.deepEqual(calls, ["Hello there"]);
});

test("probe: missing audio file returns a clean 404 response", async () => {
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

test("probe: session store evicts least recently used sessions beyond the cap", () => {
  const store = createSessionStore({ maxTurns: 4, maxSessions: 200 });

  for (let index = 0; index < 201; index += 1) {
    store.append(`session-${index}`, {
      role: "user",
      content: `message-${index}`,
    });
  }

  assert.deepEqual(store.get("session-0"), []);
  assert.deepEqual(store.get("session-200"), [
    { role: "user", content: "message-200" },
  ]);
});

test("probe: voice list parsing excludes CLI header rows", () => {
  const voices = parseVoiceListOutput(`Name  Gender  ContentCategories  VoicePersonalities
---------------------------------  --------  ---------------------  --------------------------------------
en-US-AndrewMultilingualNeural  Male  Conversation, Copilot  Warm, Confident, Authentic, Honest`);

  assert.deepEqual(voices, [
    {
      shortName: "en-US-AndrewMultilingualNeural",
      gender: "Male",
      contentCategories: "Conversation, Copilot",
      voicePersonalities: "Warm, Confident, Authentic, Honest",
    },
  ]);
});
