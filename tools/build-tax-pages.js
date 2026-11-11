#!/usr/bin/env node
/* Generate the salary-after-tax pages for every jurisdiction in the tax
   registry, the hub pages that link them, and the salary block of the sitemap.

       node tools/build-tax-pages.js

   Every figure is computed with tax-engine.js from data/tax/ — the same code
   the pages' live calculators run — and written into the HTML as text, so the
   answer to "how much is $75,000 after tax in Ohio" is on the page for anyone
   or anything reading it without scripts. Which salaries get pages is set in
   tools/salary-pages-config.js. The UK (England, Wales and Northern Ireland)
   pages come from tools/build-salary-pages.js, which this runs first. */
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const config = require("./salary-pages-config.js");
const uk = require("./build-salary-pages.js");
const related = require("./related.js");
const site = require("./lib/site.js");

const SITE = site.SITE;

// ---------------------------------------------------------------- helpers

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function niceDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return d + " " + months[m - 1] + " " + y;
}

function pct1(v) {
  return (Math.round(v * 10) / 10).toFixed(1) + "%";
}

function lowerFirst(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/* A charge's label in the middle of a sentence: "federal income tax", but
   "Social Security", "Medicare" and "California income tax" keep their
   capitals. Proper nouns are place names from the registry, a few programme
   names, and any label whose second word is capitalised ("Canada Pension
   Plan", "State Disability Insurance"). */
const PROPER = new Set(["Medicare", "Medicaid", "Social", "Canada", "Quebec", "Employment"]);
function inSentence(label) {
  const words = label.split(" ");
  if (words.length > 1 && /^[A-Z]/.test(words[1])) return label;
  if (PROPER.has(words[0]) || PLACE_WORDS.has(words[0])) return label;
  return lowerFirst(label);
}

/* How people say a salary: "75k", "12 lakh", "5 million yen" */
function spoken(n, currency) {
  if (currency === "INR") return (n / 100000) + " lakh";
  if (currency === "JPY") return (n / 1000000) + " million yen";
  if (n >= 1000000 && n % 100000 === 0) return (n / 1000000) + "m";
  return (n / 1000) + "k";
}

function slugFor(n, currency) {
  return currency === "INR" ? (n / 100000) + "-lakh-after-tax" : n + "-after-tax";
}

function yearPhrase(doc) {
  const label = doc.taxYear.label;
  return /^\d{4}$/.test(label) ? label + " tax year" : label + " tax year";
}

/* Through site.write, which records which pages really changed so the
   sitemap's <lastmod> only moves for those */
function write(rel, html) {
  site.write(rel, html);
}

const FOOTER = `    <footer class="site-footer">
      <p class="footer-categories">
        <a href="/general/">General</a>
        <a href="/business-analysis/">Business &amp; Analysis</a>
        <a href="/savings-investing/">Savings &amp; Investing</a>
        <a href="/everyday/">Everyday</a>
        <a href="/home-diy/">Home &amp; DIY</a>
        <a href="/betting-odds/">Betting &amp; Odds</a>
        <a href="/other/">Other</a>
      </p>
      <p>Built with plain HTML, CSS &amp; JavaScript — all calculations run locally in your browser.</p>
      <p><a href="/about/">About this site</a></p>
    </footer>`;

function head({ title, desc, url, ld }) {
  const ldJson = JSON.stringify(ld, null, 2).replace(/</g, "\\u003C");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script src="/consent.js"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lots Of Calcs">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://lotsofcalcs.com/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="https://lotsofcalcs.com/og-image.jpg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#1f2233">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
${ldJson}
</script>
</head>
<body>
  <div class="page">
`;
}

function breadcrumb(items) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name: name, item: url }))
  };
}

function webPage(title, desc, url) {
  return {
    "@context": "https://schema.org", "@type": "WebPage", name: title, description: desc, url: url,
    isPartOf: { "@type": "WebSite", name: "Lots Of Calcs", url: SITE + "/" }
  };
}

function faqLd(q) {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: q.map(([a, b]) => ({ "@type": "Question", name: a, acceptedAnswer: { "@type": "Answer", text: b } }))
  };
}

// ---------------------------------------------------------------- jurisdictions

const all = registry.readAll();
const current = registry.currentFiles(all);
const PLACE_WORDS = new Set(Object.keys(current).map((id) => current[id].doc.name.split(/[ (]/)[0]));

function contextFor(id) {
  const doc = current[id].doc;
  const chain = registry.chainFor(doc, all);
  const root = chain[0];
  const place = config.placeFor(id, doc);
  const currency = root.currency;
  const merged = TaxEngine.merge(chain);
  const defaults = {};
  Object.keys(merged.options).forEach((k) => { defaults[k] = merged.options[k].default; });
  return {
    id, doc, chain, root, place, currency, options: merged.options, defaults, items: merged.items,
    salaries: config.SALARIES[currency],
    hourly: config.HOURLY[currency] ? config.HOURLY[currency].rates : [],
    hours: config.HOURLY[currency] ? config.HOURLY[currency].hours : null,
    monthly: config.MONTHLY_PLACES.includes(id) ? config.MONTHLY[currency] : [],
    money: (v) => TaxEngine.money(v, currency),
    money0: (v) => TaxEngine.money(v, currency, true)
  };
}

const everywhere = Object.keys(current)
  .filter((id) => current[id].doc.standalone && config.placeFor(id, current[id].doc))
  .map(contextFor);
const byId = {};
everywhere.forEach((p) => { byId[p.id] = p; });
/* The UK's annual pages come from tools/build-salary-pages.js; every other
   place gets its annual pages and hub here */
const places = everywhere.filter((p) => p.id !== "gb");

/* The UK's pages sit directly under /salary/, everyone else's in a folder */
function base(p) {
  return "/salary/" + (p.place.path ? p.place.path + "/" : "");
}

function pageUrl(p, n) {
  return base(p) + slugFor(n, p.currency) + "/";
}

function hourUrl(p, rate) {
  return base(p) + rate + "-an-hour-after-tax/";
}

function monthUrl(p, m) {
  return base(p) + m + "-a-month-after-tax/";
}

function hubUrl(p) {
  return p.id === "gb" ? "/salary/uk/" : base(p);
}

/* "/salary/us/texas/" -> "salary/us/texas", for write() */
function dirOf(url) {
  return url.replace(/^\/|\/$/g, "");
}

/* Phrase for what comes out of pay */
function deductionPhrase(p) {
  const hasSocial = p.items.some((it) => "charge" in it && it.group === "social");
  if (p.root.country === "US") return "federal and state taxes and payroll deductions";
  if (p.root.country === "GB") return "income tax and National Insurance";
  if (p.root.country === "CA") return "federal and provincial income tax, pension contributions and EI";
  return hasSocial ? "income tax and social contributions" : "income tax";
}

/* Options marked inSummary: false (student loans) are opt-in extras: leave
   them out of the "single; region: Madrid" line a page is described by */
function optionSummary(p, opts) {
  return Object.keys(p.options).filter((k) => k !== "status" && p.options[k].inSummary !== false).map((k) =>
    p.options[k].label + ": " + p.options[k].choices[opts[k]]).join("; ");
}

function statusLabel(p, opts) {
  return p.options.status ? p.options.status.choices[opts.status] : null;
}

// ---------------------------------------------------------------- shared blocks

/* mode: { kind: "annual" } (default), { kind: "hourly", value: rate, hours },
   or { kind: "monthly", value: monthly pay }. The figures are always worked
   out on the annual equivalent; the mode decides what the box asks for and
   which figure leads. */
/* The date is filled in from data/tax/index.json by the page's script, so
   the monthly check moves it without rebuilding every page; the HTML carries
   the tax year and a link to the full list */
function checkedHint(p) {
  return `      <p class="tool-hint" id="rates-checked">${esc(p.doc.taxYear.label)} tax year · <a href="/tax-rates/">when every rate was last checked</a></p>`;
}

function toolBlock(p, gross, r, heading, mode) {
  const m = mode || { kind: "annual" };
  const selects = Object.keys(p.options).map((k) => {
    const o = p.options[k];
    if (o.type === "number") {
      return `      <div class="field" style="max-width:320px;">
        <label for="opt-${esc(k)}">${esc(o.label)}</label>
        <input type="number" id="opt-${esc(k)}" data-option="${esc(k)}" value="${o.default}" min="${o.min !== undefined ? o.min : ""}"${o.max !== undefined ? ` max="${o.max}"` : ""} step="${o.step || "any"}" inputmode="decimal">
      </div>`;
    }
    const opts = Object.keys(o.choices).map((c) =>
      `<option value="${esc(c)}"${c === p.defaults[k] ? " selected" : ""}>${esc(o.choices[c])}</option>`).join("");
    return `      <div class="field" style="max-width:320px;">
        <label for="opt-${esc(k)}">${esc(o.label)}</label>
        <select id="opt-${esc(k)}" data-option="${esc(k)}">${opts}</select>
      </div>`;
  }).join("\n");

  const shown = r.shown.map((s) =>
    `          <div class="result-row"><span class="r-label">${esc(s.label)}</span><span class="r-value" data-item="${esc(s.id)}">${p.money(s.amount)}</span></div>`).join("\n");
  const charges = r.charges.map((c) =>
    `          <div class="result-row"><span class="r-label">${esc(c.label)}</span><span class="r-value" data-item="${esc(c.id)}">${p.money(c.amount)}</span></div>`).join("\n");

  const heroRow = (label, key, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" data-out="${key}">${value}</span></div>`;
  let hero;
  if (m.kind === "monthly") {
    hero = `        <div class="result-hero">
          <div class="value" data-out="month">${p.money(r.perMonth)}</div>
          <div class="label">Take-home pay, a month</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${heroRow("A year", "net", p.money(r.net), "highlight")}
${heroRow("A week", "week", p.money(r.perWeek))}
${heroRow("Effective tax rate", "rate", pct1(r.deductionRate))}
        </div>`;
  } else {
    hero = `        <div class="result-hero">
          <div class="value" data-out="net">${p.money(r.net)}</div>
          <div class="label">Take-home pay, a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${heroRow("A month", "month", p.money(r.perMonth), "highlight")}
${heroRow("A week", "week", p.money(r.perWeek))}
${m.kind === "hourly" ? heroRow("Per hour worked", "hour", p.money(r.net / (m.hours * 52))) : heroRow("A working day", "day", p.money(r.perDay))}
${heroRow("Effective tax rate", "rate", pct1(r.deductionRate))}
        </div>`;
  }

  let inputs;
  if (m.kind === "hourly") {
    inputs = `      <p class="tool-section-title" style="margin-top:22px;">Try a different rate</p>
      <div class="field-row" style="max-width:480px;">
        <div class="field">
          <label for="salary">Hourly rate (${p.currency})</label>
          <input type="number" id="salary" value="${m.value}" step="any" min="0" placeholder="0">
        </div>
        <div class="field">
          <label for="hours">Hours a week</label>
          <input type="number" id="hours" value="${m.hours}" step="any" min="0" placeholder="${m.hours}">
        </div>
      </div>`;
  } else if (m.kind === "monthly") {
    inputs = `      <p class="tool-section-title" style="margin-top:22px;">Try different pay</p>
      <div class="field" style="max-width:320px;">
        <label for="salary">Gross monthly pay (${p.currency})</label>
        <input type="number" id="salary" value="${m.value}" step="any" min="0" placeholder="0">
      </div>`;
  } else {
    inputs = `      <p class="tool-section-title" style="margin-top:22px;">Try a different salary</p>
      <div class="field" style="max-width:320px;">
        <label for="salary">Gross annual salary (${p.currency})</label>
        <input type="number" id="salary" value="${gross}" step="any" min="0" placeholder="0">
      </div>`;
  }

  return `    <main class="tool" id="salary-tool" data-tax-id="${esc(p.id)}" data-currency="${p.currency}" data-gross="${gross}" data-mode="${m.kind}">
      <div class="result-box" aria-live="polite">
${hero}
      </div>

      <p class="tool-section-title" style="margin-top:22px;">${esc(heading)}</p>
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">${m.kind === "annual" ? "Gross salary" : "Gross pay, a year"}</span><span class="r-value" data-out="gross">${p.money0(gross)}</span></div>
${shown}
${charges}
          <div class="result-row"><span class="r-label">Total deductions</span><span class="r-value" data-out="deductions">${p.money(r.totalDeductions)}</span></div>
          <div class="result-row"><span class="r-label">Effective rate</span><span class="r-value" data-out="rate">${pct1(r.deductionRate)}</span></div>
          <div class="result-row"><span class="r-label">Marginal rate</span><span class="r-value" data-out="marginal">${Math.round(r.marginalRate)}%</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home pay</span><span class="r-value" data-out="net">${p.money(r.net)}</span></div>
        </div>
      </div>

${inputs}
${selects}
      <p class="tool-hint" id="salary-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="salary-note">Change the ${m.kind === "hourly" ? "rate, the hours" : m.kind === "monthly" ? "pay" : "salary"} or the options and everything above updates.</p>
${checkedHint(p)}
    </main>
`;
}

/* Bracket breakdown for each charge that is a straight band schedule */
function bandTables(p, r) {
  return r.charges.filter((c) => c.rows && c.rows.length).map((c) => {
    const rows = c.rows.map((x) => {
      const label = x.label || (x.to === Infinity ? "Over " + p.money0(x.from) : p.money0(x.from) + " – " + p.money0(x.to));
      return `<tr><td>${esc(label)}</td><td>${x.rate}%</td><td>${p.money0(x.amount)}</td><td>${p.money(x.charged)}</td></tr>`;
    }).join("");
    return `      <p class="tool-section-title" style="margin-top:22px;">${esc(c.label)}, band by band</p>
      <div class="table-scroll">
        <div style="min-width:420px;">
          <table class="out-table">
            <thead><tr><th>Band</th><th>Rate</th><th>Amount in band</th><th>Charged</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
`;
  }).join("");
}

function explanation(p, r) {
  /* An opt-in deduction left at nothing (no student loan) needs no paragraph */
  const parts = r.charges.filter((c) => {
    if (Math.abs(c.amount) >= 0.005) return true;
    const item = p.items.find((it) => it.id === c.id);
    return (c.group === "tax" || c.group === "social") && !item.mayBeNegative;
  }).map((c) => {
    const item = p.items.find((it) => it.id === c.id);
    return `      <p class="about-text"><strong>${esc(c.label)}: ${p.money(c.amount)}.</strong> ${esc(item.note || "")}</p>`;
  });
  r.shown.forEach((s) => {
    const item = p.items.find((it) => it.id === s.id);
    if (item.note) parts.unshift(`      <p class="about-text"><strong>${esc(s.label)}: ${p.money(s.amount)}.</strong> ${esc(item.note)}</p>`);
  });
  return parts.join("\n");
}

function aboutTheFigures(p) {
  const leaf = p.doc;
  const assumptions = p.chain.flatMap((d) => d.assumptions || []);
  const notModelled = Array.from(new Set(p.chain.flatMap((d) => d.notModelled || [])));
  const provisional = p.chain.flatMap((d) => d.provisional || []);
  const sources = p.chain.flatMap((d) => d.sources || []);
  const verified = p.chain.every((d) => d.lastVerified);
  const verifyAt = leaf.verifyAt || (sources[0] && sources[0].url);
  const li = (xs) => xs.map((x) => `<li>${esc(x)}</li>`).join("");
  return `    <main class="tool">
      <p class="tool-section-title">About these figures</p>
      <p class="about-text">They use the <strong>${esc(leaf.taxYear.label)}</strong> tax year, which runs from ${niceDate(leaf.taxYear.start)} to ${niceDate(leaf.taxYear.end)}. ${verified
        ? "The rates were last checked against the official sources on " + niceDate(p.chain.map((d) => d.lastVerified).sort()[0]) + "."
        : `The rates have not yet been checked by a person against the official sources — <a href="${esc(verifyAt)}" rel="nofollow noopener" target="_blank">check them here</a> before relying on them.`} This is an estimate, not a payslip. <a href="/tax-rates/">When every rate was last checked</a>.</p>
      <p class="about-text"><strong>Assumes:</strong></p>
      <ul class="about-list">${li(assumptions)}</ul>
      <p class="about-text"><strong>Leaves out:</strong></p>
      <ul class="about-list">${li(notModelled)}</ul>
${provisional.length ? `      <p class="about-text"><strong>Not yet confirmed for this year:</strong></p>
      <ul class="about-list">${li(provisional)}</ul>
` : ""}      <p class="about-text"><strong>Sources:</strong></p>
      <ul class="about-list">${sources.map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a></li>`).join("")}</ul>
    </main>
