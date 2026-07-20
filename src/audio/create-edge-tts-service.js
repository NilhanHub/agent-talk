import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { DEFAULT_VOICE } from "./default-voice.js";
import { defaultRunCommand } from "./default-run-command.js";
import { parseVoiceListOutput } from "./parse-voice-list-output.js";

export const createEdgeTtsService = ({
  bin = "edge-tts",
  runCommand = defaultRunCommand,
  audioDir = join(process.cwd(), "audio-cache"),
} = {}) => ({
  audioDir,
  defaultVoice: DEFAULT_VOICE,
  async listVoices() {
    const { stdout } = await runCommand(bin, ["--list-voices"]);
    return parseVoiceListOutput(stdout);
  },
  async synthesizeSpeech({ text, voice = DEFAULT_VOICE, outFile } = {}) {
    const targetFile = outFile ?? join(audioDir, `reply-${randomUUID()}.mp3`);

    await mkdir(audioDir, { recursive: true });
    await runCommand(bin, [
      "--voice",
      voice,
      "--text",
      text,
      "--write-media",
      targetFile,
    ]);

    return targetFile;
  },
});
