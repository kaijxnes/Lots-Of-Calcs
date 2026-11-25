/* UK bank holidays by region: GOV.UK's list (data/holidays/gov-uk-bank-holidays.json),
   then the expected dates from the usual pattern (uk-bank-holiday-rules.js)
   for later years, marked expected: true. The working days pages check the
   pattern against GOV.UK's list; this reuses it for other pages.

       const H = require("./lib/uk-holidays.js")(2031);
       H.list("england-and-wales")   [{ date, title, sub, expected }, ...]
       H.lastPublished               the last full year GOV.UK has published */
const fs = require("fs");
const path = require("path");
const RULES = require("./uk-bank-holiday-rules.js");
const REGIONS = ["england-and-wales", "scotland", "northern-ireland"];

module.exports = function (toYear) {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data/holidays/gov-uk-bank-holidays.json"), "utf8"));
  const hol = {};
  REGIONS.forEach((r) => { hol[r] = raw[r].events.map((e) => ({ date: e.date, title: e.title.replace(/’/g, "'"), sub: /substitute/i.test(e.notes || ""), expected: false })); });
  const ew = hol["england-and-wales"];
  const years = [...new Set(ew.map((h) => +h.date.slice(0, 4)))].filter((y) => ew.filter((h) => h.date.startsWith(y + "-")).length >= 8);
  const lastPublished = Math.max(...years);
  for (let y = lastPublished + 1; y <= toYear; y++) REGIONS.forEach((r) => {
    hol[r] = hol[r].filter((h) => !h.date.startsWith(y + "-")).concat(RULES.expected(r, y).map((h) => ({ ...h, expected: true })));
  });
  REGIONS.forEach((r) => hol[r].sort((a, b) => (a.date < b.date ? -1 : 1)));
  return { REGIONS, lastPublished, list: (r) => hol[r] };
};
