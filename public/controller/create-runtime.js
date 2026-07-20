import { getSessionId } from "../session/index.js";

export const createRuntime = (elements) => ({
  elements,
  sessionId: getSessionId(),
  recognition: null,
  listening: false,
  manuallyStopped: true,
  recognitionErrorInCycle: false,
  pendingReply: false,
  currentRequestController: null,
  requestSequence: 0,
  activeRequestId: 0,
  activePlaybackTurnId: null,
  activePlaybackAudioUrl: null,
  currentBenchmarkTurnId: null,
  currentBenchmarkMeta: null,
  observeEvent: null,
  now: () => performance.now(),
});
