/* Standard subtractive notation. The greedy pass over this table always
   produces the canonical form, because every "gap" (900, 400, 90, 40, 9, 4)
   has its own entry. */
const VALS = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
];

const SYMBOL = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/* Matches only canonical numerals from I to MMMCMXCIX. Anything a parser
   would happily add up but a Roman would never write (IIII, VV, IC, XIIX)
   fails here. */
const CANON = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

const MAX = 3999;

function toRoman(n) {
  let out = "";
  let left = n;
  for (const [value, sym] of VALS) {
    while (left >= value) {
      out += sym;
      left -= value;
    }
  }
  return out;
}

function romanValue(s) {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const here = SYMBOL[s[i]];
    const next = SYMBOL[s[i + 1]] || 0;
    total += here < next ? -here : here;
  }
  return total;
}

/* Splits a canonical numeral into the parts the greedy table produced, so the
   breakdown always lines up with the numeral shown. */
function decompose(n) {
  const parts = [];
  let left = n;
  for (const [value, sym] of VALS) {
    while (left >= value) {
      parts.push({ sym: sym, value: value });
      left -= value;
    }
  }
  return parts;
}

function partNote(part) {
  if (part.sym.length === 1) return "";
  const big = SYMBOL[part.sym[1]];
  const small = SYMBOL[part.sym[0]];
  return `${big.toLocaleString("en-GB")} − ${small.toLocaleString("en-GB")}`;
}

/* Returns "" when the numeral is valid, otherwise the most specific complaint
   we can make about it. Order matters: bad characters, then illegal repeats,
   then illegal subtractions, then a catch-all for ordering. */
function diagnose(s) {
  if (s === "") return "Enter some Roman numerals, or a number on the left.";

  const bad = [...new Set([...s].filter((ch) => !(ch in SYMBOL)))];
  if (bad.length) {
    const list = bad.map((ch) => `"${ch}"`).join(", ");
    return `Roman numerals only use I, V, X, L, C, D and M. Remove ${list}.`;
  }

  const repeatFix = { I: "4 is written IV, not IIII", X: "40 is written XL, not XXXX", C: "400 is written CD, not CCCC" };
  const pairUp = { V: "Two Vs make 10, which is written X", L: "Two Ls make 100, which is written C", D: "Two Ds make 1000, which is written M" };
  let run = 1;
  for (let i = 1; i <= s.length; i++) {
    if (s[i] === s[i - 1]) {
      run++;
    } else {
      const ch = s[i - 1];
      if (ch in pairUp && run > 1) {
        return `V, L and D are never repeated. ${pairUp[ch]}.`;
      }
      if (run > 3) {
        if (ch === "M") {
          return "M can only be repeated three times, which is why the standard system stops at 3999 (MMMCMXCIX).";
        }
        return `${ch} can only be repeated up to three times in a row — ${repeatFix[ch]}.`;
      }
      run = 1;
    }
  }

  const allowed = { I: ["V", "X"], X: ["L", "C"], C: ["D", "M"] };
  for (let i = 0; i < s.length - 1; i++) {
    const small = SYMBOL[s[i]];
    const big = SYMBOL[s[i + 1]];
    if (small >= big) continue;
    const ch = s[i];
    if (!(ch in allowed)) {
      const meant = big - small;
      const hint = meant >= 1 && meant <= MAX ? ` Did you mean ${toRoman(meant)} (${meant})?` : "";
      return `V, L and D are never subtracted, so "${ch + s[i + 1]}" is not valid.${hint}`;
    }
    if (!allowed[ch].includes(s[i + 1])) {
      const meant = big - small;
      const legal = allowed[ch].map((t) => `${ch}${t} (${SYMBOL[t] - SYMBOL[ch]})`).join(" and ");
      const hint = meant >= 1 && meant <= MAX ? ` ${meant.toLocaleString("en-GB")} is written ${toRoman(meant)}.` : "";
      return `${ch} can only be subtracted from ${allowed[ch].join(" and ")}, giving ${legal}. "${ch + s[i + 1]}" is not valid.${hint}`;
    }
  }

  if (!CANON.test(s)) {
    const meant = romanValue(s);
    const hint = meant >= 1 && meant <= MAX ? ` If you meant ${meant.toLocaleString("en-GB")}, that is ${toRoman(meant)}.` : "";
    return `The symbols are out of order — values must run largest to smallest, apart from the six subtractive pairs IV, IX, XL, XC, CD and CM.${hint}`;
  }

  return "";
}

