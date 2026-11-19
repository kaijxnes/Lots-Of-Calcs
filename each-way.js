/* Each-way calculator: a single, or a double, treble or accumulator.

   An each-way bet is two bets at the unit stake: a win bet and a place bet.
   With several selections it's a win multiple and a place multiple:
   - the win part pays unit × every leg's win odds, if every leg won;
   - the place part pays unit × every leg's place odds, if every leg won or
     placed (a winner has placed too);
   - a void leg (a non-runner) counts as odds of 1.00 in both, so the bet
     runs on as if it weren't there.
   Place odds are 1 + (win odds − 1) × the place terms, per leg, because each
   race can have its own terms. */
const rowsEl = document.getElementById("ew-rows");
const NAMES = ["", "single", "double", "treble"];

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
  const errorEl = document.getElementById("ew-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

/* Accepts fractional ("10/1"), "evens" or decimal ("11.0"); returns decimal odds */
function parseOdds(raw) {
  const text = (raw || "").trim().toLowerCase();
  if (!text) return NaN;
  if (text === "evens" || text === "evs") return 2;
  if (text.includes("/")) {
    const [a, b] = text.split("/");
    const num = parseFloat(a);
    const den = parseFloat(b);
    if (!isFinite(num) || !isFinite(den) || den <= 0 || num < 0) return NaN;
    return num / den + 1;
  }
  const dec = parseFloat(text);
  return isFinite(dec) ? dec : NaN;
}

/* Place terms are a bare fraction ("1/5"), not odds — no +1 */
function parseFraction(raw) {
  const text = (raw || "").trim();
  if (!text) return NaN;
  if (text.includes("/")) {
    const [a, b] = text.split("/");
    const num = parseFloat(a);
    const den = parseFloat(b);
    if (!isFinite(num) || !isFinite(den) || den <= 0 || num <= 0) return NaN;
    return num / den;
  }
  const dec = parseFloat(text);
  return isFinite(dec) && dec > 0 ? dec : NaN;
}

function betName(n) {
  return "Each-way " + (NAMES[n] || n + "-fold accumulator");
}

function addRow(odds, terms, result) {
  const n = rowsEl.children.length + 1;
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${n}</span>
    <input class="grow" type="text" placeholder="10/1 or 11.0" value="${odds || ""}" data-field="odds" aria-label="Odds, selection ${n}">
    <input class="fixed-sm" type="text" placeholder="1/5" value="${terms || "1/5"}" data-field="terms" aria-label="Place terms, selection ${n}">
    <select class="fixed-sm" data-field="result" aria-label="Result, selection ${n}">
      <option value="won"${result === "won" ? " selected" : ""}>Won</option>
      <option value="placed"${result === "placed" ? " selected" : ""}>Placed</option>
      <option value="lost"${result === "lost" ? " selected" : ""}>Lost</option>
      <option value="void"${result === "void" ? " selected" : ""}>Void</option>
    </select>
    <button class="btn-remove" type="button" title="Remove" aria-label="Remove selection ${n}">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    if (rowsEl.children.length === 1) return;
    row.remove();
    [...rowsEl.children].forEach((r, i) => { r.querySelector(".row-index").textContent = i + 1; });
    calculate();
  });
  row.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));
  rowsEl.appendChild(row);
}

function calculate() {
  const unit = parseFloat(document.getElementById("unit-stake").value) || 0;
  const legs = [...rowsEl.children].map((row) => ({
    odds: parseOdds(row.querySelector('[data-field="odds"]').value),
    terms: parseFraction(row.querySelector('[data-field="terms"]').value),
    result: row.querySelector('[data-field="result"]').value
  }));
  document.getElementById("bet-type").textContent = betName(legs.length);
  document.getElementById("add-sel").textContent = legs.length === 1 ? "+ Add a selection (each-way double)" : legs.length === 2 ? "+ Add a selection (each-way treble)" : "+ Add a selection";

  function reset() {
    ["total-profit", "total-staked", "win-return", "place-return", "total-return"].forEach((id) => {
      document.getElementById(id).textContent = fmtMoney(0);
    });
    document.getElementById("win-odds-out").textContent = "—";
    document.getElementById("place-odds-out").textContent = "—";
  }

  if (unit < 0) {
    showError("Stake can't be negative.");
    reset();
    return;
  }
  const bad = legs.findIndex((l) => !isFinite(l.odds) || l.odds <= 1);
  if (bad !== -1) {
    showError(`Enter odds for selection ${bad + 1} as a fraction like 10/1 or a decimal above 1 like 11.0.`);
    reset();
    return;
  }
  const badTerms = legs.findIndex((l) => !isFinite(l.terms) || l.terms <= 0);
  if (badTerms !== -1) {
    showError(`Enter place terms for selection ${badTerms + 1} as a fraction like 1/5 or 1/4.`);
    reset();
    return;
  }
  showError("");

  let winOdds = 1, placeOdds = 1, winPays = true, placePays = true;
  legs.forEach((l) => {
    const p = 1 + (l.odds - 1) * l.terms;
    if (l.result === "void") return;
    winOdds *= l.odds;
    placeOdds *= p;
    if (l.result !== "won") winPays = false;
    if (l.result === "lost") placePays = false;
  });

  const totalStaked = unit * 2;
  const winReturn = winPays ? unit * winOdds : 0;
  const placeReturn = placePays ? unit * placeOdds : 0;
  const totalReturn = winReturn + placeReturn;
  const profit = totalReturn - totalStaked;

  document.getElementById("total-staked").textContent = fmtMoney(totalStaked);
  document.getElementById("win-return").textContent = fmtMoney(winReturn);
  document.getElementById("place-return").textContent = fmtMoney(placeReturn);
  document.getElementById("total-return").textContent = fmtMoney(totalReturn);
  document.getElementById("win-odds-out").textContent = winOdds.toFixed(2);
  document.getElementById("place-odds-out").textContent = placeOdds.toFixed(2);

  const profitEl = document.getElementById("total-profit");
  profitEl.textContent = fmtMoney(profit);
  profitEl.style.color = profit > 0 ? "var(--good)" : profit < 0 ? "var(--bad)" : "";
}

document.getElementById("add-sel").addEventListener("click", () => {
  addRow("", "1/5", "won");
  calculate();
  const last = rowsEl.lastElementChild.querySelector('[data-field="odds"]');
  if (last) last.focus();
});
["unit-stake", "currency"].forEach((id) => document.getElementById(id).addEventListener("input", calculate));

addRow("10/1", "1/5", "won");
calculate();
