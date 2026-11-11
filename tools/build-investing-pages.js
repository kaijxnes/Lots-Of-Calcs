#!/usr/bin/env node
/* Investing pages by amount:

       /investing/200-a-month/        £200 a month invested
       /investing/10000-invested/     £10,000 invested as a lump sum
       /investing/us/...              the same in dollars

       node tools/build-investing-pages.js

   Each page answers "what could X grow to" in the HTML: a table of values
   after 5 to 40 years at a spread of annual returns, the money paid in
   against the growth, the effect of fees and inflation, and a calculator.
   The returns are examples, not forecasts, and the page says so; nothing
   depends on current rates, so the pages don't go stale. */
const site = require("./lib/site.js");
const InvestingMaths = require("../investing-page.js");
const { esc, card, table, neighbours, SITE } = site;

const YEARS = [5, 10, 15, 20, 25, 30, 40];
const RATES = [2, 3, 4, 5, 6, 7, 8, 10];
const EXAMPLE = { rate: 5, inflation: 2 };

const SETS = {
  GBP: {
    base: "/investing/", symbol: "£", country: "UK",
    monthly: [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000],
    lump: [1000, 2000, 5000, 10000, 15000, 20000, 25000, 50000, 100000, 250000],
    wrappers: "In the UK, a stocks and shares ISA or a pension lets investments grow without income or capital gains tax; outside them, tax may be due on gains and income above the yearly allowances.",
    target: 100000
  },
  USD: {
    base: "/investing/us/", symbol: "$", country: "US",
    monthly: [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000],
    lump: [1000, 2000, 5000, 10000, 15000, 20000, 25000, 50000, 100000, 250000],
    wrappers: "In the US, a 401(k) or IRA lets investments grow without tax until you withdraw (or tax-free with a Roth); in a taxable brokerage account, dividends and gains are taxed.",
    target: 100000
  }
};

function money(set, v) {
  return set.symbol + Math.round(v).toLocaleString("en-GB");
}

function slug(kind, n) {
  return kind === "monthly" ? `${n}-a-month` : `${n}-invested`;
}

function url(set, kind, n) {
  return set.base + slug(kind, n) + "/";
}

function plan(kind, n) {
  return kind === "monthly" ? { monthly: n, lump: 0 } : { monthly: 0, lump: n };
}

/* Years to reach a target at a return, or null within 80 years */
function yearsTo(kind, n, rate, target) {
  const r = InvestingMaths.grow(Object.assign({ rate: rate, years: 80 }, plan(kind, n)));
  const row = r.rows.find((x) => x.value >= target);
  return row ? row.year : null;
}

function tool(set, kind, n) {
  const p = plan(kind, n);
  const years = 10;
  const r = InvestingMaths.grow(Object.assign({ rate: EXAMPLE.rate, years: years, inflation: EXAMPLE.inflation }, p));
  const field = (id, label, value, step) => `        <div class="field">
          <label for="inv-${id}">${label}</label>
          <input type="number" id="inv-${id}" value="${value}" step="${step || "any"}" min="0" inputmode="decimal">
        </div>`;
  return `    <main class="tool" id="invest-tool" data-symbol="${set.symbol}">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="inv-value">${money(set, r.value)}</div>
          <div class="label" id="inv-label">after ${years} years at ${EXAMPLE.rate}% a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Paid in</span><span class="r-value" id="inv-paid">${money(set, r.paid)}</span></div>
          <div class="result-row"><span class="r-label">Growth</span><span class="r-value" id="inv-growth">${money(set, r.growth)}</span></div>
          <div class="result-row highlight"><span class="r-label">In today's money</span><span class="r-value" id="inv-real">${money(set, r.real)}</span></div>
        </div>
      </div>
      <div class="field-row" style="margin-top:18px;">
${field("monthly", `Each month (${set.symbol})`, p.monthly)}
${field("lump", `Starting sum (${set.symbol})`, p.lump)}
      </div>
      <div class="field-row">
${field("rate", "Return (% a year)", EXAMPLE.rate, "0.5")}
${field("years", "Years", years, "1")}
      </div>
      <div class="field-row">
${field("fee", "Fees (% a year)", 0, "0.05")}
${field("inflation", "Inflation (% a year)", EXAMPLE.inflation, "0.5")}
      </div>
      <p class="tool-hint" id="inv-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint">Starts on an example ${EXAMPLE.rate}% return and ${EXAMPLE.inflation}% inflation &mdash; examples, not forecasts. Investments can fall as well as rise.</p>
    </main>
`;
}

