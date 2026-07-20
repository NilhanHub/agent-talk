export const createStopListening = (runtime) => () => {
  if (!runtime.recognition) {
    return;
  }

  runtime.manuallyStopped = true;
  runtime.recognition.stop();
};
