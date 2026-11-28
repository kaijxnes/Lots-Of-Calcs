#!/usr/bin/env node
/* One command to check the whole site before a change goes out:

       node tools/test.js              build, check pages and links, test calculators in a browser
       node tools/test.js --no-build   skip the rebuild (check what's already built)
       node tools/test.js --only=gift  browser-test only calculators whose path contains "gift"

   1. Build: tools/build-monthly.js runs every builder. Each one stops if its
      figures aren't in the quoted wording of its source or a hand-checked
      example no longer comes out, tax/check.js checks every tax file, and
      sync-faq-ld.js --check confirms FAQ markup matches the page.
   2. Pages: every page has a title, a description, a canonical link (index
      pages), JSON-LD that parses, and no duplicate titles.
   3. Links: tools/check-links.js --internal.
   4. Calculators: each calculator page is opened in headless Chromium at
      phone and desktop width (Playwright). It fails on a script error, a
      missing local file, a box with no label, a result showing
      NaN, undefined, Infinity or [object, or a page wider than the screen,
      as loaded, after the first number box is changed and with it empty.
      Skipped with a warning if Playwright isn't installed.

   Exits 1 if anything fails, listing what. */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const NO_BUILD = args.includes("--no-build");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").slice(7);
const failures = [];
const fail = (step, msg) => failures.push(`[${step}] ${msg}`);
const t0 = Date.now();
const secs = () => ((Date.now() - t0) / 1000).toFixed(0) + "s";

function run(step, file, extra) {
  process.stdout.write(`${step}: node tools/${file} ${(extra || []).join(" ")} ... `);
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, file)].concat(extra || []), { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 });
    console.log(`ok (${secs()})`);
    return out;
  } catch (e) {
    console.log("FAILED");
    fail(step, `${file} failed:\n${String(e.stdout || "").split("\n").slice(-15).join("\n")}\n${String(e.stderr || "").split("\n").slice(-15).join("\n")}`);
    return null;
  }
}

/* ---------------------------------------------------------------- pages */
const SKIP_DIRS = new Set([".git", "node_modules", "tools", ".claude", "data", "embed", "og", "sitemaps"]);
function htmlFiles(dir, out) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.isDirectory()) { if (!SKIP_DIRS.has(d.name)) htmlFiles(path.join(dir, d.name), out); }
    else if (d.name.endsWith(".html")) out.push(path.join(dir, d.name));
  }
  return out;
}
function checkPages() {
  process.stdout.write("pages: titles, descriptions, canonicals, JSON-LD ... ");
  const files = htmlFiles(ROOT, []), titles = new Map();
  let bad = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    if (rel === "404.html") continue;
    const s = fs.readFileSync(f, "utf8"), problem = (m) => { bad++; if (bad <= 30) fail("pages", `${rel}: ${m}`); };
    const t = (s.match(/<title>([^<]*)<\/title>/) || [])[1];
    if (!t) problem("no title"); else { if (!titles.has(t)) titles.set(t, []); titles.get(t).push(rel); }
    if (!/<meta name="description" content="[^"]+"/.test(s)) problem("no description");
    if (path.basename(f) === "index.html" && !s.includes('rel="canonical"')) problem("no canonical");
    for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { problem("JSON-LD doesn't parse: " + e.message); }
    }
  }
  titles.forEach((rels, t) => { if (rels.length > 1) { bad++; if (bad <= 30) fail("pages", `same title on ${rels.length} pages ("${t}"): ${rels.slice(0, 3).join(", ")}`); } });
  if (bad > 30) fail("pages", `...and ${bad - 30} more`);
  console.log(bad ? `${bad} problems` : `ok, ${files.length} pages (${secs()})`);
}

/* ---------------------------------------------------------- calculators */
/* a calculator: a page with a number box, text box, date or select and a
   result area. Every top-level calculator, plus the first generated page
   under it that has one (e.g. /gift-aid-calculator/10/), which runs the same
   script with other starting values */
