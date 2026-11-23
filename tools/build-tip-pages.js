#!/usr/bin/env node
/* "20% tip on $85" — a page per common tip and bill, US-focused:

       /tip/20-percent-tip-on-85/     $17 tip, $102 total, split 2–6 ways

       node tools/build-tip-pages.js

   Bills are whole dollars and tips whole percentages, so the tip is exact
   to the cent; splits are rounded to the cent (the last person may pay a
   cent more or less, which the page says). */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/tip/";
const PCTS = [10, 12, 15, 18, 20, 22, 25];
const BILLS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 125, 150, 175, 200, 250, 300];

const slug = (x, y) => `${x}-percent-tip-on-${y}`;
const c2 = (v) => Math.round(v * 100) / 100;
const tip = (x, y) => c2(y * x / 100);
const d = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
const d2 = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function shortcut(x, y) {
  const ten = tip(10, y);
  if (x === 10) return `Move the decimal point one place left: ${d(y)} → ${d(ten)}.`;
  if (x === 20) return `Take 10% (${d(ten)}) and double it: ${d(tip(20, y))}.`;
  if (x === 15) return `Take 10% (${d(ten)}), then add half of that (${d(tip(5, y))}): ${d(tip(15, y))}.`;
  if (x === 25) return `A quarter of the bill: ${d(y)} ÷ 4 = ${d(tip(25, y))}.`;
  if (x === 18) return `20% (${d(tip(20, y))}) minus 2% (${d(tip(2, y))}): ${d(tip(18, y))}.`;
  if (x === 22) return `20% (${d(tip(20, y))}) plus 2% (${d(tip(2, y))}): ${d(tip(22, y))}.`;
  return `10% (${d(ten)}) plus 2% (${d(tip(2, y))}): ${d(tip(x, y))}.`;
}

function page(x, y) {
  const t = tip(x, y), total = c2(y + t), url = SITE + `${BASE}${slug(x, y)}/`;
  const title = site.fitTitle(`${x}% Tip on $${y} — ${d(t)} Tip, ${d(total)} Total (Split Too)`, `${x}% Tip on $${y} = ${d(t)} (${d(total)} Total)`);
  const desc = `A ${x}% tip on ${d(y)} is ${d(t)}, making ${d(total)} in all. Split two ways it's ${d2(c2(total / 2))} each. With a quick way to work it out at the table.`;
  const q = [
    [`What is a ${x}% tip on ${d(y)}?`, `${d(t)}: ${d(y)} × ${x} ÷ 100. With the tip the total is ${d(total)}.`],
    [`How do I work out a ${x}% tip in my head?`, shortcut(x, y)],
    [`Should I tip on the amount before or after tax?`, `Etiquette guides usually say to tip on the pre-tax amount, but many people tip on the total for simplicity — the difference is small. Enter whichever you prefer in the tip calculator.`],
    [`How much is ${d(total)} split between 4 people?`, `${d2(c2(total / 4))} each, tip included.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Tip Calculator", SITE + BASE], [`${x}% tip on $${y}`, url]]), site.faqLd(q)];
  const split = [1, 2, 3, 4, 5, 6, 8].map((n) => [n === 1 ? "1 person" : `${n} people`, d2(c2(t / n)), d2(c2(total / n))]);
  const others = PCTS.map((p) => [p === x ? `<strong>${p}%</strong>` : `<a href="${BASE}${slug(p, y)}/">${p}% on ${d(y)}</a>`, d(tip(p, y)), d(c2(y + tip(p, y)))]);
  const nearby = site.neighbours(BILLS, y, 5).concat([y]).sort((a, b) => a - b)
    .map((b) => [b === y ? `<strong>${x}% on ${d(b)}</strong>` : `<a href="${BASE}${slug(x, b)}/">${x}% on ${d(b)}</a>`, d(tip(x, b)), d(c2(b + tip(x, b)))]);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Tip calculator</a>
      <h1 class="page-title">${x}% tip on $${y}</h1>
      <p class="page-subtitle">A ${x}% tip on ${d(y)} is <strong>${d(t)}</strong>, for a total of <strong>${d(total)}</strong>.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Bill</span><span class="r-value">${d2(y)}</span></div>
          <div class="result-row highlight"><span class="r-label">${x}% tip</span><span class="r-value">${d2(t)}</span></div>
          <div class="result-row highlight"><span class="r-label">Total to pay</span><span class="r-value">${d2(total)}</span></div>
        </div>
      </div>
      <h2 class="tool-section-title" style="margin-top:20px;">Splitting it</h2>
${site.table(["Split between", "Tip each", "Total each"], split, 300)}      <p class="tool-hint" style="margin-top:12px;">Rounded to the cent, so one person may pay a cent more or less. Other amounts, currencies and splits: use the <a href="${BASE}">tip calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How to work it out</h2>
      <p class="about-text"><strong>The formula:</strong> bill × tip % ÷ 100 = ${d(y)} × ${x} ÷ 100 = <strong>${d(t)}</strong>. Add it to the bill for ${d(total)}, or multiply the bill by ${1 + x / 100} in one step.</p>
      <p class="about-text"><strong>At the table:</strong> ${shortcut(x, y)}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Other tips on ${d(y)}</h2>
${site.table(["Tip", "Tip amount", "Total"], others, 300)}      <h2 class="tool-section-title" style="margin-top:20px;">${x}% on nearby bills</h2>
${site.table(["Bill", "Tip amount", "Total"], nearby, 300)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "tip/index.html");
  const START = "    <!-- tip pages: generated by tools/build-tip-pages.js -->\n", END = "    <!-- end tip pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n+/, "");
  const html = `    <main class="tool">
      <h2 class="tool-section-title">Tips on common bills</h2>
${PCTS.map((x) => `      <p class="salary-links"><strong>${x}% tip on:</strong> ${BILLS.map((y) => `<a href="${BASE}${slug(x, y)}/">$${y}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error("tip: related marker not found");
  s = s.slice(0, at).replace(/\n{3,}$/, "\n\n") + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: 20% of 85 = 17; 15% of 45 = 6.75; 18% of 55 = 9.90 */
if (tip(20, 85) !== 17 || tip(15, 45) !== 6.75 || tip(18, 55) !== 9.9) throw new Error("tip check");

const urls = [];
PCTS.forEach((x) => BILLS.forEach((y) => { site.write(`tip/${slug(x, y)}`, page(x, y)); urls.push([`${BASE}${slug(x, y)}/`, "0.4"]); }));
hubBlock();
site.prune("tip", /^\d+-percent-tip-on-\d+$/);
site.sitemapBlock("tip pages", "tools/build-tip-pages.js", urls);
console.log(`built ${urls.length} tip pages`);
