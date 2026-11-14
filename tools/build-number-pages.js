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
  [15000000, 20000000, 25000000, 30000000, 40000000, 50000000, 60000000, 70000000, 75000000, 80000000, 90000000,
   100000000, 150000000, 200000000, 250000000, 300000000, 500000000, 750000000, 1000000000],
  [1500000000, 2000000000, 2500000000, 3000000000, 5000000000, 10000000000, 20000000000, 50000000000, 100000000000, 500000000000, 1000000000000],
  range(1900, 2100, 1),
  [125000, 175000, 225000, 275000, 325000, 350000, 375000, 450000, 550000, 650000, 750000, 850000, 950000]
))).sort((a, b) => a - b);

/* Guard: the British wording must match the live converter exactly */
function checkAgainstLive() {
  const el = new Proxy({}, { get: (t, k) => (k === "addEventListener" ? () => {} : k === "style" ? {} : k === "classList" ? { add() {}, remove() {}, toggle() {} } : "") });
  const ctx = { document: { getElementById: () => el, querySelector: () => el, querySelectorAll: () => [], addEventListener() {} }, window: {}, navigator: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(site.ROOT, "number-to-words.js"), "utf8") + ";this.f=integerToWords;this.o=toOrdinalWords;this.d=decimalToWords;", ctx);
  DECS.forEach((d) => { const [a, b] = d.split("."); const live = ctx.f(a) + ctx.d(b), ours = `${W.british(Number(a))} point ${[...b].map((c) => W.british(Number(c))).join(" ")}`; if (live !== ours) throw new Error(`decimal ${d}: ${live} != ${ours}`); });
  NUMBERS.forEach((n) => {
    if (ctx.f(String(n)) !== W.british(n)) throw new Error("wording differs from the live converter for " + n);
    if (ctx.o(ctx.f(String(n))) !== W.ordinal(W.british(n))) throw new Error("ordinal differs for " + n);
  });
}

const url = (n) => `/number-to-words/${n}/`;
/* 1500000 -> "1.5 million", 2500000000 -> "2.5 billion" */
function shortScaleName(n) {
  const scales = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"]];
  for (const [v, w] of scales) if (n >= v) { const x = n / v; return Number.isInteger(x * 100) ? `${x.toLocaleString("en-GB", { maximumFractionDigits: 2 })} ${w}` : null; }
  return null;
}
const isYear = (n) => n >= 1900 && n <= 2100;
/* Years are written without a thousands comma */
const fmt = (n) => (isYear(n) ? String(n) : n.toLocaleString("en-GB"));

const tc = (w) => w.replace(/(^|[ -])([a-z])/g, (m, a, c) => a + c.toUpperCase()).replace(/ And /g, " and ");

