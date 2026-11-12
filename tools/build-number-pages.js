#!/usr/bin/env node
/* Number in words pages:

       /number-to-words/1500/     1,500 in words (British, American, Indian),
                                  as an ordinal, on a cheque and in Roman numerals

       node tools/build-number-pages.js

   One page for each number people commonly look up — every number to 100,
   then round steps up to a billion, plus the lakh and crore amounts. The
   wording comes from tools/lib/words.js, which is checked here against the
   site's live converter (number-to-words.js) so the two can never disagree. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const site = require("./lib/site.js");
const W = require("./lib/words.js");
const { esc, SITE } = site;

function range(a, b, step) { const out = []; for (let v = a; v <= b; v += step) out.push(v); return out; }
const NUMBERS = Array.from(new Set([].concat(
  range(1, 100, 1), range(110, 1000, 10), range(1100, 10000, 100), range(11000, 100000, 1000),
  range(110000, 1000000, 10000), range(1500000, 10000000, 500000),
  [15000000, 20000000, 25000000, 50000000, 75000000, 100000000, 250000000, 500000000, 1000000000],
  [125000, 175000, 225000, 275000, 325000, 350000, 375000, 450000, 550000, 650000, 750000, 850000, 950000]
))).sort((a, b) => a - b);

/* Guard: the British wording must match the live converter exactly */
function checkAgainstLive() {
  const el = new Proxy({}, { get: (t, k) => (k === "addEventListener" ? () => {} : k === "style" ? {} : k === "classList" ? { add() {}, remove() {}, toggle() {} } : "") });
  const ctx = { document: { getElementById: () => el, querySelector: () => el, querySelectorAll: () => [], addEventListener() {} }, window: {}, navigator: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(site.ROOT, "number-to-words.js"), "utf8") + ";this.f=integerToWords;this.o=toOrdinalWords;", ctx);
  NUMBERS.forEach((n) => {
    if (ctx.f(String(n)) !== W.british(n)) throw new Error("wording differs from the live converter for " + n);
    if (ctx.o(ctx.f(String(n))) !== W.ordinal(W.british(n))) throw new Error("ordinal differs for " + n);
  });
}

const url = (n) => `/number-to-words/${n}/`;
const fmt = (n) => n.toLocaleString("en-GB");

const tc = (w) => w.replace(/(^|[ -])([a-z])/g, (m, a, c) => a + c.toUpperCase());

function titleFor(n) {
  if (n >= 100000) return `${fmt(n)} in Words — ${tc(W.indian(n))} or ${tc(W.american(n))}`;
  if (n >= 1000) return `${fmt(n)} in Words — ${tc(W.british(n))} (UK, US & Cheque)`;
  return `${n} in Words — ${tc(W.british(n))} | How to Spell ${n}`;
}