function page(set, kind, n) {
  const p = plan(kind, n);
  const a0 = money(set, n);
  const monthly = kind === "monthly";
  const loc = url(set, kind, n);
  const full = SITE + loc;
  const at = (rate, years, extra) => InvestingMaths.grow(Object.assign({ rate: rate, years: years }, p, extra || {}));
  const r10 = at(EXAMPLE.rate, 10, { inflation: EXAMPLE.inflation });
  const r20 = at(EXAMPLE.rate, 20, { inflation: EXAMPLE.inflation });
  const r30 = at(EXAMPLE.rate, 30, { inflation: EXAMPLE.inflation });
  const r30hi = at(7, 30);

  const what = monthly ? `${a0} a month` : `${a0}`;
  const title = monthly
    ? `${a0} a Month Invested — What It Could Grow To in 10, 20 or 30 Years`
    : `${a0} Invested — What It Could Be Worth in 10, 20 or 30 Years`;
  const desc = monthly
    ? `Investing ${a0} a month could grow to ${money(set, r10.value)} in 10 years and ${money(set, r30.value)} in 30 at ${EXAMPLE.rate}% a year. Tables at returns from 2% to 10%, with fees and inflation.`
    : `${a0} invested could grow to ${money(set, r10.value)} in 10 years and ${money(set, r30.value)} in 30 at ${EXAMPLE.rate}% a year. Tables at returns from 2% to 10%, with fees and inflation.`;

  const grid = RATES.map((rate) => [`${rate}%`].concat(YEARS.map((y) => {
    const v = money(set, at(rate, y).value);
    return rate === EXAMPLE.rate && y === 10 ? `<strong>${v}</strong>` : v;
  })));
  const paidRow = monthly ? ["Paid in"].concat(YEARS.map((y) => money(set, n * 12 * y))) : null;
  const yearRows = at(EXAMPLE.rate, 30, { inflation: EXAMPLE.inflation }).rows.filter((x) => [1, 2, 3, 5, 10, 15, 20, 25, 30].includes(x.year))
    .map((x) => [String(x.year), money(set, x.paid), money(set, x.value), money(set, x.value - x.paid), money(set, x.value / Math.pow(1 + EXAMPLE.inflation / 100, x.year))]);
  const feeRows = [0, 0.2, 0.5, 1, 1.5].map((fee) => {
    const v = at(EXAMPLE.rate, 30, { fee }).value;
    return [`${fee}%`, money(set, v), fee === 0 ? "—" : money(set, at(EXAMPLE.rate, 30).value - v)];
  });
  const reach = [4, 5, 7].map((rate) => [rate, yearsTo(kind, n, rate, set.target)]);
  const reachLine = reach.map(([rate, y]) => (y ? `${y} years at ${rate}%` : `over 80 years at ${rate}%`)).join(", ");

  const q = [
    [`How much will ${what} be worth in 10 years?`,
      `About ${money(set, r10.value)} at ${EXAMPLE.rate}% a year${monthly ? `, from ${money(set, r10.paid)} paid in` : ""}. At 3% it would be ${money(set, at(3, 10).value)}, and at 7% ${money(set, at(7, 10).value)}. In today's money, with ${EXAMPLE.inflation}% inflation, the ${EXAMPLE.rate}% figure is worth about ${money(set, r10.real)}.`],
    [`How much will ${what} be worth in 20 years?`,
      `About ${money(set, r20.value)} at ${EXAMPLE.rate}% a year${monthly ? ` from ${money(set, r20.paid)} paid in` : ""}, or ${money(set, r20.real)} in today's money.`],
    [`How much will ${what} be worth in 30 years?`,
      `About ${money(set, r30.value)} at ${EXAMPLE.rate}% a year and ${money(set, r30hi.value)} at 7%${monthly ? `, from ${money(set, r30.paid)} paid in` : ""}. The longer the money is left, the more of the total is growth rather than what you put in.`],
    [`How long would it take to reach ${money(set, set.target)}?`,
      `${monthly ? `Investing ${a0} a month` : `With ${a0} invested`}, about ${reachLine}.`],
    ["What return should I use?",
      "The returns here are examples, not predictions. Cash savings pay whatever interest rate the account offers. Shares have grown faster than cash over long periods in the past, but can fall sharply and stay down for years, so a range of returns is more useful than a single figure. The table shows 2% to 10%."],
    ["Does this include fees and tax?",
      `Fees are set to 0% to start with; add yours in the calculator or see the fee table above. ${set.wrappers} These figures are before any tax.`]
  ];

  const ld = [site.webPage(title, desc, full),
    site.breadcrumb([["Home", SITE + "/"], ["Investing", SITE + "/investing/"]].concat(set.country === "US" ? [["United States", SITE + set.base]] : []).concat([[monthly ? `${a0} a month` : `${a0} invested`, full]])),
    site.faqLd(q)];

  const list = monthly ? set.monthly : set.lump;
  const others = neighbours(list, n, 4).map((x) => card(url(set, kind, x), "🌱", monthly ? `${money(set, x)} a month` : `${money(set, x)} invested`,
    `${money(set, at(EXAMPLE.rate, 10).value * x / n)} after 10 years at ${EXAMPLE.rate}%.`)).join("");

  return site.head({ title, desc, url: full, ld }) + `    <header class="site-header">
      <a class="back-link" href="${set.base}">← Investing by amount</a>
      <h1 class="page-title">${monthly ? `${esc(a0)} a month invested` : `${esc(a0)} invested`}</h1>
      <p class="page-subtitle">What ${monthly ? `${esc(a0)} a month` : `a lump sum of ${esc(a0)}`} could grow to over 5 to 40 years, at returns from 2% to 10% a year.</p>
    </header>

${tool(set, kind, n)}
    <main class="tool">
      <p class="about-text">${monthly
        ? `Investing <strong>${esc(a0)} a month</strong> for 10 years at ${EXAMPLE.rate}% a year grows to about <strong>${money(set, r10.value)}</strong>: ${money(set, r10.paid)} paid in and ${money(set, r10.growth)} of growth. Leave it for 30 years and it is about ${money(set, r30.value)}, of which ${money(set, r30.growth)} is growth.`
        : `A lump sum of <strong>${esc(a0)}</strong> left for 10 years at ${EXAMPLE.rate}% a year grows to about <strong>${money(set, r10.value)}</strong>. After 30 years it is about ${money(set, r30.value)} &mdash; ${(r30.value / n).toFixed(1)} times what you started with.`}</p>
      <p class="tool-section-title" style="margin-top:22px;">What ${esc(what)} grows to</p>
${table(["Return a year"].concat(YEARS.map((y) => `${y} years`)), (paidRow ? [paidRow.map((c, i) => (i === 0 ? c : `<em>${c}</em>`))] : []).concat(grid), 120 + YEARS.length * 95)}      <p class="tool-hint" style="margin-top:12px;">Before fees, tax and inflation. ${monthly ? "Contributions are paid at the end of each month. " : ""}Each year grows by exactly the return shown.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Year by year at ${EXAMPLE.rate}%</p>
${table(["Year", "Paid in", "Value", "Growth", "In today's money"], yearRows, 460)}      <p class="tool-hint" style="margin-top:12px;">&ldquo;Today's money&rdquo; takes off ${EXAMPLE.inflation}% inflation a year, so it shows what the pot would buy at today's prices. The <a href="/inflation/">inflation calculator</a> shows how prices have actually moved.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">What fees cost over 30 years</p>
      <p class="about-text">A yearly charge comes off the return every year, so a small percentage adds up. At ${EXAMPLE.rate}% a year before fees:</p>
${table(["Fees a year", "Value after 30 years", "Lost to fees"], feeRows, 360)}      <p class="tool-hint" style="margin-top:12px;">The <a href="/fund-fees/">fund fee calculator</a> works this out for your own platform and fund charges.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">${monthly ? "Other monthly amounts" : "Other lump sums"}</div>
    <div class="hub-grid">
${others}${card(set.base, "📋", "All amounts", "Every monthly amount and lump sum, on one page.")}${card("/compound-interest/", "🌱", "Compound interest calculator", "Rising contributions, monthly compounding and a yearly breakdown.")}    </div>

${site.FOOTER}
  </div>
  <script src="/investing-page.js"></script>
</body>
</html>
`;
}

