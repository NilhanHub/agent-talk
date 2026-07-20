export const buildQuestionReply = (normalized, lastTopic) => {
  if (normalized.includes("voice") && normalized.includes("andrew")) {
    return "Absolutely. Andrew is still the default voice, and I can keep answering in that tone.";
  }

  if (normalized.includes("duplex")) {
    return "Yes. I'm in a best-effort full-duplex mode, so if you talk over me I can stop playback and switch back to listening.";
  }

  if (normalized.includes("mic") || normalized.includes("microphone") || normalized.includes("listen")) {
    return "The browser is handling the microphone side, and I'm generating the reply locally on the server for now.";
  }

  if (normalized.includes("project") || normalized.includes("repo") || normalized.includes("app") || normalized.includes("site")) {
    return "From here, the local voice app is already live and we can keep refining it turn by turn.";
  }

  if (lastTopic) {
    return `I can keep working with you on ${lastTopic}. Tell me the next change you want and I'll stay focused on it.`;
  }

  return "I can help with that right here, and we can keep the loop tight and practical.";
};
