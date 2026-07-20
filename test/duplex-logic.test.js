import assert from "node:assert/strict";
import test from "node:test";

import { shouldAutoRestart, shouldBargeIn } from "../src/duplex/index.js";

test("shouldBargeIn returns true when duplex mode hears a real interruption", () => {
  assert.equal(
    shouldBargeIn({
      duplexEnabled: true,
      audioPlaying: true,
      interimTranscript: "hold on a second",
    }),
    true
  );
});

test("shouldBargeIn returns false for tiny or empty transcripts", () => {
  assert.equal(
    shouldBargeIn({
      duplexEnabled: true,
      audioPlaying: true,
      interimTranscript: "ok",
    }),
    false
  );
});

test("shouldAutoRestart keeps listening alive in duplex mode unless stopped manually", () => {
  assert.equal(
    shouldAutoRestart({
      duplexEnabled: true,
      manuallyStopped: false,
    }),
    true
  );
  assert.equal(
    shouldAutoRestart({
      duplexEnabled: true,
      manuallyStopped: true,
    }),
    false
  );
});
