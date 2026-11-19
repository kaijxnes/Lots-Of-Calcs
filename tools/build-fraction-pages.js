#!/usr/bin/env node
/* Decimal ↔ fraction answer pages:

       /decimal-to-fraction/0-375/     0.375 = 3/8, with the working
       /fraction-to-decimal/1-6/       1/6 = 0.1666… (16.67%), with long division

       node tools/build-fraction-pages.js

   Every conversion goes through fraction-utils.js, the code the live
   converter runs. /fraction-to-decimal/ itself redirects to the converter
   (see _redirects), which has both directions. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { load } = require("./lib/load-script.js");
const { SITE, esc } = site;
const { Frac } = load("fraction-utils.js", ["Frac"]);

const D2F = "/decimal-to-fraction/", F2D = "/fraction-to-decimal/";

/* Decimals: every hundredth, sixteenths and eighths, and common ones above 1 */
const DECIMALS = [];
for (let i = 1; i <= 99; i++) DECIMALS.push(i % 10 === 0 ? "0." + i / 10 : "0." + String(i).padStart(2, "0"));
["0.0625", "0.125", "0.1875", "0.3125", "0.375", "0.4375", "0.5625", "0.625", "0.6875", "0.8125", "0.875", "0.9375",
  "1.1", "1.2", "1.25", "1.3", "1.4", "1.5", "1.6", "1.75", "1.8", "2.25", "2.5", "2.75", "3.25", "3.5", "3.75"].forEach((d) => DECIMALS.push(d));
DECIMALS.sort((a, b) => Number(a) - Number(b));

/* Fractions: every proper fraction in lowest terms with a denominator up to 12, and sixteenths */
const FRACTIONS = [];
[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16].forEach((d) => { for (let n = 1; n < d; n++) if (Frac.gcd(n, d) === 1) FRACTIONS.push([n, d]); });

const dSlug = (s) => s.replace(".", "-");
const fSlug = ([n, d]) => `${n}-${d}`;
const trim = (v, dp) => String(Number(v.toFixed(dp)));
const hasF = (n, d) => FRACTIONS.some((f) => f[0] === n && f[1] === d);
const step = (i, t, b) => `        <div class="step"><span class="step-n">${i}</span><div class="step-body"><div class="step-title">${t}</div><div class="step-detail">${b}</div></div></div>\n`;
const word = { 2: "halves", 3: "thirds", 4: "quarters", 5: "fifths", 6: "sixths", 7: "sevenths", 8: "eighths", 9: "ninths", 10: "tenths", 11: "elevenths", 12: "twelfths", 16: "sixteenths" };

/* 0.1(6) as HTML with the repeating digits overlined, and as plain text 0.1666… */
function decHtml(p) {
  const head = (p.neg ? "-" : "") + p.intPart + (p.nonRepeating || p.repeating ? "." : "") + p.nonRepeating;
  return p.repeating ? `${head}<span class="rec">${p.repeating}</span>` : head;
}
function decText(p) {
  if (!p.repeating) return Frac.formatDecimalParts(p);
  let digits = p.nonRepeating;
  while (digits.length < Math.max(4, p.nonRepeating.length + p.repeating.length)) digits += p.repeating;
  return `${p.intPart}.${digits.slice(0, Math.max(4, p.nonRepeating.length + p.repeating.length))}…`;
}

