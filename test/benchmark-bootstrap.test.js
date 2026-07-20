import assert from "node:assert/strict";
import test from "node:test";

import { bootAgentTalk } from "../public/bootstrap-agent-talk.js";

const createController = () => ({
  runtime: {},
  initCalls: 0,
  async init() {
    this.initCalls += 1;
  },
});

test("bootAgentTalk does not attach a benchmark hook outside benchmark mode", async () => {
  const windowObject = {};
  const controller = createController();

  const result = await bootAgentTalk({
    location: new URL("http://localhost:3000/"),
    windowObject,
    getElements: () => ({}),
    loadVoices: async () => ({}),
    sendChatRequest: async () => ({}),
    playReplyAudio: async () => {},
    createRecognition: () => null,
    createController: () => controller,
    createBenchmarkHarness: () => {
      throw new Error("benchmark harness should not be created");
    },
  });

  assert.equal(controller.initCalls, 1);
  assert.equal(result.benchmark, null);
  assert.equal("__agentTalkBenchmark__" in windowObject, false);
});

test("bootAgentTalk exposes a benchmark hook when ?benchmark=1 is present", async () => {
  const windowObject = {};
  const controller = createController();
  const benchmarkHarness = { runRound: async () => ({ ok: true }) };

  const result = await bootAgentTalk({
    location: new URL("http://localhost:3000/?benchmark=1"),
    windowObject,
    getElements: () => ({}),
    loadVoices: async () => ({}),
    sendChatRequest: async () => ({}),
    playReplyAudio: async () => {},
    createRecognition: () => null,
    createController: () => controller,
    createBenchmarkHarness: () => benchmarkHarness,
  });

  assert.equal(controller.initCalls, 1);
  assert.equal(result.benchmark, benchmarkHarness);
  assert.equal(windowObject.__agentTalkBenchmark__, benchmarkHarness);
});
