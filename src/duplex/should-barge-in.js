import { normalizeTranscript } from "./normalize-transcript.js";

export const shouldBargeIn = ({
  duplexEnabled,
  audioPlaying,
  interimTranscript,
}) =>
  Boolean(
    duplexEnabled &&
      audioPlaying &&
      normalizeTranscript(interimTranscript).length >= 5
  );
