/* Shared by the page generators in tools/: the page shell, structured data,
   file writing and the sitemap.

   Every generated page goes through write(), which notes whether its HTML
   actually changed. sitemapBlock() then gives a URL today's date only if its
   page changed (or is new) and otherwise keeps the date it had, so <lastmod>
   means what it says instead of moving on every rebuild. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SITE = "https://lotsofcalcs.com";
const TODAY = new Date().toISOString().slice(0, 10);

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function niceDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return d + " " + months[m - 1] + " " + y;
}

/* The bar at the top of every page: the site's name and a search box that
   opens the homepage search with the words already typed in */
const TOPBAR = `    <nav class="topbar" aria-label="Site">
      <a class="topbar-brand" href="/"><img src="/favicon-32.png" alt="" width="22" height="22">Lots Of Calcs</a>
      <form class="topbar-search" action="/" method="get" role="search"><input type="search" name="q" placeholder="Search…" aria-label="Search calculators"></form>
    </nav>
`;

const FOOTER = `    <footer class="site-footer">
      <p class="footer-categories">
        <a href="/general/">General</a>
        <a href="/business-analysis/">Business &amp; Analysis</a>
        <a href="/personal-finance/">Personal Finance</a>
        <a href="/savings/">Savings</a>
        <a href="/mortgages-loans/">Mortgages &amp; Loans</a>
        <a href="/investing-pensions/">Investing &amp; Pensions</a>
        <a href="/everyday/">Everyday</a>
        <a href="/home-diy/">Home &amp; DIY</a>
        <a href="/betting-odds/">Betting &amp; Odds</a>
        <a href="/other/">Other</a>
      </p>
      <p>Built with plain HTML, CSS &amp; JavaScript — all calculations run locally in your browser.</p>
      <p><a href="/about/">About this site</a> · <a href="/how-we-check/">How we check our figures</a></p>
    </footer>`;

/* Search results show about 155-160 characters of a description, so a
   longer one is cut back to the last full sentence that fits (every page
   leads with its answer), or failing that the last clause, with an ellipsis. */
const DESC_MAX = 160;
function clipDesc(d) {
  if (!d || d.length <= DESC_MAX) return d;
  let cut = -1;
  const re = /[.!?](?=\s|$)/g;
  let m;
  while ((m = re.exec(d)) && m.index < DESC_MAX) cut = m.index + 1;
  if (cut >= 80) return d.slice(0, cut).trim();
  /* the last clause break outside brackets, so nothing is left half-open */
  let at = -1, depth = 0;
  for (let i = 0; i < DESC_MAX - 2; i++) {
    const c = d[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0 && ((c === "," || c === ";") && d[i + 1] === " " || (c === " " && d[i + 1] === "—") || (c === " " && d[i + 1] === "("))) at = i;
  }
  return (at > 60 ? d.slice(0, at) : d.slice(0, d.lastIndexOf(" ", DESC_MAX - 2))).replace(/[\s,;—]+$/, "").trim() + "…";
}

/* Titles past about 65 characters are cut off in results: the first
   candidate that fits wins, so a page keeps its usual title whenever it can */
const TITLE_MAX = 65;
function fitTitle(...cands) {
  return cands.find((t) => t.length <= TITLE_MAX) || cands[cands.length - 1];
}

/* The share image for a page: its calculator's image (og/<first path
   segment>.jpg, made by tools/build-og-images.py), or the site's own. */
/* Sections without a share image of their own that borrow a parent's */
const OG_ALIAS = { "salary-comparison": "salary", "days-ago": "days-from-today", "weeks-from-today": "days-from-today" };
function ogImage(url) {
  let seg = String(url).replace(SITE, "").split("/").filter(Boolean)[0];
  seg = OG_ALIAS[seg] || seg;
  return seg && fs.existsSync(path.join(ROOT, "og", seg + ".jpg")) ? `${SITE}/og/${seg}.jpg` : `${SITE}/og-image.jpg`;
}

