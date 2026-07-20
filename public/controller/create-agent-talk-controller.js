import { handleRecognitionResult as defaultHandleRecognitionResult } from "../recognition/index.js";
import {
  renderChatResponse as defaultRenderChatResponse,
  renderVoiceOptions as defaultRenderVoiceOptions,
  setStatus as defaultSetStatus,
  syncButtons as defaultSyncButtons,
} from "../ui/index.js";
import { shouldAutoRestart as defaultShouldAutoRestart } from "../duplex/index.js";

import { attachRecognitionHandlers } from "./attach-recognition-handlers.js";
import { attachUiHandlers } from "./attach-ui-handlers.js";
import { createRuntime } from "./create-runtime.js";
import { createSendTranscript } from "./create-send-transcript.js";
import { createStartListening } from "./create-start-listening.js";
import { createStopListening } from "./create-stop-listening.js";
import { initializeRecognition } from "./initialize-recognition.js";
import { initializeVoices } from "./initialize-voices.js";

const isDuplexEnabled = (runtime) => runtime.elements.duplexToggle.checked;

export const createAgentTalkController = ({
  elements,
  loadVoices,
  sendChatRequest,
  playReplyAudio,
  createRecognition,
  renderChatResponse = defaultRenderChatResponse,
  renderVoiceOptions = defaultRenderVoiceOptions,
  setStatus = defaultSetStatus,
  syncButtons = defaultSyncButtons,
  handleRecognitionResult = defaultHandleRecognitionResult,
  shouldAutoRestart = defaultShouldAutoRestart,
}) => {
  const runtime = createRuntime(elements);
  const sendTranscript = createSendTranscript({
    runtime,
    sendChatRequest,
    playReplyAudio,
    renderChatResponse,
    setStatus,
    isDuplexEnabled,
  });
  const startListening = createStartListening({
    runtime,
    syncButtons,
    setStatus,
    isDuplexEnabled,
  });
  const stopListening = createStopListening(runtime);

  return {
    runtime,
    sendTranscript,
    startListening,
    stopListening,
    async init() {
      attachUiHandlers({
        runtime,
        startListening,
        stopListening,
        setStatus,
        isDuplexEnabled,
      });

      try {
        await initializeVoices({
          runtime,
          loadVoices,
          renderVoiceOptions,
          setStatus,
        });
      } catch (error) {
        setStatus(runtime.elements, error instanceof Error ? error.message : String(error));
      }

      initializeRecognition({
        runtime,
        createRecognition,
        startListening,
        sendTranscript,
        setStatus,
        syncButtons,
        attachRecognitionHandlers,
        handleRecognitionResult,
        shouldAutoRestart,
        isDuplexEnabled,
      });
    },
  };
};
