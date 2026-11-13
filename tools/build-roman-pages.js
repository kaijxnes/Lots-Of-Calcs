#!/usr/bin/env node
/* A page per number people look up in Roman numerals — every number to 100,
   round numbers to 3,999 and every year from 1900 to 2100:

       /roman-numerals/1999/      1999 in Roman numerals: MCMXCIX

       node tools/build-roman-pages.js

   The numerals and their breakdown come from roman-numerals.js (toRoman,
   decompose, partNote), loaded rather than copied, so these pages always
   match the converter. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { load } = require("./lib/load-script.js");
const { esc, SITE } = site;

const R = load("roman-numerals.js", ["toRoman", "decompose", "partNote", "romanValue"]);

const range = (a, b, s) => { const o = []; for (let v = a; v <= b; v += s) o.push(v); return o; };
const NUMBERS = Array.from(new Set([].concat(range(1, 100, 1), range(110, 1000, 10), range(1100, 1800, 100), range(1900, 2100, 1), range(2200, 3900, 100), [1066, 1215, 1492, 1776, 1815, 1914, 1918, 1939, 1945, 3999]))).sort((a, b) => a - b);
NUMBERS.forEach((n) => { if (R.romanValue(R.toRoman(n)) !== n) throw new Error("round trip failed for " + n); });

const url = (n) => `/roman-numerals/${n}/`;
const isYear = (n) => n >= 1000 && n <= 2100;
/* Years read without a thousands comma (1999), other numbers with one (3,999) */
const fmt = (n) => (isYear(n) ? String(n) : n.toLocaleString("en-GB"));

function page(n) {
  const r = R.toRoman(n);
  const parts = R.decompose(n);
  const loc = SITE + url(n);
  const title = isYear(n) ? `${n} in Roman Numerals — ${r} (Year ${n} in Roman Numerals)` : `${fmt(n)} in Roman Numerals — ${r}`;
  const desc = `${fmt(n)} in Roman numerals is ${r}${parts.length > 1 ? ` (${parts.map((p) => p.sym).join(" + ")})` : ""}. How it's built, how to read it${isYear(n) ? ", and how to write the year on a date" : ""}.`;
  const rows = parts.map((p) => [esc(p.sym), p.value.toLocaleString("en-GB"), esc(R.partNote(p) || "—")]);
  const sub = parts.some((p) => p.sym.length === 2);
  const near = NUMBERS.filter((x) => x !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b).slice(0, 10).sort((a, b) => a - b);
  const q = [
    [`What is ${fmt(n)} in Roman numerals?`, `${r}. It breaks down as ${parts.map((p) => `${p.sym} (${p.value.toLocaleString("en-GB")})`).join(" + ")} = ${fmt(n)}.`],
    [`How do you read ${r}?`, sub
      ? `Read left to right, adding each symbol — except where a smaller symbol sits before a larger one, which means subtract it: ${parts.filter((p) => p.sym.length === 2).map((p) => `${p.sym} is ${R.partNote(p)} = ${fmt(p.value)}`).join("; ")}.`
      : `Add the symbols from left to right: ${parts.map((p) => fmt(p.value)).join(" + ")} = ${fmt(n)}. There is no subtraction in this one.`],
    [`Can ${fmt(n)} be written another way?`, `${r} is the standard form. Clocks often show 4 as IIII rather than IV, and older inscriptions vary, but modern usage — film credits, document numbering, monarchs and years — uses the subtractive form shown here.`]
  ];
  if (isYear(n)) q.push([`How do you write a date in ${n} in Roman numerals?`, `Write each part separately: the day and month as numerals and the year as ${r}. For example, 14 March ${n} is XIV.III.${r} written day first, or III.XIV.${r} month first as in the US.`]);
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Roman Numeral Converter", SITE + "/roman-numerals/"], [`${fmt(n)} in Roman numerals`, loc]]), site.faqLd(q)];
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/roman-numerals/">← Roman numeral converter</a>
      <h1 class="page-title">${fmt(n)} in Roman numerals</h1>
      <p class="page-subtitle">${isYear(n) ? `The year ${n}` : fmt(n)} written in Roman numerals, symbol by symbol.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" style="letter-spacing:0.06em;">${esc(r)}</div>
          <div class="label">${fmt(n)} in Roman numerals</div>
        </div>
      </div>
      <p class="tool-section-title" style="margin-top:22px;">How it's built</p>
${site.table(["Symbol", "Value", "Why"], rows, 300)}      <p class="tool-hint" style="margin-top:12px;">${parts.length} part${parts.length === 1 ? "" : "s"} adding up to ${fmt(n)}. For any other number, or to read a numeral back, use the <a href="/roman-numerals/">Roman numeral converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other numbers in Roman numerals</div>
    <p class="salary-links">${near.map((x) => `<a href="${url(x)}">${fmt(x)} — ${R.toRoman(x)}</a>`).join(" ")}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "roman-numerals/index.html");
  const START = "    <!-- roman pages: generated by tools/build-roman-pages.js -->\n";
  const END = "    <!-- end roman pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const groups = [["1 to 100", (n) => n <= 100], ["Up to 1,000", (n) => n > 100 && n <= 1000], ["Years", (n) => n > 1000 && n <= 2100], ["Up to 3,999", (n) => n > 2100]];
  const html = `    <main class="tool">
      <p class="tool-section-title">Numbers and years in Roman numerals</p>
${groups.map(([label, f]) => `      <p class="salary-links-title">${label}</p>
      <p class="salary-links">${NUMBERS.filter(f).map((n) => `<a href="${url(n)}">${n > 1000 && n <= 2100 ? n : fmt(n)}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const urls = [];
NUMBERS.forEach((n) => { site.write("roman-numerals/" + n, page(n)); urls.push([url(n), "0.5"]); });
hubBlock();
const pruned = site.prune("roman-numerals", /^\d+$/);
site.sitemapBlock("roman pages", "tools/build-roman-pages.js", urls);
console.log(`built ${NUMBERS.length} Roman numeral pages; ${pruned} removed`);
