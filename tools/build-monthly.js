#!/usr/bin/env node
/* Rebuilds every page whose figures or dates move, in the order they depend
   on each other. The monthly update runs this after checking the data:

       node tools/build-monthly.js

   Stops at the first builder that fails. Why the order matters:
   - tax/check.js --write refreshes data/tax/index.json, which everything reads.
   - build-tax-pages.js rewrites the salary calculator page; build-comparison-pages.js
     then adds its links to it, and build-take-home-index.js ranks the same
     salary across countries from the tax files and the ECB rates.
   - build-tax-week-pages.js writes the tax week calendars before
     build-working-days-pages.js, whose UK payday calendars link to them.
   - build-working-days-pages.js regenerates bank-holidays.js, which
     build-countdown-pages.js reads.
   - build-guides.js builds the guides (the UK income tax guide follows the tax
     files) and puts a "read the guide" link on calculators the builders above
     rewrite (salary, pay rise, self-employed, Child Benefit, salary sacrifice,
     pension relief), so it comes after all of them.
   - build-popular.js sets the homepage's seasonal row for today.
   - build-search-index.js and build-embeds.js read finished pages.
   - apply-icons.js turns emoji icons into line icons, adds breadcrumbs and
     tags every asset link with a content hash, so it runs after every page
     is written; build-sitemap-index.js splits sitemap.xml once every builder
     has written its block; sync-faq-ld.js --check confirms each page's FAQ
     markup matches what it shows. */
const { execFileSync } = require("child_process");
const path = require("path");

const STEPS = [
  ["tax/check.js", "--write"],
  ["build-tax-pages.js"], ["build-pay-rise-pages.js"], ["build-bonus-pages.js"], ["build-net-to-gross-pages.js"], ["build-pro-rata-pages.js"], ["build-ssp-pages.js"], ["build-mileage-pages.js"], ["build-self-employed-pages.js"],
  ["build-self-assessment-pages.js"], ["build-child-benefit-pages.js"], ["build-marriage-allowance-pages.js"], ["build-tax-code-pages.js"], ["build-tax-refund-pages.js"], ["build-second-job-pages.js"],
  ["build-salary-sacrifice-pages.js"], ["build-pension-relief-pages.js"],
  ["build-stamp-duty-pages.js"], ["build-borrowing-pages.js"], ["build-budget-pages.js"], ["build-job-offer.js"],
  ["build-inflation.js"], ["build-repayment-pages.js"],
  ["build-appliance-pages.js"], ["build-heating-pages.js"], ["build-ev-pages.js"], ["build-fuel-route-pages.js"],
  ["build-tax-wrappers.js"], ["build-benefit-dates-pages.js"], ["build-tax-week-pages.js"], ["build-working-days-pages.js"], ["build-payday-pages.js"], ["build-countdown-pages.js"], ["build-turkey-pages.js"],
  ["build-age-in-year-pages.js"], ["build-born-pages.js"], ["build-planet-age.js"], ["build-calorie-pages.js"], ["build-dry-january.js"],
  ["build-savings-challenge-pages.js"], ["build-savings-goal-pages.js"], ["build-christmas-savings-pages.js"],
  ["build-pay-schedule-pages.js"], ["build-student-loan-pages.js"], ["build-expat-pages.js"],
  ["build-small-calcs.js"], ["build-uk-calcs.js"], ["build-currency-pages.js"],
  ["build-comparison-pages.js"], ["build-take-home-index.js"], ["build-guides.js"], ["build-trust-pages.js"],
  ["build-timezone-pages.js"], ["build-time-pages.js"], ["build-due-date-pages.js"],
  ["build-popular.js"], ["build-search-index.js"], ["build-embeds.js"],
  ["apply-icons.js"], ["build-sitemap-index.js"], ["sync-faq-ld.js", "--check"]
];

const only = process.argv[2];
for (const [file, ...args] of STEPS) {
  if (only && !file.includes(only)) continue;
  process.stdout.write(`${file} ${args.join(" ")}`.trim() + " ... ");
  try {
    const out = execFileSync("node", [path.join(__dirname, file), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
    const last = out.trim().split("\n").pop();
    console.log(last || "done");
  } catch (e) {
    console.log("FAILED");
    process.stderr.write((e.stdout || "") + (e.stderr || ""));
    process.exit(1);
  }
}
console.log("all builders done");
