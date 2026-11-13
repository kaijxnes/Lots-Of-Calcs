#!/usr/bin/env node
/* Builds /cheque-writer/ with the example worked out in the HTML.

       node tools/build-cheque-writer.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const W = require("../number-words.js");
const { esc, SITE } = site;

const EX = 1250.5;
const examples = [
  ["UK cheque", "£1,250.50", W.chequeWords(EX, "uk")],
  ["US check", "$1,250.50", W.chequeWords(EX, "us")],
  ["Indian cheque", "₹1,250.50", W.chequeWords(EX, "in")],
  ["Euro cheque", "€1,250.50", W.chequeWords(EX, "eu")]
];
const amounts = [10, 20, 25, 50, 75, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000];

function page() {
  const url = SITE + "/cheque-writer/";
  const title = "Cheque Writer — How to Write an Amount in Words on a Cheque or Check";
  const desc = `Type an amount and get exactly what to write on a cheque: the words line and the figures box, for a UK cheque, US check, Indian cheque or euro cheque. £1,250.50 is "${W.chequeWords(EX, "uk")}".`;
  const q = [
    ["How do I write pence on a cheque?", `Write the pounds in words, then "and" and the pence: "${W.chequeWords(EX, "uk")}". Writing "and 50p" is also accepted. In the box, write £1,250.50.`],
    ["How do I write cents on a US check?", `Write the dollars in words and the cents as a fraction of 100: "${W.chequeWords(EX, "us")}". With no cents, write "and 00/100".`],
    ["Why write \"only\"?", "\"Only\" (or a line drawn through the rest of the space) closes off the words line so nobody can add to the amount. Start writing at the far left for the same reason."],
    ["What if the words and figures don't match?", "Banks generally go by the amount in words, or may return the cheque. Check that the two agree before you sign it."],
    ["How do I write a cheque in India?", `Start with "Rupees", write the amount in the Indian system (lakh and crore) and end with "Only": "${W.chequeWords(250000, "in")}" for ₹2,50,000. In the box write ₹2,50,000/-.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Cheque Writer", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Cheque Writer", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const cq = "border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--card, transparent); font-size:0.92rem; line-height:1.5;";
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Cheque writer</h1>
      <p class="page-subtitle">What to write on a cheque or check — the amount in words and in figures.</p>
    </header>

    <main class="tool" id="cw-tool">
      <div class="field-row">
        <div class="field"><label for="cw-amount">Amount</label><input type="number" id="cw-amount" value="${EX}" step="0.01" min="0" inputmode="decimal"></div>
        <div class="field"><label for="cw-style">Cheque</label>
          <select id="cw-style">
            <option value="uk" selected>UK cheque (£)</option>
            <option value="us">US check ($)</option>
            <option value="in">Indian cheque (₹)</option>
            <option value="eu">Euro cheque (€)</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label for="cw-payee">Pay (optional)</label><input type="text" id="cw-payee" placeholder="Payee name" autocomplete="off"></div>
        <div class="field"><label for="cw-date">Date</label><input type="date" id="cw-date"></div>
      </div>
      <p class="tool-hint" id="cw-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Words line</span><span class="r-value" id="cw-words" style="text-align:right;">${esc(W.chequeWords(EX, "uk"))}</span></div>
          <div class="result-row highlight"><span class="r-label">In the box</span><span class="r-value" id="cw-figures">£1,250.50</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">How it looks</p>
      <div style="${cq}" aria-label="Cheque preview">
        <div style="text-align:right;" id="cq-date"></div>
        <div style="margin-top:8px;"><span id="cq-pay">Pay</span> <strong id="cq-payee">Payee name</strong></div>
        <div style="margin-top:10px; border-bottom:1px dashed var(--border); padding-bottom:4px;" id="cq-words">${esc(W.chequeWords(EX, "uk"))}</div>
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px; gap:10px;">
          <span style="border:1px solid var(--border); border-radius:6px; padding:4px 10px; font-weight:600;" id="cq-figures">£1,250.50</span>
          <span style="border-top:1px solid var(--border); min-width:40%; text-align:center; font-size:0.8rem; padding-top:2px;">Signature</span>
        </div>
      </div>
    </main>

    <main class="tool">
      <p class="tool-section-title">£1,250.50 four ways</p>
${site.table(["Cheque", "In the box", "On the words line"], examples.map((e) => e.map(esc)), 460)}      <p class="tool-section-title" style="margin-top:22px;">Common amounts</p>
      <p class="salary-links">${amounts.map((a) => `<a href="/number-to-words/${a}/">£${a.toLocaleString("en-GB")} in words</a>`).join(" ")}</p>
      <p class="tool-hint" style="margin-top:12px;">Each amount's page shows the UK, US and Indian cheque wording. For any number in words, decimals and ordinals, use the <a href="/number-to-words/">number to words converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/cheque-writer/")}
${site.FOOTER}
  </div>
  <script src="/number-words.js"></script>
  <script src="/cheque-writer.js"></script>
</body>
</html>
`;
}

site.write("cheque-writer", page());
console.log("built /cheque-writer/");
