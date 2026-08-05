/* ---------- Shared vocabulary (short scale, British "and") ---------- */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen"];

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/* Short scale: each step is a thousand times the last, which is the British and
   American convention today. Index is the group position from the right. */
const SCALES = ["", "thousand", "million", "billion", "trillion", "quadrillion",
  "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion"];

const MAX_DIGITS = SCALES.length * 3;

const ORDINALS = {
  zero: "zeroth", one: "first", two: "second", three: "third", four: "fourth",
  five: "fifth", six: "sixth", seven: "seventh", eight: "eighth", nine: "ninth",
  ten: "tenth", eleven: "eleventh", twelve: "twelfth", thirteen: "thirteenth",
  fourteen: "fourteenth", fifteen: "fifteenth", sixteen: "sixteenth",
  seventeen: "seventeenth", eighteen: "eighteenth", nineteen: "nineteenth",
  twenty: "twentieth", thirty: "thirtieth", forty: "fortieth", fifty: "fiftieth",
  sixty: "sixtieth", seventy: "seventieth", eighty: "eightieth", ninety: "ninetieth",
  hundred: "hundredth"
};
SCALES.slice(1).forEach((s) => { ORDINALS[s] = s + "th"; });

const CURRENCIES = {
  GBP: { major: "pound", majorPlural: "pounds", minor: "penny", minorPlural: "pence" },
  USD: { major: "dollar", majorPlural: "dollars", minor: "cent", minorPlural: "cents" },
  EUR: { major: "euro", majorPlural: "euros", minor: "cent", minorPlural: "cents" }
};

/* ---------- Number to words ---------- */

function twoDigits(n) {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return TENS[t] + (u ? "-" + ONES[u] : "");
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = "";
  if (h) out += ONES[h] + " hundred";
  /* The British "and" inside a group: three hundred AND five */
  if (r) out += (h ? " and " : "") + twoDigits(r);
  return out;
}

/* Takes the integer part as a digit string so very large values keep every
   digit — nothing is ever put through a float. */
function integerToWords(digits) {
  const clean = digits.replace(/^0+(?=\d)/, "");
  if (clean === "0") return "zero";

  const groups = [];
  for (let end = clean.length; end > 0; end -= 3) {
    groups.push(parseInt(clean.slice(Math.max(0, end - 3), end), 10));
  }

  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    let text = threeDigits(g);
    if (i > 0) text += " " + SCALES[i];
    /* The other British "and": one thousand AND five, but not
       one thousand AND one hundred and five */
    if (i === 0 && g < 100 && parts.length) text = "and " + text;
    parts.push(text);
  }
  return parts.join(" ");
}

function decimalToWords(decimals) {
  if (!decimals) return "";
  return " point " + [...decimals].map((d) => ONES[Number(d)]).join(" ");
}

function toOrdinalWords(words) {
  const m = words.match(/([a-z]+)$/);
  if (!m || !(m[1] in ORDINALS)) return words;
  return words.slice(0, m.index) + ORDINALS[m[1]];
}

function ordinalSuffix(digits) {
  const last2 = Number(digits.slice(-2));
  const last1 = Number(digits.slice(-1));
  if (last2 >= 11 && last2 <= 13) return "th";
  return { 1: "st", 2: "nd", 3: "rd" }[last1] || "th";
}

