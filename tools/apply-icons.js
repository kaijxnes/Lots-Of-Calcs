#!/usr/bin/env node
/* Turns any emoji card icons left in the site's pages into line icons (see
   tools/lib/icons.js). Pages written through site.write() are converted as
   they're written; this catches the blocks other scripts insert into
   hand-written pages (related calculators, hub lists) and the hand-written
   pages themselves. Safe to run any number of times.

       node tools/apply-icons.js */
const fs = require("fs");
const { execSync } = require("child_process");
const site = require("./lib/site.js");
const { convert } = require("./lib/icons.js");

const files = execSync("git ls-files -co --exclude-standard '*.html'", { cwd: site.ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
let changed = 0;
files.forEach((f) => {
  const p = require("path").join(site.ROOT, f);
  if (!fs.existsSync(p)) return;
  const s = fs.readFileSync(p, "utf8");
  const t = convert(s, f);
  if (t !== s) { fs.writeFileSync(p, t); changed++; }
});
console.log(`icons: ${changed} of ${files.length} pages updated`);
