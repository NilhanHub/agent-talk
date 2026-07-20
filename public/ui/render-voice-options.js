export const renderVoiceOptions = (elements, data) => {
  elements.voiceSelect.innerHTML = "";

  for (const voice of data.voices) {
    const option = document.createElement("option");
    option.value = voice.shortName;
    option.textContent = `${voice.shortName} - ${voice.voicePersonalities ?? "Voice"}`;
    option.selected = voice.shortName === data.defaultVoice;
    elements.voiceSelect.append(option);
  }

  if (!elements.voiceSelect.value) {
    elements.voiceSelect.value = data.defaultVoice;
  }
};
