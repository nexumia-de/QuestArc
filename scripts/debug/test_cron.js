const { CronHelper } = require("./src/lib/cron");

const start = 1769974177951;
// Simulate clicking 5 seconds later
const end = start + 5000;

console.log("Start:", new Date(start).toISOString(), start);
console.log("End:", new Date(end).toISOString(), end);

const occurrences = CronHelper.getOccurrencesBetween("daily", start, end);
console.log("Occurrences (daily):", occurrences);

const next = CronHelper.getNextOccurrence("daily", start);
console.log(
  "Next Occurrence:",
  next ? new Date(next).toISOString() : "null",
  next,
);

// Check if next > end
if (next) {
  if (next > end) {
    console.log("Next > End: True (Correctly 0 occurrences)");
  } else {
    console.log("Next <= End: False (Bug! Should be 0)");
  }
}
