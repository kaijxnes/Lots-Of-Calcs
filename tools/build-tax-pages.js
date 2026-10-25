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
const fs = require("fs");
const path = require("path");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const config = require("./salary-pages-config.js");
const uk = require("./build-salary-pages.js");

const ROOT = registry.ROOT;
const SITE = "https://lotsofcalcs.com";
const TODAY = new Date().toISOString().slice(0, 10);

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

function write(rel, html) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
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
    money: (v) => TaxEngine.money(v, currency),
    money0: (v) => TaxEngine.money(v, currency, true)
  };
}

const places = Object.keys(current)
  .filter((id) => id !== "gb" && current[id].doc.standalone && config.placeFor(id, current[id].doc))
  .map(contextFor);
const byId = {};
places.forEach((p) => { byId[p.id] = p; });

function pageUrl(p, n) {
  return "/salary/" + p.place.path + "/" + slugFor(n, p.currency) + "/";
}

function hubUrl(p) {
  return "/salary/" + p.place.path + "/";
}

/* Phrase for what comes out of pay */
function deductionPhrase(p) {
  const hasSocial = p.items.some((it) => "charge" in it && it.group === "social");
  if (p.root.country === "US") return "federal and state taxes and payroll deductions";
  if (p.root.country === "GB") return "income tax and National Insurance";
  return hasSocial ? "income tax and social contributions" : "income tax";
}

function optionSummary(p, opts) {
  return Object.keys(p.options).filter((k) => k !== "status").map((k) =>
    p.options[k].label + ": " + p.options[k].choices[opts[k]]).join("; ");
}

function statusLabel(p, opts) {
  return p.options.status ? p.options.status.choices[opts.status] : null;
}

// ---------------------------------------------------------------- shared blocks

