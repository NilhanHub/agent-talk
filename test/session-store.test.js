import assert from "node:assert/strict";
import test from "node:test";

import { createSessionStore } from "../src/sessions/create-session-store.js";

test("createSessionStore creates, appends, and trims turns per session", () => {
  const store = createSessionStore({ maxTurns: 4 });

  assert.deepEqual(store.get("alpha"), []);

  store.append("alpha", { role: "user", content: "one" });
  store.append("alpha", { role: "assistant", content: "two" });
  store.append("alpha", { role: "user", content: "three" });
  store.append("alpha", { role: "assistant", content: "four" });
  store.append("alpha", { role: "user", content: "five" });

  assert.deepEqual(store.get("alpha"), [
    { role: "assistant", content: "two" },
    { role: "user", content: "three" },
    { role: "assistant", content: "four" },
    { role: "user", content: "five" },
  ]);
  assert.deepEqual(store.get("beta"), []);
});

test("createSessionStore evicts the least recently used session when maxSessions is exceeded", () => {
  const store = createSessionStore({ maxTurns: 4, maxSessions: 2 });

  store.append("alpha", { role: "user", content: "one" });
  store.append("beta", { role: "user", content: "two" });
  store.get("alpha");
  store.append("gamma", { role: "user", content: "three" });

  assert.deepEqual(store.get("alpha"), [{ role: "user", content: "one" }]);
  assert.deepEqual(store.get("beta"), []);
  assert.deepEqual(store.get("gamma"), [{ role: "user", content: "three" }]);
});

test("createSessionStore refreshes recency on append", () => {
  const store = createSessionStore({ maxTurns: 4, maxSessions: 2 });

  store.append("alpha", { role: "user", content: "one" });
  store.append("beta", { role: "user", content: "two" });
  store.append("alpha", { role: "assistant", content: "three" });
  store.append("gamma", { role: "user", content: "four" });

  assert.deepEqual(store.get("alpha"), [
    { role: "user", content: "one" },
    { role: "assistant", content: "three" },
  ]);
  assert.deepEqual(store.get("beta"), []);
  assert.deepEqual(store.get("gamma"), [{ role: "user", content: "four" }]);
});
