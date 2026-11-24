#!/usr/bin/env node
/* Replaces a link everywhere it appears: pages, builders and data files.

       node tools/relink.js <old address> <new address> [<old> <new> ...]

   Only whole addresses are replaced (the old one followed by a quote, space,
   <, ), ] or #, or the end of the text), so an address that merely starts with
   the old one is left alone. In HTML the &-escaped form is replaced too. A
   #fragment after the old address is kept. Prints how many times each was
   replaced. Rebuild afterwards (node tools/build-monthly.js) so generated
   pages match their sources. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
if (!args.length || args.length % 2) { console.error("usage: node tools/relink.js <old> <new> [<old> <new> ...]"); process.exit(2); }
const ROOT = path.resolve(__dirname, "..");
const files = execSync("git ls-files -co --exclude-standard", { cwd: ROOT, encoding: "utf8" }).split("\n").filter((f) => /\.(html|json|js|md|xml|csv)$/.test(f));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pairs = [];
for (let i = 0; i < args.length; i += 2) {
  pairs.push([args[i], args[i + 1]]);
  if (args[i].includes("&")) pairs.push([args[i].replace(/&/g, "&amp;"), args[i + 1].replace(/&/g, "&amp;")]);
}
const count = new Map();
files.forEach((f) => {
  const full = path.join(ROOT, f);
  let s;
  try { s = fs.readFileSync(full, "utf8"); } catch (e) { return; }
  let t = s;
  pairs.forEach(([a, b]) => {
    const re = new RegExp(esc(a) + "(?=[\"'\\s<)\\]#]|$)", "g");
    t = t.replace(re, () => { count.set(a, (count.get(a) || 0) + 1); return b; });
  });
  if (t !== s) fs.writeFileSync(full, t);
});
pairs.forEach(([a]) => console.log(`${count.get(a) || 0}  ${a}`));
