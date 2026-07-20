import { loadVoices, sendChatRequest } from "./api/index.js";
import { playReplyAudio } from "./audio/index.js";
import { createBenchmarkHarness as defaultCreateBenchmarkHarness } from "./benchmark/index.js";
import { createAgentTalkController as defaultCreateController } from "./controller/index.js";
import { getElements as defaultGetElements } from "./dom/index.js";
import { createRecognition } from "./recognition/index.js";

const isBenchmarkEnabled = (location) => {
  if (!location) {
    return false;
  }

  const url =
    location instanceof URL ? location : new URL(location.toString(), globalThis.location?.origin);

  return url.searchParams.get("benchmark") === "1";
};

export const bootAgentTalk = async ({
  location = globalThis.location,
  windowObject = globalThis.window,
  getElements = defaultGetElements,
  loadVoices: loadVoicesImpl = loadVoices,
  sendChatRequest: sendChatRequestImpl = sendChatRequest,
  playReplyAudio: playReplyAudioImpl = playReplyAudio,
  createRecognition: createRecognitionImpl = createRecognition,
  createController = defaultCreateController,
  createBenchmarkHarness = defaultCreateBenchmarkHarness,
} = {}) => {
  const controller = createController({
    elements: getElements(),
    loadVoices: loadVoicesImpl,
    sendChatRequest: sendChatRequestImpl,
    playReplyAudio: playReplyAudioImpl,
    createRecognition: createRecognitionImpl,
  });

  await controller.init();

  let benchmark = null;

  if (isBenchmarkEnabled(location)) {
    benchmark = createBenchmarkHarness({
      controller,
      location,
      windowObject,
    });

    if (windowObject) {
      windowObject.__agentTalkBenchmark__ = benchmark;
    }
  }

  return {
    controller,
    benchmark,
  };
};
