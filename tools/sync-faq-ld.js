#!/usr/bin/env node
/* Keeps each page's FAQPage structured data in step with the FAQ people see.

       node tools/sync-faq-ld.js            rewrite any page whose data differs
       node tools/sync-faq-ld.js --check    report differences, change nothing

   The visible FAQ is the source: every <p class="faq-q"> question and the
   <p class="about-text"> paragraphs after it, up to the next question or the
   end of the section. Those become the FAQPage entry in the page's JSON-LD,
   as plain text. Edit the FAQ in the HTML and run this; never edit the JSON-LD
   copy by hand. Pages whose JSON-LD is not a list with a FAQPage are left
   alone. The salary pages are generated with their FAQ data already. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CHECK = process.argv.includes("--check");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", mdash: "—", ndash: "–", minus: "−", times: "×", divide: "÷", hellip: "…", pound: "£", euro: "€", deg: "°", frac12: "½", frac14: "¼", frac34: "¾", le: "≤", ge: "≥", asymp: "≈", sup2: "²", sup3: "³", middot: "·", rarr: "→", frasl: "/", pi: "π", radic: "√" };

function text(html) {
  return html
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => {
      if (!(name in ENTITIES)) throw new Error("unknown entity " + m);
      return ENTITIES[name];
    })
    .replace(/\s+/g, " ")
    .trim();
}

/* Question/answer pairs from the section titled "Frequently asked questions" */
function visibleFaq(html) {
  const at = html.indexOf(">Frequently asked questions<");
  if (at < 0) return null;
  const section = html.slice(at, html.indexOf("</main>", at));
  const out = [];
  const re = /<p class="(faq-q|about-text)">([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(section))) {
    if (m[1] === "faq-q") out.push({ q: text(m[2]), a: [] });
    else if (out.length) out[out.length - 1].a.push(text(m[2]));
  }
  return out.map((x) => ({ q: x.q, a: x.a.join(" ") }));
}

function sync(file) {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/);
  if (!m) return null;
  const ld = JSON.parse(m[1]);
  if (!Array.isArray(ld)) return null;
  const faq = ld.find((x) => x["@type"] === "FAQPage");
  const pairs = visibleFaq(html);
  if (!faq || !pairs) return null;
  if (!pairs.length) throw new Error(file + ": FAQ section has no questions");
  pairs.forEach((p) => { if (!p.a) throw new Error(file + ": no answer to '" + p.q + "'"); });
  faq.mainEntity = pairs.map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } }));
  const json = JSON.stringify(ld, null, 2).replace(/</g, "\\u003C");
  if (json === m[1]) return false;
  if (!CHECK) fs.writeFileSync(file, html.replace(m[0], () => '<script type="application/ld+json">\n' + json + "\n</script>"));
  return true;
}

let changed = [];
fs.readdirSync(ROOT).forEach((d) => {
  const file = path.join(ROOT, d, "index.html");
  if (d === "salary" || !fs.existsSync(file)) return;
  if (sync(file)) changed.push(d);
});
console.log((CHECK ? "out of step: " : "updated: ") + (changed.join(", ") || "none"));
if (CHECK && changed.length) process.exit(1);
