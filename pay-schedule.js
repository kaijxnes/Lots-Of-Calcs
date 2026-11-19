/* Biweekly pay schedule: every payday in a year from any one known payday,
   counting forward and back in steps of 14 days.

   Most years have 26 biweekly paydays; a year has 27 when its first payday
   falls in the first one or two days of January (a 365-day year is 52 weeks
   and a day, a leap year 52 weeks and two). Months with three paydays are the
   ones people budget around: on a two-paycheck monthly budget, those are the
   "extra" checks. */
const PaySchedule = (function () {
  const DAY = 864e5;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const utc = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  const iso = (t) => new Date(t).toISOString().slice(0, 10);

  /* every payday in `year`, given any payday (in any year) */
  function paydays(anyPayday, year, step) {
    const s = (step || 14) * DAY, a = utc(anyPayday), start = Date.UTC(year, 0, 1), end = Date.UTC(year, 11, 31);
    let t = a + Math.ceil((start - a) / s) * s;
    const out = [];
    for (; t <= end; t += s) out.push(iso(t));
    return out;
  }
  function byMonth(days) {
    const m = Array.from({ length: 12 }, () => []);
    days.forEach((d) => m[+d.slice(5, 7) - 1].push(d));
    return m;
  }
  function threeMonths(days) { return byMonth(days).map((x, i) => (x.length >= 3 ? i : -1)).filter((i) => i >= 0); }
  /* the two biweekly cycles on a weekday: the first such day of the year, and the one a week later */
  function cycles(year, weekday) {
    const jan1 = Date.UTC(year, 0, 1), first = jan1 + (((weekday - new Date(jan1).getUTCDay()) + 7) % 7) * DAY;
    return [iso(first), iso(first + 7 * DAY)];
  }
  function nice(d) { return +d.slice(8, 10) + " " + MONTHS[+d.slice(5, 7) - 1].slice(0, 3); }
  function niceLong(d) { return DAYS[new Date(utc(d)).getUTCDay()] + " " + MONTHS[+d.slice(5, 7) - 1] + " " + +d.slice(8, 10) + ", " + d.slice(0, 4); }
  return { paydays, byMonth, threeMonths, cycles, nice, niceLong, MONTHS, DAYS, utc, iso };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PaySchedule;
} else {
  (function () {
    var box = document.getElementById("ps-tool");
    if (!box) return;
    var P = PaySchedule, $ = function (id) { return document.getElementById(id); };
    function money(v, cur) { return cur + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    var q = new URLSearchParams(window.location.search);
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("payday") || "")) $("ps-payday").value = q.get("payday");
    if (!$("ps-payday").value) {
      var t = new Date(), f = new Date(t.getFullYear(), t.getMonth(), t.getDate() + ((5 - t.getDay() + 7) % 7));
      $("ps-payday").value = f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0") + "-" + String(f.getDate()).padStart(2, "0");
    }
    function calc() {
      var payday = $("ps-payday").value, year = Number($("ps-year").value), step = Number($("ps-freq").value);
      var amount = Number($("ps-amount").value) || 0, cur = $("ps-cur").value, err = $("ps-error");
      if (!payday) { err.textContent = "Enter one of your paydays."; err.style.display = "block"; return; }
      err.style.display = "none";
      var days = P.paydays(payday, year, step), months = P.byMonth(days), three = P.threeMonths(days);
      var normal = step === 14 ? 2 : 4;
      $("ps-count").textContent = days.length;
      $("ps-count-label").textContent = (step === 14 ? "biweekly" : "weekly") + " paydays in " + year;
      $("ps-extra").textContent = three.length
        ? three.map(function (i) { return P.MONTHS[i]; }).join(", ")
        : "None";
      $("ps-extra-label").textContent = step === 14 ? "Months with three paychecks" : "Months with five paychecks";
      if (step === 7) $("ps-extra").textContent = months.map(function (x, i) { return x.length >= 5 ? P.MONTHS[i] : null; }).filter(Boolean).join(", ") || "None";
      $("ps-total").textContent = amount > 0 ? money(amount * days.length, cur) + " (" + days.length + " × " + money(amount, cur) + ")" : "Add your paycheck to see it";
      $("ps-extra-pay").textContent = amount > 0 ? money(amount * (days.length - normal * 12), cur) + " beyond " + normal + " paychecks a month" : "—";
      var tb = $("ps-months");
      tb.innerHTML = "";
      months.forEach(function (x, i) {
        var tr = document.createElement("tr");
        if (x.length > normal) tr.className = "ps-extra";
        tr.innerHTML = "<td>" + P.MONTHS[i] + "</td><td>" + x.map(P.nice).join(", ") + "</td><td>" + x.length + (x.length > normal ? " ★" : "") + "</td>";
        tb.appendChild(tr);
      });
    }
    ["ps-payday", "ps-year", "ps-freq", "ps-amount", "ps-cur"].forEach(function (id) { $(id).addEventListener("input", calc); });
    $("ps-print").addEventListener("click", function () { window.print(); });
    calc();
  })();
}
