#!/usr/bin/env node
/* "How old am I if I was born in 1990?" — a page per birth year:

       /birthday/born-in-1990/

       node tools/build-born-pages.js

   The page states the age in the year it was built and the browser updates it
   from the visitor's clock (born-page.js); re-run each January (the monthly
   check does) so the text moves on with the year. Generations follow Pew
   Research Center's definitions where Pew sets the years. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const W = require("../number-words.js");
const { esc, SITE } = site;

const NOW = Number(site.TODAY.slice(0, 4));
const YEARS = []; for (let y = 1930; y <= NOW - 1; y++) YEARS.push(y);
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function generation(y) {
  if (y < 1946) return ["the Silent Generation", "Born before the post-war baby boom."];
  if (y <= 1964) return ["the Baby Boomers", "The post-war birth surge from 1946 to 1964."];
  if (y <= 1980) return ["Generation X", "Born 1965 to 1980, in Pew Research Center's definition."];
  if (y <= 1996) return ["the Millennials (Generation Y)", "Born 1981 to 1996, in Pew Research Center's definition."];
  if (y <= 2012) return ["Generation Z", "Pew Research Center counts anyone born from 1997 as Gen Z; most researchers end it around 2012."];
  return ["Generation Alpha", "The generation after Gen Z, usually taken to start in the early 2010s."];
}
const url = (y) => `/birthday/born-in-${y}/`;

function page(y) {
  const after = NOW - y, before = after - 1;
  const [gen, genNote] = generation(y);
  const loc = SITE + url(y);
  const title = `Born in ${y}? How Old You Are in ${NOW} — ${before} or ${after}`;
  const desc = `If you were born in ${y}, you are ${after} in ${NOW} once you've had your birthday, or ${before} before it. With your generation and the year you turn every milestone age.`;
  const miles = [18, 21, 30, 40, 50, 60, 65, 70, 80, 90, 100].map((a) => [`${a}`, `${y + a}`, y + a < NOW ? "Done" : y + a === NOW ? "This year" : `In ${y + a - NOW} year${y + a - NOW === 1 ? "" : "s"}`]);
  const q = [
    [`How old am I if I was born in ${y}?`, `In ${NOW} you are ${after} if your birthday has already been this year, or ${before} if it's still to come.`],
    [`What generation is someone born in ${y}?`, `${W.cap(gen)}. ${genNote}`],
    [`Was ${y} a leap year?`, leap(y) ? `Yes — ${y} had a 29 February.` : `No. ${y} had 365 days.`],
    [`How do you write ${y} in words?`, `As a year it's said "${W.yearSpoken(y)}"; in full, ${W.british(y)}. In Roman numerals it's ${W.roman(y)}.`]
  ];
  const near = YEARS.filter((x) => x !== y && Math.abs(x - y) <= 5).map((x) => `<a href="${url(x)}">Born in ${x}</a>`).join(" ");
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Birthday Calculator", SITE + "/birthday/"], [`Born in ${y}`, loc]]), site.faqLd(q)];
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/birthday/">← Birthday calculator</a>
      <h1 class="page-title">Born in ${y}: how old are you?</h1>
      <p class="page-subtitle">Your age now, your generation, and when you reach each milestone.</p>
    </header>

    <main class="tool" id="born-tool" data-year="${y}">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" id="born-age">${before} or ${after}</div>
          <div class="label" id="born-label">years old in ${NOW} — ${after} once you've had your birthday this year, ${before} before it</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Generation</span><span class="r-value">${esc(W.cap(gen.replace(/^the /, "")))}</span></div>
          <div class="result-row"><span class="r-label">Leap year</span><span class="r-value">${leap(y) ? "Yes" : "No"}</span></div>
          <div class="result-row"><span class="r-label">In Roman numerals</span><span class="r-value"><a href="/roman-numerals/${y}/">${W.roman(y)}</a></span></div>
          <div class="result-row"><span class="r-label">Said as a year</span><span class="r-value"><a href="/number-to-words/${y}/">${esc(W.cap(W.yearSpoken(y)))}</a></span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For your exact age in years, months and days, and the day of the week you were born, use the <a href="/birthday/">birthday calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">When you turn each age</p>
${site.table(["Age", "Year", ""], miles, 300)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other birth years</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
  <script src="/born-page.js"></script>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "birthday/index.html");
  const START = "    <!-- born pages: generated by tools/build-born-pages.js -->\n";
  const END = "    <!-- end born pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const decades = []; for (let d = 1930; d < NOW; d += 10) decades.push(d);
  const html = `    <main class="tool">
      <p class="tool-section-title">How old am I if I was born in…</p>
${decades.map((d) => `      <p class="salary-links">${YEARS.filter((y) => y >= d && y < d + 10).map((y) => `<a href="${url(y)}">${y}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const urls = [];
YEARS.forEach((y) => { site.write(`birthday/born-in-${y}`, page(y)); urls.push([url(y), "0.5"]); });
hubBlock();
site.prune("birthday", /^born-in-\d+$/);
site.sitemapBlock("born pages", "tools/build-born-pages.js", urls);
console.log(`built ${YEARS.length} born-in pages (${YEARS[0]}–${YEARS[YEARS.length - 1]}) for ${NOW}`);
