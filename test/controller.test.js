import assert from "node:assert/strict";
import test from "node:test";

import { createAgentTalkController } from "../public/controller/index.js";

const createButton = () => ({
  disabled: false,
  listeners: new Map(),
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  },
  async click() {
    return this.listeners.get("click")?.();
  },
});

const createToggle = () => ({
  checked: true,
  listeners: new Map(),
  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  },
  async triggerChange() {
    return this.listeners.get("change")?.();
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

test("createAgentTalkController initializes voices and recognition state", async () => {
  const elements = createElements();
  const recognition = {
    startCalls: 0,
    stopCalls: 0,
    start() {
      this.startCalls += 1;
    },
    stop() {
      this.stopCalls += 1;
    },
  };

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: async () => {
      throw new Error("not needed");
    },
    playReplyAudio: async () => {},
    createRecognition: () => recognition,
    renderVoiceOptions,
  });

  await controller.init();

  assert.equal(elements.voiceSelect.value, "en-US-AndrewMultilingualNeural");
  assert.equal(elements.modeText.textContent, "Local stand-in brain");
  assert.equal(
    elements.statusText.textContent,
    "Ready. Default voice: en-US-AndrewMultilingualNeural"
  );
  assert.equal(elements.listenButton.disabled, false);
  assert.equal(elements.stopButton.disabled, true);
});

test("createAgentTalkController aborts the previous request and shows autoplay fallback status", async () => {
  const elements = createElements();
  const signals = [];
  let pendingReject;

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: ({ transcript, signal }) => {
      signals.push(signal);

      if (transcript === "first request") {
        return new Promise((resolve, reject) => {
          pendingReject = reject;
          signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      }

      return Promise.resolve({
        response: { ok: true },
        data: {
          replyText: "Second reply",
          mode: "local-stand-in",
          voice: "en-US-AndrewMultilingualNeural",
          audioUrl: "/audio/reply-2.mp3",
        },
      });
    },
    playReplyAudio: async () => {
      throw new Error("autoplay blocked");
    },
    createRecognition: () => null,
    renderVoiceOptions,
  });

  await controller.init();

  const firstPromise = controller.sendTranscript("first request").catch(() => {});
  await controller.sendTranscript("second request");
  await firstPromise;

  assert.equal(signals.length, 2);
  assert.equal(signals[0].aborted, true);
  assert.equal(elements.heardText.textContent, "second request");
  assert.equal(
    elements.statusText.textContent,
    "Reply ready. Press play if your browser blocked autoplay."
  );

  pendingReject?.(new Error("cleanup"));
});

test("createAgentTalkController ignores a stale response that resolves after a newer reply", async () => {
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

  resolvers.get("second request")({
    response: { ok: true },
    data: {
      replyText: "Second reply",
      mode: "local-stand-in",
      voice: "voice-2",
      audioUrl: "/audio/reply-2.mp3",
    },
  });
  await secondRequest;

  resolvers.get("first request")({
    response: { ok: true },
    data: {
      replyText: "First reply",
      mode: "local-stand-in",
      voice: "voice-1",
      audioUrl: "/audio/reply-1.mp3",
    },
  });
  await firstRequest;

  assert.equal(elements.heardText.textContent, "second request");
  assert.equal(elements.replyText.textContent, "Second reply");
  assert.equal(elements.statusText.textContent, "Reply ready in voice-2. Still listening.");
});

test("createAgentTalkController rolls back listening state when recognition.start throws", async () => {
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
    sendChatRequest: async () => {
      throw new Error("not needed");
    },
    playReplyAudio: async () => {},
    createRecognition: () => recognition,
    renderVoiceOptions,
  });

  await controller.init();

  controller.startListening();

  assert.equal(controller.runtime.listening, false);
  assert.equal(controller.runtime.manuallyStopped, true);
  assert.equal(elements.listenButton.disabled, false);
  assert.equal(elements.stopButton.disabled, true);
  assert.equal(elements.heardText.textContent, "");
  assert.equal(elements.replyText.textContent, "");
  assert.equal(elements.statusText.textContent, "Mic start failed");
});

test("createAgentTalkController restarts recognition when duplex listening ends unexpectedly", async () => {
  const elements = createElements();
  const recognition = {
    startCalls: 0,
    stopCalls: 0,
    start() {
      this.startCalls += 1;
      this.onstart?.();
    },
    stop() {
      this.stopCalls += 1;
    },
  };

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: async () => {
      throw new Error("not needed");
    },
    playReplyAudio: async () => {},
    createRecognition: () => recognition,
    renderVoiceOptions,
  });

  await controller.init();
  controller.startListening();
  recognition.onend();
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(recognition.startCalls, 2);
});

test("createAgentTalkController does not auto-restart after a microphone error", async () => {
  const elements = createElements();
  const recognition = {
    startCalls: 0,
    stopCalls: 0,
    start() {
      this.startCalls += 1;
      this.onstart?.();
    },
    stop() {
      this.stopCalls += 1;
    },
  };

  const controller = createAgentTalkController({
    elements,
    loadVoices: async () => ({
      defaultVoice: "en-US-AndrewMultilingualNeural",
      voices: [{ shortName: "en-US-AndrewMultilingualNeural" }],
    }),
    sendChatRequest: async () => {
      throw new Error("not needed");
    },
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
