#!/usr/bin/env node
/* Finds broken links across the site.

       node tools/check-links.js              internal links, then every outside link
       node tools/check-links.js --internal   internal links only (fast, no network)

   Internal: every href and src on every page that points into the site must
   reach a file (a page's index.html, or the file itself), and every link to
   #something on the same page must have that id to land on.

   Outside: each distinct http(s) address linked from a page or named as a
   source in data/ is fetched once with curl (which goes through the
   environment's proxy), following redirects. It reports addresses that fail
   (404, 410, 5xx) and ones that now redirect somewhere else, which usually
   means the page moved and the link should be updated. Some sites refuse
   automated requests (401, 403, 405, 406, 429, 999) or don't answer them at
   all: those are listed separately to check by hand, never treated as dead.

   Exits 1 if any internal link is broken, so a build can stop on it. */
const fs = require("fs");
const path = require("path");
const { execSync, execFile } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://lotsofcalcs.com";
const internalOnly = process.argv.includes("--internal");

const pages = execSync("git ls-files -co --exclude-standard '*.html'", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);

/* ---------- internal ---------- */
const exists = new Map();
function reaches(p) {
  if (exists.has(p)) return exists.get(p);
  const rel = decodeURIComponent(p).replace(/^\//, "");
  const full = path.join(ROOT, rel);
  let ok = false;
  try {
    const st = fs.statSync(full);
    ok = st.isDirectory() ? fs.existsSync(path.join(full, "index.html")) : true;
  } catch (e) { ok = false; }
  exists.set(p, ok);
  return ok;
}

const broken = [], anchors = [], external = new Map();
const note = (url, from) => { if (!external.has(url)) external.set(url, new Set()); external.get(url).add(from); };
pages.forEach((f) => {
  const html = fs.readFileSync(path.join(ROOT, f), "utf8");
  const page = "/" + f.replace(/index\.html$/, "");
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  /* links inside scripts and structured data aren't links on the page */
  const body = html.replace(/<script\b[\s\S]*?<\/script>/g, "");
  for (const m of body.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)) {
    for (let u of m[1].split(/,\s*/).map((x) => x.trim().split(/\s+/)[0])) {
      u = u.replace(/&amp;/g, "&");
      if (!u || /^(mailto:|tel:|javascript:|data:)/.test(u)) continue;
      if (u.startsWith(SITE)) u = u.slice(SITE.length) || "/";
      if (/^https?:\/\//.test(u)) { note(u, page); continue; }
      if (u.startsWith("#")) { if (u.length > 1 && !ids.has(u.slice(1))) anchors.push([page, u]); continue; }
      if (!u.startsWith("/")) u = path.posix.join(page, u);
      const clean = u.split("#")[0].split("?")[0];
      if (!reaches(clean)) broken.push([page, u]);
    }
  }
});

const group = (list) => {
  const by = new Map();
  list.forEach(([from, to]) => { if (!by.has(to)) by.set(to, []); by.get(to).push(from); });
  return [...by.entries()].sort((a, b) => b[1].length - a[1].length);
};
console.log(`Internal: ${pages.length} pages checked`);
if (broken.length) {
  console.log(`  ${broken.length} broken link(s) to ${group(broken).length} address(es):`);
  group(broken).forEach(([to, from]) => console.log(`    ${to}  ← ${from.length} page(s), e.g. ${from.slice(0, 3).join(" ")}`));
} else console.log("  no broken links");
if (anchors.length) {
  console.log(`  ${anchors.length} link(s) to a #section the page doesn't have:`);
  group(anchors).slice(0, 30).forEach(([to, from]) => console.log(`    ${to}  ← ${from.length} page(s), e.g. ${from.slice(0, 3).join(" ")}`));
}

/* sources named in the data files count too */
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return walk(full);
    if (!/\.(json|md)$/.test(d.name)) return;
    const text = fs.readFileSync(full, "utf8");
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>\]]+/g)) {
      /* a ")" belongs to the address only if it closes a "(" inside it */
      let u = m[0].replace(/[.,;]+$/, "");
      while (u.endsWith(")") && (u.match(/\(/g) || []).length < (u.match(/\)/g) || []).length) u = u.slice(0, -1).replace(/[.,;]+$/, "");
      note(u, "data/" + path.relative(path.join(ROOT, "data"), full));
    }
  });
})(path.join(ROOT, "data"));

