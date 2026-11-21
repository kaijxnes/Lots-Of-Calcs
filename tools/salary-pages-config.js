/* Which salary pages exist, shared by the page generators.

   Add an amount to a list and re-run `node tools/build-tax-pages.js` to create
   the pages; hubs, cross-links and the sitemap are generated from these lists,
   so they stay consistent.

   Amounts are the ones people actually search for: round thousands, round
   hourly rates. A page for every single pound (43,001, 43,002…) would be
   thousands of near-identical pages nobody searches for, which search engines
   treat as spam — the calculator on every page covers the in-between figures. */

function range(from, to, step) {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
}

const SALARIES = {
  GBP: range(15000, 60000, 1000).concat(range(65000, 100000, 5000), [110000, 120000, 125000, 150000, 175000, 200000]),
  USD: range(30000, 100000, 5000).concat([110000, 120000, 130000, 150000, 175000, 200000, 250000]),
  /* Europe gets every thousand from 20k to 60k: the European pages rank best of
     all the salary pages, and €1k steps are how salaries are quoted there */
  EUR: range(20000, 60000, 1000).concat(range(65000, 100000, 5000), [110000, 120000, 130000, 150000, 200000]),
  NOK: [300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000, 700000, 750000, 800000, 900000, 1000000, 1200000],
  SEK: [300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000, 700000, 750000, 800000, 900000, 1000000, 1200000],
  DKK: [300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000, 700000, 750000, 800000, 900000, 1000000, 1200000],
  JPY: [3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 10000000, 12000000],
  /* India in whole lakhs, as packages are quoted ("12 LPA"), from 3 lakh to 1 crore */
  INR: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 25, 28, 30, 35, 40, 45, 50, 60, 75, 100].map((l) => l * 100000),
  AUD: range(50000, 100000, 5000).concat([110000, 120000, 130000, 150000, 180000, 200000]),
  NZD: range(50000, 100000, 5000).concat([110000, 120000, 130000, 150000, 180000, 200000]),
  CAD: range(40000, 100000, 5000).concat([110000, 120000, 130000, 150000, 175000, 200000, 250000]),
  /* Swiss salaries run high: CHF 50k–150k in 5k steps covers most of them */
  CHF: range(50000, 150000, 5000).concat([160000, 175000, 200000, 250000])
};

/* Hourly-rate pages. `hours` is the full-time week the annual figure assumes
   (every page says so and lets the visitor change it). `rates` are the pages
   each place gets; `national` adds the rates that only get an all-states
   comparison page in the US. */
const HOURLY = {
  USD: { hours: 40, rates: [15, 18, 20, 22, 25, 30, 35, 40, 50], national: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32, 35, 40, 45, 50] },
  GBP: { hours: 37.5, rates: [12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 25, 30, 35, 40, 50] },
  AUD: { hours: 38, rates: [25, 28, 30, 32, 35, 38, 40, 45, 50, 60] },
  NZD: { hours: 40, rates: [24, 25, 28, 30, 32, 35, 40, 45, 50] },
  CAD: { hours: 40, rates: [18, 20, 22, 25, 28, 30, 35, 40, 45, 50] }
};

/* Monthly-pay pages (gross a month → take-home a month), only for places
   where a salary is normally quoted and paid in twelve equal months. Places
   that pay 13 or 14 instalments (Austria, Spain, Italy, Portugal) or add a
   holiday allowance on top (the Netherlands) are left out, because "a month"
   means something different there. */
const MONTHLY = {
  GBP: [1500, 1750, 2000, 2250, 2500, 2750, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000, 10000],
  EUR: [1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 9000, 10000],
  SEK: [25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000],
  NOK: [35000, 40000, 45000, 50000, 60000, 70000, 80000],
  DKK: [25000, 30000, 35000, 40000, 45000, 50000, 60000],
  CAD: [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 10000]
};
const MONTHLY_PLACES = ["gb", "gb-sct", "de", "fr", "ie", "se", "no", "dk", "fi", "lu",
  "ca-ab", "ca-bc", "ca-mb", "ca-nb", "ca-nl", "ca-ns", "ca-nt", "ca-nu", "ca-on", "ca-pe", "ca-qc", "ca-sk", "ca-yt"];

/* The salary each hub uses for its headline comparison */
const HEADLINE = { GBP: 35000, USD: 75000, EUR: 50000, NOK: 600000, SEK: 500000, DKK: 600000, JPY: 5000000, INR: 1200000, AUD: 90000, NZD: 80000, CAD: 75000, CHF: 100000 };

/* Where each jurisdiction's pages live, and how its name reads in a sentence.
   The UK's pages sit directly under /salary/ (its annual pages come from
   tools/build-salary-pages.js). The US federal file is never shown on its own. */
