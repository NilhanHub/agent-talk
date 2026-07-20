const createDeferred = () => {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
};

const wait = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

const roundNumber = (value) => Math.round(value * 1000) / 1000;

const createRoundClock = (now) => {
  const roundStartedAt = now();

  return {
    roundStartedAt,
    elapsed() {
      return roundNumber(now() - roundStartedAt);
    },
  };
};

export const createBenchmarkHarness = ({
  controller,
  location,
  windowObject,
  now = () => performance.now(),
} = {}) => {
  const runtime = controller.runtime;
  const player = runtime.elements.player;
  const state = {
    activeRoundId: null,
    activeTurnId: null,
    currentClock: null,
    events: [],
    sequence: 0,
    lastError: null,
  };

  const recordEvent = (event) => {
    const atMs =
      event.atMs ?? (state.currentClock ? state.currentClock.elapsed() : roundNumber(now()));

    const nextEvent = {
      sequence: state.sequence + 1,
      ...event,
      atMs,
    };

    state.sequence += 1;
    state.events.push(nextEvent);

    return nextEvent;
  };

  const getHealth = () => ({
    activeRoundId: state.activeRoundId,
    activeTurnId: state.activeTurnId,
    eventCount: state.events.length,
    listening: runtime.listening,
    pendingReply: runtime.pendingReply,
    activePlaybackTurnId: runtime.activePlaybackTurnId,
    activePlaybackAudioUrl: runtime.activePlaybackAudioUrl,
    location: location?.toString?.() ?? null,
    lastError: state.lastError,
  });

  const attachPlayerObservers = () => {
    if (!player || typeof player.addEventListener !== "function") {
      return;
    }

    player.addEventListener("play", () => {
      recordEvent({
        type: "assistant/playback-start",
        turnId: runtime.activePlaybackTurnId,
        audioUrl: runtime.activePlaybackAudioUrl,
        currentTimeMs: roundNumber(player.currentTime * 1000),
      });
    });

    player.addEventListener("pause", () => {
      recordEvent({
        type: "assistant/playback-pause",
        turnId: runtime.activePlaybackTurnId,
        audioUrl: runtime.activePlaybackAudioUrl,
        currentTimeMs: roundNumber(player.currentTime * 1000),
      });
    });

    player.addEventListener("ended", () => {
      recordEvent({
        type: "assistant/playback-end",
        turnId: runtime.activePlaybackTurnId,
        audioUrl: runtime.activePlaybackAudioUrl,
        currentTimeMs: roundNumber(player.currentTime * 1000),
      });
      runtime.activePlaybackTurnId = null;
      runtime.activePlaybackAudioUrl = null;
    });
  };

  const clearEvents = () => {
    state.events = [];
    state.sequence = 0;
    state.lastError = null;
  };

  const runTurn = async ({ turn, roundClock, pendingTurns }) => {
    const targetStartAt = roundClock.roundStartedAt + turn.startMs;
    const startDelayMs = Math.max(0, targetStartAt - now());

    if (startDelayMs > 0) {
      await wait(startDelayMs);
    }

    state.activeTurnId = turn.id;
    runtime.currentBenchmarkTurnId = turn.id;

    recordEvent({
      type: "synthetic/utterance-start",
      turnId: turn.id,
      transcript: turn.transcript,
      turnStartMs: turn.startMs,
    });

    if (player && !player.paused) {
      player.pause();
      player.currentTime = 0;
      recordEvent({
        type: "assistant/barge-in-stop",
        turnId: runtime.activePlaybackTurnId,
        interruptedByTurnId: turn.id,
      });
    }

    runtime.elements.heardText.textContent = turn.transcript;

    const utteranceDurationMs = Math.max(0, turn.endMs - turn.startMs);

    if (utteranceDurationMs > 0) {
      await wait(utteranceDurationMs);
    }

    recordEvent({
      type: "synthetic/utterance-end",
      turnId: turn.id,
      turnEndMs: turn.endMs,
    });
    recordEvent({
      type: "recognition/final",
      turnId: turn.id,
      transcript: turn.transcript,
    });

    runtime.currentBenchmarkMeta = {
      enabled: true,
      roundId: state.activeRoundId,
      turnId: turn.id,
      turnStartedAtMs: turn.startMs,
      turnEndedAtMs: turn.endMs,
    };

    const request = controller.sendTranscript(turn.transcript).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      state.lastError = message;
      recordEvent({
        type: "request/error",
        turnId: turn.id,
        message,
      });
      throw error;
    });

    pendingTurns.push(request);
  };

  attachPlayerObservers();

  runtime.now = now;
  runtime.observeEvent = recordEvent;

  return {
    clearEvents,
    getEvents() {
      return [...state.events];
    },
    getHealth,
    async runRound({ scenario }) {
      clearEvents();
      state.activeRoundId = scenario.roundId;
      state.activeTurnId = null;
      state.currentClock = createRoundClock(now);

      recordEvent({
        type: "round/start",
        roundId: scenario.roundId,
        roundNumber: scenario.roundNumber,
      });

      const pendingTurns = [];
      const roundBarrier = createDeferred();

      const turnsPromise = (async () => {
        for (const turn of scenario.turns) {
          await runTurn({
            turn,
            roundClock: state.currentClock,
            pendingTurns,
          });
        }

        roundBarrier.resolve();
      })();

      await roundBarrier.promise;

      const remainingDurationMs = Math.max(
        0,
        scenario.durationMs - state.currentClock.elapsed()
      );

      if (remainingDurationMs > 0) {
        await wait(remainingDurationMs);
      }

      await Promise.allSettled(pendingTurns);
      await turnsPromise;

      recordEvent({
        type: "round/complete",
        roundId: scenario.roundId,
      });

      state.activeTurnId = null;
      runtime.currentBenchmarkTurnId = null;
      runtime.currentBenchmarkMeta = null;

      return {
        scenario,
        events: [...state.events],
        health: getHealth(),
      };
    },
    exportSnapshot() {
      return {
        events: [...state.events],
        health: getHealth(),
        activeRoundId: state.activeRoundId,
        location: location?.toString?.() ?? null,
      };
    },
    windowObject,
  };
};
