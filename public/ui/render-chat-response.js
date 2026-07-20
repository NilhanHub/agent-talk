export const renderChatResponse = (elements, data) => {
  elements.replyText.textContent = data.replyText;
  elements.modeText.textContent =
    data.mode === "local-stand-in" ? "Local stand-in brain" : "Reply engine";
};
