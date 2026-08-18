const searchInput = document.getElementById("hub-search");
const noResults = document.getElementById("hub-no-results");
const groups = [...document.querySelectorAll("[data-group]")].map((title) => ({
  title,
  grid: title.nextElementSibling,
}));

function filterCards() {
  const query = searchInput.value.trim().toLowerCase();
  let anyVisible = false;

  groups.forEach(({ title, grid }) => {
    let groupHasVisible = false;
    grid.classList.toggle("collapsed", query === "");
    grid.querySelectorAll(".hub-card").forEach((card) => {
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
