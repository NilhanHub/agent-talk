export const normalizeText = (value) =>
  value.toLowerCase().replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
