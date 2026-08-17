const rowsEl = document.getElementById("debt-rows");

const els = {
  extra: document.getElementById("extra"),
  currency: document.getElementById("currency"),
  addBtn: document.getElementById("add-debt"),
  error: document.getElementById("debt-error"),
  warning: document.getElementById("debt-warning"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  verdict: document.getElementById("verdict"),
  compareBody: document.getElementById("compare-body"),
  snowballBody: document.getElementById("snowball-body"),
  avalancheBody: document.getElementById("avalanche-body"),
  perDebtBody: document.getElementById("per-debt-body"),
  outMinTotal: document.getElementById("out-min-total"),
  outBudget: document.getElementById("out-budget")
};

const MAX_MONTHS = 600;
const MAX_ROWS = 10;
const MIN_ROWS = 2;

/* Example debts so the page has something to show on arrival. Deliberately
   chosen so the two strategies actually disagree — the smallest balance is
   the store card but the dearest debt is the credit card, so snowball and
   avalanche start in different places. Defaults where the smallest balance
   also carries the highest rate would open the page on "no difference",
   which is the one case that teaches the reader nothing. */
const DEFAULT_ROWS = [
  ["Credit card", "4200", "24.9", "105"],
  ["Store card", "900", "12.9", "30"],
  ["Car loan", "5400", "6.9", "180"]
];

function renumber() {
  [...rowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = String(i + 1);
    /* Below the minimum there is nothing to compare, so the last two rows
       lose their remove button rather than letting the page break */
    const btn = row.querySelector(".btn-remove");
    if (btn) btn.disabled = rowsEl.children.length <= MIN_ROWS;
  });
  els.addBtn.disabled = rowsEl.children.length >= MAX_ROWS;
}

function addRow(name, balance, apr, min) {
  const row = document.createElement("div");
  row.className = "dyn-row dyn-row-4";
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="Debt name" value="${Fin.escapeHtml(name || "")}" data-field="name" aria-label="Debt name">
    <input class="fixed-sm" type="number" placeholder="Balance" step="any" min="0" value="${Fin.escapeHtml(balance || "")}" data-field="balance" aria-label="Balance">
    <input class="fixed-sm" type="number" placeholder="APR %" step="any" min="0" value="${Fin.escapeHtml(apr || "")}" data-field="apr" aria-label="APR percent">
    <input class="fixed-sm" type="number" placeholder="Min/mo" step="any" min="0" value="${Fin.escapeHtml(min || "")}" data-field="min" aria-label="Minimum monthly payment">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    if (rowsEl.children.length <= MIN_ROWS) return;
    row.remove();
    renumber();
    calculate();
  });
  rowsEl.appendChild(row);
  renumber();
}

