import { CronHelper } from "./src/lib/cron";

// Mock the private checkPart method by calling it through getNextOccurrence logic
// We can't access private methods directly, so we infer from results.

const pattern = "0 0 * * 1-5"; // Mon-Fri
const sundayDate = new Date("2026-02-08T00:00:00Z"); // Sunday Feb 8

console.log("--- Debug Range 1-5 vs Sunday ---");
console.log(`Pattern: ${pattern}`);
console.log(
  `Test Date: ${sundayDate.toISOString()} (Day ${sundayDate.getDay()})`,
);

// We want to see if this matches.
// We can use getNextOccurrence from slightly before.
const beforeSunday = new Date("2026-02-07T23:59:00Z").getTime();

const next = CronHelper.getNextOccurrence(pattern, beforeSunday);

if (next) {
  const d = new Date(next);
  console.log(`Found Next: ${d.toISOString()} (Day ${d.getDay()})`);
  if (d.getDay() === 0) {
    console.error("FAIL: Matched Sunday!");
  } else if (d.getDay() === 1) {
    console.log("SUCCESS: Skipped Sunday, matched Monday.");
  } else {
    console.log(`Result: ${d.toISOString()}`);
  }
} else {
  console.log("Next: NULL");
}