function page(n) {
  const uk = W.british(n), us = W.american(n), ind = W.indian(n);
  const ord = W.ordinal(uk), ordUs = W.ordinal(us);
  const r = W.roman(n);
  const loc = SITE + url(n);
  const title = titleFor(n);
  const desc = `${fmt(n)} in words is "${uk}" in British English${us !== uk ? ` and "${us}" in American English` : ""}${n >= 100000 ? `, or "${ind}" (${W.grouped(n, "indian")}) in the Indian system` : ""}. Plus the ordinal${r ? ", Roman numerals" : ""} and how to write it on a cheque.`;

  const rows = [
    ["British English", W.cap(uk)],
    ["American English", W.cap(us)]
  ];
  if (n >= 1000) rows.push([`Indian English (${W.grouped(n, "indian")})`, W.cap(ind)]);
  rows.push(["Ordinal", `${W.ordinalSuffix(n)} — ${ord}${ordUs !== ord ? ` (US: ${ordUs})` : ""}`]);
  if (r) rows.push(["Roman numerals", r]);
  rows.push(["Digits", `${fmt(n)}${n >= 100000 ? ` (Indian grouping ${W.grouped(n, "indian")})` : ""}`]);

  const cheques = [
    ["UK cheque", `£${fmt(n)}.00`, `${W.cap(uk)} pound${n === 1 ? "" : "s"} only`],
    ["US check", `$${fmt(n)}.00`, `${W.cap(us)} and 00/100 dollar${n === 1 ? "" : "s"}`],
    ["Indian cheque", `₹${W.grouped(n, "indian")}/-`, `Rupees ${tc(ind)} Only`]
  ];

  const hyphen = /-/.test(uk);
  const q = [
    [`How do you write ${fmt(n)} in words?`, `${W.cap(uk)}. ${us !== uk ? `In American English the "and" is usually left out: ${us}. ` : ""}${n >= 100000 ? `In India it is written ${ind} (${W.grouped(n, "indian")}).` : ""}`.trim()],
    [`How do you write ${fmt(n)} on a cheque?`, `Write "${W.cap(uk)} pound${n === 1 ? "" : "s"} only" on the words line and £${fmt(n)}.00 in the box. On a US check, "${W.cap(us)} and 00/100", with a line drawn to the end so nothing can be added.`],
    [hyphen ? "Why is there a hyphen?" : `Is it "${uk}" with an "and"?`, hyphen
      ? "Numbers from twenty-one to ninety-nine are hyphenated when written out (twenty-one, forty-five), wherever they appear in a larger number."
      : (us !== uk ? `In British English, "and" goes before the last part of a number (${uk}); American English usually leaves it out (${us}). Both are correct in their own style.` : `There is no "and" in ${uk} in either British or American English.`)],
    [`What is the ordinal of ${fmt(n)}?`, `${W.ordinalSuffix(n)}, written ${ord}.`]
  ];

  const near = NUMBERS.filter((x) => x !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b).slice(0, 8).sort((a, b) => a - b);
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Number to Words", SITE + "/number-to-words/"], [`${fmt(n)} in words`, loc]]), site.faqLd(q)];

  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/number-to-words/">← Number to words converter</a>
      <h1 class="page-title">${fmt(n)} in words</h1>
      <p class="page-subtitle">How to write ${fmt(n)} out in full, in British, American${n >= 1000 ? " and Indian" : ""} English.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" style="font-size:1.5rem; line-height:1.3;">${esc(W.cap(uk))}</div>
          <div class="label">${fmt(n)} in words</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${rows.map(([a, b]) => `          <div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value" style="text-align:right;">${esc(b)}</span></div>`).join("\n")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For any other number, decimals or amounts with pence, use the <a href="/number-to-words/">number to words converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">${fmt(n)} on a cheque</p>
${site.table(["Where", "In the box", "On the words line"], cheques.map((c) => c.map(esc)), 420)}      <p class="tool-hint" style="margin-top:12px;">Start the words at the far left and draw a line through any space after them, so nothing can be added.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other numbers in words</div>
    <p class="salary-links">${near.map((x) => `<a href="${url(x)}">${fmt(x)} in words</a>`).join(" ")}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* A list on the converter page so every number page is reachable */
function hubBlock() {
  const file = path.join(site.ROOT, "number-to-words/index.html");
  const START = "    <!-- number pages: generated by tools/build-number-pages.js -->\n";
  const END = "    <!-- end number pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const groups = [["1 to 100", (n) => n <= 100], ["Hundreds", (n) => n > 100 && n <= 1000], ["Thousands", (n) => n > 1000 && n <= 100000], ["Lakhs and up to a million", (n) => n > 100000 && n <= 1000000], ["Millions, crores and a billion", (n) => n > 1000000]];
  const html = `    <main class="tool">
      <p class="tool-section-title">Numbers in words</p>
${groups.map(([label, f]) => `      <p class="salary-links-title">${label}</p>
      <p class="salary-links">${NUMBERS.filter(f).map((n) => `<a href="${url(n)}">${fmt(n)}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

checkAgainstLive();
const urls = [];
NUMBERS.forEach((n) => { site.write("number-to-words/" + n, page(n)); urls.push([url(n), "0.5"]); });
hubBlock();
const pruned = site.prune("number-to-words", /^\d+$/);
site.sitemapBlock("number pages", "tools/build-number-pages.js", urls);
console.log(`built ${NUMBERS.length} number pages; ${site.changed.size} changed, ${pruned} removed`);
