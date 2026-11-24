#!/usr/bin/env node
/* Makes /icons.svg, the sprite of line icons the cards use, from the Lucide
   icon set. Only needed when tools/lib/icons.js gains an icon:

       npm pack lucide-static@0.460.0     (into an empty folder, then untar it)
       node tools/build-icons.js <that folder>/package/icons

   Lucide is under the ISC licence, which is copied into the sprite. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { ICONS, EXTRA } = require("./lib/icons.js");

const dir = process.argv[2];
if (!dir) throw new Error("usage: node tools/build-icons.js <lucide-static>/package/icons");
const names = [...new Set(Object.values(ICONS).concat(EXTRA))].sort();
const licence = fs.readFileSync(path.join(dir, "..", "LICENSE"), "utf8").trim();
const symbols = names.map((n) => {
  const src = fs.readFileSync(path.join(dir, n + ".svg"), "utf8");
  const body = src.slice(src.indexOf(">", src.indexOf("<svg")) + 1, src.lastIndexOf("</svg>")).replace(/\n\s*/g, "").trim();
  return `<symbol id="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`;
});
const out = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<!-- Icons from Lucide (lucide-static 0.460.0), https://lucide.dev
${licence.replace(/--/g, "- -")}
-->
${symbols.join("\n")}
</svg>
`;
fs.writeFileSync(path.join(site.ROOT, "icons.svg"), out);
console.log(`icons.svg: ${names.length} icons, ${Math.round(out.length / 1024)} KB`);
