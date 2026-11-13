#!/usr/bin/env node
/* "How old is a 7-year-old dog in human years?" — a page per age:

       /dog-age/7-years/    every dog size, the DNA-based estimate and life stage
       /cat-age/10-years/

       node tools/build-pet-age-pages.js

   The ages come from dog-age.js and cat-age.js (humanYears, epigeneticYears,
   lifestage), loaded rather than copied, so these pages match the calculators. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { load } = require("./lib/load-script.js");
const { esc, SITE } = site;

const DOG = load("dog-age.js", ["humanYears", "epigeneticYears", "lifestage"]);
const CAT = load("cat-age.js", ["humanYears", "lifestage"]);
const SIZES = [["Small", "under 9 kg", 4], ["Medium", "9 to 22 kg", 5], ["Large", "22 to 45 kg", 6], ["Giant", "over 45 kg", 7]];
const r1 = (v) => (Math.round(v * 10) / 10).toLocaleString("en-GB");
const whole = (v) => Math.round(v);
const slug = (a) => `${a}-year${a === 1 ? "" : "s"}`;

function dogPage(age, ages) {
  const h = SIZES.map(([name, w, per]) => ({ name, w, h: DOG.humanYears(age, per), stage: DOG.lifestage(DOG.humanYears(age, per)) }));
  const lo = whole(h[0].h), hi = whole(h[3].h);
  const epi = DOG.epigeneticYears(age);
  const url = SITE + `/dog-age/${slug(age)}/`;
  const range = lo === hi ? `${lo}` : `${lo} to ${hi}`;
  const title = `How Old Is a ${age}-Year-Old Dog in Human Years? — ${range}${lo === hi ? "" : ", by Size"}`;
  const desc = `A ${age}-year-old dog is about ${range} in human years: ${h.map((x) => `${x.name.toLowerCase()} ${whole(x.h)}`).join(", ")}. Bigger breeds age faster. With life stages and the DNA-based estimate.`;
  const rows = h.map((x) => [`${x.name} (${x.w})`, `${r1(x.h)} years`, x.stage]);
  const q = [
    [`How old is a ${age}-year-old dog in human years?`, `Between about ${lo} and ${hi}, depending on size: a small dog ages more slowly than a giant breed. A medium-sized dog of ${age} is about ${whole(h[1].h)} in human terms — ${h[1].stage.toLowerCase()} — while a giant breed is about ${hi}.`],
    ["Is one dog year really seven human years?", `No — that's an old rule of thumb, which would make a ${age}-year-old dog ${age * 7}. Dogs grow up much faster than people in their first two years (about 15 human years in the first, 9 more in the second), then age at a steadier rate that depends on size.`],
    ["What does the DNA-based estimate say?", `A 2020 study at UC San Diego compared changes in DNA (methylation) in dogs and humans and came up with human age ≈ 16 × ln(dog age) + 31. For ${age} years that gives about ${whole(epi)}. It ages young dogs very quickly and older dogs slowly, and was worked out on Labradors, so treat it as a second opinion.`]
  ];
  return common("dog", age, ages, title, desc, url, q, `Your ${age}-year-old dog in human years`, h[1].h, "medium-sized dog", `
${site.table(["Size", "Human years", "Life stage"], rows, 380)}      <p class="tool-hint" style="margin-top:12px;">The DNA-based estimate (16 × ln(age) + 31) gives ${r1(epi)} years for any size. The <a href="/dog-age/">dog age calculator</a> works out months and part-years too.</p>`);
}

function catPage(age, ages) {
  const h = CAT.humanYears(age);
  const stage = CAT.lifestage(h);
  const url = SITE + `/cat-age/${slug(age)}/`;
  const title = `How Old Is a ${age}-Year-Old Cat in Human Years? — ${whole(h)}`;
  const desc = `A ${age}-year-old cat is about ${whole(h)} in human years — ${stage.toLowerCase()} life stage. Cats reach adulthood fast: 15 human years in their first year, 24 by two, then about 4 a year.`;
  const q = [
    [`How old is a ${age}-year-old cat in human years?`, `About ${whole(h)}. Cats age about 15 human years in their first year and 9 more in their second, then roughly 4 human years for every year after that, so ${age} works out at ${r1(h)}.`],
    ["Is one cat year seven human years?", `No — the seven-year rule would make a ${age}-year-old cat ${age * 7}. It overstates older cats and badly understates kittens, which are adults by the age of one or two.`],
    [`What life stage is a ${age}-year-old cat?`, `${stage}. Vets commonly group cats as kittens to 1, juniors to 2, adults 3 to 6, mature 7 to 10, seniors 11 to 14 and geriatric from 15.`]
  ];
  return common("cat", age, ages, title, desc, url, q, `Your ${age}-year-old cat in human years`, h, `life stage: ${stage.toLowerCase()}`, `
      <p class="tool-hint" style="margin-top:12px;">Breed and size make much less difference in cats than in dogs. The <a href="/cat-age/">cat age calculator</a> works out months and part-years too.</p>`);
}

function common(kind, age, ages, title, desc, url, q, h1, hero, heroLabel, body) {
  const Kind = kind === "dog" ? "Dog" : "Cat";
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], [`${Kind} Age Calculator`, SITE + `/${kind}-age/`], [`${age}-year-old ${kind}`, url]]), site.faqLd(q)];
  const near = ages.filter((a) => a !== age).map((a) => `<a href="/${kind}-age/${slug(a)}/">${a} ${a === 1 ? "year" : "years"}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/${kind}-age/">← ${Kind} age calculator</a>
      <h1 class="page-title">${esc(h1)}</h1>
      <p class="page-subtitle">How old a ${age}-year-old ${kind} is compared with a person.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value">${whole(hero)} human years</div>
          <div class="label">${esc(heroLabel)}</div>
        </div>
      </div>
${body}
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other ages</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hubBlock(kind, ages, label) {
  const file = path.join(site.ROOT, `${kind}-age/index.html`);
  const START = `    <!-- ${kind} age pages: generated by tools/build-pet-age-pages.js -->\n`;
  const END = `    <!-- end ${kind} age pages -->\n`;
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const html = `    <main class="tool">
      <p class="tool-section-title">${label}</p>
      <p class="salary-links">${ages.map((a) => `<a href="/${kind}-age/${slug(a)}/">${a} ${a === 1 ? "year" : "years"}</a>`).join(" ")}</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const dogAges = Array.from({ length: 20 }, (_, i) => i + 1);
const catAges = Array.from({ length: 25 }, (_, i) => i + 1);
const urls = [];
dogAges.forEach((a) => { site.write(`dog-age/${slug(a)}`, dogPage(a, dogAges)); urls.push([`/dog-age/${slug(a)}/`, "0.5"]); });
catAges.forEach((a) => { site.write(`cat-age/${slug(a)}`, catPage(a, catAges)); urls.push([`/cat-age/${slug(a)}/`, "0.5"]); });
hubBlock("dog", dogAges, "Dog years by age");
hubBlock("cat", catAges, "Cat years by age");
site.prune("dog-age", /^\d+-years?$/);
site.prune("cat-age", /^\d+-years?$/);
site.sitemapBlock("pet age pages", "tools/build-pet-age-pages.js", urls);
console.log(`built ${dogAges.length} dog and ${catAges.length} cat age pages`);