const numInput = document.getElementById("arabic");
const romInput = document.getElementById("roman");
const errorEl = document.getElementById("rn-error");
const heroValue = document.getElementById("hero-value");
const heroLabel = document.getElementById("hero-label");
const outNumber = document.getElementById("out-number");
const outRoman = document.getElementById("out-roman");
const outSymbols = document.getElementById("out-symbols");
const breakdownLine = document.getElementById("breakdown-line");
const breakdownBody = document.getElementById("breakdown-body");

let syncing = false;

function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

function clearResults() {
  heroValue.textContent = "—";
  outNumber.textContent = "—";
  outRoman.textContent = "—";
  outSymbols.textContent = "—";
  breakdownLine.textContent = "";
  breakdownBody.innerHTML = "";
}

function render(n, direction) {
  const roman = toRoman(n);
  if (direction === "toRoman") {
    heroValue.textContent = roman;
    heroLabel.textContent = "In Roman numerals";
  } else {
    heroValue.textContent = n.toLocaleString("en-GB");
    heroLabel.textContent = "In numbers";
  }
  outNumber.textContent = n.toLocaleString("en-GB");
  outRoman.textContent = roman;
  outSymbols.textContent = String(roman.length);

  const parts = decompose(n);
  breakdownLine.textContent = `${roman} = ${parts.map((p) => p.sym).join(" + ")}`;
  breakdownBody.innerHTML = "";
  let running = 0;
  parts.forEach((p) => {
    running += p.value;
    const tr = document.createElement("tr");
    const note = partNote(p);
    tr.innerHTML =
      `<td>${p.sym}</td>` +
      `<td>${p.value.toLocaleString("en-GB")}${note ? ` <span class="rn-note">(${note})</span>` : ""}</td>` +
      `<td>${running.toLocaleString("en-GB")}</td>`;
    breakdownBody.appendChild(tr);
  });
}

function fromNumber() {
  const raw = numInput.value.trim();
  syncing = true;
  romInput.value = "";
  syncing = false;

  if (raw === "") {
    showError("Enter a number between 1 and 3999, or type Roman numerals on the right.");
    clearResults();
    return;
  }
  const n = Number(raw);
  if (!isFinite(n)) {
    showError("That isn't a number. Enter a whole number between 1 and 3999.");
    clearResults();
    return;
  }
  if (!Number.isInteger(n)) {
    showError("Roman numerals have no way of writing fractions or decimals — enter a whole number.");
    clearResults();
    return;
  }
  if (n === 0) {
    showError("There is no Roman numeral for zero — the system has no symbol for it at all. Enter 1 or more.");
    clearResults();
    return;
  }
  if (n < 0) {
    showError("Roman numerals have no negative numbers. Enter a value between 1 and 3999.");
    clearResults();
    return;
  }
  if (n > MAX) {
    showError("The standard system stops at 3,999 (MMMCMXCIX). Bigger numbers needed an overbar — a vinculum — meaning ×1,000, which this calculator doesn't use.");
    clearResults();
    return;
  }

  showError("");
  syncing = true;
  romInput.value = toRoman(n);
  syncing = false;
  render(n, "toRoman");
}

function fromNumerals() {
  /* Uppercase in place without losing the caret, then ignore any spacing */
  const caret = romInput.selectionStart;
  const upper = romInput.value.toUpperCase();
  if (upper !== romInput.value) {
    romInput.value = upper;
    if (caret !== null) romInput.setSelectionRange(caret, caret);
  }
  const s = upper.replace(/\s+/g, "");

  syncing = true;
  numInput.value = "";
  syncing = false;

  const problem = diagnose(s);
  if (problem) {
    showError(problem);
    clearResults();
    return;
  }

  const n = romanValue(s);
  showError("");
  syncing = true;
  numInput.value = String(n);
  syncing = false;
  render(n, "toNumber");
}

numInput.addEventListener("input", () => {
  if (!syncing) fromNumber();
});
romInput.addEventListener("input", () => {
  if (!syncing) fromNumerals();
});

const yearBtn = document.getElementById("year-btn");
const thisYear = new Date().getFullYear();
yearBtn.textContent = `Use the current year (${thisYear})`;
yearBtn.addEventListener("click", () => {
  numInput.value = String(thisYear);
  numInput.focus();
  fromNumber();
});

fromNumber();
