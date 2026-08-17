const els = {
  a: document.getElementById("operand-a"),
  b: document.getElementById("operand-b"),
  error: document.getElementById("frac-error"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  outSimplified: document.getElementById("out-simplified"),
  mixedRow: document.getElementById("mixed-row"),
  outMixed: document.getElementById("out-mixed"),
  outDecimal: document.getElementById("out-decimal"),
  outRounded: document.getElementById("out-rounded"),
  outPercent: document.getElementById("out-percent"),
  steps: document.getElementById("steps"),
  sum: document.getElementById("plain-sum")
};

const OP_SYMBOL = { add: "+", sub: "−", mul: "×", div: "÷" };
const OP_WORD = { add: "Sum", sub: "Difference", mul: "Product", div: "Quotient" };

function operation() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "add";
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function clearResults() {
  els.heroValue.textContent = "—";
  ["outSimplified", "outMixed", "outDecimal", "outRounded", "outPercent"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.mixedRow.style.display = "none";
  els.steps.innerHTML = "";
  els.sum.textContent = "";
}

function step(n, title, body) {
  return `<div class="step"><span class="step-n">${n}</span><div class="step-body">` +
         `<div class="step-title">${title}</div>` +
         `<div class="step-detail">${body}</div></div></div>`;
}

/* The steps are the reason people come here rather than using their phone, so
   they show the actual intermediate fractions, not a description of them. */
function buildSteps(op, a, b, raw, simplified, rawA, rawB) {
  const out = [];
  const fa = Frac.format(a);
  const fb = Frac.format(b);
  let i = 1;

  /* A mixed number has to become an improper fraction before anything else can
     happen to it, and skipping that step is where readers lose the thread. */
  const mixedIn = [[rawA, a], [rawB, b]].filter(([txt]) => /\d\s+\d/.test(String(txt).trim()));
  if (mixedIn.length) {
    out.push(step(i++, mixedIn.length > 1 ? "Turn the mixed numbers into improper fractions" : "Turn the mixed number into an improper fraction",
      mixedIn.map(([txt, f]) => {
        const m = Frac.toMixed(f);
        return `<strong>${String(txt).trim()}</strong> = (${m.whole} × ${m.d} + ${m.n}) / ${m.d} = <strong>${Frac.format(f)}</strong>`;
      }).join("<br>")));
  }

  if (op === "add" || op === "sub") {
    const symbol = OP_SYMBOL[op];
    if (a.d === b.d) {
      out.push(step(i++, "The denominators already match",
        `Both fractions are in ${a.d}ths, so there is nothing to convert — just ${op === "add" ? "add" : "subtract"} the numerators.`));
    } else {
      const L = Frac.lcm(a.d, b.d);
      out.push(step(i++, "Find a common denominator",
        `The lowest common multiple of <strong>${a.d}</strong> and <strong>${b.d}</strong> is <strong>${L}</strong>.`));
      out.push(step(i++, "Convert both fractions",
        `${fa} × <sup>${L / a.d}</sup>&frasl;<sub>${L / a.d}</sub> = <strong>${Frac.format({ n: a.n * (L / a.d), d: L })}</strong><br>` +
        `${fb} × <sup>${L / b.d}</sup>&frasl;<sub>${L / b.d}</sub> = <strong>${Frac.format({ n: b.n * (L / b.d), d: L })}</strong>`));
    }
    const L = Frac.lcm(a.d, b.d);
    const an = a.n * (L / a.d);
    const bn = b.n * (L / b.d);
    out.push(step(i++, `${op === "add" ? "Add" : "Subtract"} the numerators`,
      `The denominator stays as it is: <strong>${an} ${symbol} ${bn} = ${raw.n}</strong>, over ${L}.<br>` +
      `That gives <strong>${Frac.format(raw)}</strong>.`));
  }

  if (op === "mul") {
    out.push(step(i++, "No common denominator needed",
      "Multiplying fractions works straight across — the denominators do not have to match."));
    out.push(step(i++, "Multiply the tops, then the bottoms",
      `<strong>${Math.abs(a.n)} × ${Math.abs(b.n)} = ${Math.abs(a.n * b.n)}</strong> and ` +
      `<strong>${a.d} × ${b.d} = ${a.d * b.d}</strong>, giving <strong>${Frac.format(raw)}</strong>.`));
  }

  if (op === "div") {
    out.push(step(i++, "Flip the second fraction",
      `Dividing by ${fb} is the same as multiplying by its reciprocal, <strong>${Frac.format({ n: b.d * (b.n < 0 ? -1 : 1), d: Math.abs(b.n) })}</strong>.`));
    out.push(step(i++, "Now multiply",
      `${fa} × ${Frac.format({ n: b.d * (b.n < 0 ? -1 : 1), d: Math.abs(b.n) })} = <strong>${Frac.format(raw)}</strong>.`));
  }

  const g = Frac.gcd(raw.n, raw.d);
  if (raw.n === 0) {
    out.push(step(i++, "The result is zero",
      "Zero over anything is zero, so there is nothing left to simplify."));
  } else if (g === 1) {
    out.push(step(i++, "Already in its simplest form",
      `The greatest common divisor of ${Math.abs(raw.n)} and ${raw.d} is <strong>1</strong>, so ${Frac.format(raw)} cannot be reduced any further.`));
  } else {
    out.push(step(i++, "Simplify by the greatest common divisor",
      `The greatest common divisor of ${Math.abs(raw.n)} and ${raw.d} is <strong>${g}</strong>. ` +
      `Dividing both by ${g} gives <strong>${Frac.format(simplified)}</strong>.`));
  }

  if (simplified.d !== 1 && Math.abs(simplified.n) > simplified.d) {
    out.push(step(i++, "Write it as a mixed number",
      `${simplified.d} goes into ${Math.abs(simplified.n)} ${Math.floor(Math.abs(simplified.n) / simplified.d)} times ` +
      `with ${Math.abs(simplified.n) % simplified.d} left over, so ${Frac.format(simplified)} = <strong>${Frac.formatMixed(simplified)}</strong>.`));
  }

  return out.join("");
}

function calculate() {
  const op = operation();
  const rawA = els.a.value;
  const rawB = els.b.value;

  const a = Frac.parse(rawA);
  const b = Frac.parse(rawB);

  if (a.error === "empty" || b.error === "empty") {
    setError("Enter both fractions — try 1 1/2 and 2/3.");
    clearResults();
    return;
  }
  if (a.error) {
    setError("First fraction: " + a.error);
    clearResults();
    return;
  }
  if (b.error) {
    setError("Second fraction: " + b.error);
    clearResults();
    return;
  }

  let raw;
  if (op === "add") raw = Frac.add(a, b);
  else if (op === "sub") raw = Frac.sub(a, b);
  else if (op === "mul") raw = Frac.mul(a, b);
  else raw = Frac.div(a, b);

  if (raw.error) {
    setError(raw.error);
    clearResults();
    return;
  }

  setError("");

  const simplified = Frac.simplify(raw);
  const isImproper = simplified.d !== 1 && Math.abs(simplified.n) > simplified.d;

  els.sum.innerHTML =
    `${Frac.format(a)} ${OP_SYMBOL[op]} ${Frac.format(b)} = <strong>${Frac.format(simplified)}</strong>`;

  els.heroValue.textContent = Frac.format(simplified);
  els.heroLabel.textContent = OP_WORD[op];
  els.outSimplified.textContent = Frac.format(simplified);

  els.mixedRow.style.display = isImproper ? "flex" : "none";
  els.outMixed.textContent = isImproper ? Frac.formatMixed(simplified) : "—";

  /* Exact decimal, with any recurring digits marked rather than rounded away */
  const parts = Frac.toDecimalParts(simplified);
  els.outDecimal.textContent = Frac.formatDecimalParts(parts);

  const dec = Frac.toDecimal(simplified);
  els.outRounded.textContent = parts.terminates && !parts.truncated && parts.nonRepeating.length <= 6
    ? "exact, as above"
    : dec.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  els.outPercent.textContent = (Math.round(dec * 1000000) / 10000).toLocaleString("en-GB") + "%";

  els.steps.innerHTML = buildSteps(op, a, b, raw, simplified, rawA, rawB);
}

[els.a, els.b].forEach((el) => el.addEventListener("input", calculate));

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
