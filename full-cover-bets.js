/* Full-cover bets are every combination of the selections above a given size.
   Rather than hardcoding ten fee tables, the combinations are generated from
   the selection count and the list of fold sizes each bet type covers — so
   Goliath's 247 lines come out of the same code as Trixie's four. */
const BET_TYPES = {
  trixie:      { label: "Trixie",                  n: 3, folds: [2, 3],                bets: 4 },
  patent:      { label: "Patent",                  n: 3, folds: [1, 2, 3],             bets: 7 },
  yankee:      { label: "Yankee",                  n: 4, folds: [2, 3, 4],             bets: 11 },
  lucky15:     { label: "Lucky 15",                n: 4, folds: [1, 2, 3, 4],          bets: 15 },
  canadian:    { label: "Canadian / Super Yankee", n: 5, folds: [2, 3, 4, 5],          bets: 26 },
  lucky31:     { label: "Lucky 31",                n: 5, folds: [1, 2, 3, 4, 5],       bets: 31 },
  heinz:       { label: "Heinz",                   n: 6, folds: [2, 3, 4, 5, 6],       bets: 57 },
  lucky63:     { label: "Lucky 63",                n: 6, folds: [1, 2, 3, 4, 5, 6],    bets: 63 },
  superheinz:  { label: "Super Heinz",             n: 7, folds: [2, 3, 4, 5, 6, 7],    bets: 120 },
  goliath:     { label: "Goliath",                 n: 8, folds: [2, 3, 4, 5, 6, 7, 8], bets: 247 }
};

const FOLD_NAME = {
  1: "Singles", 2: "Doubles", 3: "Trebles", 4: "Fourfolds", 5: "Fivefolds",
  6: "Sixfolds", 7: "Sevenfolds", 8: "Eightfolds"
};

const selRowsEl = document.getElementById("selection-rows");

