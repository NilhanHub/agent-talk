export const shouldAutoRestart = ({
  duplexEnabled,
  manuallyStopped,
}) => Boolean(duplexEnabled && !manuallyStopped);
