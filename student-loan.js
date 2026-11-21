/* UK student loan repayment calculator (/student-loan-calculator/).

   Month by month until the loan is cleared or written off: interest at the
   plan's rate (Plan 2's depends on income, sliding from RPI to the cap),
   then 9% (6% for a Postgraduate Loan) of income over the threshold each
   month, plus any extra you choose to pay. Income grows by the yearly rate
   given; thresholds and interest rates are held at today's levels, which
   is the usual simplifying assumption (both change over time).

   The plan figures (thresholds from the UK tax file, interest and write-off
   from data/student-loans/uk.json) are written into the page by
   tools/build-student-loan-pages.js. */
const StudentLoan = (function () {
  function rate(plan, income) {
    const i = plan.interest;
    if (i.flat !== undefined) return i.flat;
    const f = Math.min(1, Math.max(0, (income - i.lower) / (i.upper - i.lower)));
    return i.low + (i.high - i.low) * f;
  }

  /* o: { balance, salary, growth (%), firstDue (year of the April first due), start (year now), extra (a month) } */
  function project(plan, o) {
    const writeOff = o.firstDue + plan.writeOffYears;
    const months = Math.max(0, (writeOff - o.start) * 12);
    let bal = o.balance, paid = 0, interest = 0, m = 0, firstMonth = null;
    for (; m < months && bal > 0.005; m++) {
      const income = o.salary * Math.pow(1 + (o.growth || 0) / 100, Math.floor(m / 12));
      const r = rate(plan, income) / 100 / 12;
      const add = bal * r;
      bal += add; interest += add;
      const due = Math.max(0, income - plan.threshold) * plan.pct / 100 / 12;
      const pay = Math.min(bal, due + (o.extra || 0));
      if (firstMonth === null) firstMonth = due;
      bal -= pay; paid += pay;
    }
    const cleared = bal <= 0.005;
    return { cleared, months: m, years: m / 12, paid, interest, writtenOff: cleared ? 0 : bal, writeOffYear: writeOff, endYear: o.start + Math.floor(m / 12), firstMonth: firstMonth || 0 };
  }

  return { rate, project };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StudentLoan;
} else {
  (function () {
    var box = document.getElementById("sl-tool");
    if (!box) return;
    var CFG = JSON.parse(box.getAttribute("data-plans"));
    var START = Number(box.getAttribute("data-start"));
    var $ = function (id) { return document.getElementById(id); };
    function num(id) { var v = Number(String($(id).value).replace(/[\s,£]/g, "")); return isFinite(v) ? v : 0; }
    function money(v) { return "£" + Math.round(v).toLocaleString("en-GB"); }
    function money2(v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function span(months) { var y = Math.floor(months / 12), mo = months % 12; return y + " year" + (y === 1 ? "" : "s") + (mo ? ", " + mo + " month" + (mo === 1 ? "" : "s") : ""); }

    function calc() {
      var plan = CFG[$("sl-plan").value], err = $("sl-error");
      var o = { balance: num("sl-balance"), salary: num("sl-salary"), growth: num("sl-growth"), firstDue: num("sl-first"), start: START, extra: num("sl-extra") };
      if (!(o.balance > 0) || !(o.salary >= 0) || !(o.firstDue > 1990)) { err.textContent = "Enter what you owe, your salary and the year you were first due to repay."; err.style.display = "block"; return; }
      err.style.display = "none";
      var base = StudentLoan.project(plan, Object.assign({}, o, { extra: 0 }));
      var r = o.extra > 0 ? StudentLoan.project(plan, o) : base;
      $("sl-monthly").textContent = money2(base.firstMonth);
      $("sl-rate").textContent = (Math.round(StudentLoan.rate(plan, o.salary) * 100) / 100) + "%";
      $("sl-outcome").textContent = r.cleared ? "Paid off in " + span(r.months) + " (" + r.endYear + ")" : "Written off in April " + r.writeOffYear;
      $("sl-paid").textContent = money(r.paid);
      $("sl-interest").textContent = money(r.interest);
      $("sl-written").textContent = r.cleared ? "£0" : money(r.writtenOff);
      $("sl-writeoff").textContent = "April " + base.writeOffYear + " (" + plan.writeOffYears + " years after you were first due to repay)";
      var v = $("sl-verdict");
      if (o.extra > 0) {
        var d = base.paid - r.paid;
        v.textContent = d > 0
          ? "Paying " + money2(o.extra) + " a month extra saves you " + money(d) + " overall" + (r.cleared ? " and clears the loan " + span(base.cleared ? base.months - r.months : (base.writeOffYear - START) * 12 - r.months) + " sooner." : ".")
          : "Paying extra costs you " + money(-d) + " more overall: without it, the loan would be written off in April " + base.writeOffYear + " before you'd repaid it, so the extra mostly pays off debt that would have been cancelled.";
      } else {
        v.textContent = base.cleared
          ? "At this salary you clear the loan before it's written off, so paying extra would save interest — try an amount above."
          : "At this salary the loan is written off before it's repaid, so you'd pay " + money(base.paid) + " in total and paying extra would usually cost you more.";
      }
    }
    ["sl-plan", "sl-balance", "sl-salary", "sl-growth", "sl-first", "sl-extra"].forEach(function (id) { $(id).addEventListener("input", calc); });
    $("sl-plan").addEventListener("change", calc);
    calc();
  })();
}
