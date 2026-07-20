const isHeaderLine = (field) => field === "Name" || field === "Gender";
const isSeparatorLine = (field) => /^-+$/.test(field);

export const parseVoiceListOutput = (output) =>
  output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [shortName, gender, contentCategories, voicePersonalities] = line.split(
        /\s{2,}/
      );

      return {
        shortName,
        gender,
        contentCategories,
        voicePersonalities,
      };
    })
    .filter(
      ({ shortName, gender, contentCategories }) =>
        shortName &&
        gender &&
        contentCategories &&
        !isHeaderLine(shortName) &&
        !isHeaderLine(gender) &&
        !isSeparatorLine(shortName) &&
        !isSeparatorLine(gender)
    );
