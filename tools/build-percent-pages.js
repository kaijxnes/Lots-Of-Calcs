#!/usr/bin/env node
/* "What is 20% of 50?" — a page per common percentage and number:

       /percent/20-percent-of-50/     10, plus 50 + 20% = 60 and 50 − 20% = 40

       node tools/build-percent-pages.js

   X% of Y = Y × X ÷ 100. With whole-number X and Y the answer has at most
   two decimal places, so every figure here is exact. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/percent/";
const PCTS = [1, 2, 3, 5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
const NUMS = [10, 20, 25, 30, 40, 50, 75, 80, 100, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000, 1500, 2000, 2500, 5000, 10000];

const slug = (x, y) => `${x}-percent-of-${y}`;
const of = (x, y) => Math.round(y * x) / 100;
const n = (v) => v.toLocaleString("en-GB", { maximumFractionDigits: 2 });

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (x) => { const g = gcd(x, 100); return `${x / g}/${100 / g}`; };
/* round amounts for "what percent of Y is Z?" */
const ROUND = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
const pctOf = (z, y) => Math.round(z / y * 100 * 1000) / 1000;

/* An easy route to the answer, for the working */
function shortcut(x, y) {
  const ten = of(10, y), one = of(1, y);
  if (x === 50) return `50% is half, so halve ${n(y)}: ${n(of(x, y))}.`;
  if (x === 25) return `25% is a quarter, so divide ${n(y)} by 4: ${n(of(x, y))}.`;
  if (x === 75) return `75% is three quarters: a quarter of ${n(y)} is ${n(of(25, y))}, and three of those make ${n(of(x, y))}.`;
  if (x === 10) return `10% is a tenth, so divide ${n(y)} by 10: ${n(ten)}.`;
  if (x === 1) return `1% is a hundredth, so divide ${n(y)} by 100: ${n(one)}.`;
  if (x % 10 === 0) return `10% of ${n(y)} is ${n(ten)}, so ${x}% is ${x / 10} × ${n(ten)} = ${n(of(x, y))}.`;
  if (x === 15) return `10% of ${n(y)} is ${n(ten)} and 5% is half that, ${n(of(5, y))}, so 15% is ${n(of(x, y))}.`;
  if (x === 5) return `10% of ${n(y)} is ${n(ten)}, and 5% is half that: ${n(of(x, y))}.`;
  return `1% of ${n(y)} is ${n(one)}, so ${x}% is ${x} × ${n(one)} = ${n(of(x, y))}.`;
}

