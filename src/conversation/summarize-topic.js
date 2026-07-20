import { normalizeText } from "./normalize-text.js";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "app",
  "can",
  "for",
  "i",
  "it",
  "keep",
  "please",
  "same",
  "that",
  "the",
  "this",
  "to",
  "want",
  "with",
  "you",
]);

export const summarizeTopic = (transcript) => {
  const normalized = normalizeText(transcript);

  if (!normalized) {
    return "";
  }

  if (normalized.includes("andrew") && normalized.includes("voice")) {
    return "Andrew voice";
  }

  if (normalized.includes("duplex")) {
    return "full-duplex mode";
  }

  if (normalized.includes("microphone") || normalized.includes("mic")) {
    return "microphone input";
  }

  if (normalized.includes("voice")) {
    return "voice settings";
  }

  if (normalized.includes("site") || normalized.includes("repo") || normalized.includes("project")) {
    return "this app";
  }

  return normalized
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word))
    .slice(0, 4)
    .join(" ");
};
