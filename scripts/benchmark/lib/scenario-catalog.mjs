const BASE_USER_VOICE = {
  shortName: "en-US-AvaMultilingualNeural",
  gender: "Female",
};

export const BENCHMARK_GROUPS = [
  {
    id: "baseline",
    label: "Baseline polite turn-taking",
    roundNumbers: [1, 2, 3, 4],
  },
  {
    id: "barge-in",
    label: "Interruptions and barge-in",
    roundNumbers: [5, 6, 7, 8],
  },
  {
    id: "chunked",
    label: "Chunked and repeated final pressure",
    roundNumbers: [9, 10, 11, 12],
  },
  {
    id: "recovery",
    label: "Recovery and fast back-and-forth",
    roundNumbers: [13, 14, 15, 16],
  },
  {
    id: "mixed-stress",
    label: "Mixed stress matrix",
    roundNumbers: [17, 18, 19, 20],
  },
];

const createTurn = (id, startMs, durationMs, transcript) => ({
  id,
  startMs,
  endMs: startMs + durationMs,
  transcript,
});

const SCENARIO_DATA = [
  {
    roundNumber: 1,
    groupId: "baseline",
    title: "Warm introduction and short follow-ups",
    durationMs: 78_000,
    turns: [
      createTurn("turn-1", 4_000, 4_200, "Hello Andrew, this is benchmark round one. Give me a calm welcome."),
      createTurn("turn-2", 18_500, 3_800, "Now tell me how you are tracking conversation context."),
      createTurn("turn-3", 33_000, 4_000, "Keep your answer brief and friendly."),
      createTurn("turn-4", 52_000, 4_500, "End with one helpful follow-up question."),
    ],
  },
  {
    roundNumber: 2,
    groupId: "baseline",
    title: "Long pause stability",
    durationMs: 79_000,
    turns: [
      createTurn("turn-1", 5_000, 4_400, "I am checking whether long pauses confuse you."),
      createTurn("turn-2", 26_000, 4_000, "Please remember that I asked about pauses."),
      createTurn("turn-3", 47_000, 3_600, "Now answer as if we are still on the same topic."),
      createTurn("turn-4", 63_000, 4_200, "Finish with a reassurance that you stayed on track."),
    ],
  },
  {
    roundNumber: 3,
    groupId: "baseline",
    title: "Session continuity under simple follow-up",
    durationMs: 80_000,
    turns: [
      createTurn("turn-1", 3_500, 4_100, "I want the Andrew voice to stay active."),
      createTurn("turn-2", 17_000, 2_800, "Can you keep that?"),
      createTurn("turn-3", 34_000, 4_000, "Tell me why this preference matters in this app."),
      createTurn("turn-4", 56_500, 4_300, "Wrap up with one sentence only."),
    ],
  },
  {
    roundNumber: 4,
    groupId: "baseline",
    title: "Short conversational rhythm",
    durationMs: 77_000,
    turns: [
      createTurn("turn-1", 4_000, 2_900, "Hi there."),
      createTurn("turn-2", 13_500, 3_100, "What mode are you in?"),
      createTurn("turn-3", 25_000, 3_500, "What happens after you create audio?"),
      createTurn("turn-4", 40_500, 3_900, "Keep the answer practical."),
      createTurn("turn-5", 58_000, 4_000, "End neatly."),
    ],
  },
  {
    roundNumber: 5,
    groupId: "barge-in",
    title: "Early interruption against first reply",
    durationMs: 81_000,
    turns: [
      createTurn("turn-1", 4_000, 4_200, "Start a thoughtful answer about voice latency."),
      createTurn("turn-2", 9_700, 2_900, "Stop, I want a shorter version."),
      createTurn("turn-3", 23_000, 3_800, "Now answer in one sentence."),
      createTurn("turn-4", 44_000, 4_100, "Tell me whether you handled that interruption well."),
    ],
  },
  {
    roundNumber: 6,
    groupId: "barge-in",
    title: "Two quick corrections",
    durationMs: 82_000,
    turns: [
      createTurn("turn-1", 4_500, 4_000, "Explain how you listen to me in this demo."),
      createTurn("turn-2", 11_000, 3_000, "Actually focus on the browser part."),
      createTurn("turn-3", 18_500, 3_200, "And make it less technical."),
      createTurn("turn-4", 39_000, 4_300, "Summarize what you changed after I corrected you."),
    ],
  },
  {
    roundNumber: 7,
    groupId: "barge-in",
    title: "Overlap stress with rapid turn start",
    durationMs: 83_000,
    turns: [
      createTurn("turn-1", 3_500, 4_500, "Give me a detailed answer about full duplex."),
      createTurn("turn-2", 10_200, 2_800, "Interrupting now."),
      createTurn("turn-3", 16_000, 3_000, "Please continue, but more carefully."),
      createTurn("turn-4", 37_500, 4_000, "Tell me whether any audio overlap leaked through."),
    ],
  },
  {
    roundNumber: 8,
    groupId: "barge-in",
    title: "Restart after interruption",
    durationMs: 79_500,
    turns: [
      createTurn("turn-1", 4_000, 3_900, "Start by describing the current app state."),
      createTurn("turn-2", 10_500, 2_700, "Pause there."),
      createTurn("turn-3", 19_500, 4_200, "Okay continue with a clean restart."),
      createTurn("turn-4", 41_000, 4_300, "Tell me if you recovered cleanly."),
    ],
  },
  {
    roundNumber: 9,
    groupId: "chunked",
    title: "Long user utterance",
    durationMs: 84_000,
    turns: [
      createTurn("turn-1", 4_000, 7_500, "I am going to speak for longer now because I want to know whether the system stays patient, preserves all the important detail, and responds without losing the thread."),
      createTurn("turn-2", 25_000, 4_000, "Give me the short summary first."),
      createTurn("turn-3", 45_000, 4_800, "Then add one sentence on the hidden tradeoff."),
      createTurn("turn-4", 64_000, 4_200, "Finish with one direct question."),
    ],
  },
  {
    roundNumber: 10,
    groupId: "chunked",
    title: "Chunked speech pressure",
    durationMs: 85_000,
    turns: [
      createTurn("turn-1", 4_000, 2_200, "I am"),
      createTurn("turn-2", 7_000, 2_000, "speaking in"),
      createTurn("turn-3", 10_000, 2_400, "small pieces now"),
      createTurn("turn-4", 20_000, 4_200, "Please act like it was one coherent question."),
      createTurn("turn-5", 42_000, 4_500, "Explain how you merged the idea together."),
    ],
  },
  {
    roundNumber: 11,
    groupId: "chunked",
    title: "Repeated final-result pressure",
    durationMs: 82_500,
    turns: [
      createTurn("turn-1", 4_500, 3_200, "Say whether you duplicate replies when results repeat."),
      createTurn("turn-2", 18_000, 4_600, "I am intentionally pressuring the final result handling path."),
      createTurn("turn-3", 39_500, 4_200, "Respond with evidence from your behavior."),
      createTurn("turn-4", 60_500, 4_300, "Keep it concise."),
    ],
  },
  {
    roundNumber: 12,
    groupId: "chunked",
    title: "Trailing-off speech",
    durationMs: 80_500,
    turns: [
      createTurn("turn-1", 4_000, 5_000, "I might trail off a little while I ask whether you can still tell when I am done speaking"),
      createTurn("turn-2", 22_000, 3_500, "Please answer once only."),
      createTurn("turn-3", 43_000, 4_200, "Now tell me how clean that turn boundary felt."),
      createTurn("turn-4", 63_500, 4_000, "End with a simple verdict."),
    ],
  },
  {
    roundNumber: 13,
    groupId: "recovery",
    title: "Silence recovery",
    durationMs: 79_500,
    turns: [
      createTurn("turn-1", 5_000, 3_800, "We are testing silence recovery."),
      createTurn("turn-2", 30_000, 3_600, "I waited a long time before speaking again."),
      createTurn("turn-3", 51_000, 4_000, "Tell me whether the app stayed calm."),
      createTurn("turn-4", 66_500, 3_600, "Keep the tone steady."),
    ],
  },
  {
    roundNumber: 14,
    groupId: "recovery",
    title: "Fast back-and-forth",
    durationMs: 78_500,
    turns: [
      createTurn("turn-1", 4_000, 2_600, "Quick test one."),
      createTurn("turn-2", 10_500, 2_900, "Quick test two."),
      createTurn("turn-3", 17_500, 3_200, "Quick test three."),
      createTurn("turn-4", 28_000, 4_200, "Now summarize how you handled the pace."),
      createTurn("turn-5", 49_000, 4_300, "Tell me the biggest risk under this speed."),
    ],
  },
  {
    roundNumber: 15,
    groupId: "recovery",
    title: "First-play sensitivity",
    durationMs: 80_000,
    turns: [
      createTurn("turn-1", 4_000, 4_000, "I am checking whether the first audible reply starts cleanly."),
      createTurn("turn-2", 20_000, 4_200, "Please compare the first turn to later ones."),
      createTurn("turn-3", 41_000, 4_400, "Tell me whether autoplay or startup cost dominates."),
      createTurn("turn-4", 62_000, 3_800, "End with one concrete improvement."),
    ],
  },
  {
    roundNumber: 16,
    groupId: "recovery",
    title: "Context pressure",
    durationMs: 82_000,
    turns: [
      createTurn("turn-1", 4_500, 4_100, "Remember that I care about low latency and clean overlap handling."),
      createTurn("turn-2", 18_500, 4_000, "Now explain your current weak point."),
      createTurn("turn-3", 37_000, 4_200, "And tell me what tradeoff you would make first."),
      createTurn("turn-4", 58_500, 4_500, "Finish with a prioritized next step."),
    ],
  },
  {
    roundNumber: 17,
    groupId: "mixed-stress",
    title: "Mixed stress: interruption plus long follow-up",
    durationMs: 86_000,
    turns: [
      createTurn("turn-1", 4_000, 4_500, "Start a rich answer about response timing."),
      createTurn("turn-2", 10_000, 3_000, "Interrupting for a shorter path."),
      createTurn("turn-3", 22_000, 6_800, "Now give me a longer but structured answer covering latency, overlap, and recovery in that order."),
      createTurn("turn-4", 49_000, 4_400, "Tell me which part felt weakest."),
      createTurn("turn-5", 69_000, 4_600, "End with one fix you would apply next."),
    ],
  },
  {
    roundNumber: 18,
    groupId: "mixed-stress",
    title: "Mixed stress: quick corrections plus silence",
    durationMs: 84_500,
    turns: [
      createTurn("turn-1", 4_000, 3_900, "Describe your current conversation flow."),
      createTurn("turn-2", 10_500, 2_700, "Too broad."),
      createTurn("turn-3", 16_000, 2_800, "Make it specific to audio timing."),
      createTurn("turn-4", 39_000, 4_500, "I waited; now tell me whether that reset anything."),
      createTurn("turn-5", 62_000, 4_400, "End with one sentence."),
    ],
  },
  {
    roundNumber: 19,
    groupId: "mixed-stress",
    title: "Mixed stress: trailing question and rapid restart",
    durationMs: 83_000,
    turns: [
      createTurn("turn-1", 4_000, 5_300, "I am asking whether your turn boundary logic ever gets confused when the question sort of drifts at the end"),
      createTurn("turn-2", 17_500, 3_000, "Follow-up immediately."),
      createTurn("turn-3", 24_000, 4_500, "Tell me if that created a duplicate or a miss."),
      createTurn("turn-4", 47_000, 4_400, "Now summarize the outcome."),
      createTurn("turn-5", 67_500, 4_300, "Close cleanly."),
    ],
  },
  {
    roundNumber: 20,
    groupId: "mixed-stress",
    title: "Mixed stress: final campaign blend",
    durationMs: 88_000,
    turns: [
      createTurn("turn-1", 4_000, 4_400, "Final benchmark run. Start confidently."),
      createTurn("turn-2", 10_500, 2_900, "Interrupt."),
      createTurn("turn-3", 18_000, 5_800, "Recover with a compact but insightful explanation of your current performance envelope."),
      createTurn("turn-4", 39_000, 4_000, "Now give me your honest latency ceiling."),
      createTurn("turn-5", 58_000, 4_300, "Tell me the top correctness risk that remains."),
      createTurn("turn-6", 74_000, 4_000, "End with a single-line verdict."),
    ],
  },
];

export const getScenarioCatalog = () =>
  SCENARIO_DATA.map((scenario) => ({
    ...scenario,
    roundId: `round-${String(scenario.roundNumber).padStart(2, "0")}`,
    userVoice: BASE_USER_VOICE,
  }));

export const getScenarioByRound = (roundNumber) => {
  const scenario = getScenarioCatalog().find((entry) => entry.roundNumber === Number(roundNumber));

  if (!scenario) {
    throw new Error(`Unknown benchmark round: ${roundNumber}`);
  }

  return scenario;
};
