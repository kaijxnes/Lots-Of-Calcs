#!/usr/bin/env node
/* Currency converter and "100 GBP to EUR" pages, on the European Central
   Bank's reference rates (data/currency/ecb.json, refreshed by
   tools/fetch-ecb-rates.js):

       /currency-converter/            any amount between 30 currencies
       /currency/100-gbp-to-eur/       100 pounds in euros, and a table of amounts

       node tools/build-currency-pages.js

   ECB rates are euros against each currency; a cross rate (GBP→USD) is
   USD per euro ÷ GBP per euro. Every page says the date of the rate and
   that banks and card providers add a margin. Runs in the monthly rebuild,
   after fetch-ecb-rates.js. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const { SITE, esc } = site;

const E = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/currency/ecb.json"), "utf8"));
const NAMES = { EUR: ["euro", "euros", "€"], USD: ["US dollar", "US dollars", "$"], GBP: ["pound", "pounds", "£"], JPY: ["Japanese yen", "yen", "¥"], CHF: ["Swiss franc", "Swiss francs", "CHF "], AUD: ["Australian dollar", "Australian dollars", "A$"], CAD: ["Canadian dollar", "Canadian dollars", "C$"], INR: ["Indian rupee", "rupees", "₹"], PLN: ["Polish złoty", "złoty", "zł "], TRY: ["Turkish lira", "lira", "₺"], SEK: ["Swedish krona", "kronor", "kr "], NOK: ["Norwegian krone", "kroner", "kr "], DKK: ["Danish krone", "kroner", "kr "], CNY: ["Chinese yuan", "yuan", "¥"], HKD: ["Hong Kong dollar", "Hong Kong dollars", "HK$"], NZD: ["New Zealand dollar", "New Zealand dollars", "NZ$"], SGD: ["Singapore dollar", "Singapore dollars", "S$"], ZAR: ["South African rand", "rand", "R "], MXN: ["Mexican peso", "pesos", "MX$"], THB: ["Thai baht", "baht", "฿"], CZK: ["Czech koruna", "koruna", "Kč "], HUF: ["Hungarian forint", "forint", "Ft "], BRL: ["Brazilian real", "reais", "R$"], KRW: ["South Korean won", "won", "₩"], ILS: ["Israeli shekel", "shekels", "₪"], PHP: ["Philippine peso", "pesos", "₱"], IDR: ["Indonesian rupiah", "rupiah", "Rp "], MYR: ["Malaysian ringgit", "ringgit", "RM "], RON: ["Romanian leu", "lei", "lei "], ISK: ["Icelandic króna", "krónur", "kr "] };
const CUR = Object.keys(E.rates).filter((c) => NAMES[c]);
const PAIRS = [["GBP", "EUR"], ["EUR", "GBP"], ["GBP", "USD"], ["USD", "GBP"], ["EUR", "USD"], ["USD", "EUR"], ["GBP", "AUD"], ["GBP", "CAD"], ["GBP", "INR"], ["USD", "INR"], ["GBP", "JPY"], ["USD", "JPY"], ["GBP", "PLN"], ["GBP", "TRY"], ["GBP", "CHF"], ["GBP", "THB"], ["USD", "CAD"], ["EUR", "CHF"]];
const AMOUNTS = [1, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
const BASE = "/currency/", HUB = "/currency-converter/";
const DATE = new Date(E.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const SHORT = new Date(E.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const rate = (a, b) => E.rates[b] / E.rates[a];
const dp = (c) => (["JPY", "KRW", "IDR", "HUF", "ISK"].includes(c) ? 0 : 2);
const money = (c, v) => NAMES[c][2] + v.toLocaleString("en-GB", { minimumFractionDigits: dp(c), maximumFractionDigits: dp(c) });
const r4 = (v) => v.toLocaleString("en-GB", { maximumSignificantDigits: 5 });
const slug = (n, a, b) => `${n}-${a.toLowerCase()}-to-${b.toLowerCase()}`;

function page(n, a, b) {
  const x = rate(a, b), out = n * x, url = SITE + `${BASE}${slug(n, a, b)}/`;
  const title = site.fitTitle(`${n.toLocaleString("en-GB")} ${a} to ${b} — ${money(b, out)} (ECB Rate, ${SHORT})`, `${n.toLocaleString("en-GB")} ${a} to ${b} = ${money(b, out)}`);
  const desc = `${money(a, n)} is ${money(b, out)} at the European Central Bank reference rate for ${DATE} (1 ${a} = ${r4(x)} ${b}). Banks and card providers add a margin, so you'll usually get a little less.`;
  const q = [
    [`How much is ${n.toLocaleString("en-GB")} ${NAMES[a][1]} in ${NAMES[b][1]}?`, `${money(b, out)} at the ECB reference rate for ${DATE}: 1 ${a} = ${r4(x)} ${b}.`],
    ["Will I get this rate?", "Not quite. This is the mid-market reference rate; banks, bureaux and card providers add a margin or fee, which can be anything from under 1% for some cards to 5% or more at airport kiosks. Compare what you'd actually receive."],
    ["How often is the rate updated?", `The ECB publishes reference rates every working day; this page uses the rate for ${DATE} and is refreshed monthly, as is the currency converter.`]
  ];
  const ld = [site.webPage(title, desc, url, E.date), site.breadcrumb([["Home", SITE + "/"], ["Currency Converter", SITE + HUB], [`${n} ${a} to ${b}`, url]]), site.faqLd(q)];
  const table = AMOUNTS.map((m) => [m === n ? `<strong>${money(a, m)}</strong>` : `<a href="${BASE}${slug(m, a, b)}/">${money(a, m)}</a>`, money(b, m * x)]);
  const back = AMOUNTS.slice(0, 10).map((m) => [money(b, m), money(a, m / x)]);
  return site.head({ title, desc, url, ld: ld.map((o) => o) }) + `    <header class="site-header">
      <a class="back-link" href="${HUB}">← Currency converter</a>
      <h1 class="page-title">${n.toLocaleString("en-GB")} ${a} to ${b}</h1>
      <p class="page-subtitle">${money(a, n)} = <strong>${money(b, out)}</strong> at the ECB reference rate for ${DATE}.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">${money(a, n)} in ${NAMES[b][1]}</span><span class="r-value">${money(b, out)}</span></div>
          <div class="result-row"><span class="r-label">1 ${a}</span><span class="r-value">${r4(x)} ${b}</span></div>
          <div class="result-row"><span class="r-label">1 ${b}</span><span class="r-value">${r4(1 / x)} ${a}</span></div>
          <div class="result-row"><span class="r-label">Rate date</span><span class="r-value">${DATE}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The <a href="${E.source.url}" rel="noopener">European Central Bank's reference rate</a>, the mid-market rate with no fees. Any amount and 30 currencies: the <a href="${HUB}">currency converter</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">${a} to ${b}</h2>
${site.table([a, b], table, 260)}      <h2 class="tool-section-title" style="margin-top:20px;">${b} to ${a}</h2>
${site.table([b, a], back, 260)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hub() {
  const url = SITE + HUB;
  const title = `Currency Converter — Pounds, Euros, Dollars and 27 More (ECB Rates)`;
  const desc = `Convert between pounds, euros, US dollars and 27 other currencies at the European Central Bank's reference rates (${DATE}). £100 is ${money("EUR", 100 * rate("GBP", "EUR"))} or ${money("USD", 100 * rate("GBP", "USD"))}.`;
  const q = [
    ["Where do these exchange rates come from?", `The European Central Bank's euro reference rates, published every working day; these are for ${DATE}. Cross rates (such as pounds to dollars) are worked out through the euro.`],
    ["Why is my bank's rate different?", "Reference rates are mid-market rates without any margin. Banks, card providers and bureaux de change add a margin or a fee, so compare the amount you'll actually receive."]
  ];
  const ldx = [site.webPage(title, desc, url, E.date), site.breadcrumb([["Home", SITE + "/"], ["Currency Converter", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Currency Converter", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const opts = (sel) => CUR.map((c) => `<option value="${c}"${c === sel ? " selected" : ""}>${c} — ${esc(NAMES[c][0])}</option>`).join("");
  const rates = {}; CUR.forEach((c) => (rates[c] = [E.rates[c], NAMES[c][2], dp(c)]));
  const gbpTable = ["EUR", "USD", "AUD", "CAD", "INR", "JPY", "CHF", "PLN", "TRY", "THB"].map((c) => [`1 GBP`, `${r4(rate("GBP", c))} ${c}`, `1 ${c}`, `${r4(rate(c, "GBP"))} GBP`]);
  return site.head({ title, desc, url, ld: ldx }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Currency converter</h1>
      <p class="page-subtitle">30 currencies at the European Central Bank's reference rates for ${DATE}.</p>
    </header>

    <main class="tool" id="fx-tool" data-rates="${esc(JSON.stringify(rates))}">
      <div class="field"><label for="fx-amount">Amount</label><input type="number" id="fx-amount" value="100" min="0" step="any" inputmode="decimal"></div>
      <div class="field-row">
        <div class="field"><label for="fx-from">From</label><select id="fx-from">${opts("GBP")}</select></div>
        <div class="field"><label for="fx-to">To</label><select id="fx-to">${opts("EUR")}</select></div>
      </div>
      <p><button class="btn btn-ghost" type="button" id="fx-swap">⇅ Swap</button></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="fx-out">${money("EUR", 100 * rate("GBP", "EUR"))}</div><div class="label" id="fx-rate">1 GBP = ${r4(rate("GBP", "EUR"))} EUR</div></div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Mid-market reference rates from the <a href="${E.source.url}" rel="noopener">European Central Bank</a> for ${DATE}, refreshed monthly. Banks and card providers add a margin.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">The pound against other currencies (${DATE})</h2>
${site.table(["", "", "", ""], gbpTable, 360)}      <h2 class="tool-section-title" style="margin-top:20px;">Common conversions</h2>
${PAIRS.map(([a, b]) => `      <p class="salary-links"><strong>${a} to ${b}:</strong> ${AMOUNTS.map((n) => `<a href="${BASE}${slug(n, a, b)}/">${n.toLocaleString("en-GB")}</a>`).join(" ")}</p>`).join("\n")}
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(HUB)}
${site.FOOTER}
  </div>
  <script>
  (function () {
    var box = document.getElementById("fx-tool"), R = JSON.parse(box.getAttribute("data-rates")), $ = function (i) { return document.getElementById(i); };
    function calc() {
      var a = $("fx-from").value, b = $("fx-to").value, n = Number($("fx-amount").value) || 0, x = R[b][0] / R[a][0];
      $("fx-out").textContent = R[b][1] + (n * x).toLocaleString("en-GB", { minimumFractionDigits: R[b][2], maximumFractionDigits: R[b][2] });
      $("fx-rate").textContent = "1 " + a + " = " + x.toLocaleString("en-GB", { maximumSignificantDigits: 5 }) + " " + b;
    }
    $("fx-swap").addEventListener("click", function () { var t = $("fx-from").value; $("fx-from").value = $("fx-to").value; $("fx-to").value = t; calc(); });
    ["fx-amount"].forEach(function (i) { $(i).addEventListener("input", calc); });
    ["fx-from", "fx-to"].forEach(function (i) { $(i).addEventListener("change", calc); });
    calc();
  })();
  </script>
</body>
</html>
`;
}

const urls = [];
site.write("currency-converter", hub());
PAIRS.forEach(([a, b]) => AMOUNTS.forEach((n) => { site.write(`currency/${slug(n, a, b)}`, page(n, a, b)); urls.push([`${BASE}${slug(n, a, b)}/`, "0.4"]); }));
site.prune("currency", /^\d+-[a-z]{3}-to-[a-z]{3}$/);
site.sitemapBlock("currency pages", "tools/build-currency-pages.js", urls);
console.log(`built ${urls.length + 1} currency pages at ECB rates for ${E.date}`);