`;
}

function card(href, icon, title, desc) {
  return `      <a class="hub-card" href="${href}">
        <span class="icon">${icon}</span>
        <div class="title">${esc(title)}</div>
        <div class="desc">${esc(desc)}</div>
      </a>
`;
}

const ICON = { US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸", IT: "🇮🇹", NL: "🇳🇱", IE: "🇮🇪", PT: "🇵🇹", AT: "🇦🇹", NO: "🇳🇴", DK: "🇩🇰", SE: "🇸🇪", AU: "🇦🇺", NZ: "🇳🇿", IN: "🇮🇳", JP: "🇯🇵", CA: "🇨🇦" };
function iconFor(p) {
  return p.id === "gb-sct" ? "🏴󠁧󠁢󠁳󠁣󠁴󠁿" : (ICON[p.root.country] || "💷");
}

// ---------------------------------------------------------------- comparison

/* opts.link(q): the page to link each place to, or null for no link;
   opts.label: how the amount reads in the heading ("$25 an hour") */
function comparison(p, gross, opts) {
  const o = opts || {};
  const link = o.link || ((q) => pageUrl(q, gross));
  let ids;
  if (p.root.country === "US") ids = config.COMPARE.US;
  else if (p.root.country === "CA") ids = config.COMPARE.CA;
  else if (p.currency === "EUR") ids = config.COMPARE.EUR;
  else if (p.currency === "GBP") ids = config.COMPARE.GBP;
  else return "";
  ids = Array.from(new Set([p.id].concat(ids))).filter((id) => byId[id]);
  const rows = ids.map((id) => {
    const q = byId[id];
    const r = TaxEngine.compute(q.chain, gross, q.defaults);
    return { q, r };
  }).sort((a, b) => b.r.net - a.r.net);
  const body = rows.map(({ q, r }) => {
    const href = q.id === p.id ? null : link(q);
    const name = q.id === p.id ? `<strong>${esc(q.place.shortName)}</strong>` : href ? `<a href="${href}">${esc(q.place.shortName)}</a>` : esc(q.place.shortName);
    return `<tr><td>${name}</td><td>${p.money(r.net)}</td><td>${p.money(r.perMonth)}</td><td>${pct1(r.deductionRate)}</td></tr>`;
  }).join("");
  const what = p.root.country === "US" ? "in other states" : p.root.country === "CA" ? "across Canada" : p.currency === "GBP" ? "across the UK" : "in other euro countries";
  return `      <p class="tool-section-title" style="margin-top:22px;">${esc(o.label || p.money0(gross))} ${what}</p>
      <div class="table-scroll">
        <div style="min-width:420px;">
          <table class="out-table">
            <thead><tr><th>Where</th><th>Take-home a year</th><th>A month</th><th>Effective rate</th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">${p.currency === "GBP" ? "Scotland sets its own income tax bands; National Insurance is the same everywhere in the UK." : p.root.country === "CA" ? "Federal tax, CPP and EI are the same in every province except Quebec, which has its own pension plan (QPP), parental insurance (QPIP), a lower EI rate and a 16.5% cut in federal tax; the rest of the difference is provincial income tax." : `Each place on its own default assumptions${p.root.country === "US" ? " — single filer, standard deduction" : ""}. Tax systems differ in what they count, so treat this as a rough guide to where the same pay goes further.`}</p>
