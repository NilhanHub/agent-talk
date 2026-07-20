# Problem Hunt Report — 2026-03-31

## Scope

This investigation audited Agent Talk for real or plausible defects without changing product behavior. The focus was user-visible correctness first, then latent correctness issues, then architecture risks that could realistically become bugs.

Evidence sources used in this pass:

- baseline verification commands
- live localhost smoke on `http://localhost:3217`
- targeted static tracing through `public/controller`, `public/recognition`, `public/audio`, `public/duplex`, `src/chat-turn`, `src/routes`, `src/http`, and `src/audio`
- investigation probes in `scripts/investigation/problem-hunt.probe.mjs`
- added route coverage in `test/audio-route.test.js`

## Baseline Passed

- Branch was `codex/agent-talk-standalone`.
- `npm test` passed before the deeper probes.
- `npm run san:verify` passed before the deeper probes.
- The local server started cleanly on `http://localhost:3217`.
- `GET /` returned `200`.
- `POST /api/chat` returned a real conversational payload in `mode: "local-stand-in"` using the Andrew default voice.
- `GET /api/voices` returned a large voice catalog from `edge-tts`, which also exposed a parsing defect described below.
- Existing autoplay-blocked fallback coverage in `test/controller.test.js` remained green.
- Added route coverage confirmed that an existing `/audio/*.mp3` file is served successfully and encoded traversal-style paths return `404`.

## Baseline Failed

- No baseline gate failed before investigation-specific probes were added.

## Baseline Unknown

- Full live microphone verification remained environment-limited. A shared Playwright browser profile was locked, so real mic permission, live duplex barge-in, and autoplay behavior in a controllable browser session could not be fully reproduced end to end.
- The duplicate-final-result speech scenario was proven at the handler level, but not reproduced in a live browser session with a real speech engine.

## Hypothesis Ledger

| Hypothesis | Status | Evidence |
| --- | --- | --- |
| A stale response can overwrite a newer reply if an older request ignores abort. | Confirmed | `scripts/investigation/problem-hunt.probe.mjs` |
| `recognition.start()` can fail and leave the controller stuck in a false listening state. | Confirmed | `scripts/investigation/problem-hunt.probe.mjs` |
| A microphone `onerror` followed by `onend` can auto-restart and hide the error state. | Confirmed | `scripts/investigation/problem-hunt.probe.mjs` |
| Repeated final recognition results can trigger duplicate transcript sends. | Plausible but unconfirmed in live browser | `scripts/investigation/problem-hunt.probe.mjs` |
| Session memory can grow across many distinct session ids. | Plausible risk | `scripts/investigation/problem-hunt.probe.mjs` |
| `/audio/*.mp3` is missing direct coverage for valid serving and path rejection. | Partly cleared | `test/audio-route.test.js` |
| Missing audio files may not degrade cleanly. | Confirmed | live localhost request and `scripts/investigation/problem-hunt.probe.mjs` |
| Voice list parsing may be including non-voice rows. | Confirmed | live `GET /api/voices` and `scripts/investigation/problem-hunt.probe.mjs` |

## Confirmed Bugs

### 1. Older chat replies can overwrite newer replies

- Impact: high user-facing correctness risk in the primary chat flow. A slower first request can repaint the UI after a newer request already completed.
- Owning node: `public.controller`
- Evidence:
  - `public/controller/create-send-transcript.js`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Why it happens: the controller aborts the previous request, but it never verifies that the resolving response still belongs to the current request before calling `renderChatResponse()` and updating status.
- Reproduction:
  - Start request A.
  - Start request B before A resolves.
  - Let B resolve first, then let A resolve anyway.
  - The UI ends up showing B in `heardText` and A in `replyText`.

### 2. `recognition.start()` failure leaves the UI stuck in listening mode

- Impact: high for browser/mic failures. The UI can claim it is listening even when microphone startup already failed.
- Owning node: `public.controller`
- Evidence:
  - `public/controller/create-start-listening.js`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Why it happens: the controller sets `runtime.listening = true`, updates buttons, and sets the listening status before calling `runtime.recognition.start()`. If `start()` throws, there is no rollback.
- Reproduction:
  - Use a recognition object whose `start()` throws.
  - Call `startListening()`.
  - The promise rejects, but the controller still thinks it is listening.

### 3. Microphone errors can be hidden by an immediate duplex auto-restart

