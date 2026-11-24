const searchInput = document.getElementById("hub-search");
const noResults = document.getElementById("hub-no-results");
const categoryBrowse = document.getElementById("cat-browse");
const groups = [...document.querySelectorAll("[data-group]")].map((title) => ({
  title,
  grid: title.nextElementSibling,
}));

function filterCards() {
  const query = searchInput.value.trim().toLowerCase();
  let anyVisible = false;

  /* Results should sit straight under the search box rather than below a row
     of category tiles that has nothing to do with what was typed */
  if (categoryBrowse) categoryBrowse.hidden = query !== "";
  var popular = document.getElementById("hub-popular");
  if (popular) popular.hidden = query !== "";

  groups.forEach(({ title, grid }) => {
    let groupHasVisible = false;
    grid.classList.toggle("collapsed", query === "");
    /* The "see all" card is navigation, not a calculator — without excluding
       it, searching "everyday" would match its label and keep the group open */
    grid.querySelectorAll(".hub-card:not(.hub-more)").forEach((card) => {
      const text = card.textContent.toLowerCase();
      const matches = query === "" || text.includes(query);
      card.hidden = !matches;
      if (matches) groupHasVisible = true;
    });
    title.hidden = !groupHasVisible;
    grid.hidden = !groupHasVisible;
    if (groupHasVisible) anyVisible = true;
  });

  noResults.hidden = anyVisible;
}

searchInput.addEventListener("input", filterCards);

/* ---------- pages beyond the calculator cards ----------
   After a few letters, search every page's title (/search-index.json, built
   by tools/build-search-index.js and loaded on first use): "45000 after tax",
   "20% off 50", "gmt to est". Numbers match with or without commas and £/$/€,
   and "45k" means 45000. */
(function () {
  if (!searchInput) return;
  let index = null, loading = null;
  const box = document.createElement("div");
  box.className = "page-results";
  box.hidden = true;
  (noResults || searchInput).insertAdjacentElement("afterend", box);
  const norm = (s) => s.toLowerCase().replace(/(\d+(?:\.\d+)?)k\b/g, (m, n) => String(Math.round(parseFloat(n) * 1000))).replace(/[£$€,]/g, "").replace(/\s+/g, " ").trim();
  function load() {
    if (!loading) loading = fetch("/search-index.json").then((r) => r.json()).then((d) => { index = d.map(([u, t]) => [u, t, norm(t + " " + u.replace(/[/-]/g, " "))]); }).catch(() => { index = []; });
    return loading;
  }
  function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function show() {
    const q = norm(searchInput.value);
    if (q.length < 3) { box.hidden = true; return; }
    if (!index) { load().then(show); return; }
    const words = q.split(" ");
    const hits = index.filter((p) => words.every((w) => p[2].includes(w)))
      .map((p) => [p, (p[2].startsWith(q) ? 0 : p[2].includes(q) ? 1 : 2)])
      .sort((a, b) => a[1] - b[1] || a[0][1].length - b[0][1].length).map((x) => x[0]).slice(0, 12);
    if (!hits.length) { box.hidden = true; return; }
    box.innerHTML = `<div class="hub-group-title">Pages</div><ul class="page-results-list">${hits.map((p) => `<li><a href="${p[0]}">${esc(p[1])}</a></li>`).join("")}</ul>`;
    box.hidden = false;
    if (noResults) noResults.hidden = true;
  }
  searchInput.addEventListener("focus", load, { once: true });
  searchInput.addEventListener("input", show);
})();
