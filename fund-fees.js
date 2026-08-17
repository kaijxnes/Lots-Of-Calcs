const els = {
  initial: document.getElementById("initial"),
  monthly: document.getElementById("monthly"),
  riseWithInflation: document.getElementById("rise"),
  inflation: document.getElementById("inflation"),
  inflationField: document.getElementById("inflation-field"),
  years: document.getElementById("years"),
  grossReturn: document.getElementById("gross-return"),
  ocf: document.getElementById("ocf"),
  platformType: document.getElementById("platform-type"),
  platformPct: document.getElementById("platform-pct"),
  platformFlat: document.getElementById("platform-flat"),
  platformPctField: document.getElementById("platform-pct-field"),
  platformFlatField: document.getElementById("platform-flat-field"),
  transaction: document.getElementById("transaction"),
  currency: document.getElementById("currency"),
  error: document.getElementById("fee-error"),
  heroValue: document.getElementById("hero-value"),
  outWithFees: document.getElementById("out-with-fees"),
  outNoFees: document.getElementById("out-no-fees"),
  outFeeCost: document.getElementById("out-fee-cost"),
  outFeesPaid: document.getElementById("out-fees-paid"),
  outGrowthLost: document.getElementById("out-growth-lost"),
  outFeePct: document.getElementById("out-fee-pct"),
  outContributed: document.getElementById("out-contributed"),
  outCheap: document.getElementById("out-cheap"),
  cheapRow: document.getElementById("cheap-row"),
  verdict: document.getElementById("verdict"),
  tableBody: document.getElementById("breakdown-body")
};

const CHEAP_OCF = 0.1;

