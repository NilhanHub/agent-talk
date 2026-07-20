export const getSessionId = (storageKey = "agent-talk-session-id") => {
  const existing = globalThis.localStorage?.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const created = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
  globalThis.localStorage?.setItem(storageKey, created);
  return created;
};