function hub(set, isMain) {
  const loc = set.base;
  const full = SITE + loc;
  const title = isMain ? "Investing by Amount — What Monthly Savings and Lump Sums Could Grow To"
    : "US Investing by Amount — What Monthly Investing and Lump Sums Could Grow To";
  const desc = `What ${set.symbol}25 to ${set.symbol}2,000 a month, or a lump sum of ${set.symbol}1,000 to ${set.symbol}250,000, could grow to over 5 to 40 years, at returns from 2% to 10% a year.`;
  const ex = (kind, n) => InvestingMaths.grow(Object.assign({ rate: EXAMPLE.rate, years: 10 }, plan(kind, n))).value;
  const ex30 = (kind, n) => InvestingMaths.grow(Object.assign({ rate: EXAMPLE.rate, years: 30 }, plan(kind, n))).value;
  const mRows = set.monthly.map((n) => [`<a href="${url(set, "monthly", n)}">${money(set, n)} a month</a>`, money(set, ex("monthly", n)), money(set, ex30("monthly", n))]);
  const lRows = set.lump.map((n) => [`<a href="${url(set, "lump", n)}">${money(set, n)}</a>`, money(set, ex("lump", n)), money(set, ex30("lump", n))]);
  const other = isMain ? SETS.USD : SETS.GBP;
  const ld = [site.webPage(title, desc, full), site.breadcrumb([["Home", SITE + "/"], ["Investing", SITE + "/investing/"]].concat(isMain ? [] : [["United States", full]]))];
  return site.head({ title, desc, url: full, ld }) + `    <header class="site-header">
      <a class="back-link" href="${isMain ? "/savings-investing/" : "/investing/"}">← ${isMain ? "Savings &amp; investing calculators" : "Investing in pounds"}</a>
      <h1 class="page-title">${isMain ? "Investing by amount" : "Investing by amount (US dollars)"}</h1>
      <p class="page-subtitle">What a monthly amount or a lump sum could grow to, at returns from 2% to 10% a year.</p>
    </header>

    <main class="tool">
      <p class="about-text">Pick an amount for its full table over 5 to 40 years, the effect of fees and inflation, and a calculator for your own figures. The summary below uses an example ${EXAMPLE.rate}% a year &mdash; an example, not a forecast. ${isMain ? `<a href="${other.base}">See the figures in dollars</a>.` : `<a href="${other.base}">See the figures in pounds</a>.`}</p>
      <p class="tool-section-title" style="margin-top:22px;">Investing every month</p>
${table(["Each month", `After 10 years at ${EXAMPLE.rate}%`, "After 30 years"], mRows, 420)}      <p class="tool-section-title" style="margin-top:22px;">A lump sum</p>
${table(["Invested", `After 10 years at ${EXAMPLE.rate}%`, "After 30 years"], lRows, 420)}      <p class="tool-hint" style="margin-top:12px;">Before fees, tax and inflation. For other amounts, rising contributions and monthly compounding, use the <a href="/compound-interest/">compound interest calculator</a>; for a target, the <a href="/savings-goal/">savings goal calculator</a>.</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* A short "by amount" list on the related calculators, so the pages are reachable */
function linkBlock(file, html) {
  const fs = require("fs");
  const path = require("path");
  const START = "    <!-- investing links: generated by tools/build-investing-pages.js -->\n";
  const END = "    <!-- end investing links -->\n";
  const fullPath = path.join(site.ROOT, file);
  let s = fs.readFileSync(fullPath, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error(file + " has no related block to put the links above");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(fullPath, s);
}

function main() {
  const urls = [["/investing/", "0.7"], ["/investing/us/", "0.6"]];
  Object.values(SETS).forEach((set) => {
    ["monthly", "lump"].forEach((kind) => {
      (kind === "monthly" ? set.monthly : set.lump).forEach((n) => {
        const loc = url(set, kind, n);
        site.write(loc.replace(/^\/|\/$/g, ""), page(set, kind, n));
        urls.push([loc, "0.6"]);
      });
    });
  });
  site.write("investing", hub(SETS.GBP, true));
  site.write("investing/us", hub(SETS.USD, false));
  const generated = /^\d+-(a-month|invested)$/;
  const pruned = site.prune("investing", generated) + site.prune("investing/us", generated);

  const gbp = SETS.GBP;
  const links = `    <main class="tool">
      <p class="tool-section-title">What regular investing grows to</p>
      <p class="salary-links">${[50, 100, 200, 300, 500, 1000].map((n) => `<a href="${url(gbp, "monthly", n)}">£${n.toLocaleString("en-GB")} a month</a>`).join(" ")} ${[10000, 50000].map((n) => `<a href="${url(gbp, "lump", n)}">£${n.toLocaleString("en-GB")} invested</a>`).join(" ")} <a href="/investing/">All amounts</a> <a href="/investing/us/">In dollars</a></p>
    </main>
`;
  ["compound-interest/index.html", "savings-goal/index.html", "fund-fees/index.html"].forEach((f) => linkBlock(f, links));

  site.sitemapBlock("investing pages", "tools/build-investing-pages.js", urls);
  console.log(`built ${urls.length} investing pages and hubs; ${site.changed.size} changed, ${pruned} removed`);
}

main();
