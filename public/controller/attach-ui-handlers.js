export const attachUiHandlers = ({
  runtime,
  startListening,
  stopListening,
  setStatus,
  isDuplexEnabled,
}) => {
  runtime.elements.listenButton.addEventListener("click", startListening);
  runtime.elements.stopButton.addEventListener("click", stopListening);
  runtime.elements.duplexToggle.addEventListener("change", () => {
    setStatus(
      runtime.elements,
      isDuplexEnabled(runtime)
        ? "Full-duplex is on. I will keep listening and allow barge-in."
        : "Full-duplex is off. You can still talk turn by turn."
    );
    if (isDuplexEnabled(runtime) && runtime.recognition && !runtime.listening) {
      startListening();
    }
  });
};
