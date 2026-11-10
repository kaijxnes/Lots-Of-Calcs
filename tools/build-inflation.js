#!/usr/bin/env node
/* The inflation calculator (/inflation/) and its data.

       node tools/build-inflation.js

   Reads the unmodified downloads in data/inflation/raw/ (ONS for the UK, BLS
   for the US — see the README there), writes data/inflation/series.json for
   the page's calculator, and builds /inflation/index.html with its tables
   already filled in. To update: download fresh copies of the raw files from
   the URLs in the README, then run this. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const RAW = path.join(site.ROOT, "data", "inflation", "raw");
const OUT = path.join(site.ROOT, "data", "inflation", "series.json");
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ---------------------------------------------------------------- reading

/* An ONS time-series CSV: header lines, then "1988","49.6", "1988 Q1",…,
   "1988 JAN",… Returns annual values, the latest month, and the release. */
function readOns(file) {
  const text = fs.readFileSync(path.join(RAW, file), "utf8");
  const annual = {};
  const monthly = [];
  let title = "", release = "";
  text.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^"([^"]*)","([^"]*)"$/);
    if (!m) return;
    const [, key, value] = m;
    if (key === "Title") title = value;
    else if (key === "Release date") release = value;
    else if (/^\d{4}$/.test(key) && value !== "") annual[key] = Number(value);
    else if (/^\d{4} [A-Z]{3}$/.test(key) && value !== "") {
      const [y, mon] = key.split(" ");
      monthly.push({ year: Number(y), month: MONTHS.indexOf(mon) + 1, value: Number(value) });
    }
  });
  if (!Object.keys(annual).length || !monthly.length) throw new Error(file + ": no annual or monthly rows — is it an ONS CSV?");
  Object.values(annual).concat(monthly.map((x) => x.value)).forEach((v) => { if (!(v > 0)) throw new Error(file + ": bad value " + v); });
  monthly.sort((a, b) => a.year - b.year || a.month - b.month);
  return { title, release, annual, monthly };
}

/* The BLS CPI-U export: year,period,value with M13 the annual average */
function readBls(file) {
  const lines = fs.readFileSync(path.join(RAW, file), "utf8").trim().split(/\r?\n/).slice(1);
  const annual = {};
  const monthly = [];
  lines.forEach((line) => {
    const [y, period, v] = line.split(",");
    const value = Number(v);
    if (!(value > 0)) throw new Error(file + ": bad value in " + line);
    if (period === "M13") annual[y] = value;
    else if (/^M(0[1-9]|1[0-2])$/.test(period)) monthly.push({ year: Number(y), month: Number(period.slice(1)), value });
  });
  monthly.sort((a, b) => a.year - b.year || a.month - b.month);
  return { annual, monthly };
}

function latestOf(s) {
  const last = s.monthly[s.monthly.length - 1];
  const yearAgo = s.monthly.find((x) => x.year === last.year - 1 && x.month === last.month);
  return {
    label: MONTH_NAMES[last.month - 1] + " " + last.year,
    year: last.year, month: last.month, value: last.value,
    /* The headline "inflation is X%" figure: this month against the same month a year earlier */
    rate12: yearAgo ? Math.round((last.value / yearAgo.value - 1) * 1000) / 10 : null
  };
}

function build() {
  const cpi = readOns("ons-d7bt.csv");
  const cpih = readOns("ons-l522.csv");
  const rpiLong = readOns("ons-cdko.csv");
  const us = readBls("bls-cuur0000sa0.csv");
  const series = {
    "uk-cpi": {
      country: "UK", currency: "GBP", symbol: "£", label: "CPI (Consumer Prices Index)", short: "CPI",
      note: "The official measure of UK inflation and the Bank of England's target. Annual averages from 1988.",
      source: "Office for National Statistics, series D7BT (" + cpi.release + " release)",
      url: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7bt/mm23",
      annual: cpi.annual, latest: latestOf(cpi)
    },
    "uk-cpih": {
      country: "UK", currency: "GBP", symbol: "£", label: "CPIH (CPI including housing costs)", short: "CPIH",
      note: "CPI plus owner occupiers' housing costs and council tax; the ONS's most comprehensive measure. From 1988.",
      source: "Office for National Statistics, series L522 (" + cpih.release + " release)",
      url: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/l522/mm23",
      annual: cpih.annual, latest: latestOf(cpih)
    },
    "uk-rpi": {
      country: "UK", currency: "GBP", symbol: "£", label: "RPI long-run series (from 1800)", short: "RPI",
      note: "The ONS's long-run price index, built on the Retail Prices Index. It runs higher than CPI in recent decades, but is the measure that goes back to 1800.",
      source: "Office for National Statistics, series CDKO (" + rpiLong.release + " release)",
      url: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/cdko/mm23",
      annual: rpiLong.annual, latest: latestOf(rpiLong)
    },
    "us-cpi": {
      country: "US", currency: "USD", symbol: "$", label: "CPI-U (Consumer Price Index)", short: "CPI-U",
      note: "The US Consumer Price Index for All Urban Consumers, the usual measure of US inflation. Annual averages from 1913.",
      source: "US Bureau of Labor Statistics, series CUUR0000SA0",
      url: "https://data.bls.gov/timeseries/CUUR0000SA0",
      annual: us.annual, latest: latestOf(us)
    }
  };
  return series;
}