`;
}

// ---------------------------------------------------------------- salary page

function salaryPage(p, gross) {
  const r = TaxEngine.compute(p.chain, gross, p.defaults);
  const url = SITE + pageUrl(p, gross);
  const inName = p.place.inName;
  const m0 = p.money0(gross);
  const say = spoken(gross, p.currency);
  const year = p.doc.taxYear.label;
  const title = p.currency === "INR" ? `₹${gross / 100000} Lakh Salary After Tax in India (FY ${year}) — In-Hand Pay`
    : p.currency === "JPY" ? `${m0} (${gross / 1000000} Million Yen) After Tax in Japan (${year})`
    : `${m0} After Tax in ${inName} (${year}) — ${say} Take-Home Pay`;
  const desc = `${m0} a year in ${inName} leaves ${p.money(r.net)} after tax — ${p.money(r.perMonth)} a month. Every deduction for the ${year} tax year, line by line.`;
  const phrase = deductionPhrase(p);
  const opts = optionSummary(p, p.defaults);
  const status = statusLabel(p, p.defaults);
  const assumptionsLine = [status ? lowerFirst(status) : null, opts].filter(Boolean).join("; ");

  const lines = r.charges.filter((c) => Math.abs(c.amount) >= 0.005).map((c) => `${inSentence(c.label)} ${p.money(c.amount)}`);
  const q = [
    [`How much is ${m0} after tax in ${inName}?`,
      `A ${m0} salary in ${inName} leaves ${p.money(r.net)} a year after ${phrase}, which is ${p.money(r.perMonth)} a month or about ${p.money(r.perWeek)} a week. ` +
      (lines.length ? `The deductions are ${lines.join(", ")} — ${p.money(r.totalDeductions)} in all, or ${pct1(r.deductionRate)} of the gross.`
        : "Nothing is deducted at this salary.") +
      (assumptionsLine ? ` That is for ${assumptionsLine}.` : "")],
    [`How much is ${m0} a month after tax in ${inName}?`,
      `${p.money(r.perMonth)} a month — the annual take-home of ${p.money(r.net)} divided by twelve. Actual pay slips can differ where pay is split into more than twelve instalments or where withholding is settled at the end of the year.`],
    [`What is the marginal tax rate on ${m0} in ${inName}?`,
      `${Math.round(r.marginalRate)}% — that is what is taken from the next ${p.currency === "JPY" ? "yen" : "unit"} you earn, against ${pct1(r.deductionRate)} of the salary overall. The marginal rate is the one that matters when weighing a pay rise or overtime.`]
  ];
  if (p.options.status) {
    Object.keys(p.options.status.choices).filter((c) => c !== p.defaults.status).forEach((c) => {
      const o = Object.assign({}, p.defaults, { status: c });
      const rm = TaxEngine.compute(p.chain, gross, o);
      const label = p.options.status.choices[c];
      q.push([`How much is ${m0} after tax in ${inName} if I'm married?`,
        `${p.money(rm.net)} a year (${p.money(rm.perMonth)} a month) as "${label}", against ${p.money(r.net)} for a single person — ${rm.net >= r.net ? "a difference of " + p.money(rm.net - r.net) : p.money(r.net - rm.net) + " less"}. That assumes one spouse earns the whole salary.`]);
    });
  }
  const notModelled = Array.from(new Set(p.chain.flatMap((d) => d.notModelled || [])));
  q.push([`What does this leave out?`, notModelled.length ? notModelled.join("; ") + "." : "Nothing beyond the assumptions listed on this page."]);
  const verified = p.chain.every((d) => d.lastVerified);
  q.push([`How accurate are these ${inName} figures?`,
    `They apply the ${year} rates and thresholds to a ${m0} salary${assumptionsLine ? " for " + assumptionsLine : ""}. ` +
    (verified ? "The rates have been checked against the official sources." : "The rates come from published sources listed on this page but have not yet been checked by a person against the official tax authority, so confirm them before relying on them.") +
    " Pensions, credits and deductions specific to you will change the result."]);

  const ld = [
    webPage(title, desc, url),
    breadcrumb(crumbs(p).concat([[`${m0} after tax`, url]])),
    faqLd(q)
  ];

  const others = site.neighbours(p.salaries, gross, 4).map((s) => {
    const o = TaxEngine.compute(p.chain, s, p.defaults);
    return card(pageUrl(p, s), iconFor(p), `${p.money0(s)} after tax`, `${p.money0(o.net)} a year, ${p.money0(o.perMonth)} a month.`);
  }).join("");

  const faqHtml = q.map(([a, b]) => `      <p class="faq-q">${esc(a)}</p>\n      <p class="about-text">${esc(b)}</p>\n`).join("");

  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${hubUrl(p)}">← Salary after tax in ${esc(inName)}</a>
      <h1 class="page-title">${esc(m0)} after tax in ${esc(inName)}</h1>
      <p class="page-subtitle">What a ${esc(m0)} salary leaves you in the ${esc(year)} tax year${assumptionsLine ? " — " + esc(assumptionsLine) : ""}.</p>
    </header>

