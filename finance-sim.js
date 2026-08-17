/* Shared helpers for the month-by-month money calculators. Both the debt
   comparison and the fee-drag page walk a balance forward a month at a time
   rather than using a closed-form formula, because the interesting behaviour
   — a debt clearing and freeing up its payment, a flat fee eating a small pot
   — only shows up if you actually step through it. */
const Fin = (function () {
  function symbol() {
    const el = document.getElementById("currency");
    return el ? el.value : "£";
  }

  /* Full precision is carried through every simulation; rounding happens here
     and nowhere else. The sign test is against the rounded value so a tiny
     negative residue prints as £0.00 rather than -£0.00. */
  function money(v) {
    if (!isFinite(v)) return "—";
    const rounded = Math.round(Math.abs(v) * 100) / 100;
    const sign = v < 0 && rounded !== 0 ? "−" : "";
    return sign + symbol() + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* Whole pounds, for table cells where the pence are noise */
  function money0(v) {
    if (!isFinite(v)) return "—";
    const rounded = Math.round(Math.abs(v));
    const sign = v < 0 && rounded !== 0 ? "−" : "";
    return sign + symbol() + rounded.toLocaleString("en-GB");
  }

  function pct(v, dp) {
    if (!isFinite(v)) return "—";
    return v.toFixed(dp === undefined ? 2 : dp) + "%";
  }

  /* Blank and "not a number" are different problems and get different
     messages, so this returns null for one and NaN for the other. */
  function num(el) {
    const raw = String(el.value).trim().replace(/[\s,]/g, "");
    if (raw === "") return null;
    const v = Number(raw);
    return isFinite(v) ? v : NaN;
  }

  /* Credit-card style: the quoted annual rate split into twelve equal slices.
     This is the convention every debt payoff calculator uses and what card
     statements approximate. Note it is NOT the same as the twelfth root used
     for an investment return — see monthlyGrowth below. */
  function monthlyInterestRate(apr) {
    return apr / 100 / 12;
  }

  /* Compounding a return: twelve of these must multiply back to the annual
     figure, so it is the twelfth root rather than a twelfth. */
  function monthlyGrowth(annualPct) {
    return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
  }

  function monthsToWords(m) {
    if (!isFinite(m) || m < 0) return "—";
    const y = Math.floor(m / 12);
    const r = m % 12;
    if (y === 0) return r + (r === 1 ? " month" : " months");
    if (r === 0) return y + (y === 1 ? " year" : " years");
    return y + (y === 1 ? " year " : " years ") + r + (r === 1 ? " month" : " months");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return {
    symbol: symbol,
    money: money,
    money0: money0,
    pct: pct,
    num: num,
    monthlyInterestRate: monthlyInterestRate,
    monthlyGrowth: monthlyGrowth,
    monthsToWords: monthsToWords,
    escapeHtml: escapeHtml
  };
})();
