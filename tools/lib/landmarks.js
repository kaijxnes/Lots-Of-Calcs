/* One <main> per page, for screen readers and other assistive tech.

   The builders write each part of a page as <main class="tool">, which gives
   a page several main landmarks and leaves the heading, breadcrumbs and
   related links outside any. This turns each of those parts into a <section>
   and wraps everything between the site bar and the footer in a single
   <main id="main" class="page-main"> (display: contents, so the layout is
   untouched), adds a "Skip to content" link, makes scrollable tables
   reachable from the keyboard, and leaves no table header empty. Safe to
   run again: it undoes its own wrapper first, so parts added to a finished
   page later are picked up too. */
const OPEN = '<main id="main" class="page-main">\n';
const CLOSE = "    </main>\n";
const SKIP = '<a class="skip-link" href="#main">Skip to content</a>\n';

function landmarks(html) {
  const page = html.match(/<div class="page[^"]*">\n/);
  const footer = html.indexOf('    <footer class="site-footer">');
  if (!page || footer < 0) return html;
  /* undo a previous run */
  html = html.replace("    " + OPEN, "").replace(CLOSE + '    <footer class="site-footer">', '    <footer class="site-footer">').replace("  " + SKIP, "");
  /* every remaining <main> is a part of the page */
  html = html.replace(/<main(\s[^>]*)?>/g, (m, attrs) => "<section" + (attrs || "") + ">").replace(/<\/main>/g, "</section>");
  /* the wrapper: after the site bar if there is one, else at the top of the page */
  const at = html.match(/<div class="page[^"]*">\n/);
  let start = at.index + at[0].length;
  const bar = html.indexOf('<nav class="topbar"', start);
  if (bar >= 0 && bar < start + 200) start = html.indexOf("</nav>\n", bar) + "</nav>\n".length;
  const end = html.indexOf('    <footer class="site-footer">');
  html = html.slice(0, start) + "    " + OPEN + html.slice(start, end) + CLOSE + html.slice(end);
  /* the skip link, first thing on the page */
  html = html.replace(/(<div class="page[^"]*">\n)/, "$1  " + SKIP);
  /* a table that scrolls sideways needs to take focus to scroll by keyboard,
     and a name to tell it apart: its section's heading, else a number */
  html = html.replace(/<div class="table-scroll"[^>]*>/g, '<div class="table-scroll">');
  const used = {};
  let k = 0;
  html = html.replace(/<div class="table-scroll">/g, (m, at, all) => {
    k++;
    const before = all.slice(Math.max(0, at - 20000), at);
    const hs = before.match(/<h2[^>]*>([\s\S]*?)<\/h2>/g);
    let name = hs ? hs[hs.length - 1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";
    name = name ? name + " (table)" : "Table " + k;
    used[name] = (used[name] || 0) + 1;
    if (used[name] > 1) name += " " + used[name];
    return `<div class="table-scroll" tabindex="0" role="region" aria-label="${name.replace(/"/g, "&quot;")}">`;
  });
  /* a column with no heading: an empty cell, not an empty header */
  html = html.replace(/<th><\/th>/g, "<td></td>");
  return html;
}

module.exports = { landmarks };
