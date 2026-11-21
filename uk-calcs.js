/* UK tax maths shared by the dividend, salary vs dividends, contractor,
   capital gains, inheritance tax, statutory pay, redundancy, holiday,
   pension and buy-to-let calculators (tools/build-uk-calcs.js).

   The figures come in as cfg, written into each page from the UK tax file
   (income tax and National Insurance) and data/uk/rates-2026-27.json (the
   rest), so nothing here needs changing when rates change. England, Wales
   and Northern Ireland income tax bands; Scotland's differ for wages but
   not for dividends or capital gains. */
const UKCalcs = (function () {
  function bandTax(from, amount, edges, rates) {
    /* tax on `amount` of taxable income sitting from position `from`, with
       band edges [0, basic, additional] and a rate for each band */
    let tax = 0, lo = from, rest = amount;
    for (let i = 0; i < rates.length && rest > 0; i++) {
      const top = i + 1 < edges.length ? edges[i + 1] : Infinity;
      if (lo >= top) continue;
      const take = Math.min(rest, top - Math.max(lo, edges[i]));
      if (take > 0) { tax += take * rates[i] / 100; rest -= take; lo += take; }
    }
    return tax;
  }
  function allowance(cfg, total) { return Math.max(0, cfg.pa - Math.max(0, total - cfg.paTaperFrom) * cfg.paTaper); }
  const edges = (cfg) => [0, cfg.basicBand, cfg.addlFrom];

  /* income tax on wages/other income plus dividends (dividends on top) */
  function incomeTax(cfg, other, div) {
    other = Math.max(0, other || 0); div = Math.max(0, div || 0);
    const pa = allowance(cfg, other + div);
    const nsTaxable = Math.max(0, other - pa), leftPA = Math.max(0, pa - other), divTaxable = Math.max(0, div - leftPA);
    const nsTax = bandTax(0, nsTaxable, edges(cfg), cfg.rates);
    const free = Math.min(divTaxable, cfg.div.allowance);
    const divTax = bandTax(nsTaxable + free, divTaxable - free, edges(cfg), [cfg.div.basic, cfg.div.higher, cfg.div.additional]);
    return { pa, nsTaxable, divTaxable, nsTax, divTax, total: nsTax + divTax };
  }
  function employeeNI(cfg, pay) {
    return Math.max(0, Math.min(pay, cfg.niUEL) - cfg.niPT) * cfg.niMain / 100 + Math.max(0, pay - cfg.niUEL) * cfg.niUpper / 100;
  }
  function employerNI(cfg, pay, ea) {
    const ni = Math.max(0, pay - cfg.er.threshold) * cfg.er.rate / 100;
    return ea ? Math.max(0, ni - cfg.er.employmentAllowance) : ni;
  }
  function corpTax(cfg, profit) {
    const c = cfg.ct;
    if (profit <= 0) return 0;
    if (profit <= c.lower) return profit * c.small / 100;
    if (profit >= c.upper) return profit * c.main / 100;
    return profit * c.main / 100 - (c.upper - profit) * c.fraction;
  }

  /* a director taking `salary` from company profit (before the salary), the
     rest as dividends after corporation tax */
  function director(cfg, profit, salary, ea, other) {
    salary = Math.max(0, Math.min(salary, profit));
    const erNI = Math.min(employerNI(cfg, salary, ea), Math.max(0, profit - salary));
    const pre = profit - salary - erNI, ct = corpTax(cfg, pre), div = Math.max(0, pre - ct);
    const it = incomeTax(cfg, salary + (other || 0), div), otherTax = other ? incomeTax(cfg, other, 0).total : 0;
    const eeNI = employeeNI(cfg, salary);
    const tax = it.total - otherTax;
    return { salary, erNI, ct, div, incomeTax: it.nsTax - otherTax, divTax: it.divTax, eeNI, net: salary + div - tax - eeNI, totalTax: erNI + ct + tax + eeNI };
  }

  function cgt(cfg, gain, taxableIncome, badr) {
    const g = cfg.cgt, chargeable = Math.max(0, gain - g.allowance);
    if (badr) return { chargeable, tax: chargeable * g.badr / 100, inBasic: 0 };
    const room = Math.max(0, cfg.basicBand - Math.max(0, taxableIncome));
    const inBasic = Math.min(room, chargeable);
    return { chargeable, inBasic, tax: inBasic * g.basic / 100 + (chargeable - inBasic) * g.higher / 100 };
  }

  /* o: estate, home (to direct descendants), transferNRB / transferRNRB (0–100%), charity */
  function iht(cfg, o) {
    const t = cfg.iht, nrb = t.nilRateBand * (1 + (o.transferNRB || 0) / 100);
    let rnrbMax = t.residenceNilRateBand * (1 + (o.transferRNRB || 0) / 100);
    rnrbMax = Math.max(0, rnrbMax - Math.max(0, o.estate - t.taperThreshold) / 2);
    const rnrb = Math.min(rnrbMax, o.home || 0);
    const charity = Math.max(0, o.charity || 0);
    const baseline = Math.max(0, o.estate - nrb - rnrb);
    const rate = charity > 0 && charity >= 0.1 * baseline ? t.charityRate : t.rate;
    const taxable = Math.max(0, o.estate - charity - nrb - rnrb);
    return { nrb, rnrb, taxable, rate, tax: taxable * rate / 100 };
  }

  function smp(cfg, awe) {
    const s = cfg.sp, first = awe * 0.9, rest = Math.min(s.smpWeekly, awe * 0.9);
    return { eligible: awe >= s.lowerEarningsLimit, first, rest, total: first * 6 + rest * (s.smpWeeks - 6) };
  }

  /* age now, full years of service, weekly pay before tax */
  function redundancy(cfg, age, years, weekly) {
    const r = cfg.red, wk = Math.min(weekly, r.weekCap), n = Math.min(Math.floor(years), r.maxYears);
    let weeks = 0;
    for (let i = 1; i <= n; i++) { const a = age - i; weeks += a >= 41 ? 1.5 : a >= 22 ? 1 : 0.5; }
    const eligible = Math.floor(years) >= r.minYears;
    return { eligible, weeks, weekPay: wk, total: eligible ? Math.min(r.maxTotal, weeks * wk) : 0 };
  }

  /* days a week → statutory days, capped; fraction of the leave year worked */
  function holiday(cfg, days, fraction) {
    const h = cfg.hol, full = Math.min(h.weeks * days, h.capDays);
    return { full, due: full * (fraction === undefined ? 1 : fraction) };
  }

  /* pension pot: draw `yearly` from the start of each year, growth after */
  function drawdown(pot, yearly, growth) {
    let bal = pot, y = 0;
    if (yearly <= 0) return { years: Infinity };
    while (bal > 0 && y < 100) { bal -= yearly; if (bal <= 0) { y += 1 + bal / yearly; break; } bal *= 1 + growth / 100; y++; }
    return { years: y };
  }

  return { incomeTax, employeeNI, employerNI, corpTax, director, cgt, iht, smp, redundancy, holiday, drawdown, allowance };
})();
if (typeof module !== "undefined" && module.exports) module.exports = UKCalcs;
