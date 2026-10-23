/* Take-home pay from a gross salary, for the /salary/ landing pages.

   The headline figures on each page are baked into the HTML at build time by
   tools/build-salary-pages.py, which implements this same arithmetic in Python.
   Two implementations of one calculation is a drift risk, so the test suite
   checks this one reproduces the baked numbers on every page. Change the maths
   here and the generator has to change with it. */
const Salary = (function () {
  /* Above £100,000 the personal allowance is withdrawn by £1 for every £2
     earned, which is what creates the 60% effective band between £100,000 and
     £125,140 — the pound of allowance lost is itself taxed. */
  function personalAllowance(gross, cfg) {
    if (gross <= cfg.allowanceTaperFrom) return cfg.personalAllowance;
    const lost = (gross - cfg.allowanceTaperFrom) * cfg.allowanceTaperPerPound;
    return Math.max(0, cfg.personalAllowance - lost);
  }

  /* Walks a band list, charging each slice at its own rate. Used for both
     income tax (on taxable income) and National Insurance (on gross pay) —
     they are the same shape, just applied to different bases. */
  function applyBands(amount, bands) {
    const rows = [];
    let lower = 0;
    let total = 0;

    for (const band of bands) {
      const upper = band.upTo === null || band.upTo === undefined ? Infinity : band.upTo;
      const inBand = Math.max(0, Math.min(amount, upper) - lower);
      const charged = inBand * (band.rate / 100);
      if (inBand > 0) {
        rows.push({
          label: band.label,
          rate: band.rate,
          from: lower,
          to: upper,
          amount: inBand,
          charged: charged
        });
      }
      total += charged;
      lower = upper;
      if (amount <= upper) break;
    }

    return { total: total, rows: rows };
  }

  function compute(gross, cfg) {
    const allowance = personalAllowance(gross, cfg);
    const taxable = Math.max(0, gross - allowance);

    const tax = applyBands(taxable, cfg.incomeTaxBands);
    const ni = applyBands(gross, cfg.nationalInsurance.bands);

    const totalDeductions = tax.total + ni.total;
    const net = gross - totalDeductions;

    return {
      gross: gross,
      allowance: allowance,
      taxable: taxable,
      incomeTax: tax.total,
      incomeTaxRows: tax.rows,
      nationalInsurance: ni.total,
      nationalInsuranceRows: ni.rows,
      totalDeductions: totalDeductions,
      net: net,
      /* A "working day" is taken as 5 days a week across 52 weeks. It is a
         convention, not a payroll figure, and the page says so. */
      perMonth: net / 12,
      perWeek: net / 52,
      perDay: net / 260,
      /* What share of the gross never reaches you */
      deductionRate: gross > 0 ? (totalDeductions / gross) * 100 : 0,
      /* The rate charged on the next pound earned — the number that actually
         matters when someone is weighing a pay rise or overtime */
      marginalRate: marginalRate(gross, cfg)
    };
  }

  function marginalRate(gross, cfg) {
    if (gross <= 0) return 0;
    const step = 1;
    const a = compute_internal(gross, cfg);
    const b = compute_internal(gross + step, cfg);
    return ((b.deductions - a.deductions) / step) * 100;
  }

  /* Deductions only, without the derived fields — avoids compute() and
     marginalRate() calling each other forever */
  function compute_internal(gross, cfg) {
    const allowance = personalAllowance(gross, cfg);
    const taxable = Math.max(0, gross - allowance);
    const tax = applyBands(taxable, cfg.incomeTaxBands).total;
    const ni = applyBands(gross, cfg.nationalInsurance.bands).total;
    return { deductions: tax + ni };
  }

  return {
    compute: compute,
    personalAllowance: personalAllowance,
    applyBands: applyBands
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Salary;