function toolBlock(p, gross, r, heading) {
  const selects = Object.keys(p.options).map((k) => {
    const o = p.options[k];
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

  return `    <main class="tool" id="salary-tool" data-tax-id="${esc(p.id)}" data-currency="${p.currency}" data-gross="${gross}">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" data-out="net">${p.money(r.net)}</div>
          <div class="label">Take-home pay, a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A month</span><span class="r-value" data-out="month">${p.money(r.perMonth)}</span></div>
          <div class="result-row"><span class="r-label">A week</span><span class="r-value" data-out="week">${p.money(r.perWeek)}</span></div>
          <div class="result-row"><span class="r-label">A working day</span><span class="r-value" data-out="day">${p.money(r.perDay)}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">${esc(heading)}</p>
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Gross salary</span><span class="r-value" data-out="gross">${p.money0(gross)}</span></div>
${shown}
${charges}
          <div class="result-row"><span class="r-label">Total deductions</span><span class="r-value" data-out="deductions">${p.money(r.totalDeductions)}</span></div>
          <div class="result-row"><span class="r-label">Effective rate</span><span class="r-value" data-out="rate">${pct1(r.deductionRate)}</span></div>
          <div class="result-row"><span class="r-label">Marginal rate</span><span class="r-value" data-out="marginal">${Math.round(r.marginalRate)}%</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home pay</span><span class="r-value" data-out="net">${p.money(r.net)}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">Try a different salary</p>
      <div class="field" style="max-width:320px;">
        <label for="salary">Gross annual salary (${p.currency})</label>
        <input type="number" id="salary" value="${gross}" step="any" min="0" placeholder="0">
      </div>
${selects}
      <p class="tool-hint" id="salary-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="salary-note">Change the salary or the options and everything above updates.</p>
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
  const parts = r.charges.map((c) => {
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
        : `The rates have not yet been checked by a person against the official sources — <a href="${esc(verifyAt)}" rel="nofollow noopener" target="_blank">check them here</a> before relying on them.`} This is an estimate, not a payslip.</p>
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

const ICON = { US: "🇺🇸", GB: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸", IT: "🇮🇹", NL: "🇳🇱", IE: "🇮🇪", PT: "🇵🇹", AT: "🇦🇹", NO: "🇳🇴", DK: "🇩🇰", SE: "🇸🇪", AU: "🇦🇺", NZ: "🇳🇿", IN: "🇮🇳", JP: "🇯🇵" };
function iconFor(p) {
  return p.id === "gb-sct" ? "🏴󠁧󠁢󠁳󠁣󠁴󠁿" : (ICON[p.root.country] || "💷");
}

// ---------------------------------------------------------------- comparison

function comparison(p, gross) {
  let ids;
  if (p.root.country === "US") ids = config.COMPARE.US;
  else if (p.currency === "EUR") ids = config.COMPARE.EUR;
  else return "";
  ids = Array.from(new Set([p.id].concat(ids))).filter((id) => byId[id]);
  const rows = ids.map((id) => {
    const q = byId[id];
    const r = TaxEngine.compute(q.chain, gross, q.defaults);
    return { q, r };
  }).sort((a, b) => b.r.net - a.r.net);
  const body = rows.map(({ q, r }) => {
    const name = q.id === p.id ? `<strong>${esc(q.place.shortName)}</strong>` : `<a href="${pageUrl(q, gross)}">${esc(q.place.shortName)}</a>`;
    return `<tr><td>${name}</td><td>${p.money(r.net)}</td><td>${p.money(r.perMonth)}</td><td>${pct1(r.deductionRate)}</td></tr>`;
  }).join("");
  const what = p.root.country === "US" ? "other states" : "other euro countries";
  return `      <p class="tool-section-title" style="margin-top:22px;">${esc(p.money0(gross))} in ${what}</p>
      <div class="table-scroll">
        <div style="min-width:420px;">
          <table class="out-table">
            <thead><tr><th>Where</th><th>Take-home a year</th><th>A month</th><th>Effective rate</th></tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Each place on its own default assumptions${p.root.country === "US" ? " — single filer, standard deduction" : ""}. Tax systems differ in what they count, so treat this as a rough guide to where the same salary goes further.</p>
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

  const lines = r.charges.filter((c) => Math.abs(c.amount) >= 0.005).map((c) => `${lowerFirst(c.label)} ${p.money(c.amount)}`);
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

  const others = p.salaries.filter((s) => s !== gross).map((s) => {
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
${others}${card(hubUrl(p), "📋", `All salaries in ${p.place.shortName}`, "Every salary on one page, with a calculator.")}${p.root.country === "US" ? card("/salary/us/", "🇺🇸", "Compare all 50 states", "Take-home pay in every state at the same salary.") : card("/salary/", "🌍", "Other countries", "Salary after tax pages for other countries.")}    </div>

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
      <a class="back-link" href="${p.root.country === "US" ? "/salary/us/" : "/salary/"}">← ${p.root.country === "US" ? "All states" : "Salary after tax"}</a>
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
${comparison(p, gross)}    </main>

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
      <p class="tool-hint" style="margin-top:12px;">Ranked by take-home pay at $75,000. Indiana and Maryland include a county income tax at their most populous county's rate; local taxes elsewhere (Ohio and Michigan cities, Pennsylvania's earned income tax) are not included &mdash; each state's page says what it leaves out. Indexed figures some states had not yet published for 2026 use the 2025 amounts.</p>
    </main>

${FOOTER}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- salary index

function salaryIndex() {
  const url = SITE + "/salary/";
  const title = "Salary After Tax Calculators — UK, US States, Europe, Australia, India & Japan";
  const desc = "Take-home pay calculators and salary tables for the UK, all 50 US states, Western Europe, Australia, New Zealand, India and Japan, for the current tax year.";
  const ukChain = registry.loadChain("gb");
  const ukLine = (s) => {
    const r = TaxEngine.compute(ukChain, s);
    return `${TaxEngine.money(r.net, "GBP", true)} a year, ${TaxEngine.money(r.perMonth, "GBP", true)} a month.`;
  };
  const ukCards = uk.SALARIES.map((s) => card(`/salary/${s}-after-tax/`, "🇬🇧", `${TaxEngine.money(s, "GBP", true)} after tax`, ukLine(s))).join("");
  const headline = (p) => {
    const g = config.HEADLINE[p.currency];
    const r = TaxEngine.compute(p.chain, g, p.defaults);
    return `${p.money0(g)} leaves ${p.money0(r.net)} a year.`;
  };
  const group = (filter) => places.filter(filter).map((p) => card(hubUrl(p), iconFor(p), `Salary after tax in ${p.place.shortName}`, headline(p))).join("");
  const europe = group((p) => ["DE", "FR", "ES", "IT", "NL", "IE", "PT", "AT", "NO", "DK", "SE"].includes(p.root.country));
  const apac = group((p) => ["AU", "NZ", "IN", "JP"].includes(p.root.country));
  const scot = byId["gb-sct"];
  const ld = [webPage(title, desc, url), breadcrumb([["Home", SITE + "/"], ["Salary after tax", url]])];
  return head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Salary after tax</h1>
      <p class="page-subtitle">What a salary actually leaves you, in the country, state or region you're paid in.</p>
    </header>

    <div class="hub-group-title">United Kingdom</div>
    <div class="hub-grid">
${ukCards}${scot ? card(hubUrl(scot), iconFor(scot), "Salary after tax in Scotland", headline(scot)) : ""}    </div>

    <div class="hub-group-title" style="margin-top:28px;">United States</div>
    <div class="hub-grid">
${card("/salary/us/", "🇺🇸", "All 50 states compared", "Take-home pay in every state at $50k, $75k and $100k.")}${["us-ca", "us-tx", "us-ny", "us-ny-nyc", "us-fl"].filter((id) => byId[id]).map((id) => card(hubUrl(byId[id]), "🇺🇸", `Salary after tax in ${byId[id].place.shortName}`, headline(byId[id]))).join("")}    </div>

    <div class="hub-group-title" style="margin-top:28px;">Europe</div>
    <div class="hub-grid">
${europe}    </div>

    <div class="hub-group-title" style="margin-top:28px;">Asia-Pacific</div>
    <div class="hub-grid">
${apac}    </div>

    <main class="tool" style="margin-top:28px;">
      <p class="about-text">Each page applies that place's current tax year to a salary &mdash; income tax, social contributions and the local taxes that apply to most employees &mdash; and says plainly what it assumes and leaves out. The rates come from published sources listed on every page; none has yet been checked by a person against the official tax authority, so treat the figures as estimates and confirm before relying on them.</p>
    </main>

${FOOTER}
  </div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- sitemap

function updateSitemap(urls) {
  const file = path.join(ROOT, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");
  const START = "  <!-- salary pages: generated by tools/build-tax-pages.js -->\n";
  const END = "  <!-- end salary pages -->\n";
  // Drop the generated block, and any hand-added salary entries from before it existed
  if (xml.includes(START)) xml = xml.slice(0, xml.indexOf(START)) + xml.slice(xml.indexOf(END) + END.length);
  xml = xml.replace(/  <url>\s*<loc>https:\/\/lotsofcalcs\.com\/salary\/[^<]*<\/loc>[\s\S]*?<\/url>\n/g, "");
  const block = START + urls.map(([loc, priority]) =>
    `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`).join("") + END;
  xml = xml.replace("</urlset>", block + "</urlset>");
  fs.writeFileSync(file, xml);
}

// ---------------------------------------------------------------- main

function main() {
  uk.main();
  const urls = [["/salary/", "0.8"], ["/salary/us/", "0.8"]];
  uk.SALARIES.forEach((s) => urls.push([`/salary/${s}-after-tax/`, "0.7"]));

  let pages = 0;
  places.forEach((p) => {
    write("salary/" + p.place.path, placeHub(p));
    urls.push([hubUrl(p), "0.7"]);
    p.salaries.forEach((s) => {
      write("salary/" + p.place.path + "/" + slugFor(s, p.currency), salaryPage(p, s));
      urls.push([pageUrl(p, s), "0.6"]);
      pages++;
    });
  });
  write("salary/us", usHub());
  write("salary", salaryIndex());
  updateSitemap(urls);
  console.log(`built ${pages} salary pages and ${places.length + 2} hubs for ${places.length} places; sitemap now lists ${urls.length} salary URLs`);
}

main();
