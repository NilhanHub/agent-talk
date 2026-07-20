import assert from "node:assert/strict";
import test from "node:test";

import { runChatTurn } from "../src/chat-turn/index.js";

const createMemorySessionStore = () => {
  const sessions = new Map();

  return {
    get(sessionId) {
      return sessions.get(sessionId) ?? [];
    },
    append(sessionId, ...turns) {
      const nextTurns = [...this.get(sessionId), ...turns];
      sessions.set(sessionId, nextTurns);
      return nextTurns;
    },
  };
};

test("runChatTurn rejects a blank transcript", async () => {
  await assert.rejects(
    () =>
      runChatTurn({
        transcript: "   ",
        edgeTtsService: {
          synthesizeSpeech: async () => "audio-cache/reply.mp3",
        },
        sessionStore: createMemorySessionStore(),
      }),
    /Transcript is required\./
  );
});

test("runChatTurn uses the default voice, persists session turns, and packages the response", async () => {
  const calls = [];
  const sessionStore = createMemorySessionStore();

  const result = await runChatTurn({
    transcript: "Hello there",
    sessionId: "session-1",
    edgeTtsService: {
      synthesizeSpeech: async (payload) => {
        calls.push(payload);
        return "audio-cache/reply-123.mp3";
      },
    },
    sessionStore,
  });

  assert.deepEqual(result, {
    transcript: "Hello there",
    replyText: "Hey. I'm here with you and ready to talk. What would you like to explore first?",
    voice: "en-US-AndrewMultilingualNeural",
    audioUrl: "/audio/reply-123.mp3",
    sessionId: "session-1",
    mode: "local-stand-in",
  });
  assert.deepEqual(calls, [
    {
      text: "Hey. I'm here with you and ready to talk. What would you like to explore first?",
      voice: "en-US-AndrewMultilingualNeural",
    },
  ]);
  assert.deepEqual(sessionStore.get("session-1"), [
    {
      role: "user",
      content: "Hello there",
      topic: "hello there",
    },
    {
      role: "assistant",
      content: "Hey. I'm here with you and ready to talk. What would you like to explore first?",
    },
  ]);
});

test("runChatTurn uses session history for follow-up replies", async () => {
  const sessionStore = createMemorySessionStore();
  const edgeTtsService = {
    synthesizeSpeech: async () => "audio-cache/reply-123.mp3",
  };

  await runChatTurn({
    transcript: "I want the Andrew voice for this app",
    sessionId: "session-2",
    edgeTtsService,
    sessionStore,
  });
  const result = await runChatTurn({
    transcript: "Can you keep that?",
    sessionId: "session-2",
    edgeTtsService,
    sessionStore,
  });

  assert.equal(
    result.replyText,
    "Yes. I can stick with Andrew voice and keep building from there."
  );
});
