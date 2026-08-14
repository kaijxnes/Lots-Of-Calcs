const els = {
  price: document.getElementById("price"),
  deposit: document.getElementById("deposit"),
  term: document.getElementById("term"),
  apr: document.getElementById("apr"),
  balloon: document.getElementById("balloon"),
  balloonField: document.getElementById("balloon-field"),
  currency: document.getElementById("currency"),
  error: document.getElementById("cf-error"),
  heroValue: document.getElementById("hero-value"),
  outFinanced: document.getElementById("out-financed"),
  outMonthly: document.getElementById("out-monthly"),
  outPayments: document.getElementById("out-payments"),
  outBalloon: document.getElementById("out-balloon"),
  balloonRow: document.getElementById("balloon-row"),
  outTotal: document.getElementById("out-total"),
  outInterest: document.getElementById("out-interest"),
  compareRow: document.getElementById("compare-row"),
  outCompare: document.getElementById("out-compare"),
  compareNote: document.getElementById("compare-note"),
  tableBody: document.getElementById("schedule-body"),
  scheduleWrap: document.getElementById("schedule-wrap")
};

function agreement() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "hp";
}

function money(v) {
  const symbol = els.currency.value;
  if (!isFinite(v)) return "—";
  const rounded = Math.round(Math.abs(v) * 100) / 100;
  const sign = v < 0 && rounded !== 0 ? "−" : "";
  return sign + symbol + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(el) {
  const raw = el.value.trim().replace(/[\s,]/g, "");
  if (raw === "") return null;
  const v = Number(raw);
  return isFinite(v) ? v : NaN;
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function clearResults() {
  els.heroValue.textContent = "—";
  ["outFinanced", "outMonthly", "outPayments", "outBalloon", "outTotal", "outInterest", "outCompare"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.compareNote.style.display = "none";
  els.tableBody.innerHTML = "";
}

/* UK APR is an effective annual rate, so the monthly rate is the twelfth root
   rather than APR ÷ 12. The shortcut overstates the payment by a few pounds a
   month on a typical car deal. */
function monthlyRate(apr) {
  return Math.pow(1 + apr / 100, 1 / 12) - 1;
}

/* Annuity with a future value: the balloon is discounted back and taken off
   the amount the monthly payments have to clear. */
function monthlyPayment(financed, balloon, months, apr) {
  const i = monthlyRate(apr);
  if (i === 0) return (financed - balloon) / months;
  const disc = Math.pow(1 + i, -months);
  return (financed - balloon * disc) * i / (1 - disc);
}

function calculate() {
  const mode = agreement();
  els.balloonField.style.display = mode === "pcp" ? "" : "none";

  const price = num(els.price);
  const deposit = num(els.deposit);
  const term = num(els.term);
  const apr = num(els.apr);
  const balloonRaw = mode === "pcp" ? num(els.balloon) : 0;

  if (price === null) return fail("Enter the cash price of the car.");
  if (isNaN(price)) return fail("The cash price isn't a number.");
  if (price <= 0) return fail("The cash price has to be more than zero.");

  const dep = deposit === null ? 0 : deposit;
  if (isNaN(dep)) return fail("The deposit isn't a number.");
  if (dep < 0) return fail("The deposit can't be negative.");
  if (dep >= price) return fail("The deposit covers the whole price — there is nothing left to finance.");

  if (term === null) return fail("Enter the term in months.");
  if (isNaN(term)) return fail("The term isn't a number.");
  if (!Number.isInteger(term) || term < 1) return fail("The term has to be a whole number of months, at least 1.");
  if (term > 120) return fail("120 months is the longest term this handles — car finance rarely runs beyond 60.");

  if (apr === null) return fail("Enter the APR. Use 0 for an interest-free deal.");
  if (isNaN(apr)) return fail("The APR isn't a number.");
  if (apr < 0) return fail("The APR can't be negative.");
  if (apr > 100) return fail("That APR is above 100% — check the figure you've entered.");

  const financed = price - dep;
  const balloon = balloonRaw === null ? 0 : balloonRaw;
  if (isNaN(balloon)) return fail("The final payment isn't a number.");
  if (balloon < 0) return fail("The final payment can't be negative.");
  if (balloon >= financed) {
    return fail(`The final payment has to be less than the ${money(financed)} being financed, or there is nothing for the monthly payments to clear.`);
  }

  setError("");

  /* Everything downstream comes off the unrounded payment and is rounded only
     for display. Rounding the monthly figure first leaves a residue that shows
     up as a few pence of interest on a 0% deal — or, worse, negative interest.
     Real agreements absorb the same residue in the final instalment. */
  const monthlyExact = monthlyPayment(financed, balloon, term, apr);
  const monthly = Math.round(monthlyExact * 100) / 100;
  const paymentsTotal = Math.round(monthlyExact * term * 100) / 100;
  const totalPayable = Math.round((dep + monthlyExact * term + balloon) * 100) / 100;
  const interest = Math.round((totalPayable - price) * 100) / 100;

  els.heroValue.textContent = money(monthly);
  els.outFinanced.textContent = money(financed);
  els.outMonthly.textContent = money(monthly);
  els.outPayments.textContent = `${money(paymentsTotal)} over ${term} months`;
  els.outTotal.textContent = money(totalPayable);
  els.outInterest.textContent = money(interest);

  els.balloonRow.style.display = balloon > 0 ? "flex" : "none";
  els.outBalloon.textContent = money(balloon);

  /* The point of a balloon is a lower monthly payment, and the cost of it is
     more interest — worth showing side by side rather than leaving implied. */
  if (balloon > 0) {
    const noBalloonExact = monthlyPayment(financed, 0, term, apr);
    const noBalloon = Math.round(noBalloonExact * 100) / 100;
    const noBalloonTotal = Math.round((dep + noBalloonExact * term) * 100) / 100;
    const noBalloonInterest = Math.round((noBalloonTotal - price) * 100) / 100;
    els.compareRow.style.display = "flex";
    els.outCompare.textContent = `${money(noBalloon)}/mo, ${money(noBalloonInterest)} interest`;
    els.compareNote.innerHTML =
      `The final payment lowers the monthly figure by <strong>${money(noBalloon - monthly)}</strong>, ` +
      `but adds <strong>${money(interest - noBalloonInterest)}</strong> in interest over the term — ` +
      `you are borrowing more of the car's value for longer.`;
    els.compareNote.style.display = "block";
  } else {
    els.compareRow.style.display = "none";
    els.compareNote.style.display = "none";
  }

  buildSchedule(financed, monthlyExact, term, apr, balloon);
}

function fail(message) {
  setError(message);
  clearResults();
}

function buildSchedule(financed, monthly, term, apr, balloon) {
  const i = monthlyRate(apr);
  let balance = financed;
  let interestThisYear = 0;
  let paidThisYear = 0;
  els.tableBody.innerHTML = "";

  for (let m = 1; m <= term; m++) {
    const interestPart = balance * i;
    balance = balance + interestPart - monthly;
    interestThisYear += interestPart;
    paidThisYear += monthly;

    if (m % 12 === 0 || m === term) {
      const year = Math.ceil(m / 12);
      /* The last row settles the balloon, so show the balance actually left */
      const shown = m === term ? Math.max(0, Math.round(balance * 100) / 100) : balance;
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${year}</td>` +
        `<td>${money(paidThisYear)}</td>` +
        `<td>${money(interestThisYear)}</td>` +
        `<td>${money(shown)}</td>`;
      els.tableBody.appendChild(tr);
      interestThisYear = 0;
      paidThisYear = 0;
    }
  }
  els.scheduleWrap.style.display = "block";
}

[els.price, els.deposit, els.term, els.apr, els.balloon].forEach((el) =>
  el.addEventListener("input", calculate)
);
els.currency.addEventListener("change", calculate);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active")) return;
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    calculate();
  });
});

calculate();