const PLACES = {
  "gb": { path: "", inName: "the UK", shortName: "England, Wales & N. Ireland" },
  "gb-sct": { path: "scotland", inName: "Scotland" },
  "de": { path: "germany" }, "fr": { path: "france" }, "es": { path: "spain" }, "it": { path: "italy" },
  "nl": { path: "netherlands", inName: "the Netherlands" }, "ie": { path: "ireland" }, "pt": { path: "portugal" },
  "at": { path: "austria" }, "no": { path: "norway" }, "dk": { path: "denmark" }, "se": { path: "sweden" },
  "fi": { path: "finland" }, 
  "be": { path: "belgium", hubTitle: ["Belgium Salary After Tax Calculator ({year}) — Gross to Net", "Belgium Gross to Net Salary Calculator ({year})"] },
  "lu": { path: "luxembourg", hubTitle: ["Luxembourg Salary After Tax Calculator ({year}) — Gross to Net", "Luxembourg Gross to Net Salary Calculator"] },
  "ch": { path: "switzerland", inName: "Zurich, Switzerland", shortName: "Switzerland (Zurich)",
    hubTitle: ["Swiss Salary After Tax Calculator ({year}) — Zurich Take-Home", "Swiss Salary Calculator — Take-Home Pay in Zurich"] }, "au": { path: "australia" }, "nz": { path: "new-zealand" }, "in": { path: "india" }, "jp": { path: "japan" },
  "us-dc": { path: "us/washington-dc", inName: "Washington, DC", shortName: "Washington, DC" },
  "us-ny-nyc": { path: "us/new-york-city" }
};

/* US states default to /salary/us/<name>/, Canadian provinces and
   territories to /salary/canada/<name>/ */
function placeFor(id, doc) {
  if (PLACES[id]) return Object.assign({ inName: doc.name, shortName: doc.name }, PLACES[id]);
  if (id.startsWith("us-")) {
    return { path: "us/" + doc.name.toLowerCase().replace(/[^a-z]+/g, "-"), inName: doc.name, shortName: doc.name };
  }
  if (id.startsWith("ca-")) {
    return { path: "canada/" + doc.name.toLowerCase().replace(/[^a-z]+/g, "-"), inName: doc.name, shortName: doc.name };
  }
  return null;
}

/* Comparison sets shown on salary pages: places people weigh against each other */
const COMPARE = {
  US: ["us-tx", "us-fl", "us-wa", "us-ca", "us-ny", "us-ny-nyc", "us-il", "us-pa", "us-ma", "us-nj", "us-ga", "us-nc", "us-co", "us-az", "us-oh"],
  EUR: ["de", "fr", "es", "it", "nl", "be", "lu", "ie", "pt", "at", "fi"],
  GBP: ["gb", "gb-sct"],
  CA: ["ca-ab", "ca-bc", "ca-mb", "ca-nb", "ca-nl", "ca-ns", "ca-nt", "ca-nu", "ca-on", "ca-pe", "ca-qc", "ca-sk", "ca-yt"]
};

/* Country-against-country pages, /salary-comparison/<a>-vs-<b>/ (built by
   tools/build-comparison-pages.js and linked from each place's salary pages).
   Labels: [short name, how it reads in a sentence]. */
const COMPARISON_LABEL = { gb: ["UK", "the UK"], "gb-sct": ["Scotland", "Scotland"], ie: ["Ireland", "Ireland"], de: ["Germany", "Germany"], nl: ["Netherlands", "the Netherlands"], fr: ["France", "France"], es: ["Spain", "Spain"], pt: ["Portugal", "Portugal"], it: ["Italy", "Italy"], "us-tx": ["Texas", "Texas"], "us-ca": ["California", "California"], "us-ny-nyc": ["New York City", "New York City"], "us-fl": ["Florida", "Florida"], "ca-on": ["Ontario", "Ontario"], "ca-bc": ["British Columbia", "British Columbia"], au: ["Australia", "Australia"], nz: ["New Zealand", "New Zealand"], be: ["Belgium", "Belgium"], lu: ["Luxembourg", "Luxembourg"], ch: ["Switzerland", "Zurich, Switzerland"] };
const COMPARISON_PAIRS = [["gb", "ie"], ["gb", "de"], ["gb", "nl"], ["gb", "fr"], ["gb", "es"], ["gb", "pt"], ["gb", "us-ny-nyc"], ["gb", "us-tx"], ["gb", "us-ca"], ["gb", "ca-on"], ["gb", "au"], ["gb", "nz"], ["gb", "gb-sct"], ["ie", "de"], ["de", "nl"], ["us-ca", "us-tx"], ["us-ny-nyc", "us-fl"], ["us-tx", "ca-on"], ["ca-on", "ca-bc"], ["au", "nz"], ["gb", "ch"], ["gb", "be"], ["gb", "lu"], ["de", "ch"], ["be", "nl"], ["be", "fr"], ["fr", "lu"], ["de", "lu"]];
const comparisonSlug = (a, b) => [a, b].map((id) => COMPARISON_LABEL[id][0].toLowerCase().replace(/\s+/g, "-")).join("-vs-");
/* The comparison pages a place appears on, as [url, "A vs B"] */
const comparisonsFor = (id) => COMPARISON_PAIRS.filter((pr) => pr.includes(id)).map(([a, b]) => [`/salary-comparison/${comparisonSlug(a, b)}/`, `${COMPARISON_LABEL[a][0]} vs ${COMPARISON_LABEL[b][0]}`]);

module.exports = { SALARIES, HOURLY, MONTHLY, MONTHLY_PLACES, HEADLINE, PLACES, COMPARE, placeFor, COMPARISON_LABEL, COMPARISON_PAIRS, comparisonSlug, comparisonsFor };
