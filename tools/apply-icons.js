#!/usr/bin/env node
/* Finishes every page: turns any emoji card icons into line icons (see
   tools/lib/icons.js) and tags the site's stylesheet, scripts and icon
   sprite with a version from their contents (tools/lib/assets.js), so a
   changed file is never served from an old cached copy. Run it after any
   change to styles.css, a script or icons.svg, and last in a build. Pages written through site.write() are converted as
   they're written; this catches the blocks other scripts insert into
   hand-written pages (related calculators, hub lists) and the hand-written
   pages themselves. Safe to run any number of times.

       node tools/apply-icons.js */
const fs = require("fs");
const { execSync } = require("child_process");
const site = require("./lib/site.js");
const { convert } = require("./lib/icons.js");
const { version } = require("./lib/assets.js");

const files = execSync("git ls-files -co --exclude-standard '*.html'", { cwd: site.ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
let changed = 0;
files.forEach((f) => {
  const p = require("path").join(site.ROOT, f);
  if (!fs.existsSync(p)) return;
  const s = fs.readFileSync(p, "utf8");
  const t = version(convert(s, f));
  if (t !== s) { fs.writeFileSync(p, t); changed++; }
});
console.log(`icons and asset versions: ${changed} of ${files.length} pages updated`);