function page({ title, desc, url, crumb, h1, sub, body, q, script }) {
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Decimal to Fraction Converter", SITE + D2F], [crumb, url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${D2F}">← Decimal ↔ fraction converter</a>
      <h1 class="page-title">${h1}</h1>
      <p class="page-subtitle">${sub}</p>
    </header>

${body}
    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- decimal → fraction */
function decimalPage(s) {
  const f = Frac.parseDecimalString(s);
  const [, intStr, frac] = s.match(/^(\d+)\.(\d+)$/);
  const d0 = 10 ** frac.length, n0 = Number(intStr + frac), g = Frac.gcd(n0, d0);
  const fr = Frac.format(f), mixed = f.n > f.d ? Frac.formatMixed(f) : null;
  const pct = trim(Number(s) * 100, 4);
  const url = SITE + `${D2F}${dSlug(s)}/`;
  const title = site.fitTitle(mixed ? `${s} as a Fraction — ${fr} or ${mixed} (With Working)` : `${s} as a Fraction — ${fr} in Simplest Form (With Working)`, `${s} as a Fraction — ${mixed || fr} in Simplest Form`);
  const desc = `${s} as a fraction is ${fr}${mixed ? `, or ${mixed} as a mixed number` : ""}. Write it as ${n0}/${d0}${g > 1 ? ` and divide top and bottom by ${g}` : ", which can't be simplified"}. As a percentage it's ${pct}%.`;
  let i = 1;
  let steps = step(i++, "Write it over a power of ten", `${s} has ${frac.length} digit${frac.length > 1 ? "s" : ""} after the point, so put ${n0} over 1${"0".repeat(frac.length)}: <strong>${n0}/${d0}</strong>.`);
  steps += g > 1
    ? step(i++, "Find the biggest number that divides both", `The greatest common divisor of ${n0} and ${d0} is <strong>${g}</strong>.`) + step(i++, "Divide top and bottom by it", `${n0} ÷ ${g} = ${f.n} and ${d0} ÷ ${g} = ${f.d}, so ${s} = <strong>${fr}</strong>.`)
    : step(i++, "Check it can't be simplified", `${n0} and ${d0} share no factor except 1, so <strong>${fr}</strong> is already in its simplest form.`);
  if (mixed) steps += step(i++, "As a mixed number", `${f.n} ÷ ${f.d} = ${Math.floor(f.n / f.d)} remainder ${f.n % f.d}, so ${fr} = <strong>${mixed}</strong>.`);
  const idx = DECIMALS.indexOf(s);
  const near = DECIMALS.slice(Math.max(0, idx - 5), idx + 6).map((x) => {
    const y = Frac.parseDecimalString(x);
    return [x === s ? `<strong>${x}</strong>` : `<a href="${D2F}${dSlug(x)}/">${x}</a>`, Frac.format(y), trim(Number(x) * 100, 4) + "%"];
  });
  const q = [
    [`What is ${s} as a fraction?`, `${fr}${mixed ? `, which is ${mixed} as a mixed number` : ""}. ${s} is ${n0}/${d0}${g > 1 ? `, and dividing both by ${g} simplifies it to ${fr}` : ", which is already in lowest terms"}.`],
    [`How do you convert ${s} to a fraction?`, `Put the digits after the point over 1 followed by as many zeros as there are digits (${n0}/${d0}), then divide the top and bottom by their greatest common divisor${g > 1 ? ` (${g})` : ""}.`],
    [`What is ${s} as a percentage?`, `${pct}%. Multiply the decimal by 100, which moves the point two places to the right.`]
  ];
  const body = `    <main class="tool">
      <div class="result-box">
        <div class="result-hero"><div class="value">${fr}</div><div class="label">${s} as a fraction</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Before simplifying</span><span class="r-value">${n0}/${d0}</span></div>
          <div class="result-row highlight"><span class="r-label">Simplest form</span><span class="r-value">${fr}</span></div>
${mixed ? `          <div class="result-row"><span class="r-label">Mixed number</span><span class="r-value">${mixed}</span></div>\n` : ""}          <div class="result-row"><span class="r-label">Percentage</span><span class="r-value">${pct}%</span></div>
        </div>
      </div>
      <p class="tool-section-title" style="margin-top:20px;">How to work it out</p>
      <div class="steps">
${steps}      </div>
      <p class="tool-hint" style="margin-top:12px;">For any other decimal, including recurring ones like 0.1(6), use the <a href="${D2F}">decimal to fraction converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Nearby decimals as fractions</p>
${site.table(["Decimal", "Fraction", "Percentage"], near, 300)}    </main>
`;
  return page({ title, desc, url, crumb: `${s} as a fraction`, h1: `${s} as a fraction`, sub: `${s} = ${fr}${mixed ? ` = ${mixed}` : ""} in its simplest form.`, body, q });
}

/* ---------------------------------------------------------------- fraction → decimal */
function longDivision(n, d) {
  const rows = [];
  let r = n % d;
  const seen = new Map();
  while (r !== 0 && !seen.has(r) && rows.length < 10) {
    seen.set(r, rows.length);
    const x = r * 10, digit = Math.floor(x / d);
    rows.push([`${x} ÷ ${d}`, String(digit), String(x % d)]);
    r = x % d;
  }
  return { rows, repeatsAt: r !== 0 && seen.has(r) ? r : null };
}

function fractionPage([n, d]) {
  const f = { n, d }, p = Frac.toDecimalParts(f), val = n / d;
  const html = decHtml(p), text = decText(p);
  const pct = p.terminates && (p.nonRepeating.length <= 4) ? trim(val * 100, 4) : (val * 100).toFixed(2);
  const pctExact = p.terminates && p.nonRepeating.length <= 4;
  const url = SITE + `${F2D}${n}-${d}/`;
  const factors = Frac.factorise(d);
  const why = p.terminates
    ? `It terminates because ${d} = ${factors.join(" × ")} has no prime factors other than 2 and 5, the factors of 10.`
    : `It recurs because ${d}${factors.length > 1 ? ` = ${factors.join(" × ")}` : ""} has a prime factor other than 2 or 5, so the division never comes out exactly.`;
  const title = site.fitTitle(`${n}/${d} as a Decimal — ${text} (${pct}%)`, `${n}/${d} as a Decimal — ${text}`);
  const desc = `${n}/${d} as a decimal is ${p.terminates ? text : `${text}, with the ${p.repeating} recurring`}${p.terminates ? "" : ` (${val.toFixed(3)} to 3 decimal places)`}. As a percentage it's ${pctExact ? "" : "about "}${pct}%. ${why}`;
  const ld = longDivision(n, d);
  const divTable = site.table(["Step", "Digit", "Remainder"], ld.rows, 280);
  const sameDen = [];
  for (let k = 1; k < d; k++) {
    const g = Frac.gcd(k, d), lo = [k / g, d / g];
    const pp = Frac.toDecimalParts({ n: k, d });
    const label = k === n ? `<strong>${k}/${d}</strong>` : hasF(lo[0], lo[1]) ? `<a href="${F2D}${lo[0]}-${lo[1]}/">${k}/${d}</a>` : `${k}/${d}`;
    sameDen.push([label, g > 1 ? `= ${lo[0]}/${lo[1]}` : "", decHtml(pp), (k / d * 100).toFixed(2).replace(/\.00$/, "") + "%"]);
  }
  const equiv = [2, 3, 4, 5].map((m) => `${n * m}/${d * m}`).join(", ");
  const q = [
    [`What is ${n}/${d} as a decimal?`, p.terminates ? `${text}. Divide ${n} by ${d} and the division comes out exactly.` : `${text}, with the ${p.repeating} repeating forever. Rounded, it's ${val.toFixed(2)} to 2 decimal places or ${val.toFixed(3)} to 3.`],
    [`What is ${n}/${d} as a percentage?`, `${pctExact ? "" : "About "}${pct}%. Divide ${n} by ${d} and multiply by 100.`],
    [`Is ${n}/${d} a recurring decimal?`, `${p.terminates ? "No." : "Yes."} ${why}`]
  ];
  const body = `    <main class="tool">
      <div class="result-box">
        <div class="result-hero"><div class="value">${html}</div><div class="label">${n}/${d} as a decimal</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Decimal</span><span class="r-value">${p.terminates ? text : `${html} (${text})`}</span></div>
          <div class="result-row"><span class="r-label">To 2 decimal places</span><span class="r-value">${val.toFixed(2)}</span></div>
          <div class="result-row"><span class="r-label">To 3 decimal places</span><span class="r-value">${val.toFixed(3)}</span></div>
          <div class="result-row"><span class="r-label">Percentage</span><span class="r-value">${pct}%</span></div>
          <div class="result-row"><span class="r-label">${p.terminates ? "Terminates" : "Repeating block"}</span><span class="r-value">${p.terminates ? "Yes" : p.repeating}</span></div>
        </div>
      </div>
      <p class="tool-section-title" style="margin-top:20px;">Long division: ${n} ÷ ${d}</p>
      <p class="about-text">Write ${n} as ${n}.000… and divide by ${d}, one digit at a time. Each remainder is multiplied by 10 for the next step.</p>
${divTable}      <p class="about-text" style="margin-top:12px;">${ld.repeatsAt !== null ? `The remainder ${ld.repeatsAt} has come up before, so the digits from there repeat: <strong>${n}/${d} = ${html}</strong>.` : `The remainder reaches 0, so the decimal stops: <strong>${n}/${d} = ${text}</strong>.`} ${why}</p>
      <p class="tool-hint" style="margin-top:12px;">Equivalent fractions with the same value: ${equiv}. For any other fraction, use the <a href="${D2F}">fraction to decimal converter</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">All ${word[d]} as decimals</p>
${site.table(["Fraction", "Simplifies to", "Decimal", "Percentage"], sameDen, 300)}    </main>
`;
  return page({ title, desc, url, crumb: `${n}/${d} as a decimal`, h1: `${n}/${d} as a decimal`, sub: `${n}/${d} = ${p.terminates ? text : `${text} (${html})`}, or ${pctExact ? "" : "about "}${pct}%.`, body, q });
}

/* ---------------------------------------------------------------- hub + sitemap */
function hubBlock() {
  const file = path.join(site.ROOT, "decimal-to-fraction/index.html");
  const START = "    <!-- fraction pages: generated by tools/build-fraction-pages.js -->\n", END = "    <!-- end fraction pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const byDen = {};
  FRACTIONS.forEach(([n, d]) => (byDen[d] = byDen[d] || []).push(`<a href="${F2D}${n}-${d}/">${n}/${d}</a>`));
  const html = `    <main class="tool">
      <p class="tool-section-title">Decimals as fractions</p>
      <p class="salary-links">${DECIMALS.map((x) => `<a href="${D2F}${dSlug(x)}/">${x}</a>`).join(" ")}</p>
      <p class="tool-section-title" style="margin-top:18px;">Fractions as decimals</p>
${Object.keys(byDen).map((d) => `      <p class="salary-links"><strong>${word[d][0].toUpperCase() + word[d].slice(1)}:</strong> ${byDen[d].join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks */
{
  const a = Frac.parseDecimalString("0.375"), b = Frac.toDecimalParts({ n: 1, d: 6 }), c = Frac.toDecimalParts({ n: 3, d: 8 });
  if (Frac.format(a) !== "3/8" || decText(b) !== "0.1666…" || decText(c) !== "0.375" || decText(Frac.toDecimalParts({ n: 2, d: 7 })) !== "0.285714…") throw new Error("fraction check");
}

const urls = [];
DECIMALS.forEach((s) => { site.write(`decimal-to-fraction/${dSlug(s)}`, decimalPage(s)); urls.push([`${D2F}${dSlug(s)}/`, "0.5"]); });
FRACTIONS.forEach((f) => { site.write(`fraction-to-decimal/${fSlug(f)}`, fractionPage(f)); urls.push([`${F2D}${fSlug(f)}/`, "0.5"]); });
hubBlock();
site.prune("decimal-to-fraction", /^\d+-\d+$/);
site.prune("fraction-to-decimal", /^\d+-\d+$/);
site.sitemapBlock("fraction pages", "tools/build-fraction-pages.js", urls);
console.log(`built ${DECIMALS.length} decimal and ${FRACTIONS.length} fraction pages`);