- Impact: medium-high. Permission or device errors can be briefly reported and then overwritten by the normal listening state, which makes diagnosis harder and can mislead the user.
- Owning node: `public.controller`
- Evidence:
  - `public/controller/attach-recognition-handlers.js`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Why it happens: `onerror` sets the error message, but `onend` still auto-restarts whenever duplex is enabled and `manuallyStopped` is false.
- Reproduction:
  - Start duplex listening.
  - Fire `recognition.onerror({ error: "not-allowed" })`.
  - Fire `recognition.onend()`.
  - The controller restarts listening and overwrites the error state.

### 4. Missing audio files return `500 Internal Server Error` instead of a clean `404`

- Impact: medium. A stale or missing audio URL degrades as an internal server error instead of a normal missing-file response.
- Owning node: `src.routes` and `src.http`
- Evidence:
  - `src/routes/handle-audio-route.js`
  - `src/http/file-response.js`
  - live request to `GET /audio/missing.mp3`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Why it happens: the audio handler resolves a path and immediately passes it into `fileResponse()`. If the file does not exist, `readFile()` throws and the Node server converts that into a generic `500`.
- Reproduction:
  - Request a missing file such as `/audio/missing.mp3`.
  - The response body is `{"error":"Internal server error.","detail":"ENOENT: ..."}`.

### 5. `/api/voices` includes `edge-tts` header rows as fake voices

- Impact: medium. The voice picker receives bogus options and the API shape is polluted.
- Owning node: `src.audio`
- Evidence:
  - `src/audio/parse-voice-list-output.js`
  - live `GET /api/voices`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Why it happens: the parser splits every non-empty line into voice fields and does not filter the CLI table header or separator row.
- Reproduction:
  - Call `GET /api/voices`.
  - The first two entries are `Name / Gender / ContentCategories / VoicePersonalities` and the dashed separator line, not real voices.

## Plausible But Unconfirmed Defects

### 1. Duplicate final speech results can trigger duplicate sends

- Owning node: `public.recognition`
- Evidence:
  - `public/recognition/handle-recognition-result.js`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Current status: the handler definitely sends once per final result item. The missing piece is live browser proof that the speech engine used here emits duplicate final results for one utterance in normal operation.

### 2. Session store can grow without cross-session eviction

- Owning node: `src.sessions`
- Evidence:
  - `src/sessions/create-session-store.js`
  - `scripts/investigation/problem-hunt.probe.mjs`
- Current status: the store trims turns per session, but it never evicts old session ids. This is a real resource-growth risk, but this pass did not prove user-visible degradation in a normal workload.

## Cleared Hypotheses

### 1. Encoded traversal-style `/audio` requests do not escape the audio root

- Evidence:
  - `test/audio-route.test.js`
  - direct app probe against `/audio/%2e%2e/%2e%2e/package.json`
- Result: contained. The request returns `404 Not found`.

### 2. Basic chat turn generation is working

- Evidence:
  - live `POST /api/chat`
- Result: cleared for this pass. The app returned a conversational reply, Andrew voice metadata, and a generated audio URL.

### 3. Existing autoplay-blocked fallback behavior is already covered and passed

- Evidence:
  - `test/controller.test.js`
- Result: no new defect confirmed in that path during this investigation.

## Architecture Warnings That Are Not Bugs Yet

- `public.controller` remains the main gravity well. It is the highest-probability area for future regressions because sequencing, playback, duplex state, and recognition state all converge there.
- `src.sessions` is safe for short conversations, but it lacks a global retention policy.
- `src.audio` has a correctness gap in parsing and a separate resilience gap in missing-file handling.
- SAN drift remains useful as a change-risk signal, but this investigation separated those warnings from actual user-facing defects.

## Evidence Files

- Probe harness: `scripts/investigation/problem-hunt.probe.mjs`
- Route coverage: `test/audio-route.test.js`
- Local server stdout: `artifacts/investigation/problem-hunt-server.out.log`
- Local server stderr: `artifacts/investigation/problem-hunt-server.err.log`

## Next Fix Slice

The safest next repair slice is:

1. Harden `public.controller` request sequencing and recognition lifecycle together.
2. Normalize `src.audio` degradation paths so `/api/voices` only returns real voices and missing audio files return `404`.
3. Decide whether duplicate-final-result suppression and session eviction belong in the same fix wave or a second hardening pass.