${toolBlock(p, gross, r, "Where it goes")}
    <main class="tool">
      <p class="about-text">A salary of <strong>${esc(m0)}</strong> in ${esc(inName)} leaves <strong>${p.money(r.net)}</strong> a year once ${esc(phrase)} are taken off &mdash; <strong>${p.money(r.perMonth)}</strong> a month. The deductions come to ${p.money(r.totalDeductions)}, or ${pct1(r.deductionRate)} of the gross, and the next ${p.currency === "JPY" ? "yen" : "unit"} earned is taxed at ${Math.round(r.marginalRate)}%.</p>
${bandTables(p, r)}${comparison(p, gross)}    </main>

    <main class="tool">
      <p class="tool-section-title">How ${esc(m0)} after tax is worked out</p>
${explanation(p, r)}
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${faqHtml}    </main>

${aboutTheFigures(p)}
    <div class="hub-group-title" style="margin-top:28px;">Other salaries in ${esc(inName)}</div>
    <div class="hub-grid">
${others}${card(hubUrl(p), "📋", `All salaries in ${p.place.shortName}`, "Every salary, hourly rate and monthly figure, with a calculator.")}${p.root.country === "US" ? card("/salary/us/", "🇺🇸", "Compare all 50 states", "Take-home pay in every state at the same salary.") : p.root.country === "CA" ? card("/salary/canada/", "🇨🇦", "Compare every province", "Take-home pay in all 13 provinces and territories.") : card("/salary/", "🌍", "Other countries", "Salary after tax pages for other countries.")}    </div>

${FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-page.js"></script>
</body>
</html>
`;
}

function crumbs(p) {
  const list = [["Home", SITE + "/"], ["Salary after tax", SITE + "/salary/"]];
  if (p.root.country === "US") list.push(["United States", SITE + "/salary/us/"]);
  if (p.root.country === "CA") list.push(["Canada", SITE + "/salary/canada/"]);
  list.push([p.place.shortName, SITE + hubUrl(p)]);
  return list;
}

// ---------------------------------------------------------------- place hub

function placeHub(p) {
  const gross = config.HEADLINE[p.currency];
  const r = TaxEngine.compute(p.chain, gross, p.defaults);
  const url = SITE + hubUrl(p);
  const inName = p.place.inName;
  const year = p.doc.taxYear.label;
  const title = `Salary After Tax in ${inName} (${year}) — Take-Home Pay Calculator`;
  const desc = `Take-home pay in ${inName} for the ${year} tax year: ${p.money0(gross)} leaves ${p.money(r.net)}. Calculator and tables for every salary from ${p.money0(p.salaries[0])} to ${p.money0(p.salaries[p.salaries.length - 1])}.`;
  const opts = optionSummary(p, p.defaults);
  const status = statusLabel(p, p.defaults);
  const assumptionsLine = [status ? lowerFirst(status) : null, opts].filter(Boolean).join("; ");

  const rows = p.salaries.map((s) => {
    const o = TaxEngine.compute(p.chain, s, p.defaults);
    return `<tr><td><a href="${pageUrl(p, s)}">${esc(p.money0(s))}</a></td><td>${p.money(o.net)}</td><td>${p.money(o.perMonth)}</td><td>${pct1(o.deductionRate)}</td><td>${Math.round(o.marginalRate)}%</td></tr>`;
  }).join("");

  const ld = [webPage(title, desc, url), breadcrumb(crumbs(p)), {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: p.salaries.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: `${p.money0(s)} after tax in ${inName}`, url: SITE + pageUrl(p, s) }))
  }];

  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${p.root.country === "US" ? "/salary/us/" : p.root.country === "CA" ? "/salary/canada/" : "/salary/"}">← ${p.root.country === "US" ? "All states" : p.root.country === "CA" ? "All provinces" : "Salary after tax"}</a>
      <h1 class="page-title">Salary after tax in ${esc(inName)}</h1>
      <p class="page-subtitle">Take-home pay for the ${esc(year)} tax year${assumptionsLine ? " — " + esc(assumptionsLine) : ""}. Change the salary or options below.</p>
    </header>

${toolBlock(p, gross, r, `Where ${p.money0(gross)} goes`)}
    <main class="tool">
      <p class="tool-section-title">Take-home pay by salary</p>
      <div class="table-scroll">
        <div style="min-width:480px;">
          <table class="out-table">
            <thead><tr><th>Salary</th><th>Take-home a year</th><th>A month</th><th>Effective rate</th><th>Marginal rate</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
${payLinks(p)}${comparison(p, gross)}    </main>

    <main class="tool">
      <p class="tool-section-title">What comes out of pay in ${esc(inName)}</p>
${explanation(p, r)}
    </main>

${aboutTheFigures(p)}
${FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-page.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- hourly and monthly pages

/* The hourly and monthly pages a place has, as link lists for its hub */
function payLinks(p) {
  const parts = [];
  if (p.hourly.length) {
    parts.push(`      <p class="tool-section-title" style="margin-top:22px;">By hourly rate</p>
      <p class="salary-links">${p.hourly.map((h) => `<a href="${hourUrl(p, h)}">${esc(p.money0(h))} an hour</a>`).join(" ")}</p>
`);
  }
  if (p.monthly.length) {
    parts.push(`      <p class="tool-section-title" style="margin-top:22px;">By monthly pay</p>
      <p class="salary-links">${p.monthly.map((m) => `<a href="${monthUrl(p, m)}">${esc(p.money0(m))} a month</a>`).join(" ")}</p>
`);
  }
  return parts.join("");
}

/* The UK file covers England, Wales and Northern Ireland only; say so where
   a page is titled "in the UK" */
function ukNote(p, scotUrl) {
  if (p.id !== "gb") return "";
  return `      <p class="tool-hint">These figures are for England, Wales and Northern Ireland. Scotland sets its own income tax bands${scotUrl ? ` &mdash; <a href="${scotUrl}">see the Scottish figures</a>` : ""}.</p>
`;
}

function assumptionsFor(p) {
  const opts = optionSummary(p, p.defaults);
  const status = statusLabel(p, p.defaults);
  return [status ? lowerFirst(status) : null, opts].filter(Boolean).join("; ");
}

function accuracyFaq(p, what) {
  const verified = p.chain.every((d) => d.lastVerified);
  const line = assumptionsFor(p);
  return [`How accurate are these figures?`,
    `They apply the ${p.doc.taxYear.label} rates and thresholds to ${what}${line ? " for " + line : ""}. ` +
    (verified ? "The rates have been checked against the official sources." : "The rates come from published sources listed on this page but have not yet been checked by a person against the official tax authority, so confirm them before relying on them.") +
    " Pensions, credits and deductions specific to you will change the result."];
}

function leavesOutFaq(p) {
  const notModelled = Array.from(new Set(p.chain.flatMap((d) => d.notModelled || [])));
  return [`What does this leave out?`, notModelled.length ? notModelled.join("; ") + "." : "Nothing beyond the assumptions listed on this page."];
}

function hourlyPage(p, rate) {
  const hrs = p.hours;
  const yearHours = hrs * 52;
  const gross = rate * yearHours;
  const r = TaxEngine.compute(p.chain, gross, p.defaults);
  const perHour = r.net / yearHours;
  const url = SITE + hourUrl(p, rate);
  const inName = p.place.inName;
  const year = p.doc.taxYear.label;
  const mr = p.money0(rate);
  const line = assumptionsFor(p);
  const phrase = deductionPhrase(p);
  const title = `${mr} an Hour After Tax in ${inName} (${year}) — Take-Home Pay`;
  const desc = `${mr} an hour at ${hrs} hours a week is ${p.money0(gross)} a year. In ${inName} that leaves ${p.money(r.net)} after tax — ${p.money(r.perMonth)} a month, or ${p.money(perHour)} for each hour worked.`;

  /* The same rate at other weekly hours: part-time to long weeks */
  const weeks = Array.from(new Set([16, 20, 30, hrs, 45])).sort((a, b) => a - b);
  const hoursRows = weeks.map((h) => {
    const g = rate * h * 52;
    const o = TaxEngine.compute(p.chain, g, p.defaults);
    const cell = (x) => (h === hrs ? `<strong>${x}</strong>` : x);
    return [cell(h + " hours"), cell(p.money0(g)), cell(p.money(o.net)), cell(p.money(o.perMonth)), cell(p.money(o.net / (h * 52)))];
  });

  const overtime = rate * (1 - r.marginalRate / 100);
  const part = TaxEngine.compute(p.chain, rate * 20 * 52, p.defaults);
  const q = [
    [`How much is ${mr} an hour a year?`,
      `${mr} an hour for ${hrs} hours a week over 52 weeks is ${p.money0(gross)} a year before tax. After ${phrase} in ${inName}, that leaves ${p.money(r.net)} a year.`],
    [`How much is ${mr} an hour after tax a month?`,
      `${p.money(r.perMonth)} a month, or ${p.money(r.perWeek)} a week, working ${hrs} hours a week. Each hour worked takes home ${p.money(perHour)} once ${pct1(r.deductionRate)} has gone in deductions.`],
    [`What if I work part-time at ${mr} an hour?`,
      `At 20 hours a week, ${mr} an hour is ${p.money0(rate * 20 * 52)} a year and leaves ${p.money(part.net)} after tax, or ${p.money(part.perMonth)} a month. Lower earnings are taxed at a lower average rate, so take-home doesn't fall quite in proportion to the hours. The table above covers other weekly hours.`],
    [`How much of an overtime hour do I keep?`,
      `At this level of pay your marginal rate is ${Math.round(r.marginalRate)}%, so an extra hour at ${mr} leaves about ${p.money(overtime)} after tax. Overtime paid at a higher rate keeps the same share of the higher figure.`]
  ];
  if (p.id === "gb") q.push(["Is this the same in Scotland?", "No. Scotland sets its own income tax bands and rates, so the income tax differs at most rates of pay; National Insurance is the same across the UK. These figures are for England, Wales and Northern Ireland."]);
  q.push(leavesOutFaq(p));
  q.push(accuracyFaq(p, `${mr} an hour for ${hrs} hours a week`));

  const crumb = crumbs(p).concat([[`${mr} an hour after tax`, url]]);
  const ld = [webPage(title, desc, url), breadcrumb(crumb), faqLd(q)];

  const others = site.neighbours(p.hourly, rate, 4).map((h) => {
    const o = TaxEngine.compute(p.chain, h * yearHours, p.defaults);
    return card(hourUrl(p, h), iconFor(p), `${p.money0(h)} an hour after tax`, `${p.money0(o.net)} a year, ${p.money0(o.perMonth)} a month.`);
  }).join("");
  const national = p.root.country === "US" && config.HOURLY.USD.national.includes(rate)
    ? card(`/salary/us/${rate}-an-hour-after-tax/`, "🇺🇸", `${mr} an hour in every state`, "Take-home pay at this rate in all 50 states, ranked.") : "";
  const scot = p.id === "gb" && byId["gb-sct"] ? hourUrl(byId["gb-sct"], rate) : null;

  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${hubUrl(p)}">← Salary after tax in ${esc(inName)}</a>
      <h1 class="page-title">${esc(mr)} an hour after tax in ${esc(inName)}</h1>
      <p class="page-subtitle">${hrs} hours a week, 52 weeks a year: ${esc(p.money0(gross))} before tax in the ${esc(year)} tax year${line ? " — " + esc(line) : ""}.</p>
    </header>

