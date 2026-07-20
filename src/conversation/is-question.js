export const isQuestion = (value) =>
  value.endsWith("?") ||
  /^(can|could|do|does|how|what|when|where|who|why|will|would)\b/i.test(value);
