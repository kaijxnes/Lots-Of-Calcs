/* A visible breadcrumb trail (Home › Mortgages & Loans › £37,000 loan) in
   place of a page's "← back" link, made from the BreadcrumbList already in
   its structured data, so the two always match. A calculator listed on the
   homepage whose trail skips its category (Home › Tip Calculator) gets the
   category added, in the structured data as well. Pages without a
   BreadcrumbList keep their back link. Safe to run again. */
const fs = require("fs");
const pathMod = require("path");
const SITE = "https://lotsofcalcs.com";
let CATS = null;
/* href -> [category name, category href], from the homepage's groups */
function cats() {
  if (CATS) return CATS;
  CATS = {};
  const home = fs.readFileSync(pathMod.join(__dirname, "..", "..", "index.html"), "utf8");
  home.split('<div class="hub-group-title" data-group><span>').slice(1).forEach((sec) => {
    const name = sec.slice(0, sec.indexOf("<")).replace(/&amp;/g, "&");
    const more = sec.match(/<a class="hub-card hub-more" href="([^"]+)"/);
    if (!more) return;
    const re = /<a class="hub-card" href="([^"]+)">/g;
    let m;
    while ((m = re.exec(sec))) if (!CATS[m[1]]) CATS[m[1]] = [name, more[1]];
  });
  return CATS;
}
const LD = /<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/g;
const BACK = /<a class="back-link([^"]*)" href="[^"]*">[^<]*<\/a>/;
const NAV = /<nav class="crumbs[^"]*" aria-label="Breadcrumb">[\s\S]*?<\/nav>/;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const path = (u) => u.replace(/^https?:\/\/[^/]+/, "") || "/";

function trail(html) {
  let m;
  LD.lastIndex = 0;
  while ((m = LD.exec(html))) {
    let d;
    try { d = JSON.parse(m[1]); } catch (e) { continue; }
    const list = (Array.isArray(d) ? d : [d]).find((x) => x && x["@type"] === "BreadcrumbList");
    if (list && list.itemListElement && list.itemListElement.length >= 2) {
      return list.itemListElement.slice().sort((a, b) => a.position - b.position).map((x) => [x.name, x.item]);
    }
  }
  return null;
}

/* add the category to a two-step trail, in the structured data too; a
   three-step trail through a category the homepage no longer lists the page
   under gets the right one */
function withCategory(html, t) {
  if (t.length !== 2 && t.length !== 3) return [html, t];
  const last = t[t.length - 1], here = path(last[1]), c = cats()[here];
  if (!c || c[1] === here) return [html, t];
  if (t.length === 3) {
    const hubs = new Set(Object.values(cats()).map((x) => x[1]));
    if (!hubs.has(path(t[1][1])) || path(t[1][1]) === c[1]) return [html, t];
  }
  const t2 = [t[0], [c[0], SITE + c[1]], last];
  LD.lastIndex = 0;
  const out = html.replace(LD, (all, body) => {
    let d;
    try { d = JSON.parse(body); } catch (e) { return all; }
    const arr = Array.isArray(d) ? d : [d];
    const list = arr.find((x) => x && x["@type"] === "BreadcrumbList");
    if (!list) return all;
    list.itemListElement = t2.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item }));
    return '<script type="application/ld+json">\n' + JSON.stringify(d, null, 2) + "\n</script>";
  });
  return [out, t2];
}

function crumbs(html) {
  let t = trail(html);
  if (!t) return html;
  [html, t] = withCategory(html, t);
  const back = html.match(BACK);
  const extra = back ? back[1] : (html.match(/<nav class="crumbs([^"]*)"/) || [, ""])[1];
  const nav = `<nav class="crumbs${extra}" aria-label="Breadcrumb">` + t.map(([name, item], i) =>
    i === t.length - 1 ? `<span aria-current="page">${esc(name)}</span>` : `<a href="${esc(path(item))}">${esc(name)}</a><span class="crumb-sep" aria-hidden="true">›</span>`).join("") + "</nav>";
  if (back) return html.replace(BACK, () => nav);
  if (NAV.test(html)) return html.replace(NAV, () => nav);
  return html;
}

module.exports = { crumbs };