function titleFor(n) {
  if (isYear(n)) {
    const said = W.yearSpoken(n), written = W.british(n);
    return said === written ? `${n} in Words — ${tc(written)} (as a Year and a Number)` : `${n} in Words — ${tc(said)} or ${tc(written)}`;
  }
  if (n > 1000000000 && shortScaleName(n)) return `${tc(shortScaleName(n))} in Words (${fmt(n)}) — ${tc(W.american(n))}`;
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
  if (isYear(n)) rows.unshift(["Said as a year", W.cap(W.yearSpoken(n))]);
  if (n >= 1000 && !isYear(n)) rows.push([`Indian English (${W.grouped(n, "indian")})`, W.cap(ind)]);
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
  const zeros = /^10*$/.test(String(n)) && n >= 1000 ? String(n).length - 1 : 0;
  const shortForm = n >= 1000000 && !isYear(n) ? shortScaleName(n) : null;
  if (shortForm) q.splice(1, 0, [`How do you write ${shortForm} in words?`, `${shortForm} is ${fmt(n)}, written ${uk}${us !== uk ? ` (US: ${us})` : ""}.${n >= 10000000 ? ` In India it's ${ind}.` : ""}`]);
  if (zeros) q.push([`How many zeros are in ${uk.replace(/^one /, "a ")}?`, `${W.cap(W.british(zeros))}: ${fmt(n)}${zeros >= 6 ? ` is 10 to the power of ${zeros} (10${["", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"][zeros] || "^" + zeros})` : ""}.${n === 1000000000 ? " A billion is a thousand million in both British and American English today; the old British billion (a million million) is no longer used." : ""}`]);
  if (isYear(n)) q.unshift([`How do you say ${n} as a year?`, `${W.cap(W.yearSpoken(n))}. ${n >= 2001 && n <= 2009 ? "" : n % 100 > 0 && n % 100 < 10 ? `Some people say ${W.british(n)} instead. ` : n >= 2010 && n <= 2099 ? `"${W.cap(W.british(n))}" is also common, especially in formal writing. ` : ""}Written out as a number in full it is ${W.british(n)}${W.american(n) !== W.british(n) ? ` (US: ${W.american(n)})` : ""}.`]);

  const near = NUMBERS.filter((x) => x !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b).slice(0, 8).sort((a, b) => a - b);
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Number to Words", SITE + "/number-to-words/"], [`${fmt(n)} in words`, loc]]), site.faqLd(q)];

  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/number-to-words/">← Number to words converter</a>
      <h1 class="page-title">${fmt(n)} in words</h1>
      <p class="page-subtitle">${isYear(n) ? `How to say and write the year ${n}, and ${n} as a number in full.` : `How to write ${fmt(n)} out in full, in British, American${n >= 1000 ? " and Indian" : ""} English.`}</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" style="font-size:1.5rem; line-height:1.3;">${esc(W.cap(isYear(n) ? W.yearSpoken(n) : uk))}</div>
          <div class="label">${fmt(n)} in words</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${rows.map(([a, b]) => `          <div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value" style="text-align:right;">${esc(b)}</span></div>`).join("\n")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">${n <= 100 ? `The ordinal, ${W.ordinalSuffix(n)}, has its own page: <a href="${url(W.ordinalSuffix(n))}">${W.ordinalSuffix(n)} in words</a>. ` : ""}For any other number, decimals or amounts with pence, use the <a href="/number-to-words/">number to words converter</a>.</p>
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

/* ---------- Ordinal pages: /number-to-words/21st/ ---------- */
const ORDS = range(1, 100, 1);
function ordPage(n) {
  const tag = W.ordinalSuffix(n), word = W.ordinal(W.british(n)), card = W.british(n);
  const loc = SITE + url(tag);
  const title = `${tag} in Words — How to Spell ${tc(word)}`;
  const desc = `${tag} in words is "${word}" — the ordinal of ${card}. How to spell it, when it takes a hyphen, and how to write it in a date.`;
  const suffixWhy = n % 100 >= 11 && n % 100 <= 13 ? `${n} ends in ${n % 100}, and 11, 12 and 13 always take "th" (eleventh, twelfth, thirteenth), even though they end in 1, 2 or 3.` : `The suffix follows the last word: ${word.split(/[ -]/).pop()} ends "${tag.slice(-2)}", so ${n} is written ${tag}.`;
  const q = [
    [`How do you spell ${tag}?`, `${W.cap(word)}.${/-/.test(word) ? " It's hyphenated, like the number itself (" + card + ")." : ""}`],
    [`Why is it ${tag}?`, suffixWhy],
    [`How do you write the ${tag} in a date?`, n <= 31 ? `In the UK, "the ${tag} of March" or "${n} March"; in the US, "March ${tag}" or "March ${n}". In formal writing the date is often written without the suffix: ${n} March 2027.` : `Dates only go up to the 31st, but ${tag} is used for anniversaries, birthdays and positions: "her ${word} birthday", "${tag} place".`],
    [`What is ${tag} as a number?`, `${n} — ${card}. ${tag} is its ordinal form, used for order or position.`]
  ];
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Number to Words", SITE + "/number-to-words/"], [`${tag} in words`, loc]]), site.faqLd(q)];
  const near = ORDS.filter((x) => x !== n && Math.abs(x - n) <= 5).map((x) => `<a href="${url(W.ordinalSuffix(x))}">${W.ordinalSuffix(x)}</a>`).join(" ");
  const rows = [["Ordinal in words", W.cap(word)], ["Short form", tag], ["Cardinal number", `${n} — ${card}`]];
  if (W.roman(n)) rows.push(["Roman numerals", W.roman(n)]);
  if (n <= 31) rows.push(["In a date", `${tag} March (UK) · March ${tag} (US)`]);
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/number-to-words/">← Number to words converter</a>
      <h1 class="page-title">${tag} in words</h1>
      <p class="page-subtitle">How to spell the ordinal ${tag}, and when to use it.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" style="font-size:1.5rem; line-height:1.3;">${esc(W.cap(word))}</div>
          <div class="label">${tag} in words</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${rows.map(([a, b]) => `          <div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value" style="text-align:right;">${esc(b)}</span></div>`).join("\n")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The number itself: <a href="${url(n)}">${n} in words</a>. For any number's ordinal, use the <a href="/number-to-words/">number to words converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Nearby ordinals</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* ---------- Decimal pages: /number-to-words/1.5/ ---------- */
const DECS = ["0.1", "0.2", "0.25", "0.3", "0.4", "0.5", "0.6", "0.7", "0.75", "0.8", "0.9", "1.25", "1.5", "1.75", "2.5", "2.75", "3.5", "4.5", "5.5", "7.5", "10.5", "12.5"];
/* the decimal part as a fraction in words, where there's a usual one */
const FRAC = { "1": ["one tenth", "1/10"], "2": ["one fifth", "1/5"], "25": ["a quarter", "1/4"], "3": ["three tenths", "3/10"], "4": ["two fifths", "2/5"], "5": ["a half", "1/2"], "6": ["three fifths", "3/5"], "7": ["seven tenths", "7/10"], "75": ["three quarters", "3/4"], "8": ["four fifths", "4/5"], "9": ["nine tenths", "9/10"] };
const decUrl = (d) => `/number-to-words/${d}/`;
function decPage(d) {
  const [whole, part] = d.split(".");
  const w = Number(whole), v = Number(d);
  const point = `${W.british(w)} point ${[...part].map((c) => W.british(Number(c))).join(" ")}`;
  const fr = FRAC[part];
  const asFrac = w ? `${W.british(w)} and ${fr[0]}` : fr[0];
  const loc = SITE + decUrl(d);
  const title = `${d} in Words — ${tc(point)} (or ${tc(asFrac).replace(/(^| )A /g, "$1a ")})`;
  const pct = (Math.round(v * 10000) / 100).toLocaleString("en-GB") + "%";
  const desc = `${d} in words is "${point}", or "${asFrac}" as a fraction (${w ? whole + " " : ""}${fr[1]}). As money, £${v.toFixed(2)} is "${W.chequeWords(v, "uk").replace(/ only$/, "")}". ${d} as a percentage is ${pct}.`;
  const q = [
    [`How do you write ${d} in words?`, `${W.cap(point)}. After the decimal point, each digit is read on its own${part.length > 1 ? ` — "point ${[...part].map((c) => W.british(Number(c))).join(" ")}", not "point ${W.british(Number(part))}"` : ""}. As a fraction it is ${asFrac}.`],
    [`How do you write £${v.toFixed(2)} in words?`, `${W.chequeWords(v, "uk")} on a cheque; ${w ? `"${W.british(w)} pound${w === 1 ? "" : "s"} ${Number(part.padEnd(2, "0"))}"` : `"${W.british(Number(part.padEnd(2, "0")))}p"`} when you say it. On a US check, $${v.toFixed(2)} is "${W.chequeWords(v, "us")}".`],
    [`What is ${d} as a fraction?`, `${w ? whole + " " : ""}${fr[1]}${w ? ` (${w * Number(fr[1].split("/")[1]) + Number(fr[1].split("/")[0])}/${fr[1].split("/")[1]} as an improper fraction)` : ""}. See the <a href="/decimal-to-fraction/">decimal to fraction converter</a> for any other decimal.`],
    [`What is ${d} as a percentage?`, `${pct} — multiply by 100.`]
  ];
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Number to Words", SITE + "/number-to-words/"], [`${d} in words`, loc]]), site.faqLd(q.map(([a, b]) => [a, b.replace(/<[^>]+>/g, "")]))];
  const rows = [["Decimal", W.cap(point)], ["As a fraction", `${W.cap(asFrac)} (${w ? whole + " " : ""}${fr[1]})`], ["As money (UK)", `£${v.toFixed(2)} — ${W.chequeWords(v, "uk")}`], ["As money (US)", `$${v.toFixed(2)} — ${W.chequeWords(v, "us")}`], ["Percentage", pct]];
  const others = DECS.filter((x) => x !== d).map((x) => `<a href="${decUrl(x)}">${x}</a>`).join(" ");
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/number-to-words/">← Number to words converter</a>
      <h1 class="page-title">${d} in words</h1>
      <p class="page-subtitle">How to write ${d} as words, as a fraction and as money.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" style="font-size:1.5rem; line-height:1.3;">${esc(W.cap(point))}</div>
          <div class="label">${d} in words</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${rows.map(([a, b]) => `          <div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value" style="text-align:right;">${esc(b)}</span></div>`).join("\n")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For any amount with pence or cents, the <a href="/cheque-writer/">cheque writer</a> gives the words line; for any decimal, the <a href="/number-to-words/">number to words converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other decimals in words</div>
    <p class="salary-links">${others}</p>

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
  const groups = [["1 to 100", (n) => n <= 100], ["Hundreds", (n) => n > 100 && n <= 1000], ["Years", (n) => isYear(n)], ["Thousands", (n) => n > 1000 && n <= 100000 && !isYear(n)], ["Lakhs and up to a million", (n) => n > 100000 && n <= 1000000], ["Millions and crores", (n) => n > 1000000 && n <= 1000000000], ["Billions and a trillion", (n) => n > 1000000000]];
  const html = `    <main class="tool">
      <p class="tool-section-title">Numbers in words</p>
${groups.map(([label, f]) => `      <p class="salary-links-title">${label}</p>
      <p class="salary-links">${NUMBERS.filter(f).map((n) => `<a href="${url(n)}">${fmt(n)}</a>`).join(" ")}</p>`).join("\n")}
      <p class="salary-links-title">Ordinals</p>
      <p class="salary-links">${ORDS.map((n) => `<a href="${url(W.ordinalSuffix(n))}">${W.ordinalSuffix(n)}</a>`).join(" ")}</p>
      <p class="salary-links-title">Decimals</p>
      <p class="salary-links">${DECS.map((d) => `<a href="${decUrl(d)}">${d}</a>`).join(" ")}</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

checkAgainstLive();
const urls = [];
NUMBERS.forEach((n) => { site.write("number-to-words/" + n, page(n)); urls.push([url(n), "0.5"]); });
ORDS.forEach((n) => { site.write("number-to-words/" + W.ordinalSuffix(n), ordPage(n)); urls.push([url(W.ordinalSuffix(n)), "0.4"]); });
DECS.forEach((d) => { if (!FRAC[d.split(".")[1]]) throw new Error("no fraction for " + d); site.write("number-to-words/" + d, decPage(d)); urls.push([decUrl(d), "0.4"]); });
site.prune("number-to-words", /^\d+(st|nd|rd|th)$/);
site.prune("number-to-words", /^\d+\.\d+$/);
hubBlock();
const pruned = site.prune("number-to-words", /^\d+$/);
site.sitemapBlock("number pages", "tools/build-number-pages.js", urls);
console.log(`built ${NUMBERS.length} number pages, ${ORDS.length} ordinals and ${DECS.length} decimals; ${site.changed.size} changed, ${pruned} removed`);
