export const initializeRecognition = ({
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
}) => {
  runtime.recognition = createRecognition();
  if (!runtime.recognition) {
    setStatus(runtime.elements, "Speech recognition is not available here. Use Edge or Chrome on localhost.");
    syncButtons(runtime);
    return;
  }

  attachRecognitionHandlers({
    runtime,
    startListening,
    sendTranscript,
    handleRecognitionResult,
    setStatus,
    syncButtons,
    shouldAutoRestart,
    isDuplexEnabled,
  });
  syncButtons(runtime);
};
