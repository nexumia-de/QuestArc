function cleanTaskTitle(title: string): string {
  let clean = title;
  // Match both "🔥 1/2" (old) and "1/2 🔥" (new) formats for backward compatibility
  clean = clean.replace(/(\s*🔥\s*\d+(\/\d+)?)|(\s*\d+(\/\d+)?\s*🔥)/g, "");
  clean = clean.replace(/\s*\(\d+\/\d+\)$/, "");
  return clean.trim();
}

function proposedCleanTaskTitle(title: string): string {
  let clean = title;
  // Match both "🔥 1/2" (old) and "1/2 🔥" (new) formats for backward compatibility
  clean = clean.replace(/(\s*🔥\s*\d+(\/\d+)?)|(\s*\d+(\/\d+)?\s*🔥)/g, "");

  // Updated: Global replace, not anchored to end
  clean = clean.replace(/\s*\(\d+\/\d+\)/g, "");
  return clean.trim();
}

const inputs = [
  "test (2/2) (2/2) (2/2) 3/3 🔥 [Next: Tue 12:00 AM]",
  "Simple Task (1/3)",
  "Task with [Next: Tue]",
  "Task with (1/3) and more text",
];

console.log("--- Current Implementation ---");
inputs.forEach((input) => {
  console.log(`Original: "${input}"\nCleaned:  "${cleanTaskTitle(input)}"`);
});

console.log("\n--- Proposed Implementation ---");
inputs.forEach((input) => {
  console.log(
    `Original: "${input}"\nCleaned:  "${proposedCleanTaskTitle(input)}"`,
  );
});
