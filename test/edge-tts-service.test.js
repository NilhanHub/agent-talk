import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VOICE,
  createEdgeTtsService,
  parseVoiceListOutput,
} from "../src/audio/index.js";

test("DEFAULT_VOICE uses the Andrew multilingual voice", () => {
  assert.equal(DEFAULT_VOICE, "en-US-AndrewMultilingualNeural");
});

test("parseVoiceListOutput parses the fixed-width edge-tts list format and skips headers", () => {
  const voices = parseVoiceListOutput(`
Name                                Gender    ContentCategories      VoicePersonalities
---------------------------------   --------  ---------------------  --------------------------------------
en-US-AndrewMultilingualNeural     Male      Conversation, Copilot  Warm, Confident, Authentic, Honest
en-US-AriaNeural                   Female    News, Novel            Positive, Confident
`.trim());

  assert.deepEqual(voices, [
    {
      shortName: "en-US-AndrewMultilingualNeural",
      gender: "Male",
      contentCategories: "Conversation, Copilot",
      voicePersonalities: "Warm, Confident, Authentic, Honest",
    },
    {
      shortName: "en-US-AriaNeural",
      gender: "Female",
      contentCategories: "News, Novel",
      voicePersonalities: "Positive, Confident",
    },
  ]);
});

test("synthesizeSpeech delegates to edge-tts with the expected arguments", async () => {
  const calls = [];
  const service = createEdgeTtsService({
    runCommand: async (command, args) => {
      calls.push({ command, args });
      return { stdout: "", stderr: "" };
    },
  });

  await service.synthesizeSpeech({
    text: "Hello from Andrew",
    outFile: "audio-cache/reply.mp3",
    voice: "en-US-AndrewNeural",
  });

  assert.deepEqual(calls, [
    {
      command: "edge-tts",
      args: [
        "--voice",
        "en-US-AndrewNeural",
        "--text",
        "Hello from Andrew",
        "--write-media",
        "audio-cache/reply.mp3",
      ],
    },
  ]);
});
