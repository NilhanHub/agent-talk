export const playReplyAudio = async (player, audioUrl) => {
  player.src = audioUrl;
  player.load();
  await player.play();
};
