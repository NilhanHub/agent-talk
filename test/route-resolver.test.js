import assert from "node:assert/strict";
import test from "node:test";

import { resolveRoute } from "../src/routes/resolve-route.js";

test("resolveRoute maps the workflow endpoints to route keys", () => {
  assert.equal(resolveRoute({ method: "GET", pathname: "/" }), "home");
  assert.equal(resolveRoute({ method: "GET", pathname: "/api/voices" }), "voices");
  assert.equal(resolveRoute({ method: "POST", pathname: "/api/chat" }), "chat");
  assert.equal(resolveRoute({ method: "GET", pathname: "/audio/reply.mp3" }), "audio");
  assert.equal(resolveRoute({ method: "GET", pathname: "/audio/play-reply-audio.js" }), "static");
  assert.equal(resolveRoute({ method: "GET", pathname: "/app.js" }), "static");
  assert.equal(resolveRoute({ method: "DELETE", pathname: "/api/chat" }), "not-found");
});
