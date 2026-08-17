/* Shared odds handling. Everything is converted to decimal odds internally,
   because decimal is the only format you can multiply — which is what every
   multiple bet needs. */
const Odds = (function () {
  /* Accepts fractional ("5/2", "11/4"), decimal ("3.50"), American ("+150",
     "-200") and the word "evens". Returns decimal odds, or NaN. */
  function parse(raw) {
    let text = String(raw == null ? "" : raw).trim().toLowerCase()
      .replace(/−/g, "-")
      .replace(/\s+/g, "");
    if (text === "") return NaN;

    if (text === "evens" || text === "evs" || text === "even" || text === "1/1") return 2;
    if (text === "sp") return NaN;

    if (text.includes("/")) {
      const bits = text.split("/");
      if (bits.length !== 2) return NaN;
      const n = Number(bits[0]);
      const d = Number(bits[1]);
      if (!isFinite(n) || !isFinite(d) || d <= 0 || n < 0) return NaN;
      return n / d + 1;
    }

    /* An explicit sign means American — a bare number is decimal, so "150" is
       decimal odds of 150 and "+150" is 5/2. The sign is the only signal. */
    if (/^[+-]/.test(text)) {
      const v = Number(text);
      if (!isFinite(v) || v === 0) return NaN;
      return americanToDecimal(v);
    }

    const dec = Number(text);
    return isFinite(dec) ? dec : NaN;
  }

  function americanToDecimal(american) {
    if (american > 0) return american / 100 + 1;
    return 100 / Math.abs(american) + 1;
  }

  function decimalToAmerican(decimal) {
    if (decimal >= 2) return (decimal - 1) * 100;
    return -100 / (decimal - 1);
  }

  /* Closest standard betting fraction, by trying every denominator up to 100.
     Betting fractions are conventional rather than mathematically neat — 11/8
     and 6/4 are used where 1.375 and 1.5 would reduce — so this looks for the
     closest match rather than the simplest one. */
  function toFraction(value) {
    if (!isFinite(value) || value <= 0) return { num: 0, den: 1 };

    const maxDen = 100;
    let bestNum = 1;
    let bestDen = 1;
    let bestErr = Infinity;

    for (let den = 1; den <= maxDen; den++) {
      const num = Math.round(value * den);
      if (num < 1) continue;
      const err = Math.abs(value - num / den);
      if (err < bestErr - 1e-12) {
        bestErr = err;
        bestNum = num;
        bestDen = den;
        if (err < 1e-9) break;
      }
    }

    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(bestNum, bestDen);
    return { num: bestNum / g, den: bestDen / g };
  }

  function formatFraction(decimal) {
    const f = toFraction(decimal - 1);
    return f.num + "/" + f.den;
  }

  /* Place odds are a stated fraction of the win odds, applied to the profit
     part only — a 1/5 place on 10.0 pays 1 + 9/5, not 2.0. */
  function placeOdds(decimal, fraction) {
    if (!isFinite(decimal) || decimal <= 1) return 1;
    return 1 + (decimal - 1) * fraction;
  }

  return {
    parse: parse,
    americanToDecimal: americanToDecimal,
    decimalToAmerican: decimalToAmerican,
    toFraction: toFraction,
    formatFraction: formatFraction,
    placeOdds: placeOdds
  };
})();
