import { buildQuestionReply } from "./build-question-reply.js";
import { findLastUserTopic } from "./find-last-user-topic.js";
import { isQuestion } from "./is-question.js";
import { normalizeText } from "./normalize-text.js";
import { summarizeTopic } from "./summarize-topic.js";

export const createReply = ({ transcript, history = [], now = new Date() }) => {
  const cleaned = transcript.trim();

  if (!cleaned) {
    return "I did not catch that. Please try again.";
  }

  const normalized = normalizeText(cleaned);
  const lastTopic = findLastUserTopic(history);

  if (/(keep that|keep it|same voice|remember that|stick with that)/.test(normalized) && lastTopic) {
    return `Yes. I can stick with ${lastTopic} and keep building from there.`;
  }

  if (/^(hello|hey|hi)\b/.test(normalized)) {
    return "Hey. I'm here with you and ready to talk. What would you like to explore first?";
  }

  if (normalized.includes("how are you")) {
    return "I'm doing well and fully focused on you. What do you want to talk through?";
  }

  if (normalized.includes("who are you") || normalized.includes("what are you")) {
    return "I'm Agent Talk's local stand-in brain for now. I can keep the conversation moving and speak back with Andrew.";
  }

  if (normalized.includes("thank")) {
    return "You're welcome. Keep talking and I'll stay with you.";
  }

  if (normalized.includes("time")) {
    const localTime = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return `Right now it's ${localTime}.`;
  }

  if (isQuestion(cleaned)) {
    return buildQuestionReply(normalized, lastTopic);
  }

  const topic = summarizeTopic(cleaned) || lastTopic || "this";
  return `I hear you. We can keep moving on ${topic} and make the next turn more precise.`;
};