function groupDigits(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalise(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/* Adds one to a digit string, carrying as far as it needs to. Used when
   rounding pence up tips 99p over into another pound. */
function incrementDigits(s) {
  const a = s.split("");
  for (let i = a.length - 1; i >= 0; i--) {
    if (a[i] === "9") {
      a[i] = "0";
    } else {
      a[i] = String(Number(a[i]) + 1);
      return a.join("");
    }
  }
  return "1" + a.join("");
}

function parseNumber(raw) {
  let s = raw.trim().replace(/[\s,_]/g, "");
  if (s === "") return { empty: true };

  let negative = false;
  if (s[0] === "+") s = s.slice(1);
  else if (s[0] === "-" || s[0] === "−") { negative = true; s = s.slice(1); }

  if (s === "" || s === "." || !/^\d*(\.\d*)?$/.test(s)) {
    return { error: "Enter digits only — for example 1234.5 or -76. Commas and spaces are ignored." };
  }

  const [intRaw, decRaw = ""] = s.split(".");
  const integer = (intRaw.replace(/^0+(?=\d)/, "") || "0");
  if (integer.length > MAX_DIGITS) {
    return { error: `That's more than ${MAX_DIGITS} digits. The short scale runs out of names past decillions, so this converter stops there.` };
  }
  if (decRaw.length > 20) {
    return { error: "That's a lot of decimal places — keep it to 20 or fewer." };
  }
  return { integer: integer, decimals: decRaw, negative: negative && !(integer === "0" && !/[1-9]/.test(decRaw)) };
}

/* ---------- Words to number ---------- */

const WORD_VALUES = {};
ONES.forEach((w, i) => { WORD_VALUES[w] = i; });
TENS.forEach((w, i) => { if (w) WORD_VALUES[w] = i * 10; });
WORD_VALUES.nought = 0;
WORD_VALUES.nil = 0;
WORD_VALUES.oh = 0;

const SCALE_POWERS = {};
SCALES.forEach((w, i) => { if (w) SCALE_POWERS[w] = i * 3; });

const SKIP_WORDS = new Set(["and", "a", "an"]);

function wordsToNumber(text) {
  const cleaned = text.toLowerCase().replace(/[,]/g, " ").replace(/[-–—]/g, " ").trim();
  if (cleaned === "") return { empty: true };

  let tokens = cleaned.split(/\s+/);
  let negative = false;
  while (tokens.length && ["minus", "negative"].includes(tokens[0])) {
    negative = !negative;
    tokens = tokens.slice(1);
  }

  const pointAt = tokens.indexOf("point");
  const wholeTokens = pointAt === -1 ? tokens : tokens.slice(0, pointAt);
  const decTokens = pointAt === -1 ? [] : tokens.slice(pointAt + 1);

  let decimals = "";
  for (const t of decTokens) {
    if (t in WORD_VALUES && WORD_VALUES[t] <= 9) {
      decimals += String(WORD_VALUES[t]);
    } else if (/^\d$/.test(t)) {
      decimals += t;
    } else {
      return { error: `After "point" the digits are read one at a time, so use words like "four seven" — "${t}" doesn't fit there.` };
    }
  }

  let total = 0n;
  let current = 0;
  let seen = false;
  let lastPower = Infinity;

  for (const t of wholeTokens) {
    if (SKIP_WORDS.has(t)) continue;
    if (t in WORD_VALUES) {
      current += WORD_VALUES[t];
      seen = true;
    } else if (t === "hundred") {
      if (current === 0) current = 1;
      if (current > 99) return { error: '"hundred" can only follow a number from one to ninety-nine.' };
      current *= 100;
      seen = true;
    } else if (t in SCALE_POWERS) {
      const power = SCALE_POWERS[t];
      if (power >= lastPower) {
        return { error: `Scales run from largest to smallest, so "${t}" can't come after a smaller one.` };
      }
      if (current === 0) current = 1;
      total += BigInt(current) * 10n ** BigInt(power);
      current = 0;
      lastPower = power;
      seen = true;
    } else {
      return { error: `"${t}" isn't a number word — check the spelling.` };
    }
  }

  if (!seen && decimals === "") {
    return { error: "That doesn't contain any number words yet." };
  }

  total += BigInt(current);
  return { integer: total.toString(), decimals: decimals, negative: negative && (total > 0n || /[1-9]/.test(decimals)) };
}

/* ---------- Wiring ---------- */

const numInput = document.getElementById("number-in");
const numError = document.getElementById("num-error");
const outWords = document.getElementById("out-words");
const outOrdinal = document.getElementById("out-ordinal");
const outOrdinalShort = document.getElementById("out-ordinal-short");
const ordinalNote = document.getElementById("ordinal-note");
const outCheque = document.getElementById("out-cheque");
const chequeNote = document.getElementById("cheque-note");
const currencySelect = document.getElementById("cheque-currency");

const wordsInput = document.getElementById("words-in");
const wordsError = document.getElementById("words-error");
const outDigits = document.getElementById("out-digits");
const outGrouped = document.getElementById("out-grouped");

function setError(el, message) {
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function chequeLine(parsed) {
  const c = CURRENCIES[currencySelect.value] || CURRENCIES.GBP;
  let pounds = parsed.integer;
  const dec = (parsed.decimals + "00").slice(0, 3);
  let pence = Math.round(Number(dec) / 10);
  const rounded = /[1-9]/.test(parsed.decimals.slice(2));
  if (pence >= 100) {
    pence -= 100;
    pounds = incrementDigits(pounds);
  }

  const minorWords = twoDigits(pence) + " " + (pence === 1 ? c.minor : c.minorPlural);
  let line;
  if (pounds === "0" && pence > 0) {
    /* An amount under a pound is written as pence alone, not "zero pounds and…" */
    line = capitalise(minorWords) + " only";
  } else {
    line = capitalise(integerToWords(pounds)) + " " + (pounds === "1" ? c.major : c.majorPlural);
    if (pence > 0) line += " and " + minorWords;
    line += " only";
  }

  const notes = [];
  if (parsed.negative) notes.push("Cheques can't be written for a negative amount, so the minus sign is ignored here.");
  if (rounded) notes.push("Rounded to the nearest " + c.minor + ".");
  if (pence === 0) notes.push('With no ' + c.minorPlural + ', many people write "' + line.replace(" only", "") + " and no " + c.minorPlural + ' only" instead — both are accepted.');
  return { line: line, note: notes.join(" ") };
}

function convertNumber() {
  const parsed = parseNumber(numInput.value);

  if (parsed.empty || parsed.error) {
    setError(numError, parsed.error || "Enter a number to write it out in words.");
    outWords.textContent = "—";
    outOrdinal.textContent = "—";
    outOrdinalShort.textContent = "—";
    ordinalNote.textContent = "";
    outCheque.textContent = "—";
    chequeNote.textContent = "";
    return;
  }
  setError(numError, "");

  const words = integerToWords(parsed.integer) + decimalToWords(parsed.decimals);
  outWords.textContent = (parsed.negative ? "minus " : "") + words;

  if (parsed.decimals) {
    outOrdinal.textContent = "—";
    outOrdinalShort.textContent = "—";
    ordinalNote.textContent = "Ordinals only apply to whole numbers — remove the decimal part.";
  } else {
    outOrdinal.textContent = (parsed.negative ? "minus " : "") + toOrdinalWords(integerToWords(parsed.integer));
    outOrdinalShort.textContent = (parsed.negative ? "−" : "") + groupDigits(parsed.integer) + ordinalSuffix(parsed.integer);
    ordinalNote.textContent = "";
  }

  const cheque = chequeLine(parsed);
  outCheque.textContent = cheque.line;
  chequeNote.textContent = cheque.note;
}

function convertWords() {
  const parsed = wordsToNumber(wordsInput.value);
  if (parsed.empty || parsed.error) {
    setError(wordsError, parsed.error || 'Type a number in words — for example "two thousand and twenty-six".');
    outDigits.textContent = "—";
    outGrouped.textContent = "—";
    return;
  }
  setError(wordsError, "");
  const sign = parsed.negative ? "-" : "";
  const plain = sign + parsed.integer + (parsed.decimals ? "." + parsed.decimals : "");
  outDigits.textContent = plain;
  outGrouped.textContent = (parsed.negative ? "−" : "") + groupDigits(parsed.integer) + (parsed.decimals ? "." + parsed.decimals : "");
}

numInput.addEventListener("input", convertNumber);
currencySelect.addEventListener("change", convertNumber);
wordsInput.addEventListener("input", convertWords);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
  });
});

convertNumber();
convertWords();