function clearResults() {
  els.heroValue.textContent = "—";
  ["outWithFees", "outNoFees", "outFeeCost", "outFeesPaid", "outGrowthLost",
   "outFeePct", "outContributed", "outCheap"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.verdict.style.display = "none";
  els.tableBody.innerHTML = "";
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function fail(message) {
  setError(message);
  clearResults();
}

/* Walks the pot forward a month at a time. Percentage charges come off the
   monthly growth rate; a flat platform fee comes off as cash, which is what
   makes it bite so hard on a small pot and vanish on a large one.

   Returns the final pot plus the two numbers that matter: what was actually
   handed over in charges, and — separately — the growth that money would have
   earned had it stayed invested. */
function run(opts) {
  const grossMonthly = Fin.monthlyGrowth(opts.grossReturn);
  const pctFeeMonthly = (opts.ocf + opts.platformPct + opts.transaction) / 100 / 12;
  const netMonthly = grossMonthly - pctFeeMonthly;
  const flatMonthly = opts.platformFlat / 12;

  let pot = opts.initial;
  let contributed = opts.initial;
  let feesPaid = 0;
  let contribution = opts.monthly;
  const yearEnds = [];

  const months = Math.round(opts.years * 12);

  for (let m = 1; m <= months; m++) {
    /* People put their standing order up once a year, not every month */
    if (opts.riseWithInflation && m > 1 && (m - 1) % 12 === 0) {
      contribution *= 1 + opts.inflation / 100;
    }

    /* The percentage fee is charged on the pot before this month's growth,
       which is what subtracting it from the rate amounts to */
    feesPaid += pot * pctFeeMonthly + flatMonthly;

    pot = pot * (1 + netMonthly) - flatMonthly + contribution;
    contributed += contribution;

    /* A flat fee can outrun a small pot. Stop at zero rather than showing a
       negative balance that nobody would actually be allowed to run up. */
    if (pot < 0) pot = 0;

    if (m % 12 === 0) yearEnds.push({ year: m / 12, pot: pot, contributed: contributed, feesPaid: feesPaid });
  }

  return { pot: pot, contributed: contributed, feesPaid: feesPaid, yearEnds: yearEnds };
}

function calculate() {
  const flat = els.platformType.value === "flat";
  els.platformPctField.style.display = flat ? "none" : "";
  els.platformFlatField.style.display = flat ? "" : "none";

  const rise = els.riseWithInflation.value === "yes";
  els.inflationField.style.display = rise ? "" : "none";

  const initialRaw = Fin.num(els.initial);
  const monthlyRaw = Fin.num(els.monthly);
  const years = Fin.num(els.years);
  const grossReturn = Fin.num(els.grossReturn);
  const ocf = Fin.num(els.ocf);
  const platformRaw = flat ? Fin.num(els.platformFlat) : Fin.num(els.platformPct);
  const transactionRaw = Fin.num(els.transaction);
  const inflationRaw = Fin.num(els.inflation);

  const initial = initialRaw === null ? 0 : initialRaw;
  const monthly = monthlyRaw === null ? 0 : monthlyRaw;
  const platform = platformRaw === null ? 0 : platformRaw;
  const transaction = transactionRaw === null ? 0 : transactionRaw;
  const inflation = inflationRaw === null ? 0 : inflationRaw;

  if (isNaN(initial) || initial < 0) return fail("The starting lump sum has to be zero or more.");
  if (isNaN(monthly) || monthly < 0) return fail("The monthly contribution has to be zero or more.");
  if (initial === 0 && monthly === 0) return fail("Enter a starting lump sum, a monthly contribution, or both — there is nothing to invest otherwise.");

  if (years === null) return fail("Enter the number of years.");
  if (isNaN(years)) return fail("The number of years isn't a number.");
  if (years <= 0) return fail("The number of years has to be more than zero.");
  if (years > 70) return fail("70 years is the longest this models — beyond that the assumption of a constant return stops meaning anything.");

  if (grossReturn === null) return fail("Enter the expected gross annual return.");
  if (isNaN(grossReturn)) return fail("The gross return isn't a number.");
  if (grossReturn <= -100) return fail("A return of −100% or worse would wipe the pot out entirely.");
  if (grossReturn > 50) return fail("A sustained 50%+ annual return isn't a realistic planning assumption.");

  if (ocf === null) return fail("Enter the fund's ongoing charge. Use 0 if there isn't one.");
  if (isNaN(ocf)) return fail("The ongoing charge isn't a number.");
  if (ocf < 0) return fail("The ongoing charge can't be negative.");
  if (isNaN(platform) || platform < 0) return fail("The platform fee can't be negative.");
  if (isNaN(transaction) || transaction < 0) return fail("Transaction costs can't be negative.");
  if (isNaN(inflation) || inflation < 0) return fail("The inflation rate can't be negative.");

  const platformPct = flat ? 0 : platform;
  const platformFlat = flat ? platform : 0;
  const totalPct = ocf + platformPct + transaction;
  if (totalPct > 20) return fail("Total percentage charges above 20% a year aren't a real product — check the figures.");

  setError("");

  const base = {
    initial: initial,
    monthly: monthly,
    riseWithInflation: rise,
    inflation: inflation,
    years: years,
    grossReturn: grossReturn,
    ocf: ocf,
    platformPct: platformPct,
    platformFlat: platformFlat,
    transaction: transaction
  };

  const withFees = run(base);
  const noFees = run(Object.assign({}, base, { ocf: 0, platformPct: 0, platformFlat: 0, transaction: 0 }));
  const cheap = run(Object.assign({}, base, { ocf: CHEAP_OCF }));

  const feeCost = noFees.pot - withFees.pot;
  const growthLost = feeCost - withFees.feesPaid;

  els.heroValue.textContent = Fin.money(feeCost);
  els.outWithFees.textContent = Fin.money(withFees.pot);
  els.outNoFees.textContent = Fin.money(noFees.pot);
  els.outFeeCost.textContent = Fin.money(feeCost);
  els.outFeesPaid.textContent = Fin.money(withFees.feesPaid);
  els.outGrowthLost.textContent = Fin.money(growthLost);
  els.outContributed.textContent = Fin.money(withFees.contributed);

  /* Measured against the fee-free pot: "what share of what I would have had
     did charges take". Stated on the page so the denominator isn't a guess. */
  els.outFeePct.textContent = noFees.pot > 0 ? Fin.pct((feeCost / noFees.pot) * 100) : "—";

  const cheaperByOcf = Math.abs(ocf - CHEAP_OCF) > 0.001;
  els.cheapRow.style.display = cheaperByOcf ? "flex" : "none";
  if (cheaperByOcf) {
    const diff = cheap.pot - withFees.pot;
    els.outCheap.textContent = `${Fin.money(cheap.pot)} (${diff >= 0 ? "+" : "−"}${Fin.money(Math.abs(diff)).replace("−", "")})`;
  }

  buildTable(withFees, noFees, years);
  buildVerdict(withFees, noFees, feeCost, growthLost, totalPct, platformFlat, years, ocf, cheap);
}

/* Five-year intervals, plus the final year when it isn't a multiple of five */
function buildTable(withFees, noFees, years) {
  els.tableBody.innerHTML = "";
  const total = Math.round(years);
  const marks = [];
  for (let y = 5; y <= total; y += 5) marks.push(y);
  if (!marks.length || marks[marks.length - 1] !== total) marks.push(total);

  marks.forEach((y) => {
    const w = withFees.yearEnds.find((r) => r.year === y);
    const n = noFees.yearEnds.find((r) => r.year === y);
    if (!w || !n) return;
    const gap = n.pot - w.pot;
    els.tableBody.innerHTML +=
      `<tr><td>${y}</td>` +
      `<td>${Fin.money0(w.pot)}</td>` +
      `<td>${Fin.money0(n.pot)}</td>` +
      `<td class="neg">${Fin.money0(gap)}</td>` +
      `<td>${n.pot > 0 ? Fin.pct((gap / n.pot) * 100, 1) : "—"}</td></tr>`;
  });
}

function buildVerdict(withFees, noFees, feeCost, growthLost, totalPct, platformFlat, years, ocf, cheap) {
  const parts = [];

  parts.push(`Over ${years} year${years === 1 ? "" : "s"}, charges cost you <strong>${Fin.money(feeCost)}</strong>.`);

  if (withFees.feesPaid > 0 && growthLost > 0) {
    const share = (growthLost / feeCost) * 100;
    parts.push(`Only ${Fin.money(withFees.feesPaid)} of that was handed over as fees — the other ` +
      `<strong>${Fin.money(growthLost)}</strong>, ${Math.round(share)}% of the total, is growth those fees never got the chance to earn.`);
  }

  if (platformFlat > 0 && noFees.pot > 0) {
    const flatShare = (platformFlat * years / feeCost) * 100;
    parts.push(`The flat platform fee is ${Fin.money(platformFlat)} a year whatever the pot is worth, so it accounts for ` +
      `roughly ${Math.round(flatShare)}% of the damage here and shrinks as a share as the pot grows.`);
  }

  if (Math.abs(ocf - CHEAP_OCF) > 0.001) {
    const diff = cheap.pot - withFees.pot;
    if (diff > 0) {
      parts.push(`Moving to a ${CHEAP_OCF}% index fund would leave you <strong>${Fin.money(diff)}</strong> better off.`);
    }
  }

  els.verdict.innerHTML = parts.join(" ");
  els.verdict.style.display = "block";
}

[els.initial, els.monthly, els.inflation, els.years, els.grossReturn, els.ocf,
 els.platformPct, els.platformFlat, els.transaction].forEach((el) =>
  el.addEventListener("input", calculate)
);
[els.platformType, els.riseWithInflation, els.currency].forEach((el) =>
  el.addEventListener("change", calculate)
);

calculate();
