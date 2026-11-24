/* Version tags on the site's own stylesheet, scripts and icon sprite:

       <link rel="stylesheet" href="/styles.css?v=3f9a1c2e">

   The tag is a short hash of the file's contents, so when styles.css or a
   script changes, every page points at a new address and no browser can
   pair a new page with an old, cached copy (CSS and JS may be reused for
   an hour and refreshed in the background for a day; see _headers).
   Cloudflare serves the current file whatever the tag says, and caches each
   tag separately. Only files at the site root are tagged; data files that
   scripts fetch are left alone. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..", "..");

const seen = {};
function tag(file) {
  if (!(file in seen)) {
    const p = path.join(ROOT, file);
    seen[file] = fs.existsSync(p) ? crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex").slice(0, 8) : null;
  }
  return seen[file];
}

const RE = /((?:href|src)=")\/([A-Za-z0-9._-]+\.(?:css|js|svg))(?:\?v=[0-9a-f]+)?(#[^"]*)?"/g;
function version(html) {
  return html.replace(RE, (all, pre, file, frag) => {
    const v = tag(file);
    return v ? `${pre}/${file}?v=${v}${frag || ""}"` : all;
  });
}

module.exports = { version, tag };
