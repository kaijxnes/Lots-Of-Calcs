/* Christmas savings: how much a week or a month to have a budget ready by a
   date (1 December by default, so there's time to shop).

   Weekly: one deposit every 7 days from the start date, up to and including
   the deadline. Monthly: one deposit each payday (a day of the month) from
   the start date to the deadline. What's still needed is the budget less
   anything already saved, shared evenly over those deposits. */
const ChristmasSavings = (function () {
  function d(iso) { return new Date(iso + "T12:00:00Z"); }
  function iso(dt) { return dt.toISOString().slice(0, 10); }
  function weekly(start, end) {
    let n = 0;
    for (let t = d(start); t <= d(end); t.setUTCDate(t.getUTCDate() + 7)) n++;
    return n;
  }
  function paydays(start, end, day) {
    const out = [], s = d(start), e = d(end);
    for (let y = s.getUTCFullYear(), m = s.getUTCMonth(); ; m++) {
      const yy = y + Math.floor(m / 12), mm = m % 12;
      const last = new Date(Date.UTC(yy, mm + 1, 0, 12)).getUTCDate();
      const p = new Date(Date.UTC(yy, mm, Math.min(day, last), 12));
      if (p > e) break;
      if (p >= s) out.push(iso(p));
    }
    return out;
  }
  function plan(budget, saved, start, end, payday) {
    const need = Math.max(0, budget - (saved || 0));
    const w = weekly(start, end), p = paydays(start, end, payday || 28);
    const days = Math.round((d(end) - d(start)) / 864e5) + 1;
    return { need, weeks: w, perWeek: w ? need / w : NaN, paydays: p, perMonth: p.length ? need / p.length : NaN, days, perDay: days > 0 ? need / days : NaN };
  }
  /* The Christmas to save for: this year's while there are at least 8 weeks to go, else next year's */
  function target(today) {
    const t = today || new Date(), y = t.getFullYear();
    return Date.UTC(y, 11, 1) - Date.UTC(y, t.getMonth(), t.getDate()) >= 56 * 864e5 ? y : y + 1;
  }
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function nice(isoDate) { const [y, m, dd] = isoDate.split("-").map(Number); return dd + " " + MONTHS[m - 1] + " " + y; }
  function money(v, cur) { return (cur || "£") + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  return { plan, weekly, paydays, target, nice, money, MONTHS };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChristmasSavings;
} else {
  (function () {
    var box = document.getElementById("xs-tool");
    if (!box) return;
    var C = ChristmasSavings, $ = function (id) { return document.getElementById(id); };
    var today = new Date(), todayIso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    if (!$("xs-start").value) $("xs-start").value = todayIso;
    if (!$("xs-end").value) $("xs-end").value = C.target(today) + "-12-01";
    var q = new URLSearchParams(window.location.search);
    if (Number(q.get("budget")) > 0) $("xs-budget").value = q.get("budget");
    function calc() {
      var budget = Number($("xs-budget").value), saved = Number($("xs-saved").value) || 0, start = $("xs-start").value, end = $("xs-end").value;
      var payday = Math.min(31, Math.max(1, Number($("xs-payday").value) || 28)), cur = $("xs-cur").value, err = $("xs-error");
      if (!(budget > 0) || !start || !end) { err.textContent = "Enter your budget and the dates."; err.style.display = "block"; return; }
      if (end < start) { err.textContent = "The date you want it by needs to be after the start date."; err.style.display = "block"; return; }
      err.style.display = "none";
      var r = C.plan(budget, saved, start, end, payday);
      $("xs-week").textContent = r.weeks ? C.money(r.perWeek, cur) : "—";
      $("xs-week-label").textContent = "a week for " + r.weeks + " week" + (r.weeks === 1 ? "" : "s");
      $("xs-month").textContent = r.paydays.length ? C.money(r.perMonth, cur) + " on each of " + r.paydays.length + " payday" + (r.paydays.length === 1 ? "" : "s") : "No payday before then";
      $("xs-day").textContent = C.money(r.perDay, cur) + " a day for " + r.days + " days";
      $("xs-need").textContent = C.money(r.need, cur);
      $("xs-by").textContent = C.nice(end);
    }
    ["xs-budget", "xs-saved", "xs-start", "xs-end", "xs-payday", "xs-cur"].forEach(function (id) { $(id).addEventListener("input", calc); });
    calc();
  })();
}
