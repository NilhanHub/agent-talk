export const initializeVoices = async ({
  runtime,
  loadVoices,
  renderVoiceOptions,
  setStatus,
}) => {
  const data = await loadVoices();
  renderVoiceOptions(runtime.elements, data);
  runtime.elements.modeText.textContent = "Local stand-in brain";
  setStatus(runtime.elements, `Ready. Default voice: ${runtime.elements.voiceSelect.value}`);
};