function readRows() {
  return [...rowsEl.children].map((row, i) => {
    const g = (f) => row.querySelector('[data-field="' + f + '"]');
    return {
      index: i + 1,
      name: g("name").value.trim() || "Debt " + (i + 1),
      balance: Fin.num(g("balance")),
      apr: Fin.num(g("apr")),
      min: Fin.num(g("min"))
    };
  });
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function setWarning(html) {
  els.warning.innerHTML = html;
  els.warning.style.display = html ? "block" : "none";
}

function clearResults() {
  els.heroValue.textContent = "—";
  els.outMinTotal.textContent = "—";
  els.outBudget.textContent = "—";
  els.verdict.style.display = "none";
  [els.compareBody, els.snowballBody, els.avalancheBody, els.perDebtBody].forEach((b) => {
    b.innerHTML = "";
  });
}

/* Avalanche attacks the dearest debt, snowball the smallest. Ties break by the
   order the rows are in, so the result is at least deterministic. */
function comparator(strategy) {
  if (strategy === "avalanche") {
    return (a, b) => b.apr - a.apr || a.index - b.index;
  }
  return (a, b) => a.bal - b.bal || a.index - b.index;
}

/* One month at a time, because the whole point is what happens when a debt
   clears and its payment rolls onto the next one. */
function simulate(debts, extra, strategy) {
  const state = debts.map((d) => ({
    index: d.index,
    name: d.name,
    apr: d.apr,
    min: d.min,
    start: d.balance,
    bal: d.balance,
    interest: 0,
    paid: 0,
    clearedMonth: null
  }));

  /* The budget is every minimum plus the extra, held constant for the whole
     run. That single line is the "rolling" in rolling snowball: when a debt
     clears, its minimum is no longer spent on it but is still in the budget,
     so it flows onto the next target in the very same month. */
  const budgetPerMonth = debts.reduce((s, d) => s + d.min, 0) + extra;

  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const order = [];

  const outstanding = () => state.filter((d) => d.bal > 0.005);

  while (outstanding().length && month < MAX_MONTHS) {
    month++;

    /* Interest first, on what is owed at the start of the month */
    for (const d of state) {
      if (d.bal <= 0) continue;
      const i = d.bal * Fin.monthlyInterestRate(d.apr);
      d.bal += i;
      d.interest += i;
      totalInterest += i;
    }

    let budget = budgetPerMonth;

    /* Minimums on everything still owing, never more than the balance */
    for (const d of outstanding()) {
      const pay = Math.min(d.min, d.bal, budget);
      if (pay <= 0) continue;
      d.bal -= pay;
      d.paid += pay;
      budget -= pay;
      totalPaid += pay;
    }

    /* Whatever is left goes at the target — and keeps going down the list if
       it more than clears it, which is what makes the final month come out
       right instead of overpaying */
    const targets = outstanding().sort(comparator(strategy));
    for (const d of targets) {
      if (budget <= 0.005) break;
      const pay = Math.min(budget, d.bal);
      d.bal -= pay;
      d.paid += pay;
      budget -= pay;
      totalPaid += pay;
    }

    for (const d of state) {
      if (d.clearedMonth === null && d.bal <= 0.005) {
        d.bal = 0;
        d.clearedMonth = month;
        order.push(d);
      }
    }
  }

  return {
    strategy: strategy,
    months: month,
    totalInterest: totalInterest,
    totalPaid: totalPaid,
    order: order,
    debts: state,
    stalled: outstanding().length > 0,
    stalledDebts: outstanding().map((d) => d.name)
  };
}

function orderRows(result) {
  return result.order.map((d, i) =>
    `<tr><td>${i + 1}</td><td>${Fin.escapeHtml(d.name)}</td>` +
    `<td>${Fin.pct(d.apr)}</td>` +
    `<td>month ${d.clearedMonth}</td>` +
    `<td>${Fin.money0(d.interest)}</td></tr>`
  ).join("");
}

function calculate() {
  const rows = readRows();

  for (const r of rows) {
    if (r.balance === null) return fail(`Enter the balance for ${r.name}.`);
    if (isNaN(r.balance)) return fail(`The balance for ${r.name} isn't a number.`);
    if (r.balance < 0) return fail(`The balance for ${r.name} can't be negative.`);
    if (r.apr === null) return fail(`Enter the APR for ${r.name} — use 0 for an interest-free debt.`);
    if (isNaN(r.apr)) return fail(`The APR for ${r.name} isn't a number.`);
    if (r.apr < 0) return fail(`The APR for ${r.name} can't be negative.`);
    if (r.apr > 200) return fail(`An APR of ${r.apr}% on ${r.name} looks wrong — check the figure.`);
    if (r.min === null) return fail(`Enter the minimum monthly payment for ${r.name}.`);
    if (isNaN(r.min)) return fail(`The minimum payment for ${r.name} isn't a number.`);
    if (r.min < 0) return fail(`The minimum payment for ${r.name} can't be negative.`);
  }

  const extraRaw = Fin.num(els.extra);
  const extra = extraRaw === null ? 0 : extraRaw;
  if (isNaN(extra)) return fail("The extra monthly payment isn't a number.");
  if (extra < 0) return fail("The extra monthly payment can't be negative.");

  const live = rows.filter((r) => r.balance > 0);
  if (!live.length) {
    setError("Enter a balance on at least one debt.");
    setWarning("");
    clearResults();
    return;
  }

  const minTotal = live.reduce((s, r) => s + r.min, 0);
  const budget = minTotal + extra;

  /* A debt whose minimum does not cover its own interest grows every month.
     Worth saying before the simulation runs, not after it hits the cap. */
  const drowning = live.filter((r) => r.min < r.balance * Fin.monthlyInterestRate(r.apr));
  let warning = "";
  if (drowning.length) {
    warning = drowning.map((r) =>
      `<strong>${Fin.escapeHtml(r.name)}</strong>: the ${Fin.money(r.min)} minimum is less than the ` +
      `${Fin.money(r.balance * Fin.monthlyInterestRate(r.apr))} of interest it accrues each month, so on its own that ` +
      `balance grows rather than falls. It only clears once the extra payment reaches it.`
    ).join("<br>");
  }

  setError("");

  const snowball = simulate(live, extra, "snowball");
  const avalanche = simulate(live, extra, "avalanche");

  if (snowball.stalled || avalanche.stalled) {
    const stuck = [...new Set([...snowball.stalledDebts, ...avalanche.stalledDebts])];
    setWarning(warning);
    setError(
      `These debts don't clear within ${MAX_MONTHS / 12} years at this payment level — ` +
      `${stuck.map(Fin.escapeHtml).join(", ")} ${stuck.length === 1 ? "is" : "are"} still outstanding. ` +
      `The payments aren't keeping up with the interest. Increase the extra monthly payment, or look at a 0% balance transfer.`
    );
    clearResults();
    els.outMinTotal.textContent = Fin.money(minTotal);
    els.outBudget.textContent = Fin.money(budget);
    return;
  }

  setWarning(warning);

  const interestSaved = snowball.totalInterest - avalanche.totalInterest;
  const monthsSaved = snowball.months - avalanche.months;

  els.heroValue.textContent = Fin.money(Math.abs(interestSaved));
  els.heroLabel.textContent = interestSaved >= 0.005 ? "Avalanche saves you" : "Difference between the two";

  els.outMinTotal.textContent = Fin.money(minTotal);
  els.outBudget.textContent = `${Fin.money(budget)} a month`;

  els.compareBody.innerHTML = [
    ["Months to debt-free", Fin.monthsToWords(snowball.months), Fin.monthsToWords(avalanche.months)],
    ["Total interest paid", Fin.money(snowball.totalInterest), Fin.money(avalanche.totalInterest)],
    ["Total paid", Fin.money(snowball.totalPaid), Fin.money(avalanche.totalPaid)],
    ["First debt cleared", snowball.order.length ? `${Fin.escapeHtml(snowball.order[0].name)}, month ${snowball.order[0].clearedMonth}` : "—",
      avalanche.order.length ? `${Fin.escapeHtml(avalanche.order[0].name)}, month ${avalanche.order[0].clearedMonth}` : "—"]
  ].map(([label, s, a]) => `<tr><td>${label}</td><td>${s}</td><td>${a}</td></tr>`).join("");

  els.snowballBody.innerHTML = orderRows(snowball);
  els.avalancheBody.innerHTML = orderRows(avalanche);

  els.perDebtBody.innerHTML = live.map((r) => {
    const s = snowball.debts.find((d) => d.index === r.index);
    const a = avalanche.debts.find((d) => d.index === r.index);
    return `<tr><td>${Fin.escapeHtml(r.name)}</td>` +
      `<td>${Fin.money0(r.balance)}</td>` +
      `<td>${Fin.pct(r.apr)}</td>` +
      `<td>month ${s.clearedMonth} / ${Fin.money0(s.interest)}</td>` +
      `<td>month ${a.clearedMonth} / ${Fin.money0(a.interest)}</td></tr>`;
  }).join("");

  buildVerdict(interestSaved, monthsSaved, snowball, avalanche, live);
}

function fail(message) {
  setError(message);
  setWarning("");
  clearResults();
}

function buildVerdict(interestSaved, monthsSaved, snowball, avalanche, live) {
  let text;

  if (live.length === 1) {
    text = `With only one debt there is no order to choose, so the two strategies are the same thing. ` +
      `Add a second debt to see them diverge.`;
  } else if (interestSaved < 0.005 && monthsSaved === 0) {
    text = `<strong>These two come out identical here.</strong> Your debts happen to sit in the same order by balance as by ` +
      `interest rate, so both strategies attack them in the same sequence. Pick whichever you find easier to stick to.`;
  } else if (interestSaved < 1 && Math.abs(monthsSaved) <= 1) {
    text = `<strong>The difference is negligible</strong> — ${Fin.money(interestSaved)} and ` +
      `${monthsSaved === 0 ? "no difference in time" : "a month"}. At these balances and rates the choice barely matters, ` +
      `so take the snowball if the early wins will keep you going.`;
  } else {
    const bits = [`<strong>Avalanche saves you ${Fin.money(interestSaved)}</strong>`];
    if (monthsSaved > 0) bits.push(`and clears the lot ${Fin.monthsToWords(monthsSaved)} sooner`);
    else if (monthsSaved === 0) bits.push(`in the same ${Fin.monthsToWords(avalanche.months)}`);
    else bits.push(`though snowball finishes ${Fin.monthsToWords(-monthsSaved)} sooner`);
    text = bits.join(" ") + ". ";

    const first = snowball.order[0];
    text += `Snowball clears <strong>${Fin.escapeHtml(first.name)}</strong> first, in month ${first.clearedMonth}` +
      (avalanche.order[0].index !== first.index
        ? `, against month ${avalanche.debts.find((d) => d.index === first.index).clearedMonth} on avalanche — ` +
          `that early win is what you are buying with the ${Fin.money(interestSaved)}.`
        : ` — the same debt avalanche starts with, so you get the early win either way.`);
  }

  els.verdict.innerHTML = text;
  els.verdict.style.display = "block";
}

els.addBtn.addEventListener("click", () => {
  if (rowsEl.children.length >= MAX_ROWS) return;
  addRow("", "", "", "");
  calculate();
});

rowsEl.addEventListener("input", calculate);
els.extra.addEventListener("input", calculate);
els.currency.addEventListener("change", calculate);

DEFAULT_ROWS.forEach(([n, b, a, m]) => addRow(n, b, a, m));
calculate();
