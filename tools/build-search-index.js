#!/usr/bin/env node
/* /search-index.json: every page's address and a short title, for the
   homepage search to find pages beyond the calculator cards ("£45,000 after
   tax", "20% off £50"). Loaded only when someone searches.

       node tools/build-search-index.js

   Run after the page generators (the monthly rebuild runs it before the
   embeds). Titles are cut at the first " — " or ":" tail to keep the file
   small. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");

const SKIP = /^(embed|node_modules|tools|data|\.)/;
const out = [];
(function walk(dir, rel) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name), r = rel ? rel + "/" + name : name;
    if (SKIP.test(r)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, r);
    else if (name === "index.html" && rel) {
      const html = fs.readFileSync(full, "utf8");
      if (/<meta name="robots" content="noindex/.test(html)) continue;
      const t = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
      if (!t) continue;
      const short = t.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').split(" — ")[0].trim();
      out.push(["/" + rel + "/", short]);
    }
  }
})(site.ROOT, "");
out.sort((a, b) => a[0].localeCompare(b[0]));
fs.writeFileSync(path.join(site.ROOT, "search-index.json"), JSON.stringify(out));
console.log(`search index: ${out.length} pages, ${(fs.statSync(path.join(site.ROOT, "search-index.json")).size / 1024).toFixed(0)} KB`);
