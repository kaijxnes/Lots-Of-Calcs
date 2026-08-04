let mode = "qualifying";

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
  const errorEl = document.getElementById("lay-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab[data-mode]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  document.getElementById("mode-hint").textContent =
    mode === "freebet"
      ? "The bookmaker pays only the winnings, not the free bet stake, so the levelled figure is genuine profit."
      : "Your back stake is returned if the bet wins, so the aim is to make the loss either way as small as possible.";
  document.getElementById("outcome-label").textContent =
    mode === "freebet" ? "Profit locked in" : "Qualifying loss";
  calculate();
}

document.querySelectorAll(".tab[data-mode]").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

function calculate() {
  const backStake = num("back-stake");
  const backOdds = num("back-odds");
  const layOdds = num("lay-odds");
  const commissionPct = num("commission");
  const commission = commissionPct / 100;

  function reset() {
    ["lay-stake", "liability", "profit-bookie", "profit-exchange", "locked-result"].forEach((id) => {
      document.getElementById(id).textContent = fmtMoney(0);
    });
  }

  if (backStake < 0 || backOdds < 0 || layOdds < 0 || commissionPct < 0) {
    showError("Values can't be negative.");
    reset();
    return;
  }
  if (backOdds <= 1) {
    showError("Back odds must be greater than 1.");
    reset();
    return;
  }
  if (layOdds <= 1) {
    showError("Lay odds must be greater than 1.");
    reset();
    return;
  }
  if (commissionPct >= 100) {
    showError("Commission must be below 100%.");
    reset();
    return;
  }

  showError("");

  const isFree = mode === "freebet";

  /* Free bets are stake-not-returned, so only the winnings need covering */
  const backSide = isFree ? backOdds - 1 : backOdds;
  const layStake = (backStake * backSide) / (layOdds - commission);
  const liability = layStake * (layOdds - 1);

  /* Bookmaker's selection wins: collect back winnings, pay the exchange liability */
  const profitBookie = backStake * (backOdds - 1) - liability;

  /* Lay wins: keep lay stake net of commission; lose the back stake unless it was free */
  const profitExchange = layStake * (1 - commission) - (isFree ? 0 : backStake);

  document.getElementById("lay-stake").textContent = fmtMoney(layStake);
  document.getElementById("liability").textContent = fmtMoney(liability);

  const bookieEl = document.getElementById("profit-bookie");
  bookieEl.textContent = fmtMoney(profitBookie);
  bookieEl.style.color = profitBookie > 0 ? "var(--good)" : profitBookie < 0 ? "var(--bad)" : "";

  const exchangeEl = document.getElementById("profit-exchange");
  exchangeEl.textContent = fmtMoney(profitExchange);
  exchangeEl.style.color = profitExchange > 0 ? "var(--good)" : profitExchange < 0 ? "var(--bad)" : "";

  /* Both outcomes are levelled by construction; show the worse one if rounding parts them */
  const locked = Math.min(profitBookie, profitExchange);
  const lockedEl = document.getElementById("locked-result");
  lockedEl.textContent = fmtMoney(locked);
  lockedEl.style.color = locked > 0 ? "var(--good)" : locked < 0 ? "var(--bad)" : "";
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
