/* Which salary pages exist, shared by the page generators.

   Add a salary to a list and re-run `node tools/build-tax-pages.js` to create
   the pages; hubs, cross-links and the sitemap are generated from these lists,
   so they stay consistent. */

const SALARIES = {
  GBP: [20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 100000, 150000],
  USD: [30000, 40000, 50000, 60000, 70000, 75000, 80000, 90000, 100000, 120000, 150000, 200000],
  EUR: [20000, 25000, 30000, 35000, 40000, 50000, 60000, 70000, 80000, 100000],
  NOK: [300000, 400000, 500000, 600000, 700000, 800000, 1000000],
  SEK: [300000, 400000, 500000, 600000, 700000, 800000, 1000000],
  DKK: [300000, 400000, 500000, 600000, 700000, 800000, 1000000],
  JPY: [3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 10000000, 12000000],
  INR: [500000, 800000, 1000000, 1200000, 1500000, 2000000, 2500000, 3000000, 5000000],
  AUD: [50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000],
  NZD: [50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000]
};

/* The salary each hub uses for its headline comparison */
const HEADLINE = { GBP: 35000, USD: 75000, EUR: 50000, NOK: 600000, SEK: 500000, DKK: 600000, JPY: 5000000, INR: 1200000, AUD: 90000, NZD: 80000 };

/* Where each jurisdiction's pages live, and how its name reads in a sentence.
   Jurisdictions not listed (the UK, which has its own generator, and the US
   federal file, which is never shown on its own) get no generic pages. */
const PLACES = {
  "gb-sct": { path: "scotland", inName: "Scotland" },
  "de": { path: "germany" }, "fr": { path: "france" }, "es": { path: "spain" }, "it": { path: "italy" },
  "nl": { path: "netherlands", inName: "the Netherlands" }, "ie": { path: "ireland" }, "pt": { path: "portugal" },
  "at": { path: "austria" }, "no": { path: "norway" }, "dk": { path: "denmark" }, "se": { path: "sweden" },
  "au": { path: "australia" }, "nz": { path: "new-zealand" }, "in": { path: "india" }, "jp": { path: "japan" },
  "us-dc": { path: "us/washington-dc", inName: "Washington, DC", shortName: "Washington, DC" },
  "us-ny-nyc": { path: "us/new-york-city" }
};

/* US states default to /salary/us/<name>/ */
function placeFor(id, doc) {
  if (PLACES[id]) return Object.assign({ inName: doc.name, shortName: doc.name }, PLACES[id]);
  if (id.startsWith("us-")) {
    return { path: "us/" + doc.name.toLowerCase().replace(/[^a-z]+/g, "-"), inName: doc.name, shortName: doc.name };
  }
  return null;
}

/* Comparison sets shown on salary pages: places people weigh against each other */
const COMPARE = {
  US: ["us-tx", "us-fl", "us-wa", "us-ca", "us-ny", "us-ny-nyc", "us-il", "us-pa", "us-ma", "us-nj", "us-ga", "us-nc", "us-co", "us-az", "us-oh"],
  EUR: ["de", "fr", "es", "it", "nl", "ie", "pt", "at"]
};

module.exports = { SALARIES, HEADLINE, PLACES, COMPARE, placeFor };