// ---------------------------------------------------------------- arithmetic

function years(s) {
  return Object.keys(s.annual).map(Number).sort((a, b) => a - b);
}

function worth(s, amount, from) {
  return amount * (s.latest.value / s.annual[from]);
}

function money(s, v, dp) {
  const d = dp === undefined ? 2 : dp;
  return s.symbol + v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* Average yearly rate from the middle of `from` to the latest month */
function avgRate(s, from) {
  const span = s.latest.year + (s.latest.month - 0.5) / 12 - (from + 0.5);
  return (Math.pow(s.latest.value / s.annual[from], 1 / span) - 1) * 100;
}

function rate(s, y) {
  return s.annual[y - 1] ? (s.annual[y] / s.annual[y - 1] - 1) * 100 : null;
}

const pct1 = (v) => (Math.round(v * 10) / 10).toFixed(1) + "%";

// ---------------------------------------------------------------- page

function page(series) {
  const cpi = series["uk-cpi"], rpi = series["uk-rpi"], us = series["us-cpi"];
  const from = 2000, amount = 100;
  const w = worth(cpi, amount, from);
  const url = SITE + "/inflation/";
  const title = "Inflation Calculator UK & US — What Money From Any Year Is Worth Today";
  const desc = `What money from any year is worth now, using official UK (ONS CPI, CPIH and RPI back to 1800) and US (BLS CPI) figures to ${cpi.latest.label}. £100 in 2000 is worth ${money(cpi, w)} today.`;

  const cpiYears = years(cpi), rpiYears = years(rpi), usYears = years(us);
  const fromOptions = cpiYears.slice().reverse().map((y) => `<option value="${y}"${y === from ? " selected" : ""}>${y}</option>`).join("");
  const toOptions = `<option value="latest" selected>${esc(cpi.latest.label)} (latest)</option>` + cpiYears.slice().reverse().map((y) => `<option value="${y}">${y}</option>`).join("");

  const cpiRows = cpiYears.filter((y) => y < cpi.latest.year).slice().reverse().map((y) => {
    const r = rate(cpi, y);
    return [String(y), esc(money(cpi, worth(cpi, 100, y))), r === null ? "—" : pct1(r)];
  });
  const decades = [1800, 1850, 1900, 1920, 1930, 1940, 1950, 1960, 1970, 1975, 1980, 1985, 1990].filter((y) => rpi.annual[y]);
  const rpiRows = decades.map((y) => [String(y), esc(money(rpi, worth(rpi, 100, y))), pct1(avgRate(rpi, y))]);
  const usPick = [1913, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2005, 2010, 2015, 2020, 2021, 2022, 2023, 2024, 2025].filter((y) => us.annual[y]);
  const usRows = usPick.map((y) => [String(y), esc(money(us, worth(us, 100, y))), rate(us, y) === null ? "—" : pct1(rate(us, y))]);

  const w1970 = worth(rpi, 100, 1970), w1990 = worth(cpi, 100, 1990), wUs1990 = worth(us, 100, 1990);
  const q = [
    [`What is £100 from ${from} worth today?`,
      `${money(cpi, w)} in ${cpi.latest.label} money, using the Consumer Prices Index. Prices have risen ${pct1((w / 100 - 1) * 100)} since ${from}, an average of ${pct1(avgRate(cpi, from))} a year.`],
    ["What is £100 from 1970 worth today?",
      `About ${money(rpi, w1970, 0)}, using the ONS long-run price index (the only official UK series that goes back before 1988). Prices have risen roughly ${Math.round(w1970 / 100)}-fold since 1970.`],
    ["Should I use CPI, CPIH or RPI?",
      "CPI is the official measure of UK inflation, the one the Bank of England targets and most people mean. CPIH adds housing costs for homeowners and council tax. RPI is an older measure that usually runs higher than CPI and is no longer a national statistic, but its long-run series is the only official one that goes back before 1988 — so use it for older years."],
    ["How is the value worked out?",
      "The amount is multiplied by the price index for the later date and divided by the index for the earlier year. Years use the average index across that year; 'latest' uses the most recent month published. The result is what you'd need then and now to buy the same basket of goods and services."],
    [`What is the current rate of inflation?`,
      `UK CPI inflation was ${cpi.latest.rate12}% in the 12 months to ${cpi.latest.label}, and US CPI-U inflation ${us.latest.rate12}% in the 12 months to ${us.latest.label}, from the latest official figures.`],
    ["What is $100 from 1990 worth today?",
      `${money(us, wUs1990)} in ${us.latest.label} dollars, using the US Bureau of Labor Statistics' CPI-U. (£100 from 1990 is ${money(cpi, w1990)} on UK CPI.)`],
    ["How often is this updated?",
      "Monthly, after the ONS and the US Bureau of Labor Statistics publish each month's figures. The date of the latest figures is shown next to the result."]
  ];

  const ld = [
    site.webPage(title, desc, url),
    site.breadcrumb([["Home", SITE + "/"], ["Inflation calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Inflation Calculator", url: url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
    site.faqLd(q)
  ];

  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Inflation calculator</h1>
      <p class="page-subtitle">What money from any year is worth now, from official UK and US price figures.</p>
    </header>

    <main class="tool" id="inflation-tool">
      <div class="field-row">
        <div class="field">
          <label for="inf-country">Country</label>
          <select id="inf-country"><option value="UK" selected>United Kingdom</option><option value="US">United States</option></select>
        </div>
        <div class="field">
          <label for="inf-measure">Measure</label>
          <select id="inf-measure"><option value="uk-cpi" selected>CPI</option><option value="uk-cpih">CPIH</option><option value="uk-rpi">RPI long-run (from 1800)</option></select>
        </div>
      </div>
      <div class="field-row-3 field-row">
        <div class="field">
          <label for="inf-amount">Amount</label>
          <input type="number" id="inf-amount" value="${amount}" step="any" min="0" inputmode="decimal">
        </div>
        <div class="field">
          <label for="inf-from">In</label>
          <select id="inf-from">${fromOptions}</select>
        </div>
        <div class="field">
          <label for="inf-to">Is worth in</label>
          <select id="inf-to">${toOptions}</select>
        </div>
      </div>
      <p class="tool-hint" id="inf-error" role="alert" style="color: var(--bad); display: none;"></p>

      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="inf-worth">${esc(money(cpi, w))}</div>
          <div class="label" id="inf-label">£100 in ${from}, in ${esc(cpi.latest.label)} money</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Prices rose by</span><span class="r-value" id="inf-total">${pct1((w / 100 - 1) * 100)}</span></div>
          <div class="result-row"><span class="r-label">Average a year</span><span class="r-value" id="inf-avg">${pct1(avgRate(cpi, from))}</span></div>
          <div class="result-row highlight"><span class="r-label" id="inf-back-label">£100 now, in ${from} money</span><span class="r-value" id="inf-back">${esc(money(cpi, 100 * cpi.annual[from] / cpi.latest.value))}</span></div>
        </div>
      </div>
      <p class="tool-hint" id="inf-source" style="margin-top:12px;">${esc(cpi.note)} Source: <a href="${cpi.url}" rel="nofollow noopener" target="_blank">${esc(cpi.source)}</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">What £100 is worth today, by year (UK CPI)</p>
      <p class="about-text">£100 in each year, in ${esc(cpi.latest.label)} money, with that year's average inflation rate. CPI inflation was <strong>${cpi.latest.rate12}%</strong> in the 12 months to ${esc(cpi.latest.label)}.</p>
${site.table(["Year", "£100 then is worth now", "Inflation that year"], cpiRows, 360)}    </main>

    <main class="tool">
      <p class="tool-section-title">Further back: the long-run series</p>
      <p class="about-text">CPI only goes back to 1988. For older years the ONS publishes a long-run price index back to 1800, built on the Retail Prices Index. It shows higher inflation than CPI in recent decades, so use CPI where it's available.</p>
${site.table(["Year", "£100 then is worth now", "Average a year since"], rpiRows, 360)}    </main>

    <main class="tool">
      <p class="tool-section-title">United States: what $100 is worth today</p>
      <p class="about-text">Using the Bureau of Labor Statistics' CPI-U, up to ${esc(us.latest.label)}. US inflation was <strong>${us.latest.rate12}%</strong> in the 12 months to ${esc(us.latest.label)}.</p>
${site.table(["Year", "$100 then is worth now", "Inflation that year"], usRows, 360)}    </main>

    <main class="tool">
      <p class="tool-section-title">How the calculator works</p>
      <p class="about-text">A price index tracks what a fixed basket of everyday goods and services costs over time. Dividing the index at the later date by the index at the earlier one gives how much prices rose: an index of ${esc(String(cpi.annual[from]))} in ${from} and ${esc(String(cpi.latest.value))} in ${esc(cpi.latest.label)} means prices are ${(cpi.latest.value / cpi.annual[from]).toFixed(2)} times higher, so £100 then buys what costs ${esc(money(cpi, w))} now.</p>
      <p class="about-text">The figure is an average across the whole basket. Some things have risen far faster than inflation &mdash; house prices, rent, university fees &mdash; and others, like electronics, have got cheaper. For your own savings, the <a href="/compound-interest/">compound interest calculator</a> shows whether a rate of return beats inflation.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/inflation/")}
${site.FOOTER}
  </div>
  <script src="/inflation.js"></script>
</body>
</html>
`;
}

function main() {
  const series = build();
  const json = JSON.stringify({
    _note: "Generated by tools/build-inflation.js from data/inflation/raw/. Annual values are each year's average index; latest is the most recent month published.",
    series: series
  });
  fs.writeFileSync(OUT, json + "\n");
  site.write("inflation", page(series));
  Object.keys(series).forEach((k) => console.log(k, years(series[k])[0] + "–" + years(series[k]).slice(-1)[0], "latest", series[k].latest.label, series[k].latest.value, series[k].latest.rate12 + "%"));
}

main();