${toolBlock(p, gross, r, "Where it goes", { kind: "hourly", value: rate, hours: hrs })}
    <main class="tool">
      <p class="about-text">Paid <strong>${esc(mr)} an hour</strong> for ${hrs} hours a week, you earn ${esc(p.money0(gross))} a year. Once ${esc(phrase)} are taken off in ${esc(inName)}, you take home <strong>${p.money(r.net)}</strong> a year &mdash; <strong>${p.money(r.perMonth)}</strong> a month, or ${p.money(perHour)} for every hour worked.</p>
${ukNote(p, scot)}      <p class="tool-section-title" style="margin-top:22px;">${esc(mr)} an hour at different hours</p>
${site.table(["Hours a week", "Gross a year", "Take-home a year", "A month", "Per hour"], hoursRows, 480)}      <p class="tool-hint" style="margin-top:12px;">Assumes you're paid for all 52 weeks, including paid holiday. If some weeks are unpaid, enter your average weekly hours across the year in the calculator above.</p>
${bandTables(p, r)}${comparison(p, gross, { label: `${mr} an hour`, link: (o) => (o.hourly.includes(rate) ? hourUrl(o, rate) : null) })}    </main>

    <main class="tool">
      <p class="tool-section-title">How ${esc(mr)} an hour after tax is worked out</p>
      <p class="about-text">The hourly rate is turned into a yearly salary first &mdash; ${esc(mr)} &times; ${hrs} hours &times; 52 weeks = ${esc(p.money0(gross))} &mdash; because tax is worked out on yearly income. The take-home is then spread back over the year.</p>
${explanation(p, r)}
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${aboutTheFigures(p)}
    <div class="hub-group-title" style="margin-top:28px;">Other hourly rates in ${esc(inName)}</div>
    <div class="hub-grid">
${others}${national}${card(hubUrl(p), "📋", `All pay in ${p.place.shortName}`, "Every salary, hourly rate and monthly figure, with a calculator.")}    </div>

${FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-page.js"></script>
</body>
</html>
`;
}

function monthlyPage(p, monthly) {
  const gross = monthly * 12;
  const r = TaxEngine.compute(p.chain, gross, p.defaults);
  const url = SITE + monthUrl(p, monthly);
  const inName = p.place.inName;
  const year = p.doc.taxYear.label;
  const mm = p.money0(monthly);
  const line = assumptionsFor(p);
  const phrase = deductionPhrase(p);
  const title = `${mm} a Month After Tax in ${inName} (${year}) — Monthly Take-Home Pay`;
  const desc = `${mm} a month before tax is ${p.money0(gross)} a year. In ${inName} it leaves ${p.money(r.perMonth)} a month after tax — ${p.money(r.net)} a year.`;

  const rows = site.neighbours(p.monthly, monthly, 3).concat([monthly]).sort((a, b) => a - b).map((x) => {
    const o = TaxEngine.compute(p.chain, x * 12, p.defaults);
    const cell = (c) => (x === monthly ? `<strong>${c}</strong>` : c);
    const name = x === monthly ? esc(p.money0(x)) : `<a href="${monthUrl(p, x)}">${esc(p.money0(x))}</a>`;
    return [cell(name), cell(p.money(o.perMonth)), cell(p.money(o.totalDeductions / 12)), cell(pct1(o.deductionRate))];
  });

  const monthTax = r.totalDeductions / 12;
  const q = [
    [`How much is ${mm} a month after tax in ${inName}?`,
      `${p.money(r.perMonth)} a month. ${mm} a month is ${p.money0(gross)} a year before tax; after ${phrase} that leaves ${p.money(r.net)} a year, or ${p.money(r.perWeek)} a week.`],
    [`How much is ${mm} a month a year?`,
      `${p.money0(gross)} before tax — twelve times the monthly figure. Salaries are usually quoted per year, so this is the number to compare with a job advert.`],
    [`How much tax do I pay on ${mm} a month?`,
      `About ${p.money(monthTax)} a month, ${pct1(r.deductionRate)} of the gross, counting every deduction on this page. The next ${p.currency === "JPY" ? "yen" : "unit"} you earn is taxed at ${Math.round(r.marginalRate)}%.`],
    [`Why might my payslip show a different amount?`,
      p.currency === "GBP"
        ? "PAYE works cumulatively across the tax year, so the first month of a new job, a mid-year pay rise or an emergency tax code can make one month's figure differ. Pension contributions, student loan repayments and benefits in kind also come off a real payslip."
        : "Withholding in a single month can differ from a twelfth of the annual figure — for example in the first month of a job, after a pay rise, or where bonuses and one-off payments are taxed differently. Pension contributions and other deductions specific to you also come off a real payslip."]
  ];
  if (p.id === "gb") q.push(["Is this the same in Scotland?", "No. Scotland sets its own income tax bands and rates, so the income tax differs at most salaries; National Insurance is the same across the UK. These figures are for England, Wales and Northern Ireland."]);
  q.push(leavesOutFaq(p));
  q.push(accuracyFaq(p, `${mm} a month`));

  const crumb = crumbs(p).concat([[`${mm} a month after tax`, url]]);
  const ld = [webPage(title, desc, url), breadcrumb(crumb), faqLd(q)];

  const others = site.neighbours(p.monthly, monthly, 4).map((x) => {
    const o = TaxEngine.compute(p.chain, x * 12, p.defaults);
    return card(monthUrl(p, x), iconFor(p), `${p.money0(x)} a month after tax`, `${p.money0(o.perMonth)} a month, ${p.money0(o.net)} a year.`);
  }).join("");
  const scot = p.id === "gb" && byId["gb-sct"] ? monthUrl(byId["gb-sct"], monthly) : null;

  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${hubUrl(p)}">← Salary after tax in ${esc(inName)}</a>
      <h1 class="page-title">${esc(mm)} a month after tax in ${esc(inName)}</h1>
      <p class="page-subtitle">What ${esc(mm)} a month before tax leaves you in the ${esc(year)} tax year${line ? " — " + esc(line) : ""}.</p>
    </header>

${toolBlock(p, gross, r, "Where it goes, over a year", { kind: "monthly", value: monthly })}
    <main class="tool">
      <p class="about-text">Gross pay of <strong>${esc(mm)} a month</strong> is ${esc(p.money0(gross))} a year. Once ${esc(phrase)} are taken off in ${esc(inName)}, you take home <strong>${p.money(r.perMonth)}</strong> a month &mdash; ${p.money(r.net)} a year. About ${p.money(monthTax)} a month, ${pct1(r.deductionRate)} of your pay, goes in deductions.</p>
${ukNote(p, scot)}      <p class="tool-section-title" style="margin-top:22px;">Nearby monthly pay</p>
${site.table(["Gross a month", "Take-home a month", "Deductions a month", "Effective rate"], rows, 420)}${bandTables(p, r)}${comparison(p, gross, { label: `${mm} a month`, link: (o) => (o.monthly.includes(monthly) ? monthUrl(o, monthly) : null) })}    </main>

    <main class="tool">
      <p class="tool-section-title">How ${esc(mm)} a month after tax is worked out</p>
      <p class="about-text">Tax is worked out on the year, so the monthly figure is multiplied by twelve &mdash; ${esc(p.money0(gross))} &mdash; the deductions are worked out on that, and the take-home is divided back by twelve. The yearly amounts below are for the whole year.</p>
${explanation(p, r)}
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${aboutTheFigures(p)}
    <div class="hub-group-title" style="margin-top:28px;">Other monthly pay in ${esc(inName)}</div>
    <div class="hub-grid">
${others}${card(hubUrl(p), "📋", `All pay in ${p.place.shortName}`, "Every salary, hourly rate and monthly figure, with a calculator.")}    </div>

${FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-page.js"></script>
</body>
</html>
`;
}

