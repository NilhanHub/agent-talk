export const createSendTranscript = ({
  runtime,
  sendChatRequest,
  playReplyAudio,
  renderChatResponse,
  setStatus,
  isDuplexEnabled,
}) => async (transcript) => {
  if (runtime.currentRequestController) {
    runtime.currentRequestController.abort();
  }

  const requestId = runtime.requestSequence + 1;
  const controller = new AbortController();
  const benchmarkTurnId = runtime.currentBenchmarkTurnId;
  const benchmarkMeta = runtime.currentBenchmarkMeta;

  runtime.requestSequence = requestId;
  runtime.activeRequestId = requestId;
  runtime.currentRequestController = controller;
  runtime.pendingReply = true;
  runtime.elements.heardText.textContent = transcript;
  setStatus(runtime.elements, "Generating spoken reply...");
  runtime.observeEvent?.({
    type: "request/dispatch",
    turnId: benchmarkTurnId,
    requestId,
    transcript,
    benchmarkMeta,
  });

  const isActiveRequest = () =>
    runtime.activeRequestId === requestId &&
    runtime.currentRequestController === controller &&
    !controller.signal.aborted;

  try {
    const { response, data } = await sendChatRequest({
      transcript,
      voice: runtime.elements.voiceSelect.value,
      sessionId: runtime.sessionId,
      signal: controller.signal,
      benchmark: benchmarkMeta,
    });
    runtime.observeEvent?.({
      type: "request/response",
      turnId: benchmarkTurnId,
      requestId,
      ok: response.ok,
      benchmarkTimings: data?.benchmarkTimings ?? null,
    });

    if (!isActiveRequest()) {
      return;
    }

    if (!response.ok) {
      throw new Error(data.error ?? "The server could not generate a reply.");
    }

    renderChatResponse(runtime.elements, data);
    runtime.observeEvent?.({
      type: "assistant/reply-ready",
      turnId: benchmarkTurnId,
      requestId,
      replyText: data.replyText,
      voice: data.voice,
      audioUrl: data.audioUrl,
      benchmarkTimings: data?.benchmarkTimings ?? null,
    });

    if (!isActiveRequest()) {
      return;
    }

    try {
      runtime.activePlaybackTurnId = benchmarkTurnId;
      runtime.activePlaybackAudioUrl = data.audioUrl;
      await playReplyAudio(runtime.elements.player, data.audioUrl);
    } catch {
      if (!isActiveRequest()) {
        return;
      }
      setStatus(runtime.elements, "Reply ready. Press play if your browser blocked autoplay.");
      return;
    }

    if (!isActiveRequest()) {
      return;
    }

    setStatus(
      runtime.elements,
      `Reply ready in ${data.voice}. ${isDuplexEnabled(runtime) ? "Still listening." : ""}`.trim()
    );
  } finally {
    if (runtime.activeRequestId === requestId) {
      runtime.pendingReply = false;
      runtime.currentRequestController = null;
      runtime.activeRequestId = 0;
      runtime.currentBenchmarkMeta = null;
      runtime.currentBenchmarkTurnId = null;
    }
  }
};