function calculatorPages() {
  const pages = [];
  const look = (rel) => {
    const f = path.join(ROOT, rel, "index.html");
    if (!fs.existsSync(f)) return false;
    const s = fs.readFileSync(f, "utf8");
    if (/<input[^>]+type="(number|text|date)"|<select/.test(s) && /aria-live|class="result/.test(s)) { pages.push("/" + rel + "/"); return true; }
    return false;
  };
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || SKIP_DIRS.has(d.name) || d.name.startsWith(".") || d.name === "guides") continue;
    look(d.name);
    const subs = fs.readdirSync(path.join(ROOT, d.name), { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort();
    subs.some((x) => look(d.name + "/" + x));
  }
  return pages.filter((p) => !ONLY || p.includes(ONLY)).sort();
}
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain" };
function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let f = path.join(ROOT, p);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (p.endsWith("/")) f = path.join(f, "index.html");
    fs.readFile(f, (err, buf) => {
      if (err) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
      res.end(buf);
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}
async function checkCalculators() {
  let chromium;
  try { ({ chromium } = require("playwright")); } catch (e) {
    console.log("calculators: skipped (Playwright isn't installed: npm i -g playwright && npx playwright install chromium)");
    return;
  }
  const pages = calculatorPages();
  process.stdout.write(`calculators: ${pages.length} pages in a browser at phone and desktop width ... `);
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const context = async (width, height) => {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript(() => { try { localStorage.setItem("loc-analytics-consent", "denied"); } catch (e) { /* storage blocked */ } });
    /* nothing leaves the machine: block anything that isn't the local server */
    await ctx.route((u) => !u.href.startsWith(base), (r) => r.abort());
    return ctx;
  };
  const phone = await context(390, 844), desktop = await context(1280, 900);
  let bad = 0;
  const one = async (u, ctx, label) => {
    const pg = await ctx.newPage(), errs = [];
    pg.on("pageerror", (e) => errs.push("script error: " + e.message));
    pg.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(base)) errs.push(`missing file ${r.url().slice(base.length)} (${r.status()})`); });
    try {
      await pg.goto(base + u, { waitUntil: "load", timeout: 30000 });
      const look = () => pg.evaluate(() => {
        const text = [...document.querySelectorAll("[aria-live], [class*=result]")].map((e) => e.innerText).join(" ");
        const m = text.match(/\bNaN\b|\bundefined\b|\bInfinity\b|\[object/);
        return { m: m ? m[0] + " in \"" + text.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, " ") + "\"" : "", wide: document.documentElement.scrollWidth - window.innerWidth };
      });
      const problems = [];
      let r = await look();
      if (r.m) problems.push("as loaded: " + r.m);
      if (r.wide > 1) problems.push(`page is ${r.wide}px wider than the screen`);
      /* every box someone can type in or choose from has a name a screen reader can read */
      const unlabelled = await pg.evaluate(() => [...document.querySelectorAll("main input:not([type=hidden]), main select, main textarea")]
        .filter((e) => e.offsetParent !== null && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby") && !e.closest("label") && !(e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)))
        .map((e) => e.id || e.name || e.outerHTML.slice(0, 60)));
      if (unlabelled.length) problems.push("no label for " + unlabelled.slice(0, 5).join(", "));
      /* change the first visible number box and look again */
      const box = await pg.$("main input[type=number]:visible, main input[inputmode=decimal]:visible, main input[inputmode=numeric]:visible");
      if (box) {
        const v = await box.inputValue();
        await box.fill(String(v && Number(String(v).replace(/,/g, "")) > 0 ? Math.round(Number(String(v).replace(/,/g, "")) * 1.5 * 100) / 100 : 25));
        await box.dispatchEvent("input"); await box.dispatchEvent("change");
        await pg.waitForTimeout(150);
        r = await look();
        if (r.m) problems.push("after changing the first number box: " + r.m);
        /* and with it cleared, as someone retyping it would leave it */
        await box.fill(""); await box.dispatchEvent("input"); await box.dispatchEvent("change");
        await pg.waitForTimeout(150);
        r = await look();
        if (r.m) problems.push("with the first number box empty: " + r.m);
      }
      problems.push(...new Set(errs));
      if (problems.length) { bad++; fail("calculators", `${u} (${label}): ${problems.join("; ")}`); }
    } catch (e) { bad++; fail("calculators", `${u} (${label}): couldn't load (${e.message.split("\n")[0]})`); }
    await pg.close();
  };
  const queue = pages.map((u) => [u, phone, "phone"]).concat(pages.map((u) => [u, desktop, "desktop"]));
  await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await one(...queue.shift()); }));
  await browser.close(); server.close();
  console.log(bad ? `${bad} with problems (${secs()})` : `ok (${secs()})`);
}

(async () => {
  if (NO_BUILD) console.log("build: skipped (--no-build)");
  else run("build", "build-monthly.js");
  checkPages();
  run("links", "check-links.js", ["--internal"]);
  await checkCalculators();
  if (failures.length) {
    console.log(`\n${failures.length} problem${failures.length === 1 ? "" : "s"}:\n` + failures.map((f) => "  " + f.replace(/\n/g, "\n    ")).join("\n"));
    process.exit(1);
  }
  console.log(`\nall checks passed (${secs()})`);
})();
