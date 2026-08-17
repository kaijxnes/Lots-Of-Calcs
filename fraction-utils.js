/* Shared fraction maths for /fractions/ and /decimal-to-fraction/.
   Everything here works on exact integer numerator/denominator pairs — no
   floats anywhere in the arithmetic, because 0.1 + 0.2 is the whole reason
   these pages exist. A fraction is { n, d } with the sign carried on n and d
   always positive. */
const Frac = (function () {
  /* JavaScript integers are exact only up to 2^53. Rather than reach for
     BigInt, every result is checked and an out-of-range one is reported
     honestly instead of silently going wrong. */
  const SAFE = Number.MAX_SAFE_INTEGER;

  function safe(v) {
    return Number.isSafeInteger(v);
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a / gcd(a, b) * b);
  }

  function make(n, d) {
    if (d === 0) return null;
    /* Keep the sign on the numerator so comparisons and arithmetic behave */
    if (d < 0) {
      n = -n;
      d = -d;
    }
    return { n: n, d: d };
  }

  function simplify(f) {
    if (!f) return null;
    if (f.n === 0) return { n: 0, d: 1 };
    const g = gcd(f.n, f.d);
    return { n: f.n / g, d: f.d / g };
  }

  function isWhole(f) {
    return f.d === 1;
  }

  function toDecimal(f) {
    return f.n / f.d;
  }

  /* Splits an improper fraction into whole part and remainder. The sign
     belongs to the value as a whole, not to either piece — -3/2 is
     "minus one and a half", not "minus one, plus a half". */
  function toMixed(f) {
    const neg = f.n < 0;
    const n = Math.abs(f.n);
    return {
      neg: neg,
      whole: Math.floor(n / f.d),
      n: n % f.d,
      d: f.d
    };
  }

  function format(f) {
    if (!f) return "—";
    if (f.n === 0) return "0";
    /* The minus sits in front of the whole value, not on the numerator */
    const sign = f.n < 0 ? "−" : "";
    if (f.d === 1) return sign + Math.abs(f.n);
    return sign + Math.abs(f.n) + "/" + f.d;
  }

  function formatMixed(f) {
    if (!f) return "—";
    const m = toMixed(f);
    const sign = m.neg ? "−" : "";
    if (m.n === 0) return sign + m.whole;
    if (m.whole === 0) return sign + m.n + "/" + m.d;
    return sign + m.whole + " " + m.n + "/" + m.d;
  }

  /* Accepts a whole number, a proper or improper fraction, a mixed number or
     a decimal, with an optional leading minus:
       3      -3      2/3     -5/8     1 1/2     -1 1/2     0.75
     Returns { n, d } or { error }. */
  function parse(raw) {
    const text = String(raw == null ? "" : raw)
      .replace(/−/g, "-")   /* a pasted proper minus */
      .replace(/\s+/g, " ")
      .trim();

    if (text === "") return { error: "empty" };
    if (!/^-?\s*[\d.\s/]+$/.test(text)) {
      return { error: "Use a whole number, a fraction like 2/3, or a mixed number like 1 1/2." };
    }

    const neg = text.startsWith("-");
    const body = neg ? text.slice(1).trim() : text;
    if (body === "") return { error: "Enter a number after the minus sign." };

    const parts = body.split(" ").filter(Boolean);
    if (parts.length > 2) {
      return { error: "That looks like more than one number — try 1 1/2 for one and a half." };
    }

    /* Mixed number: a whole part followed by a fraction */
    if (parts.length === 2) {
      if (!/^\d+$/.test(parts[0])) return { error: "The whole part of a mixed number has to be a whole number." };
      const frac = parseSingle(parts[1]);
      if (frac.error) return frac;
      if (frac.d === 1) return { error: "A mixed number needs a fraction after the whole part, like 1 1/2." };
      if (frac.n >= frac.d) return { error: "The fraction part of a mixed number has to be less than 1 — " + parts[1] + " is not." };
      const whole = Number(parts[0]);
      const n = whole * frac.d + frac.n;
      if (!safe(n)) return { error: "That number is too large to work with exactly." };
      return applySign(make(n, frac.d), neg);
    }

    const single = parseSingle(parts[0]);
    if (single.error) return single;
    return applySign(single, neg);
  }

  function applySign(f, neg) {
    if (!f || f.error) return f;
    return neg ? { n: -f.n, d: f.d } : f;
  }

  /* One token: "3", "2/3" or "0.75" — no sign, no whole part */
  function parseSingle(token) {
    if (token.includes("/")) {
      const bits = token.split("/");
      if (bits.length !== 2) return { error: "A fraction needs exactly one slash, like 2/3." };
      if (!/^\d+$/.test(bits[0]) || !/^\d+$/.test(bits[1])) {
        return { error: "A fraction needs whole numbers either side of the slash, like 2/3." };
      }
      const n = Number(bits[0]);
      const d = Number(bits[1]);
      if (d === 0) return { error: "A fraction can't have zero on the bottom — nothing is divided into zero parts." };
      if (!safe(n) || !safe(d)) return { error: "That number is too large to work with exactly." };
      return make(n, d);
    }

    if (token.includes(".")) {
      const bits = token.split(".");
      if (bits.length !== 2 || !/^\d*$/.test(bits[0]) || !/^\d+$/.test(bits[1])) {
        return { error: "That decimal isn't valid." };
      }
      if (bits[1].length > 15) return { error: "That many decimal places can't be held exactly — try 15 or fewer." };
      const d = Math.pow(10, bits[1].length);
      const n = Number((bits[0] || "0") + bits[1]);
      if (!safe(n)) return { error: "That number is too large to work with exactly." };
      return make(n, d);
    }

    if (!/^\d+$/.test(token)) return { error: "That isn't a number." };
    const n = Number(token);
    if (!safe(n)) return { error: "That number is too large to work with exactly." };
    return make(n, 1);
  }

  /* --- arithmetic, all guarded against silently overflowing --- */

  const TOO_BIG = { error: "Those numbers are too large to stay exact — try smaller ones." };

  function add(a, b) {
    const d = lcm(a.d, b.d);
    const n = a.n * (d / a.d) + b.n * (d / b.d);
    if (!safe(n) || !safe(d)) return TOO_BIG;
    return make(n, d);
  }

  function sub(a, b) {
    return add(a, { n: -b.n, d: b.d });
  }

  function mul(a, b) {
    const n = a.n * b.n;
    const d = a.d * b.d;
    if (!safe(n) || !safe(d)) return TOO_BIG;
    return make(n, d);
  }

  function div(a, b) {
    if (b.n === 0) return { error: "You can't divide by zero." };
    const n = a.n * b.d;
    const d = a.d * b.n;
    if (!safe(n) || !safe(d)) return TOO_BIG;
    return make(n, d);
  }

  /* --- decimal expansion ---
     Long division, remembering which remainders we have already seen. The
     moment a remainder repeats, the digits since we last saw it are the
     recurring cycle — that is what makes this exact rather than a guess. */
  function toDecimalParts(f, maxDigits) {
    maxDigits = maxDigits || 3000;
    const neg = f.n < 0;
    let n = Math.abs(f.n);
    const d = f.d;

    const intPart = Math.floor(n / d);
    let rem = n % d;

    const digits = [];
    const seen = new Map();
    let cycleStart = -1;

    while (rem !== 0 && digits.length < maxDigits) {
      if (seen.has(rem)) {
        cycleStart = seen.get(rem);
        break;
      }
      seen.set(rem, digits.length);
      rem *= 10;
      digits.push(Math.floor(rem / d));
      rem %= d;
    }

    if (rem !== 0 && cycleStart === -1) {
      /* Ran out of room before the cycle closed — say so rather than lie */
      return {
        neg: neg,
        intPart: intPart,
        nonRepeating: digits.join(""),
        repeating: "",
        terminates: false,
        truncated: true
      };
    }

    return {
      neg: neg,
      intPart: intPart,
      nonRepeating: digits.slice(0, cycleStart === -1 ? digits.length : cycleStart).join(""),
      repeating: cycleStart === -1 ? "" : digits.slice(cycleStart).join(""),
      terminates: cycleStart === -1,
      truncated: false
    };
  }

  /* Renders 1/6 as 0.1(6) — the bracket marks the digits that recur */
  function formatDecimalParts(p) {
    const sign = p.neg && (p.intPart !== 0 || p.nonRepeating || p.repeating) ? "−" : "";
    let s = sign + p.intPart;
    if (p.nonRepeating || p.repeating) s += ".";
    s += p.nonRepeating;
    if (p.repeating) s += "(" + p.repeating + ")";
    if (p.truncated) s += "…";
    return s;
  }

  /* A fraction terminates only if, once simplified, its denominator is built
     from 2s and 5s alone — the prime factors of ten. */
  function factorise(d) {
    const out = [];
    let rest = d;
    for (let p = 2; p * p <= rest; p++) {
      while (rest % p === 0) {
        out.push(p);
        rest /= p;
      }
    }
    if (rest > 1) out.push(rest);
    return out;
  }

  /* --- decimal string -> exact fraction ---
     Accepts "0.75", "0.(3)", "0.1(6)", "-2.5", "5". The bracket holds the
     recurring digits. The identity is the schoolbook one: subtract the
     non-repeating prefix from the whole digit string, over as many nines as
     there are recurring digits followed by as many zeros as there are
     non-recurring decimal places. */
  function parseDecimalString(raw) {
    let text = String(raw == null ? "" : raw).replace(/−/g, "-").replace(/[\s,]/g, "").trim();
    if (text === "") return { error: "empty" };

    const neg = text.startsWith("-");
    if (neg) text = text.slice(1);
    if (text === "") return { error: "Enter a number after the minus sign." };

    const m = text.match(/^(\d*)(?:\.(\d*)(?:\((\d+)\))?)?$/);
    if (!m) {
      return { error: "Use a decimal like 0.75, or mark the recurring digits in brackets like 0.1(6)." };
    }
    if (text.includes("(") && !m[3]) {
      return { error: "The brackets need at least one digit inside them, like 0.1(6)." };
    }

    const intStr = m[1] || "0";
    const nonRep = m[2] || "";
    const rep = m[3] || "";

    if (intStr === "" && nonRep === "" && rep === "") return { error: "Enter a number." };
    if (intStr.length + nonRep.length + rep.length > 15) {
      return { error: "That many digits can't be held exactly — try 15 or fewer in total." };
    }

    let f;
    if (rep === "") {
      const d = Math.pow(10, nonRep.length);
      f = make(Number(intStr + nonRep), d);
    } else {
      /* all digits minus the non-recurring ones, over nines-then-zeros */
      const whole = Number(intStr + nonRep + rep);
      const prefix = Number(intStr + nonRep);
      const d = Number("9".repeat(rep.length) + "0".repeat(nonRep.length));
      if (!safe(whole) || !safe(d)) return { error: "That many digits can't be held exactly — try fewer." };
      f = make(whole - prefix, d);
    }

    if (!f) return { error: "That number isn't valid." };
    f = simplify(f);
    return neg ? { n: -f.n, d: f.d } : f;
  }

  /* Best rational approximation with a denominator no bigger than maxDen,
     via the continued fraction expansion. Converges far faster than trying
     every denominator, and is provably the closest at each step. */
  function approximate(value, maxDen) {
    if (!isFinite(value)) return null;
    const neg = value < 0;
    let x = Math.abs(value);

    let prevN = 1, prevD = 0;
    let curN = Math.floor(x), curD = 1;
    let frac = x - curN;

    while (frac > 1e-12) {
      x = 1 / frac;
      const a = Math.floor(x);
      const nextN = a * curN + prevN;
      const nextD = a * curD + prevD;
      if (nextD > maxDen || !safe(nextN) || !safe(nextD)) break;
      prevN = curN; prevD = curD;
      curN = nextN; curD = nextD;
      frac = x - a;
    }

    if (curD === 0) return null;
    const f = simplify(make(curN, curD));
    return neg ? { n: -f.n, d: f.d } : f;
  }

  return {
    gcd: gcd,
    lcm: lcm,
    make: make,
    simplify: simplify,
    isWhole: isWhole,
    toDecimal: toDecimal,
    toMixed: toMixed,
    format: format,
    formatMixed: formatMixed,
    parse: parse,
    add: add,
    sub: sub,
    mul: mul,
    div: div,
    toDecimalParts: toDecimalParts,
    formatDecimalParts: formatDecimalParts,
    factorise: factorise,
    parseDecimalString: parseDecimalString,
    approximate: approximate
  };
})();
