export const loadVoices = async () => {
  const response = await fetch("/api/voices");
  return response.json();
};