function head({ title, desc, url, ld }) {
  desc = clipDesc(desc);
  const ldJson = JSON.stringify(ld, null, 2).replace(/</g, "\\u003C");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lots Of Calcs">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImage(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage(url)}">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#1f2233">
<link rel="stylesheet" href="/styles.css">
<script src="/theme.js"></script>
<script src="/consent.js" defer></script>
<script src="/visits.js" defer></script>
<script src="/share.js" defer></script>
<script type="application/ld+json">
${ldJson}
</script>
</head>
<body>
  <div class="page">
${TOPBAR}`;
}

/* items: [[name, absolute url], ...] */
function breadcrumb(items) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name: name, item: url }))
  };
}

/* modified: the date the figures behind the page were last confirmed
   (rates checked), for pages built on data that changes */
function webPage(title, desc, url, modified) {
  const o = {
    "@context": "https://schema.org", "@type": "WebPage", name: title, description: clipDesc(desc), url: url,
    isPartOf: { "@type": "WebSite", name: "Lots Of Calcs", url: SITE + "/" }
  };
  if (modified) o.dateModified = modified;
  return o;
}

/* q: [[question, answer], ...] as plain text */
function faqLd(q) {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: q.map(([a, b]) => ({ "@type": "Question", name: a, acceptedAnswer: { "@type": "Answer", text: b } }))
  };
}

function faqHtml(q) {
  return q.map(([a, b]) => `      <h3 class="faq-q">${esc(a)}</h3>\n      <p class="about-text">${esc(b)}</p>\n`).join("");
}

function card(href, icon, title, desc) {
  return `      <a class="hub-card" href="${href}">
        <span class="icon">${/^</.test(icon) ? icon : require("./icons.js").inner(icon) || icon}</span>
        <div class="title">${esc(title)}</div>
        <div class="desc">${esc(desc)}</div>
      </a>
`;
}

/* A table that scrolls sideways inside its own box on a narrow screen.
   Cells are HTML: escape anything that isn't already. */
function table(headers, rows, minWidth) {
  return `      <div class="table-scroll">
        <div style="min-width:${minWidth || 420}px;">
          <table class="out-table">
            <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>
${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("\n")}
            </tbody>
          </table>
        </div>
      </div>
`;
}

/* The few entries of a sorted list nearest to one of them, for "other
   amounts" links: a page links to its neighbours rather than to everything. */
function neighbours(list, value, each) {
  const n = each || 4;
  const i = list.indexOf(value);
  if (i < 0) return list.slice(0, n * 2);
  let lo = Math.max(0, i - n);
  let hi = Math.min(list.length, i + n + 1);
  // Near either end, take the slack from the other side
  if (i - lo < n) hi = Math.min(list.length, hi + (n - (i - lo)));
  if (hi - i - 1 < n) lo = Math.max(0, lo - (n - (hi - i - 1)));
  return list.slice(lo, hi).filter((x) => x !== value);
}

// ---------------------------------------------------------------- writing

const changed = new Set();
const written = new Set();

/* rel is the page's directory relative to the site root, e.g. "salary/us" */
function write(rel, html) {
  html = require("./icons.js").convert(html, rel);
  const dir = path.join(ROOT, rel);
  const file = path.join(dir, "index.html");
  const loc = "/" + (rel ? rel.replace(/\/$/, "") + "/" : "");
  written.add(loc);
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === html) return false;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, html);
  changed.add(loc);
  return true;
}

/* Removes generated page directories under rel that this run did not write —
   pages for amounts that have been taken off a list. Only directories whose
   name matches `pattern` are considered, so hand-made pages are left alone. */
function prune(rel, pattern) {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    if (!d.isDirectory() || !pattern.test(d.name)) return;
    const loc = "/" + rel.replace(/\/$/, "") + "/" + d.name + "/";
    if (written.has(loc)) return;
    fs.rmSync(path.join(dir, d.name), { recursive: true });
    n++;
  });
  return n;
}

// ---------------------------------------------------------------- sitemap

/* Replaces one generator's block of sitemap.xml. urls: [[loc, priority], ...]
   with loc relative ("/salary/"). `key` names the block in its marker comment;
   `strip`, if given, also removes loose entries under that path from before
   the block existed. */
function sitemapBlock(key, generator, urls, strip) {
  const file = path.join(ROOT, "sitemap.xml");
  let xml = fs.readFileSync(file, "utf8");

  const was = {};
  const re = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
  let m;
  while ((m = re.exec(xml))) was[m[1]] = m[2];

  const START = `  <!-- ${key}: generated by ${generator} -->\n`;
  const END = `  <!-- end ${key} -->\n`;
  if (xml.includes(START)) xml = xml.slice(0, xml.indexOf(START)) + xml.slice(xml.indexOf(END) + END.length);
  if (strip) {
    const loose = new RegExp("  <url>\\s*<loc>" + (SITE + strip).replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&") + "[^<]*</loc>[\\s\\S]*?</url>\\n", "g");
    xml = xml.replace(loose, "");
  }
  const block = START + urls.map(([loc, priority]) => {
    const full = SITE + loc;
    const lastmod = changed.has(loc) || !was[full] ? TODAY : was[full];
    return `  <url>\n    <loc>${full}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  }).join("") + END;
  xml = xml.replace("</urlset>", block + "</urlset>");
  fs.writeFileSync(file, xml);
}

/* Put a generated block on a hand-written calculator page, just above its
   related calculators, between marker comments so re-running replaces it.
   name: "pace pages"; generator: "tools/build-pace-pages.js". */
function hubBlock(rel, name, generator, html) {
  const file = path.join(ROOT, rel.replace(/^\/|\/$/g, ""), "index.html");
  const START = `    <!-- ${name}: generated by ${generator} -->\n`, END = `    <!-- end ${name} -->\n`;
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n+/, "");
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error(rel + ": related marker not found");
  s = s.slice(0, at).replace(/\n{3,}$/, "\n\n") + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

module.exports = {
  ROOT, SITE, TODAY, FOOTER, TOPBAR,
  esc, niceDate, clipDesc, fitTitle, head, breadcrumb, webPage, faqLd, faqHtml, card, table, neighbours,
  write, prune, sitemapBlock, changed, hubBlock, ogImage
};
