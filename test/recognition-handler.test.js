import assert from "node:assert/strict";
import test from "node:test";

import { handleRecognitionResult } from "../public/recognition/index.js";

const createElements = () => ({
  duplexToggle: { checked: true },
  heardText: { textContent: "" },
  statusText: { textContent: "" },
  player: {
    paused: false,
    currentTime: 0,
    pause() {
      this.paused = true;
    },
  },
});

test("handleRecognitionResult merges multiple final segments into one transcript send", async () => {
  const calls = [];
  const elements = createElements();
  const runtime = { elements };

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
      { isFinal: true, 0: { transcript: "General Kenobi" } },
    ],
  });

  assert.deepEqual(calls, ["Hello there General Kenobi"]);
});
