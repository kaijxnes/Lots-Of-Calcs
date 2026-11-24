#!/usr/bin/env node
/* Finishes every page, safe to run any number of times:
   - emoji card icons become line icons (tools/lib/icons.js)
   - the breadcrumb trail is shown, from the page's structured data, with
     a calculator's category added (tools/lib/crumbs.js)
   - one <main> per page, the page's parts as <section>s, a skip link and
     keyboard-scrollable tables (tools/lib/landmarks.js)
   - the site's stylesheet, scripts and icon sprite are tagged with a
     version from their contents (tools/lib/assets.js), so a changed file
     is never served from an old cached copy.
   Pages written through site.write() get all of these as they're written;
   this catches blocks other scripts insert into hand-written pages, and the
   hand-written pages themselves. Run it after changing styles.css, a script
   or icons.svg, and last in a build.

       node tools/apply-icons.js */
const fs = require("fs");
const { execSync } = require("child_process");
const site = require("./lib/site.js");
const { convert } = require("./lib/icons.js");
const { version } = require("./lib/assets.js");
const { crumbs } = require("./lib/crumbs.js");
const { landmarks } = require("./lib/landmarks.js");

const files = execSync("git ls-files -co --exclude-standard '*.html'", { cwd: site.ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
let changed = 0;
files.forEach((f) => {
  const p = require("path").join(site.ROOT, f);
  if (!fs.existsSync(p)) return;
  const s = fs.readFileSync(p, "utf8");
  const t = version(landmarks(crumbs(convert(s, f))));
  if (t !== s) { fs.writeFileSync(p, t); changed++; }
});
console.log(`icons and asset versions: ${changed} of ${files.length} pages updated`);
