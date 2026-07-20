const touchSession = (sessions, sessionId, turns) => {
  sessions.delete(sessionId);
  sessions.set(sessionId, turns);
  return turns;
};

const trimSessionBudget = (sessions, maxSessions) => {
  while (sessions.size > maxSessions) {
    const oldestSessionId = sessions.keys().next().value;
    sessions.delete(oldestSessionId);
  }
};

export const createSessionStore = ({ maxTurns = 8, maxSessions = 200 } = {}) => {
  const sessions = new Map();

  return {
    get(sessionId) {
      if (!sessions.has(sessionId)) {
        return [];
      }

      return touchSession(sessions, sessionId, sessions.get(sessionId));
    },
    append(sessionId, ...turns) {
      const nextTurns = [...this.get(sessionId), ...turns].slice(-maxTurns);
      touchSession(sessions, sessionId, nextTurns);
      trimSessionBudget(sessions, maxSessions);
      return sessions.get(sessionId);
    },
  };
};