/* /salary/us/<rate>-an-hour-after-tax/: one hourly rate in every state */
function usHourly(rate) {
  const hrs = config.HOURLY.USD.hours;
  const gross = rate * hrs * 52;
  const usd = (v) => TaxEngine.money(v, "USD");
  const mr = TaxEngine.money(rate, "USD", true);
  const states = places.filter((p) => p.root.country === "US");
  const rows = states.map((p) => ({ p, r: TaxEngine.compute(p.chain, gross, p.defaults) })).sort((a, b) => b.r.net - a.r.net);
  const best = rows[0], worst = rows[rows.length - 1];
  const median = rows[Math.floor(rows.length / 2)];
  const url = SITE + `/salary/us/${rate}-an-hour-after-tax/`;
  const title = `${mr} an Hour After Tax in Every State (2026) — Take-Home Pay by State`;
  const desc = `${mr} an hour full-time is ${TaxEngine.money(gross, "USD", true)} a year. After tax it leaves ${usd(best.r.net)} in ${best.p.place.shortName} and ${usd(worst.r.net)} in ${worst.p.place.shortName}. All 50 states and DC, ranked.`;

  const body = rows.map(({ p, r }, i) => {
    const href = p.hourly.includes(rate) ? hourUrl(p, rate) : hubUrl(p);
    return [String(i + 1), `<a href="${href}">${esc(p.place.shortName)}</a>`, usd(r.net), usd(r.perMonth), usd(r.net / (hrs * 52)), pct1(r.deductionRate)];
  });

  const q = [
    [`How much is ${mr} an hour a year?`, `${mr} an hour for ${hrs} hours a week over 52 weeks is ${usd(gross)} a year before tax.`],
    [`How much is ${mr} an hour after taxes?`, `It depends on the state. A single filer on the standard deduction takes home between ${usd(worst.r.net)} a year in ${worst.p.place.shortName} and ${usd(best.r.net)} in ${best.p.place.shortName}; in the middle state, ${median.p.place.shortName}, it is ${usd(median.r.net)}, or ${usd(median.r.perMonth)} a month.`],
    [`Which states take the least from ${mr} an hour?`, `States with no tax on wages come out on top: ${rows.slice(0, 5).map((x) => x.p.place.shortName).join(", ")} lead the table. Federal income tax, Social Security and Medicare are the same in every state.`],
    [`How much is ${mr} an hour per month after tax?`, `Between ${usd(worst.r.perMonth)} and ${usd(best.r.perMonth)} a month depending on the state, working ${hrs} hours a week. Each state's page has the full breakdown and a calculator for your own hours.`]
  ];
  const ld = [webPage(title, desc, url), breadcrumb([["Home", SITE + "/"], ["Salary after tax", SITE + "/salary/"], ["United States", SITE + "/salary/us/"], [`${mr} an hour`, url]]), faqLd(q)];

  const nat = config.HOURLY.USD.national;
  const others = site.neighbours(nat, rate, 4).map((h) => card(`/salary/us/${h}-an-hour-after-tax/`, "🇺🇸", `${TaxEngine.money(h, "USD", true)} an hour after tax`, `${TaxEngine.money(h * hrs * 52, "USD", true)} a year before tax, in every state.`)).join("");

  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/salary/us/">← All states</a>
      <h1 class="page-title">${esc(mr)} an hour after tax in every state</h1>
      <p class="page-subtitle">${hrs} hours a week, 52 weeks a year (${esc(usd(gross))}), 2026, single filer on the standard deduction.</p>
    </header>

    <main class="tool">
      <p class="about-text">Working full-time at <strong>${esc(mr)} an hour</strong> earns ${esc(usd(gross))} a year. After federal and state taxes and payroll deductions, that leaves <strong>${usd(best.r.net)}</strong> in ${esc(best.p.place.shortName)} but <strong>${usd(worst.r.net)}</strong> in ${esc(worst.p.place.shortName)} &mdash; ${usd(best.r.net - worst.r.net)} a year apart for the same hours at the same rate.</p>
${site.table(["#", "State", "Take-home a year", "A month", "Per hour", "Effective rate"], body, 560)}      <p class="tool-hint" style="margin-top:12px;">Federal income tax, Social Security and Medicare are the same everywhere; the differences are state and local income taxes and state payroll programs. Indiana and Maryland include a county tax at their most populous county's rate; other local taxes are not included. Each state's page lists what it leaves out.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other hourly rates</div>
    <div class="hub-grid">
${others}${card("/salary/us/", "🇺🇸", "Salary after tax by state", "Every state at $50k, $75k and $100k.")}    </div>

${FOOTER}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- US hub

function usHub() {
  const states = places.filter((p) => p.root.country === "US");
  const cols = [50000, 75000, 100000];
  const rows = states.map((p) => ({ p, rs: cols.map((g) => TaxEngine.compute(p.chain, g, p.defaults)) }))
    .sort((a, b) => b.rs[1].net - a.rs[1].net);
  const usd = (v) => TaxEngine.money(v, "USD");
  const body = rows.map(({ p, rs }, i) =>
    `<tr><td>${i + 1}</td><td><a href="${hubUrl(p)}">${esc(p.place.shortName)}</a></td>${rs.map((r, j) => `<td><a href="${pageUrl(p, cols[j])}">${usd(r.net)}</a></td>`).join("")}<td>${pct1(rs[1].deductionRate)}</td></tr>`).join("");
  const best = rows[0], worst = rows[rows.length - 1];
  const url = SITE + "/salary/us/";
  const title = "Salary After Tax by State (2026) — Take-Home Pay in All 50 States";
  const desc = `Take-home pay in every US state for 2026: $75,000 leaves ${usd(best.rs[1].net)} in ${best.p.place.shortName} and ${usd(worst.rs[1].net)} in ${worst.p.place.shortName}. Federal, state and local taxes and payroll deductions.`;
  const ld = [webPage(title, desc, url), breadcrumb([["Home", SITE + "/"], ["Salary after tax", SITE + "/salary/"], ["United States", url]])];
  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/salary/">← Salary after tax</a>
      <h1 class="page-title">Salary after tax in every US state</h1>
      <p class="page-subtitle">2026 take-home pay for a single filer on the standard deduction, after federal and state income tax, Social Security, Medicare and state payroll programs.</p>
    </header>

    <main class="tool">
      <p class="about-text">The same $75,000 salary leaves <strong>${usd(best.rs[1].net)}</strong> in ${esc(best.p.place.shortName)} and <strong>${usd(worst.rs[1].net)}</strong> in ${esc(worst.p.place.shortName)} &mdash; a gap of ${usd(best.rs[1].net - worst.rs[1].net)} a year. Federal tax and FICA are the same everywhere; the difference is state and local income tax and the payroll programs some states run. Pick a state for a calculator and every salary from $30,000 to $200,000.</p>
      <div class="table-scroll">
        <div style="min-width:520px;">
          <table class="out-table">
            <thead><tr><th>#</th><th>State</th><th>$50,000</th><th>$75,000</th><th>$100,000</th><th>Effective rate at $75k</th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
      <p class="tool-section-title" style="margin-top:22px;">Hourly pay in every state</p>
      <p class="salary-links">${config.HOURLY.USD.national.map((h) => `<a href="/salary/us/${h}-an-hour-after-tax/">$${h} an hour</a>`).join(" ")}</p>
      <p class="tool-hint" style="margin-top:12px;">Ranked by take-home pay at $75,000. Indiana and Maryland include a county income tax at their most populous county's rate; local taxes elsewhere (Ohio and Michigan cities, Pennsylvania's earned income tax) are not included &mdash; each state's page says what it leaves out. Indexed figures some states had not yet published for 2026 use the 2025 amounts.</p>
    </main>

${FOOTER}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- Canada hub

function caHub() {
  const provs = places.filter((p) => p.root.country === "CA");
  const cols = [50000, 75000, 100000];
  const rows = provs.map((p) => ({ p, rs: cols.map((g) => TaxEngine.compute(p.chain, g, p.defaults)) }))
    .sort((a, b) => b.rs[1].net - a.rs[1].net);
  const cad = (v) => TaxEngine.money(v, "CAD");
  const body = rows.map(({ p, rs }, i) =>
    `<tr><td>${i + 1}</td><td><a href="${hubUrl(p)}">${esc(p.place.shortName)}</a></td>${rs.map((r, j) => `<td><a href="${pageUrl(p, cols[j])}">${cad(r.net)}</a></td>`).join("")}<td>${pct1(rs[1].deductionRate)}</td></tr>`).join("");
  const best = rows[0], worst = rows[rows.length - 1];
  const fedDoc = current["ca"].doc;
  const url = SITE + "/salary/canada/";
  const title = "Salary After Tax in Canada (2026) — Take-Home Pay by Province";
  const desc = `Take-home pay in every Canadian province and territory for 2026: $75,000 leaves ${cad(best.rs[1].net)} in ${best.p.place.shortName} and ${cad(worst.rs[1].net)} in ${worst.p.place.shortName}, after federal and provincial tax, CPP and EI.`;
  const ld = [webPage(title, desc, url), breadcrumb([["Home", SITE + "/"], ["Salary after tax", SITE + "/salary/"], ["Canada", url]])];
  const q = [
    ["Which province has the lowest taxes on a salary?", `At $75,000, ${best.p.place.shortName} leaves the most (${cad(best.rs[1].net)} a year) and ${worst.p.place.shortName} the least (${cad(worst.rs[1].net)}). The order changes with income: a province with a high basic personal amount does well at lower salaries, one with low top rates at higher ones, so check the columns for your pay.`],
    ["What comes off a paycheque in Canada?", "Federal income tax, provincial or territorial income tax, Canada Pension Plan contributions (5.95% of earnings between $3,500 and $74,600, plus 4% up to $85,000) and Employment Insurance premiums (1.63% of earnings up to $68,900). Quebec has its own pension plan and parental insurance instead, and a lower EI rate."],
    ["Why is federal tax lower in Quebec?", "Quebec residents get the Quebec abatement: 16.5% off basic federal tax, because Quebec runs some programs that the federal government pays for elsewhere. Quebec income tax is higher to match, and is collected by Revenu Québec."]
  ];
  ld.push(faqLd(q));
  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/salary/">← Salary after tax</a>
      <h1 class="page-title">Salary after tax in Canada</h1>
      <p class="page-subtitle">${esc(fedDoc.taxYear.label)} take-home pay in every province and territory, after federal and provincial income tax, CPP (or QPP) and EI.</p>
    </header>

    <main class="tool">
      <p class="about-text">The same $75,000 salary leaves <strong>${cad(best.rs[1].net)}</strong> in ${esc(best.p.place.shortName)} and <strong>${cad(worst.rs[1].net)}</strong> in ${esc(worst.p.place.shortName)} &mdash; ${cad(best.rs[1].net - worst.rs[1].net)} a year apart. Federal tax, CPP and EI are the same everywhere outside Quebec; the rest is provincial tax. Pick a province for a calculator and every salary from $40,000 to $250,000.</p>
      <div class="table-scroll">
        <div style="min-width:520px;">
          <table class="out-table">
            <thead><tr><th>#</th><th>Province or territory</th><th>$50,000</th><th>$75,000</th><th>$100,000</th><th>Effective rate at $75k</th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Ranked by take-home pay at $75,000, for one job all year with only the basic personal amount claimed, worked out with the CRA's payroll formulas. ${esc(TaxEngine.checkedLine({ taxYear: fedDoc.taxYear.label, lastChecked: fedDoc.lastChecked }))}.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${FOOTER}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- salary calculator (/salary/)

/* /salary/ is the calculator people reach from the homepage: pick where you're
   paid, type a salary, see the take-home. The per-salary pages exist for
   search engines and people arriving from them; here they sit in a folded
   list at the bottom rather than being the page. */

const REGIONS = {
  Europe: ["DE", "FR", "ES", "IT", "NL", "IE", "PT", "AT", "NO", "DK", "SE"],
  "Asia-Pacific": ["AU", "NZ", "IN", "JP"]
};

function locationList() {
  const ukChain = registry.loadChain("gb");
  const entry = (id, name, currency, hub) => ({ id, name, currency, hub, gross: config.HEADLINE[currency] });
  const groups = [["United Kingdom", [entry("gb", "England, Wales & Northern Ireland", ukChain[0].currency, "")]]];
  if (byId["gb-sct"]) groups[0][1].push(entry("gb-sct", "Scotland", "GBP", hubUrl(byId["gb-sct"])));
  const named = (ps) => ps.map((p) => entry(p.id, p.place.shortName, p.currency, hubUrl(p))).sort((a, b) => a.name.localeCompare(b.name));
  groups.push(["United States", named(places.filter((p) => p.root.country === "US"))]);
  groups.push(["Canada", named(places.filter((p) => p.root.country === "CA"))]);
  Object.keys(REGIONS).forEach((region) => groups.push([region, named(places.filter((p) => REGIONS[region].includes(p.root.country)))]));
  return groups;
}

function salaryIndex() {
  const url = SITE + "/salary/";
  const title = "Salary After Tax Calculator — Take-Home Pay in the UK, US, Canada, Europe & More";
  const desc = "Work out your take-home pay after income tax and social contributions for the UK, every US state, every Canadian province, Western Europe, Australia, New Zealand, India and Japan, for the current tax year.";
  const groups = locationList();

  /* Baked for the default location so the page shows a real answer before,
     or without, its script */
  const chain = registry.loadChain("gb");
  const gross = config.HEADLINE.GBP;
  const r = TaxEngine.compute(chain, gross);
  const m = (v) => TaxEngine.money(v, "GBP");
  const row = (label, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${esc(label)}</span><span class="r-value">${value}</span></div>`;
  const breakdown = [row("Gross salary", TaxEngine.money(gross, "GBP", true))]
    .concat(r.shown.map((s) => row(s.label, m(s.amount))))
    .concat(r.charges.map((c) => row(c.label, m(c.amount))))
    .concat([row("Total deductions", m(r.totalDeductions)), row("Effective rate", pct1(r.deductionRate)),
      row("Marginal rate", Math.round(r.marginalRate) + "%"), row("Take-home pay", m(r.net), "highlight")]).join("\n");

  const select = groups.map(([label, xs]) => `          <optgroup label="${esc(label)}">${xs.map((x) =>
    `<option value="${esc(x.id)}" data-currency="${x.currency}" data-gross="${x.gross}" data-hub="${esc(x.hub)}"${x.id === "gb" ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("\n");

  const tables = groups.map(([label, xs]) => {
    const links = label === "United Kingdom"
      ? [`<a href="/salary/uk/">England, Wales &amp; N. Ireland: every salary, hourly rate and monthly figure</a>`].concat(xs.filter((x) => x.hub).map((x) => `<a href="${x.hub}">${esc(x.name)}</a>`))
      : (label === "United States" ? [`<a href="/salary/us/">All states compared</a>`] : label === "Canada" ? [`<a href="/salary/canada/">All provinces compared</a>`] : []).concat(xs.map((x) => `<a href="${x.hub}">${esc(x.name)}</a>`));
    return `        <p class="salary-links-title">${esc(label)}</p>
        <p class="salary-links">${links.join(" ")}</p>`;
  }).join("\n");

  const ld = [
    webPage(title, desc, url),
    breadcrumb([["Home", SITE + "/"], ["Salary after tax", url]]),
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: "Salary After Tax Calculator", url: url,
      applicationCategory: "FinanceApplication", operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }
    }
  ];

  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Salary after tax</h1>
      <p class="page-subtitle">What your salary leaves you after tax, wherever you're paid.</p>
    </header>

    <main class="tool" id="salary-calc">
      <div class="field-row">
        <div class="field">
          <label for="location">Where you're paid</label>
          <select id="location">
${select}
          </select>
        </div>
        <div class="field">
          <label for="salary">Gross annual salary (<span id="salary-currency">GBP</span>)</label>
          <input type="number" id="salary" value="${gross}" step="any" min="0" inputmode="decimal" placeholder="0">
        </div>
      </div>
      <div class="field-row" id="salary-options"></div>
      <p class="tool-hint" id="salary-error" role="alert" style="color: var(--bad); display: none;"></p>

      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="out-net">${m(r.net)}</div>
          <div class="label">Take-home pay, a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A month</span><span class="r-value" id="out-month">${m(r.perMonth)}</span></div>
          <div class="result-row"><span class="r-label">A week</span><span class="r-value" id="out-week">${m(r.perWeek)}</span></div>
          <div class="result-row"><span class="r-label">A working day</span><span class="r-value" id="out-day">${m(r.perDay)}</span></div>
          <div class="result-row"><span class="r-label">Effective tax rate</span><span class="r-value" id="out-rate">${pct1(r.deductionRate)}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">Where it goes</p>
      <div class="result-box">
        <div class="result-grid" id="breakdown">
${breakdown}
        </div>
      </div>
      <p class="tool-hint" id="salary-note" style="margin-top:12px;">${esc(chain[0].taxYear.label)} tax year. An estimate, not a payslip: it assumes one job and no other income. Pensions, student loans and other deductions can be added where the place has them.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How it works</p>
      <p class="about-text">Pick where you're paid and type your salary before any deductions. The calculator applies that place's current tax year &mdash; income tax, social contributions and the local taxes most employees pay &mdash; and shows each one. Some places have options, such as filing status in the US or region in Spain; they appear under the salary when they apply.</p>
      <p class="about-text">The rates come from published sources listed on each location's own page. They have not yet been checked by a person against the official tax authority, so treat the figures as estimates and confirm them before relying on them.</p>
    </main>

    <details class="fold-group salary-tables">
      <summary><span class="fold-name">Salary tables by location</span></summary>
${tables}
    </details>

${related.block("/salary/")}
${FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-calculator.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- /tax-rates/

/* Every tax file in force, when it was last checked, and whether a person
   has verified it. Rebuilt with everything else, so the monthly check that
   moves the dates also refreshes this page. */
function taxRatesPage() {
  const url = SITE + "/tax-rates/";
  const title = "Tax Rates Used on Lots Of Calcs — When Each Was Last Checked";
  const desc = "Every income tax and payroll rate set behind the salary calculators: the tax year in force, when it was last checked against published sources, and the official page to check it against.";
  const fmt = (d) => (d ? niceDate(d) : "Not yet");
  const ids = Object.keys(current).sort((a, b) => {
    const da = current[a].doc, db = current[b].doc;
    return (da.country + (da.parent ? "1" : "0") + da.name).localeCompare(db.country + (db.parent ? "1" : "0") + db.name);
  });
  const rows = ids.map((id) => {
    const d = current[id].doc;
    const name = byId[id] ? `<a href="${hubUrl(byId[id])}">${esc(d.name)}</a>` : esc(d.name);
    const official = d.verifyAt || (d.sources[0] && d.sources[0].url);
    return [name, esc(d.taxYear.label), fmt(d.lastChecked), d.lastVerified ? niceDate(d.lastVerified) : "Not yet",
      String((d.provisional || []).length || "—"), official ? `<a href="${esc(official)}" rel="nofollow noopener" target="_blank">Official source</a>` : ""];
  });
  const checkedCount = ids.filter((id) => current[id].doc.lastChecked).length;
  const ld = [webPage(title, desc, url), breadcrumb([["Home", SITE + "/"], ["Tax rates", url]])];
  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/salary/">← Salary after tax</a>
      <h1 class="page-title">Tax rates and when they were checked</h1>
      <p class="page-subtitle">Every tax and payroll rate set the salary calculators use.</p>
    </header>

    <main class="tool">
      <p class="about-text">Each country, state and region has its own file of rates and thresholds for its current tax year. They are checked every month against the tax authority's published figures and any change is put in straight away; ${checkedCount} of ${ids.length} have been checked so far. New tax years are prepared as soon as their figures are published and switch on when the year starts.</p>
      <p class="about-text"><strong>Last checked</strong> is the last time the figures were compared with current published sources and found to be up to date. <strong>Verified</strong> means a person has also gone through every figure against the official source. Until then, treat the results as estimates. <strong>Not yet confirmed</strong> counts figures that had not been published for the year when the file was made, where the previous year's amount is used.</p>
${site.table(["Where", "Tax year", "Last checked", "Verified", "Not yet confirmed", ""], rows, 640)}    </main>

${FOOTER}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- main

/* Folders of generated pages: anything matching here that this run didn't
   write is a page for an amount taken off a list, and is removed */
const GENERATED = /^\d+(-lakh)?-after-tax$|^\d+-an-hour-after-tax$|^\d+-a-month-after-tax$/;

function main() {
  uk.main();
  const urls = [["/salary/", "0.8"], ["/salary/us/", "0.8"], ["/salary/canada/", "0.8"]];
  uk.SALARIES.forEach((s) => urls.push([`/salary/${s}-after-tax/`, "0.7"]));

  const count = { annual: uk.SALARIES.length, hourly: 0, monthly: 0, hubs: 3 };
  everywhere.forEach((p) => {
    write(dirOf(hubUrl(p)), placeHub(p));
    urls.push([hubUrl(p), "0.7"]);
    count.hubs++;
    if (p.id !== "gb") {
      p.salaries.forEach((s) => {
        write(dirOf(pageUrl(p, s)), salaryPage(p, s));
        urls.push([pageUrl(p, s), "0.6"]);
        count.annual++;
      });
    }
    p.hourly.forEach((h) => {
      write(dirOf(hourUrl(p, h)), hourlyPage(p, h));
      urls.push([hourUrl(p, h), "0.6"]);
      count.hourly++;
    });
    p.monthly.forEach((m) => {
      write(dirOf(monthUrl(p, m)), monthlyPage(p, m));
      urls.push([monthUrl(p, m), "0.6"]);
      count.monthly++;
    });
  });
  config.HOURLY.USD.national.forEach((h) => {
    write(`salary/us/${h}-an-hour-after-tax`, usHourly(h));
    urls.push([`/salary/us/${h}-an-hour-after-tax/`, "0.7"]);
    count.hourly++;
  });
  write("salary/us", usHub());
  write("salary/canada", caHub());
  write("salary", salaryIndex());
  write("tax-rates", taxRatesPage());
  urls.push(["/tax-rates/", "0.5"]);

  let pruned = 0;
  new Set(["salary", "salary/us", "salary/canada"].concat(everywhere.map((p) => dirOf(base(p))))).forEach((dir) => { pruned += site.prune(dir, GENERATED); });

  site.sitemapBlock("salary pages", "tools/build-tax-pages.js", urls, "/salary/");
  console.log(`built ${count.annual} annual, ${count.hourly} hourly and ${count.monthly} monthly pages and ${count.hubs} hubs` +
    `; ${site.changed.size} changed, ${pruned} removed; sitemap lists ${urls.length} salary URLs`);
}

main();
