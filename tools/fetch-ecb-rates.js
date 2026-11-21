#!/usr/bin/env node
/* Saves the European Central Bank's euro reference rates to
   data/currency/ecb.json for the currency converter and pages.

       node tools/fetch-ecb-rates.js

   The ECB publishes them each working day around 16:00 CET; the monthly
   rebuild runs this first. Fails without touching the file if the download
   isn't the ECB's XML. */
const fs = require("fs");
const path = require("path");
const https = require("https");

const URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";
https.get(URL, (res) => {
  let body = ""; res.on("data", (c) => (body += c));
  res.on("end", () => {
    const date = (body.match(/<Cube time=['"](\d{4}-\d{2}-\d{2})['"]>/) || [])[1];
    const rates = {};
    for (const m of body.matchAll(/<Cube currency=['"]([A-Z]{3})['"] rate=['"]([\d.]+)['"]\s*\/>/g)) rates[m[1]] = Number(m[2]);
    if (res.statusCode !== 200 || !date || !rates.USD || !rates.GBP || Object.keys(rates).length < 20) { console.error("not the ECB reference rates file"); process.exit(1); }
    const out = { _note: "Euro foreign exchange reference rates from the European Central Bank: units of each currency per 1 euro. Fetched by tools/fetch-ecb-rates.js.", source: { title: "European Central Bank — euro foreign exchange reference rates", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html", file: URL }, date, rates: Object.assign({ EUR: 1 }, rates) };
    fs.writeFileSync(path.join(__dirname, "..", "data/currency/ecb.json"), JSON.stringify(out, null, 2) + "\n");
    console.log(`ECB rates for ${date}: ${Object.keys(rates).length} currencies`);
  });
}).on("error", (e) => { console.error(e.message); process.exit(1); });
