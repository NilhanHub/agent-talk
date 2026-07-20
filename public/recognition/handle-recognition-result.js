import { isAudioPlaying } from "../audio/index.js";
import { shouldBargeIn } from "../duplex/index.js";

const appendFinalTranscript = (finalTranscripts, transcript) => {
  if (finalTranscripts.at(-1) !== transcript) {
    finalTranscripts.push(transcript);
  }
};

export const handleRecognitionResult = ({ runtime, sendTranscript, setStatus }) =>
  async (event) => {
    const finalTranscripts = [];

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript?.trim() ?? "";

      if (!transcript) {
        continue;
      }

      if (
        !result.isFinal &&
        shouldBargeIn({
          duplexEnabled: runtime.elements.duplexToggle.checked,
          audioPlaying: isAudioPlaying(runtime.elements.player),
          interimTranscript: transcript,
        })
      ) {
        runtime.elements.player.pause();
        runtime.elements.player.currentTime = 0;
        setStatus(runtime.elements, "You interrupted playback. Listening to you...");
      }

      if (!result.isFinal) {
        runtime.elements.heardText.textContent = transcript;
        continue;
      }

      appendFinalTranscript(finalTranscripts, transcript);
    }

    const mergedTranscript = finalTranscripts.join(" ").trim();

    if (!mergedTranscript) {
      return;
    }

    try {
      await sendTranscript(mergedTranscript);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setStatus(runtime.elements, error instanceof Error ? error.message : String(error));
    }
  };
