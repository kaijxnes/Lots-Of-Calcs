const els = {
  decimal: document.getElementById("decimal-in"),
  maxDen: document.getElementById("max-den"),
  fracIn: document.getElementById("fraction-in"),
  error: document.getElementById("dtf-error"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  panelDec: document.getElementById("panel-decimal"),
  panelFrac: document.getElementById("panel-fraction"),
  /* decimal -> fraction outputs */
  outExact: document.getElementById("out-exact"),
  outSimplified: document.getElementById("out-simplified"),
  mixedRow: document.getElementById("mixed-row"),
  outMixed: document.getElementById("out-mixed"),
  approxRow: document.getElementById("approx-row"),
  outApprox: document.getElementById("out-approx"),
  approxErrRow: document.getElementById("approx-err-row"),
  outApproxErr: document.getElementById("out-approx-err"),
  workingDec: document.getElementById("working-decimal"),
  /* fraction -> decimal outputs */
  outDecimal: document.getElementById("out-decimal"),
  outKind: document.getElementById("out-kind"),
  cycleRow: document.getElementById("cycle-row"),
  outCycle: document.getElementById("out-cycle"),
  outRoundedDec: document.getElementById("out-rounded-dec"),
  outFracSimplified: document.getElementById("out-frac-simplified"),
  workingFrac: document.getElementById("working-fraction"),
  gridDec: document.getElementById("grid-decimal"),
  gridFrac: document.getElementById("grid-fraction")
};

function direction() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "d2f";
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function step(n, title, body) {
  return `<div class="step"><span class="step-n">${n}</span><div class="step-body">` +
         `<div class="step-title">${title}</div>` +
         `<div class="step-detail">${body}</div></div></div>`;
}

function clearAll() {
  els.heroValue.textContent = "—";
  ["outExact", "outSimplified", "outMixed", "outApprox", "outApproxErr",
   "outDecimal", "outKind", "outCycle", "outRoundedDec", "outFracSimplified"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.mixedRow.style.display = "none";
  els.approxRow.style.display = "none";
  els.approxErrRow.style.display = "none";
  els.cycleRow.style.display = "none";
  els.workingDec.innerHTML = "";
  els.workingFrac.innerHTML = "";
}

/* --- decimal -> fraction --- */

function runDecimalToFraction() {
  const raw = els.decimal.value.trim();
  const parsed = Frac.parseDecimalString(raw);

  if (parsed.error === "empty") {
    setError("Enter a decimal — try 0.75, or 0.1(6) for a recurring one.");
    clearAll();
    return;
  }
  if (parsed.error) {
    setError(parsed.error);
    clearAll();
    return;
  }

  setError("");

  const simplified = parsed;
  const isImproper = simplified.d !== 1 && Math.abs(simplified.n) > simplified.d;
  const recurring = raw.includes("(");

  els.heroValue.textContent = Frac.format(simplified);
  els.heroLabel.textContent = recurring ? "Exact fraction" : "As a fraction";
  els.outSimplified.textContent = Frac.format(simplified);

  els.mixedRow.style.display = isImproper ? "flex" : "none";
  els.outMixed.textContent = isImproper ? Frac.formatMixed(simplified) : "—";

  /* Rebuild the unsimplified starting fraction so the working can show it */
  const m = raw.replace(/−/g, "-").replace(/[\s,]/g, "").match(/^-?(\d*)(?:\.(\d*)(?:\((\d+)\))?)?$/);
  const intStr = (m && m[1]) || "0";
  const nonRep = (m && m[2]) || "";
  const rep = (m && m[3]) || "";
  const neg = raw.trim().startsWith("-") || raw.trim().startsWith("−");

  const working = [];
  let i = 1;

  if (rep === "") {
    const d = Math.pow(10, nonRep.length);
    const n = Number(intStr + nonRep);
    const unsimplified = { n: neg ? -n : n, d: d };
    els.outExact.textContent = Frac.format(unsimplified);

    if (nonRep === "") {
      working.push(step(i++, "This is already a whole number",
        `${Frac.format(simplified)} needs no fraction — it is ${Math.abs(simplified.n)} over 1.`));
    } else {
      working.push(step(i++, "Write it over a power of ten",
        `There ${nonRep.length === 1 ? "is 1 digit" : "are " + nonRep.length + " digits"} after the point, ` +
        `so put the digits over <strong>1 followed by ${nonRep.length} zero${nonRep.length === 1 ? "" : "s"}</strong>: ` +
        `<strong>${Frac.format(unsimplified)}</strong>.`));
      const g = Frac.gcd(unsimplified.n, unsimplified.d);
      if (g === 1) {
        working.push(step(i++, "Already in its simplest form",
          `The greatest common divisor of ${Math.abs(unsimplified.n)} and ${unsimplified.d} is 1, so it cannot be reduced.`));
      } else {
        working.push(step(i++, "Simplify",
          `The greatest common divisor of ${Math.abs(unsimplified.n)} and ${unsimplified.d} is <strong>${g}</strong>, ` +
          `so divide both by it to get <strong>${Frac.format(simplified)}</strong>.`));
      }
    }

    /* An unmarked decimal might be a truncated recurring one, so offer the
       neat fraction alongside the literal one — that is usually what is wanted */
    const maxDen = Number(els.maxDen.value);
    const approx = Frac.approximate(Frac.toDecimal(simplified), maxDen);
    if (approx && !(approx.n === simplified.n && approx.d === simplified.d)) {
      const err = Math.abs(Frac.toDecimal(approx) - Frac.toDecimal(simplified));
      els.approxRow.style.display = "flex";
      els.outApprox.textContent = Frac.format(approx);
      els.approxErrRow.style.display = "flex";
      els.outApproxErr.textContent = "off by " + err.toExponential(2).replace("e", " × 10^");
      working.push(step(i++, "Closest simple fraction",
        `With the denominator capped at ${maxDen}, the nearest fraction is <strong>${Frac.format(approx)}</strong> ` +
        `(${Frac.toDecimal(approx).toFixed(9).replace(/0+$/, "")}…). ` +
        `If you typed a rounded-off decimal, this is probably the fraction you meant.`));
    } else {
      els.approxRow.style.display = "none";
      els.approxErrRow.style.display = "none";
    }
  } else {
    /* Recurring: the algebraic identity, spelled out */
    const whole = Number(intStr + nonRep + rep);
    const prefix = Number(intStr + nonRep);
    const d = Number("9".repeat(rep.length) + "0".repeat(nonRep.length));
    const unsimplified = { n: neg ? -(whole - prefix) : whole - prefix, d: d };
    els.outExact.textContent = Frac.format(unsimplified);
    els.approxRow.style.display = "none";
    els.approxErrRow.style.display = "none";

    const k = nonRep.length;
    const mLen = rep.length;
    working.push(step(i++, "Name the number",
      `Let <strong>x = ${raw.trim()}</strong>, where the bracketed digits repeat forever.`));
    working.push(step(i++, "Shift the point past the repeat",
      `Multiplying by 10<sup>${k + mLen}</sup> moves the point ${k + mLen} place${k + mLen === 1 ? "" : "s"} right: ` +
      `<strong>${Math.pow(10, k + mLen).toLocaleString("en-GB")}x = ${intStr}${nonRep}${rep}.(${rep})</strong>` +
      (k > 0 ? `<br>And 10<sup>${k}</sup>x = <strong>${intStr}${nonRep}.(${rep})</strong>` : "")));
    working.push(step(i++, "Subtract, and the repeat cancels",
      `Both lines have the same infinite tail, so subtracting removes it entirely: ` +
      `<strong>${d.toLocaleString("en-GB")}x = ${whole.toLocaleString("en-GB")} − ${prefix.toLocaleString("en-GB")} = ${(whole - prefix).toLocaleString("en-GB")}</strong>. ` +
      `This is the whole trick — an infinite decimal turned into a finite subtraction.`));
    working.push(step(i++, "Solve for x",
      `<strong>x = ${Frac.format(unsimplified)}</strong>` +
      (mLen ? ` — ${mLen} nine${mLen === 1 ? "" : "s"}${k ? ` followed by ${k} zero${k === 1 ? "" : "s"}` : ""} on the bottom.` : ".")));

    const g = Frac.gcd(unsimplified.n, unsimplified.d);
    if (g === 1) {
      working.push(step(i++, "Already in its simplest form",
        `The greatest common divisor is 1, so ${Frac.format(unsimplified)} cannot be reduced.`));
    } else {
      working.push(step(i++, "Simplify",
        `The greatest common divisor of ${Math.abs(unsimplified.n)} and ${unsimplified.d} is <strong>${g}</strong>, ` +
        `giving <strong>${Frac.format(simplified)}</strong>.`));
    }
  }

  els.workingDec.innerHTML = working.join("");
}

/* --- fraction -> decimal --- */

function runFractionToDecimal() {
  const parsed = Frac.parse(els.fracIn.value);

  if (parsed.error === "empty") {
    setError("Enter a fraction — try 3/8, or a mixed number like 1 1/2.");
    clearAll();
    return;
  }
  if (parsed.error) {
    setError(parsed.error);
    clearAll();
    return;
  }

  setError("");

  const simplified = Frac.simplify(parsed);
  const parts = Frac.toDecimalParts(simplified);
  const shown = Frac.formatDecimalParts(parts);

  els.heroValue.textContent = shown;
  els.heroLabel.textContent = parts.terminates ? "Terminating decimal" : "Recurring decimal";
  els.outDecimal.textContent = shown;
  els.outFracSimplified.textContent = Frac.format(simplified);

  const dec = Frac.toDecimal(simplified);
  els.outRoundedDec.textContent = parts.terminates && parts.nonRepeating.length <= 6
    ? "exact, as above"
    : dec.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");

  const factors = Frac.factorise(simplified.d);
  const only25 = factors.every((p) => p === 2 || p === 5);

  els.outKind.textContent = parts.terminates ? "Terminates" : "Recurs forever";
  els.cycleRow.style.display = parts.repeating ? "flex" : "none";
  els.outCycle.textContent = parts.repeating
    ? `${parts.repeating.length} digit${parts.repeating.length === 1 ? "" : "s"} — ${parts.repeating.length > 24 ? parts.repeating.slice(0, 24) + "…" : parts.repeating}`
    : "—";

  const working = [];
  let i = 1;

  working.push(step(i++, "Simplify first",
    Frac.format(parsed) === Frac.format(simplified)
      ? `${Frac.format(simplified)} is already in lowest terms, so the denominator to look at is <strong>${simplified.d}</strong>.`
      : `${Frac.format(parsed)} reduces to <strong>${Frac.format(simplified)}</strong>. Whether a decimal terminates depends on the <em>simplified</em> denominator, so this step matters.`));

  if (simplified.d === 1) {
    working.push(step(i++, "It is a whole number",
      `The denominator is 1, so there is no decimal part at all.`));
  } else {
    working.push(step(i++, "Break the denominator into primes",
      `<strong>${simplified.d} = ${factors.join(" × ")}</strong>.`));
    working.push(step(i++, only25 ? "Only 2s and 5s, so it terminates" : "Something other than 2s and 5s, so it recurs",
      only25
        ? `Ten is 2 × 5, so any denominator built only from 2s and 5s divides into a power of ten exactly — and a power of ten is just a shift of the decimal point. That is why this one stops.`
        : `The factor${factors.filter((p) => p !== 2 && p !== 5).length === 1 ? "" : "s"} <strong>${[...new Set(factors.filter((p) => p !== 2 && p !== 5))].join(", ")}</strong> ` +
          `${factors.filter((p) => p !== 2 && p !== 5).length === 1 ? "does" : "do"} not divide into any power of ten, so the long division never lands on a remainder of zero.`));

    if (!parts.terminates && !parts.truncated) {
      working.push(step(i++, "The cycle has to close",
        `Dividing by ${simplified.d} leaves only ${simplified.d - 1} possible non-zero remainders, so within ${simplified.d - 1} steps one must repeat — and from there the digits repeat too. ` +
        `Here the cycle is <strong>${parts.repeating.length} digit${parts.repeating.length === 1 ? "" : "s"}</strong> long, which is why the answer is written as ${shown}.`));
    }
    if (parts.truncated) {
      working.push(step(i++, "Cycle too long to display",
        `The repeating block for this denominator runs to more digits than is useful to show, so the decimal above is cut short. It does still recur.`));
    }
  }

  els.workingFrac.innerHTML = working.join("");
}

function calculate() {
  const dir = direction();
  const toDecimal = dir === "d2f";
  /* Inputs, result rows and working all follow the selected direction, so only
     one set is ever on the page at a time */
  els.panelDec.classList.toggle("active", toDecimal);
  els.panelFrac.classList.toggle("active", !toDecimal);
  els.gridDec.style.display = toDecimal ? "" : "none";
  els.gridFrac.style.display = toDecimal ? "none" : "";
  els.workingDec.style.display = toDecimal ? "" : "none";
  els.workingFrac.style.display = toDecimal ? "none" : "";
  if (toDecimal) runDecimalToFraction();
  else runFractionToDecimal();
}

els.decimal.addEventListener("input", calculate);
els.fracIn.addEventListener("input", calculate);
els.maxDen.addEventListener("change", calculate);

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

/* Clicking an example fills the box rather than making the reader retype it */
document.querySelectorAll("[data-example]").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.decimal.value = btn.dataset.example;
    if (direction() !== "d2f") document.querySelector('.tab[data-tab="d2f"]').click();
    else calculate();
  });
});

calculate();