if (internalOnly) process.exit(broken.length ? 1 : 0);

/* ---------- outside ---------- */
const BLOCKED = new Set([401, 403, 405, 406, 429, 451, 999]);
function curl(url, extra) {
  return new Promise((resolve) => {
    execFile("curl", ["-sS", "-o", "/dev/null", "-L", "--max-redirs", "8", "--max-time", "25", ...extra, "-A", "Mozilla/5.0 (compatible; site link check)",
      "-w", "%{http_code} %{url_effective}", url], { timeout: 35000 }, (err, out, errText) => {
      const [code, final] = String(out || "").trim().split(" ");
      resolve({ url, code: Number(code) || 0, final: final || url, why: String(errText || "").trim().split("\n").pop().replace(/^curl: \(\d+\) /, "") });
    });
  });
}
/* no answer over HTTP/2 is often the protocol rather than the page: try 1.1 */
async function fetchOne(url) {
  const r = await curl(url, []);
  return r.code ? r : curl(url, ["--http1.1"]);
}
const same = (a, b) => {
  const n = (u) => u.replace(/^http:/, "https:").replace(/#.*$/, "").replace(/\/$/, "").replace(/^https:\/\/www\./, "https://");
  return n(a) === n(b);
};

(async () => {
  const urls = [...external.keys()].filter((u) => !/^https?:\/\/(localhost|127\.)/.test(u));
  console.log(`\nOutside: ${urls.length} distinct addresses`);
  const results = [];
  let i = 0;
  async function worker() { while (i < urls.length) { const u = urls[i++]; results.push(await fetchOne(u)); } }
  await Promise.all(Array.from({ length: 8 }, worker));
  const where = (u) => { const f = [...external.get(u)]; return `${f.length} place(s), e.g. ${f.slice(0, 3).join(" ")}`; };
  const dead = results.filter((r) => r.code >= 400 && !BLOCKED.has(r.code));
  const silent = results.filter((r) => r.code === 0);
  const blocked = results.filter((r) => BLOCKED.has(r.code));
  const moved = results.filter((r) => r.code >= 200 && r.code < 400 && !same(r.url, r.final));
  console.log(`  ${results.length - dead.length - silent.length - blocked.length} answered, ${dead.length} broken, ${moved.length} redirected, ${silent.length} gave no answer, ${blocked.length} refused automated checks`);
  if (dead.length) { console.log("\n  Broken (404 and 410 are gone; a 5xx may be a temporary fault, so check again before replacing):"); dead.sort((a, b) => a.code - b.code).forEach((r) => console.log(`    ${r.code}  ${r.url}\n          from ${where(r.url)}`)); }
  if (moved.length) { console.log("\n  Redirected (the page may have moved; update the link if the new address is the same page):"); moved.forEach((r) => console.log(`    ${r.url}\n      → ${r.final}\n          from ${where(r.url)}`)); }
  if (silent.length) { console.log("\n  No answer (timed out or the connection was refused, often a site turning away automated requests or a network limit here; check in a browser):"); silent.forEach((r) => console.log(`    ${r.url}  [${r.why || "no response"}]\n          from ${where(r.url)}`)); }
  if (blocked.length) { console.log("\n  Refused automated checks (check by hand if it matters):"); blocked.forEach((r) => console.log(`    ${r.code}  ${r.url}  (${where(r.url)})`)); }
  process.exit(broken.length ? 1 : 0);
})();
