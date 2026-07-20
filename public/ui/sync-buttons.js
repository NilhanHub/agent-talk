export const syncButtons = (runtime) => {
  runtime.elements.listenButton.disabled = !runtime.recognition || runtime.listening;
  runtime.elements.stopButton.disabled = !runtime.recognition || !runtime.listening;
};
