export const attachRecognitionHandlers = ({
  runtime,
  startListening,
  sendTranscript,
  handleRecognitionResult,
  setStatus,
  syncButtons,
  shouldAutoRestart,
  isDuplexEnabled,
}) => {
  runtime.recognition.onstart = () => {
    runtime.recognitionErrorInCycle = false;
    runtime.listening = true;
    syncButtons(runtime);
  };

  runtime.recognition.onresult = handleRecognitionResult({
    runtime,
    sendTranscript,
    setStatus,
  });

  runtime.recognition.onerror = (event) => {
    runtime.recognitionErrorInCycle = true;
    runtime.listening = false;
    syncButtons(runtime);
    setStatus(runtime.elements, `Microphone error: ${event.error}`);
  };

  runtime.recognition.onend = () => {
    runtime.listening = false;
    syncButtons(runtime);
    if (
      !runtime.recognitionErrorInCycle &&
      shouldAutoRestart({
        duplexEnabled: isDuplexEnabled(runtime),
        manuallyStopped: runtime.manuallyStopped,
      })
    ) {
      queueMicrotask(() => {
        if (!runtime.listening) {
          startListening();
        }
      });
    }
  };
};
