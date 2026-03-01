const BOSS_REGEX_FRACTION = /(?:(?:⚔️|🛡️)\s*)?(.+?)\s+(\d+)\s*\/\s*(\d+)/iu;

const inputs = [
  "My Habit (1/3)",
  "Dragon 100/100",
  "Buy 1/2 gallon milk",
  "Boss [HP:100]", // Should not match fraction regex
];

inputs.forEach((input) => {
  const match = input.match(BOSS_REGEX_FRACTION);
  if (match) {
    console.log(
      `MATCH: "${input}" -> Name: "${match[1]}", HP: ${match[2]}/${match[3]}`,
    );
  } else {
    console.log(`NO MATCH: "${input}"`);
  }
});
