export const findLastUserTopic = (history) =>
  [...history].reverse().find((turn) => turn.role === "user" && turn.topic)?.topic ?? "";
