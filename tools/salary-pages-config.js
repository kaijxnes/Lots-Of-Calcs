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
  EUR: range(20000, 100000, 5000).concat([120000, 150000]),
  NOK: [300000, 400000, 500000, 600000, 700000, 800000, 1000000],
  SEK: [300000, 400000, 500000, 600000, 700000, 800000, 1000000],
  DKK: [300000, 400000, 500000, 600000, 700000, 800000, 1000000],
  JPY: [3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 10000000, 12000000],
  INR: [500000, 800000, 1000000, 1200000, 1500000, 2000000, 2500000, 3000000, 5000000],
  AUD: range(50000, 100000, 5000).concat([110000, 120000, 130000, 150000, 180000, 200000]),
  NZD: range(50000, 100000, 5000).concat([110000, 120000, 130000, 150000, 180000, 200000]),
  CAD: range(40000, 100000, 5000).concat([110000, 120000, 130000, 150000, 175000, 200000, 250000])
};

/* Hourly-rate pages. `hours` is the full-time week the annual figure assumes
   (every page says so and lets the visitor change it). `rates` are the pages
   each place gets; `national` adds the rates that only get an all-states
   comparison page in the US. */
const HOURLY = {
  USD: { hours: 40, rates: [15, 18, 20, 22, 25, 30, 35, 40, 50], national: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32, 35, 40, 45, 50] },
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
  EUR: [2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 8000],
  SEK: [25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000],
  NOK: [35000, 40000, 45000, 50000, 60000, 70000, 80000],
  DKK: [25000, 30000, 35000, 40000, 45000, 50000, 60000],
  CAD: [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 10000]
};
const MONTHLY_PLACES = ["gb", "gb-sct", "de", "fr", "ie", "se", "no", "dk", "fi",
  "ca-ab", "ca-bc", "ca-mb", "ca-nb", "ca-nl", "ca-ns", "ca-nt", "ca-nu", "ca-on", "ca-pe", "ca-qc", "ca-sk", "ca-yt"];

/* The salary each hub uses for its headline comparison */
const HEADLINE = { GBP: 35000, USD: 75000, EUR: 50000, NOK: 600000, SEK: 500000, DKK: 600000, JPY: 5000000, INR: 1200000, AUD: 90000, NZD: 80000, CAD: 75000 };

/* Where each jurisdiction's pages live, and how its name reads in a sentence.
   The UK's pages sit directly under /salary/ (its annual pages come from
   tools/build-salary-pages.js). The US federal file is never shown on its own. */
const PLACES = {
  "gb": { path: "", inName: "the UK", shortName: "England, Wales & N. Ireland" },
  "gb-sct": { path: "scotland", inName: "Scotland" },
  "de": { path: "germany" }, "fr": { path: "france" }, "es": { path: "spain" }, "it": { path: "italy" },
  "nl": { path: "netherlands", inName: "the Netherlands" }, "ie": { path: "ireland" }, "pt": { path: "portugal" },
  "at": { path: "austria" }, "no": { path: "norway" }, "dk": { path: "denmark" }, "se": { path: "sweden" },
  "fi": { path: "finland" }, "au": { path: "australia" }, "nz": { path: "new-zealand" }, "in": { path: "india" }, "jp": { path: "japan" },
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
  EUR: ["de", "fr", "es", "it", "nl", "ie", "pt", "at", "fi"],
  GBP: ["gb", "gb-sct"],
  CA: ["ca-ab", "ca-bc", "ca-mb", "ca-nb", "ca-nl", "ca-ns", "ca-nt", "ca-nu", "ca-on", "ca-pe", "ca-qc", "ca-sk", "ca-yt"]
};

module.exports = { SALARIES, HOURLY, MONTHLY, MONTHLY_PLACES, HEADLINE, PLACES, COMPARE, placeFor };
