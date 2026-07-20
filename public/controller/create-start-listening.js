export const createStartListening = ({
  runtime,
  syncButtons,
  setStatus,
  isDuplexEnabled,
}) => () => {
  if (!runtime.recognition || runtime.listening) {
    return;
  }

  const previousState = {
    heardText: runtime.elements.heardText.textContent,
    replyText: runtime.elements.replyText.textContent,
    listening: runtime.listening,
    manuallyStopped: runtime.manuallyStopped,
    recognitionErrorInCycle: runtime.recognitionErrorInCycle,
  };

  runtime.recognition.continuous = isDuplexEnabled(runtime);
  runtime.recognition.interimResults = isDuplexEnabled(runtime);
  runtime.elements.heardText.textContent = "Listening...";
  if (!runtime.pendingReply) {
    runtime.elements.replyText.textContent = "Waiting for your words.";
  }

  try {
    runtime.recognition.start();
  } catch (error) {
    runtime.elements.heardText.textContent = previousState.heardText;
    runtime.elements.replyText.textContent = previousState.replyText;
    runtime.listening = previousState.listening;
    runtime.manuallyStopped = previousState.manuallyStopped;
    runtime.recognitionErrorInCycle = previousState.recognitionErrorInCycle;
    syncButtons(runtime);
    setStatus(runtime.elements, error instanceof Error ? error.message : String(error));
    return;
  }

  runtime.manuallyStopped = false;
  runtime.recognitionErrorInCycle = false;
  runtime.listening = true;
  syncButtons(runtime);
  setStatus(runtime.elements, "Listening through your browser microphone...");
};
