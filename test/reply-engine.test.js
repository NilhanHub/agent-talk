import assert from "node:assert/strict";
import test from "node:test";

import { createReply, summarizeTopic } from "../src/conversation/index.js";

test("createReply asks the user to try again when the transcript is blank", () => {
  assert.equal(
    createReply({ transcript: "   ", history: [] }),
    "I did not catch that. Please try again."
  );
});

test("createReply turns a greeting into a natural conversational response", () => {
  assert.equal(
    createReply({ transcript: "Hello there", history: [] }),
    "Hey. I'm here with you and ready to talk. What would you like to explore first?"
  );
});

test("createReply uses recent memory when the user refers back to an earlier topic", () => {
  assert.equal(
    createReply({
      transcript: "Can you keep that?",
      history: [
        {
          role: "user",
          content: "I want the Andrew voice for this app",
          topic: "Andrew voice",
        },
      ],
    }),
    "Yes. I can stick with Andrew voice and keep building from there."
  );
});

test("summarizeTopic extracts a compact conversational topic", () => {
  assert.equal(summarizeTopic("I want the Andrew voice for this app"), "Andrew voice");
});
