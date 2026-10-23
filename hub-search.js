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
