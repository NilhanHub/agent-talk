export const sendChatRequest = async ({
  transcript,
  voice,
  sessionId,
  signal,
  benchmark,
}) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      transcript,
      voice,
      sessionId,
      ...(benchmark ? { benchmark } : {}),
    }),
    signal,
  });

  return {
    response,
    data: await response.json(),
  };
};