function page(x, y) {
  const a = of(x, y), plus = Math.round((y + a) * 100) / 100, minus = Math.round((y - a) * 100) / 100;
  const url = SITE + `${BASE}${slug(x, y)}/`;
  const title = site.fitTitle(`What Is ${x}% of ${n(y)}? = ${n(a)} (With Working)`, `What Is ${x}% of ${n(y)}? = ${n(a)}`);
  const desc = `${x}% of ${n(y)} is ${n(a)}: ${n(y)} × ${x} ÷ 100. ${n(y)} plus ${x}% is ${n(plus)}, and ${n(y)} minus ${x}% is ${n(minus)}. With a quick way to work it out in your head.`;
  const q = [
    [`What is ${x}% of ${n(y)}?`, `${n(a)}. Multiply ${n(y)} by ${x} and divide by 100, or multiply by ${x / 100}.`],
    [`What is ${n(y)} plus ${x}%?`, `${n(plus)}: ${n(y)} + ${n(a)}, or ${n(y)} × ${1 + x / 100}.`],
    [`What is ${n(y)} minus ${x}%?`, `${n(minus)}: ${n(y)} − ${n(a)}, or ${n(y)} × ${Math.round((1 - x / 100) * 100) / 100}. That's the price after a ${x}% discount.`],
    [`How do I work out ${x}% of ${n(y)} in my head?`, shortcut(x, y)],
    [`${n(a)} is ${x}% of what number?`, `${n(y)}. To work backwards from a percentage, divide by the percentage and multiply by 100: ${n(a)} ÷ ${x} × 100 = ${n(y)}.`],
    [`What percentage of ${n(y)} is ${n(a)}?`, `${x}%: ${n(a)} ÷ ${n(y)} × 100 = ${x}.`]
  ];
  const rounds = ROUND.filter((z) => z < y && z !== a).slice(-8);
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Percentage Calculator", SITE + BASE], [`${x}% of ${n(y)}`, url]]), site.faqLd(q)];
  const otherPcts = PCTS.map((p) => [p === x ? `<strong>${p}%</strong>` : `<a href="${BASE}${slug(p, y)}/">${p}% of ${n(y)}</a>`, n(of(p, y))]);
  const otherNums = site.neighbours(NUMS, y, 5).concat([y]).sort((p, q2) => p - q2).map((m) => [m === y ? `<strong>${x}% of ${n(m)}</strong>` : `<a href="${BASE}${slug(x, m)}/">${x}% of ${n(m)}</a>`, n(of(x, m))]);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Percentage calculator</a>
      <h1 class="page-title">What is ${x}% of ${n(y)}?</h1>
      <p class="page-subtitle">${x}% of ${n(y)} is <strong>${n(a)}</strong>. ${n(y)} plus ${x}% is ${n(plus)}; ${n(y)} minus ${x}% is ${n(minus)}.</p>
    </header>

    <main class="tool" id="pp-tool">
      <div class="field-row">
        <div class="field"><label for="pp-pct">Percentage (%)</label><input type="number" id="pp-pct" value="${x}" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pp-num">Of the number</label><input type="number" id="pp-num" value="${y}" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="pp-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Percentage of the number</span><span class="r-value" id="pp-of">${n(a)}</span></div>
          <div class="result-row"><span class="r-label">Number plus the percentage</span><span class="r-value" id="pp-plus">${n(plus)}</span></div>
          <div class="result-row"><span class="r-label">Number minus the percentage</span><span class="r-value" id="pp-minus">${n(minus)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For percentage change, "what percent is X of Y" and reverse percentages, use the <a href="${BASE}">percentage calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How to work it out</h2>
      <p class="about-text"><strong>The formula:</strong> multiply the number by the percentage and divide by 100. ${n(y)} × ${x} ÷ 100 = <strong>${n(a)}</strong>.</p>
      <p class="about-text"><strong>As a decimal:</strong> ${x}% is ${x / 100}, so ${n(y)} × ${x / 100} = ${n(a)}.</p>
      <p class="about-text"><strong>As a fraction:</strong> ${x}% is ${frac(x)}${frac(x) === `${x}/100` ? "" : ` (${x}/100 simplified)`}, so it's ${n(y)} × ${frac(x).replace("/", " ÷ ")} = ${n(a)}.</p>
      <p class="about-text"><strong>In your head:</strong> ${shortcut(x, y)}</p>
      <p class="about-text"><strong>Adding or taking off ${x}%:</strong> multiply by ${1 + x / 100} to add it (${n(plus)}) or by ${Math.round((1 - x / 100) * 100) / 100} to take it off (${n(minus)}).</p>
      <p class="about-text"><strong>Working backwards:</strong> if ${n(a)} is ${x}% of a number, the number is ${n(a)} ÷ ${x} × 100 = ${n(y)}. And if ${n(plus)} is a price with ${x}% added, the price before was ${n(plus)} ÷ ${1 + x / 100} = ${n(y)}.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Other percentages of ${n(y)}</h2>
${site.table(["Percentage", "Answer"], otherPcts, 260)}      <h2 class="tool-section-title" style="margin-top:20px;">${x}% of other numbers</h2>
${site.table(["Sum", "Answer"], otherNums, 260)}${rounds.length ? `      <h2 class="tool-section-title" style="margin-top:20px;">What percent of ${n(y)} is…</h2>
${site.table(["Amount", "Percentage of " + n(y)], rounds.map((z) => [`${n(z)} of ${n(y)}`, `${n(pctOf(z, y))}%`]), 260)}      <p class="tool-hint" style="margin-top:12px;">Divide the amount by ${n(y)} and multiply by 100.</p>
` : ""}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/percent-page.js"></script>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "percent/index.html");
  const START = "    <!-- percent pages: generated by tools/build-percent-pages.js -->\n", END = "    <!-- end percent pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
  const html = `    <main class="tool">
      <h2 class="tool-section-title">Percentages of common numbers</h2>
${PCTS.map((x) => `      <p class="salary-links"><strong>${x}% of:</strong> ${NUMS.map((y) => `<a href="${BASE}${slug(x, y)}/">${n(y)}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error("percent: related marker not found");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: 20% of 50 = 10; 15% of 75 = 11.25; 12% of 2,500 = 300; 3% of 25 = 0.75 */
if (of(20, 50) !== 10 || of(15, 75) !== 11.25 || of(12, 2500) !== 300 || of(3, 25) !== 0.75) throw new Error("percent check");

const urls = [];
PCTS.forEach((x) => NUMS.forEach((y) => { site.write(`percent/${slug(x, y)}`, page(x, y)); urls.push([`${BASE}${slug(x, y)}/`, "0.4"]); }));
hubBlock();
site.prune("percent", /^\d+-percent-of-\d+$/);
site.sitemapBlock("percent pages", "tools/build-percent-pages.js", urls);
console.log(`built ${urls.length} percentage pages`);