const els = {
  betType: document.getElementById("bet-type"),
  stake: document.getElementById("stake"),
  eachWay: document.getElementById("each-way"),
  placeFraction: document.getElementById("place-fraction"),
  placeFractionField: document.getElementById("place-fraction-field"),
  places: document.getElementById("places"),
  placesField: document.getElementById("places-field"),
  consolation: document.getElementById("consolation"),
  allWinnersBonus: document.getElementById("all-winners-bonus"),
  currency: document.getElementById("currency"),
  error: document.getElementById("fcb-error"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  outBets: document.getElementById("out-bets"),
  outStake: document.getElementById("out-stake"),
  outReturn: document.getElementById("out-return"),
  outProfit: document.getElementById("out-profit"),
  outWinners: document.getElementById("out-winners"),
  bonusRow: document.getElementById("bonus-row"),
  outBonus: document.getElementById("out-bonus"),
  consolationRow: document.getElementById("consolation-row"),
  outConsolation: document.getElementById("out-consolation"),
  verdict: document.getElementById("verdict"),
  breakdown: document.getElementById("breakdown"),
  composition: document.getElementById("composition")
};

function money(v) {
  const symbol = els.currency.value;
  if (!isFinite(v)) return "—";
  const rounded = Math.round(Math.abs(v) * 100) / 100;
  const sign = v < 0 && rounded !== 0 ? "−" : "";
  return sign + symbol + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(el) {
  const raw = String(el.value).trim().replace(/[\s,]/g, "");
  if (raw === "") return null;
  const v = Number(raw);
  return isFinite(v) ? v : NaN;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

/* Every k-subset of n, in index order */
function combinations(n, k) {
  const out = [];
  const idx = [];
  (function rec(start) {
    if (idx.length === k) {
      out.push(idx.slice());
      return;
    }
    for (let i = start; i < n; i++) {
      idx.push(i);
      rec(i + 1);
      idx.pop();
    }
  })(0);
  return out;
}

function buildRows(n) {
  const existing = [...selRowsEl.children].map((row) => ({
    name: row.querySelector('[data-field="name"]').value,
    odds: row.querySelector('[data-field="odds"]').value,
    result: row.querySelector('[data-field="result"]').value
  }));

  selRowsEl.innerHTML = "";
  const defaults = ["2.0", "3.0", "1.5", "5.0", "2.5", "4.0", "1.8", "6.0"];

  for (let i = 0; i < n; i++) {
    const prev = existing[i];
    const row = document.createElement("div");
    row.className = "dyn-row";
    row.innerHTML = `
      <span class="row-index">${i + 1}</span>
      <input class="grow" type="text" placeholder="Selection ${i + 1}" value="${escapeHtml(prev ? prev.name : "")}" data-field="name" aria-label="Selection ${i + 1} name">
      <input class="fixed-sm" type="text" placeholder="2.0" value="${escapeHtml(prev ? prev.odds : defaults[i])}" data-field="odds" aria-label="Selection ${i + 1} odds">
      <select class="fixed-sm" data-field="result" aria-label="Selection ${i + 1} result">
        <option value="win">Win</option>
        <option value="place">Place</option>
        <option value="lose">Lose</option>
        <option value="nonrunner">Non-runner</option>
      </select>
    `;
    row.querySelector('[data-field="result"]').value = prev ? prev.result : "win";
    selRowsEl.appendChild(row);
  }
}

function readSelections() {
  return [...selRowsEl.children].map((row, i) => ({
    index: i + 1,
    name: row.querySelector('[data-field="name"]').value.trim() || "Selection " + (i + 1),
    raw: row.querySelector('[data-field="odds"]').value,
    odds: Odds.parse(row.querySelector('[data-field="odds"]').value),
    result: row.querySelector('[data-field="result"]').value
  }));
}

/* What one selection contributes to a multiple, on the win part or the place
   part. A non-runner is not a loser — it settles at 1.00, so it multiplies its
   bets by one and every bet containing it settles a size smaller. On a Lucky 15
   that means two Patents' worth of cover on the other three selections plus a
   void single, not one Patent — the bets that included the non-runner duplicate
   the smaller combinations rather than disappearing. Getting this right is the
   difference between this calculator and most of the others. */
function factor(sel, part, placeFraction) {
  if (sel.result === "nonrunner") return 1;
  if (sel.result === "lose") return 0;
  if (part === "win") {
    return sel.result === "win" ? sel.odds : 0;
  }
  /* Place part: a winner has also placed */
  return Odds.placeOdds(sel.odds, placeFraction);
}

function settle(sels, type, unitStake, part, placeFraction) {
  const lines = [];
  let total = 0;
  let winners = 0;

  type.folds.forEach((k) => {
    combinations(type.n, k).forEach((combo) => {
      let f = 1;
      let dead = false;
      combo.forEach((i) => {
        const c = factor(sels[i], part, placeFraction);
        if (c === 0) dead = true;
        f *= c;
      });
      const ret = dead ? 0 : unitStake * f;
      /* A bet made entirely of non-runners is void — the stake comes back, so
         it is neither a winner nor a loser */
      const allVoid = combo.every((i) => sels[i].result === "nonrunner");
      if (!dead && !allVoid) winners++;
      total += ret;
      lines.push({
        fold: k,
        combo: combo,
        names: combo.map((i) => sels[i].name),
        odds: dead ? 0 : f,
        stake: unitStake,
        ret: ret,
        void: allVoid,
        dead: dead
      });
    });
  });

  return { lines: lines, total: total, winners: winners };
}

function calculate() {
  const type = BET_TYPES[els.betType.value];
  if (selRowsEl.children.length !== type.n) buildRows(type.n);

  const ew = els.eachWay.value === "yes";
  els.placeFractionField.style.display = ew ? "" : "none";
  els.placesField.style.display = ew ? "" : "none";

  const sels = readSelections();
  const unitStake = num(els.stake);
  const bonusPct = num(els.allWinnersBonus);
  const consolationMult = Number(els.consolation.value);
  const placeFraction = ew ? Number(els.placeFraction.value) : 0;

  if (unitStake === null) return fail("Enter a unit stake.");
  if (isNaN(unitStake)) return fail("The unit stake isn't a number.");
  if (unitStake < 0) return fail("The unit stake can't be negative.");

  if (bonusPct !== null && (isNaN(bonusPct) || bonusPct < 0 || bonusPct > 100)) {
    return fail("The all-winners bonus has to be between 0% and 100%.");
  }
  const bonus = bonusPct === null ? 0 : bonusPct;

  /* Odds only have to be valid where they can affect a return. A non-runner
     settles at 1.00 and a loser at 0, so neither needs readable odds. */
  const bad = sels.filter((s) => (s.result === "win" || s.result === "place") && (!isFinite(s.odds) || s.odds <= 1));
  if (bad.length) {
    return fail(`${bad[0].name} needs odds above 1 — try a fraction like 5/2, a decimal like 3.50, or a moneyline like +150.`);
  }

  setError("");

  const winPart = settle(sels, type, unitStake, "win", placeFraction);
  const placePart = ew ? settle(sels, type, unitStake, "place", placeFraction) : null;

  const totalStake = unitStake * type.bets * (ew ? 2 : 1);
  let totalReturn = winPart.total + (placePart ? placePart.total : 0);

  /* --- consolation bonus ---
     The common Lucky-bet rule: exactly one selection wins and the rest lose,
     and the winning single is paid at multiplied odds. Implemented strictly —
     a non-runner anywhere in the bet voids it, which is the more conservative
     of the two conventions in use. */
  const wins = sels.filter((s) => s.result === "win");
  const nonRunners = sels.filter((s) => s.result === "nonrunner");
  const hasSingles = type.folds.includes(1);
  let consolation = 0;

  if (hasSingles && consolationMult > 1 && wins.length === 1 && nonRunners.length === 0) {
    const w = wins[0];
    /* "Double the odds" means doubling the profit part: 2/1 pays as 4/1 */
    const boosted = 1 + (w.odds - 1) * consolationMult;
    const normal = unitStake * w.odds;
    consolation = unitStake * boosted - normal;
    if (ew) {
      const boostedPlace = 1 + (Odds.placeOdds(w.odds, placeFraction) - 1) * consolationMult;
      consolation += unitStake * boostedPlace - unitStake * Odds.placeOdds(w.odds, placeFraction);
    }
    totalReturn += consolation;
  }

  /* --- all-winners bonus ---
     Applied to the total return rather than the profit. Paid when nothing
     lost and nothing merely placed on the win part — non-runners are allowed
     through, since they are not losers. */
  const allWon = sels.every((s) => s.result === "win" || s.result === "nonrunner") && wins.length > 0;
  let bonusAmount = 0;
  if (allWon && bonus > 0) {
    bonusAmount = totalReturn * (bonus / 100);
    totalReturn += bonusAmount;
  }

  const profit = totalReturn - totalStake;
  const totalWinners = winPart.winners + (placePart ? placePart.winners : 0);
  const totalLines = type.bets * (ew ? 2 : 1);

  els.heroValue.textContent = money(profit);
  els.heroLabel.textContent = profit >= 0 ? "Profit" : "Loss";
  els.heroValue.style.color = profit > 0 ? "var(--good)" : profit < 0 ? "var(--bad)" : "";

  els.outBets.textContent = `${type.bets}${ew ? " × 2 (each-way)" : ""}`;
  els.outStake.textContent = money(totalStake);
  els.outReturn.textContent = money(totalReturn);
  els.outProfit.textContent = money(profit);
  els.outWinners.textContent = `${totalWinners} of ${totalLines}`;

  els.bonusRow.style.display = bonusAmount > 0 ? "flex" : "none";
  els.outBonus.textContent = money(bonusAmount);
  els.consolationRow.style.display = consolation > 0 ? "flex" : "none";
  els.outConsolation.textContent = money(consolation);

  els.composition.innerHTML = describeComposition(type, sels);
  buildBreakdown(type, winPart, placePart, ew);
  buildVerdict(type, sels, profit, totalStake, totalReturn, nonRunners, wins, consolation, bonusAmount);
}

function fail(message) {
  setError(message);
  els.heroValue.textContent = "—";
  ["outBets", "outStake", "outReturn", "outProfit", "outWinners", "outBonus", "outConsolation"]
    .forEach((k) => { els[k].textContent = "—"; });
  els.breakdown.innerHTML = "";
  els.composition.innerHTML = "";
  els.verdict.style.display = "none";
}

function describeComposition(type, sels) {
  const parts = type.folds.map((k) => {
    const count = combinations(type.n, k).length;
    const name = FOLD_NAME[k].toLowerCase();
    return `${count} ${count === 1 ? name.replace(/s$/, "") : name}`;
  });
  const nr = sels.filter((s) => s.result === "nonrunner").length;
  let s = `<strong>${type.label}</strong> — ${type.n} selections, ${type.bets} bets: ${parts.join(", ")}.`;
  if (nr > 0) {
    s += ` With ${nr} non-runner${nr === 1 ? "" : "s"} settling at 1.00, every bet containing ` +
      `${nr === 1 ? "it" : "one"} settles a size smaller — so the wager still carries substantial cover on the ` +
      `remaining ${type.n - nr} selection${type.n - nr === 1 ? "" : "s"}.`;
  }
  return s;
}

/* 247 lines is unreadable as one list, so each fold size gets its own
   collapsible group with a subtotal. Everything is closed by default on the
   larger bets and open on the small ones. */
function buildBreakdown(type, winPart, placePart, ew) {
  const groups = [];

  const render = (part, label) => {
    type.folds.forEach((k) => {
      const lines = part.lines.filter((l) => l.fold === k);
      if (!lines.length) return;
      const subtotal = lines.reduce((s, l) => s + l.ret, 0);
      const won = lines.filter((l) => !l.dead && !l.void).length;
      const open = type.bets <= 15 ? " open" : "";
      groups.push(
        `<details class="fold-group"${open}>` +
        `<summary><span class="fold-name">${FOLD_NAME[k]}${label}</span>` +
        `<span class="fold-meta">${won}/${lines.length} won · ${money(subtotal)}</span></summary>` +
        `<div class="table-scroll"><div style="min-width:420px;">` +
        `<table class="out-table"><thead><tr><th>Selections</th><th>Odds</th><th>Stake</th><th>Returns</th></tr></thead><tbody>` +
        lines.map((l) =>
          `<tr${l.ret > 0 ? ' class="current"' : ""}><td>${l.names.map(escapeHtml).join(" + ")}</td>` +
          `<td>${l.void ? "void" : l.dead ? "—" : l.odds.toFixed(2)}</td>` +
          `<td>${money(l.stake)}</td>` +
          `<td>${money(l.ret)}</td></tr>`
        ).join("") +
        `</tbody></table></div></div></details>`
      );
    });
  };

  render(winPart, ew ? " (win)" : "");
  if (placePart) render(placePart, " (place)");

  els.breakdown.innerHTML = groups.join("");
}

function buildVerdict(type, sels, profit, totalStake, totalReturn, nonRunners, wins, consolation, bonusAmount) {
  const parts = [];
  const losers = sels.filter((s) => s.result === "lose").length;

  parts.push(profit >= 0
    ? `A ${money(totalStake)} ${type.label} returning ${money(totalReturn)} — a profit of <strong>${money(profit)}</strong>.`
    : `A ${money(totalStake)} ${type.label} returning ${money(totalReturn)} — a loss of <strong>${money(-profit)}</strong>.`);

  if (nonRunners.length) {
    parts.push(`${nonRunners.length === 1 ? "The non-runner is" : "Non-runners are"} settled at odds of 1.00, not as ` +
      `${nonRunners.length === 1 ? "a loser" : "losers"} — so ${nonRunners.length === 1 ? "it drops" : "they drop"} out and every bet ` +
      `containing ${nonRunners.length === 1 ? "it" : "them"} settles a size smaller. The stake is not refunded, because the bets containing ` +
      `${nonRunners.length === 1 ? "it" : "them"} still stand on their other legs.`);
  }

  if (consolation > 0) {
    parts.push(`One winner and no non-runners, so the consolation bonus applies — worth <strong>${money(consolation)}</strong> on top.`);
  }
  if (bonusAmount > 0) {
    parts.push(`All selections won, so the all-winners bonus adds <strong>${money(bonusAmount)}</strong> to the return.`);
  }

  if (losers === sels.length) {
    parts.push(`With every selection beaten there is nothing to return — the whole ${money(totalStake)} is lost. ` +
      `This is the trade-off: a full-cover bet stakes many units to buy a return on partial success.`);
  }

  els.verdict.innerHTML = parts.join(" ");
  els.verdict.style.display = "block";
}

els.betType.addEventListener("change", () => {
  buildRows(BET_TYPES[els.betType.value].n);
  calculate();
});

selRowsEl.addEventListener("input", calculate);
selRowsEl.addEventListener("change", calculate);
[els.stake, els.allWinnersBonus].forEach((el) => el.addEventListener("input", calculate));
[els.eachWay, els.placeFraction, els.places, els.consolation, els.currency].forEach((el) =>
  el.addEventListener("change", calculate)
);

buildRows(BET_TYPES[els.betType.value].n);
calculate();
