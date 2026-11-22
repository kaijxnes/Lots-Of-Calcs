#!/usr/bin/env node
/* Tells Bing and the other IndexNow search engines (not Google, which uses
   the sitemaps) which pages are new or changed, so they recrawl them soon.

       node tools/indexnow.js            pages whose lastmod is today
       node tools/indexnow.js --since 2026-11-01
       node tools/indexnow.js --all

   The key is the file /8e30e18ecab7cbb7cd51b14e4af74a55.txt at the site root, which
   proves the site is ours; it must be live before the first submission.
   Up to 10,000 URLs go in each request. */
const fs = require("fs");
const path = require("path");
const https = require("https");
const site = require("./lib/site.js");

const KEY = "8e30e18ecab7cbb7cd51b14e4af74a55";
const xml = fs.readFileSync(path.join(site.ROOT, "sitemap.xml"), "utf8");
const arg = process.argv.slice(2);
const since = arg[0] === "--all" ? "0000" : arg[0] === "--since" ? arg[1] : site.TODAY;
const urls = [];
xml.replace(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g, (_, loc, mod) => { if (mod >= since) urls.push(loc); });
if (!urls.length) { console.log("indexnow: nothing changed since " + since); process.exit(0); }

function post(list) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ host: new URL(site.SITE).host, key: KEY, keyLocation: site.SITE + "/" + KEY + ".txt", urlList: list });
    const req = https.request("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) } }, (res) => {
      let out = ""; res.on("data", (d) => (out += d)); res.on("end", () => resolve([res.statusCode, out]));
    });
    req.on("error", reject); req.end(body);
  });
}
(async () => {
  for (let i = 0; i < urls.length; i += 10000) {
    const [code, out] = await post(urls.slice(i, i + 10000));
    /* 200 and 202 both mean accepted */
    console.log("indexnow: " + Math.min(10000, urls.length - i) + " URLs -> HTTP " + code + (out ? " " + out.slice(0, 200) : ""));
    if (code !== 200 && code !== 202) process.exitCode = 1;
  }
})();
