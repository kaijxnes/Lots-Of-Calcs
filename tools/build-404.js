#!/usr/bin/env node
/* The "page not found" page, /404.html, which Cloudflare serves (with a 404
   status) for any address that doesn't exist — see not_found_handling in
   wrangler.jsonc.

       node tools/build-404.js

   It carries every calculator card from the homepage, so 404.js can suggest
   the ones that match the words in the mistyped address, and look for the
   nearest real page above it (/salary/uk/123/ → /salary/uk/). Rebuild after
   adding a calculator; tools/related.js runs it. Every link is absolute,
   because this page is shown at whatever address was asked for. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");

function build() {
  const home = fs.readFileSync(path.join(site.ROOT, "index.html"), "utf8");
  const seen = new Set();
  const cards = [];
  const re = /<a class="hub-card" href="([^"]+)">\s*<span class="icon">([^<]*)<\/span>\s*<div class="title">([^<]*)<\/div>\s*<div class="desc">([^<]*)<\/div>/g;
  let m;
  while ((m = re.exec(home))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    cards.push(site.card(m[1], m[2], m[3].replace(/&amp;/g, "&"), m[4].replace(/&amp;/g, "&")).replace('class="hub-card"', 'class="hub-card" hidden'));
  }
  if (cards.length < 20) throw new Error("404: homepage cards not found");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page Not Found — Lots Of Calcs</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#1f2233">
<link rel="stylesheet" href="/styles.css">
<script src="/theme.js"></script>
<script src="/consent.js" defer></script>
</head>
<body>
  <div class="page">
${site.TOPBAR}    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Page not found</h1>
      <p class="page-subtitle">There's nothing at this address. It may have moved, or there's a typo in the link.</p>
    </header>

    <main class="tool">
      <p class="about-text" id="nf-nearest" hidden></p>
      <div class="hub-search">
        <span class="hub-search-icon" aria-hidden="true">🔍</span>
        <input type="search" id="nf-search" placeholder="Search calculators…" aria-label="Search calculators">
      </div>
      <h2 class="tool-section-title" id="nf-heading" style="margin-top:18px;">Popular calculators</h2>
      <div class="hub-grid" id="nf-cards">
${cards.join("")}      </div>
      <p class="tool-hint" id="nf-none" hidden>No calculators match that. Try another word, or browse a category below.</p>
      <p class="tool-hint" style="margin-top:16px;">Or go to the <a href="/">homepage</a> to see all ${cards.length} calculators.</p>
    </main>

${site.FOOTER}
  </div>
  <script src="/404.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(site.ROOT, "404.html"), html);
  return cards.length;
}

module.exports = { build };
if (require.main === module) console.log(`built 404.html with ${build()} calculators`);
