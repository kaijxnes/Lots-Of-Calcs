/* The 52-week savings challenge (and the 365-day version).

   Classic: week n you save n × the amount, so £1 a week rising gives
   £1 + £2 + … + £52 = £1,378. Reverse: the same deposits, biggest first, so
   December is the easy end. 365-day: day n you save n × the amount, so 1p
   rising gives £667.95. Totals are amount × 1,378 (weeks) or × 66,795 (days).

   Ticks on the chart are kept in this browser only (localStorage), per
   challenge, so someone can come back each week and mark their deposit. */
const SavingsChallenge = (function () {
  const MODES = {
    classic: { periods: 52, days: 7, label: "Classic 52 weeks", unit: "Week", reverse: false },
    reverse: { periods: 52, days: 7, label: "Reverse 52 weeks", unit: "Week", reverse: true },
    daily: { periods: 365, days: 1, label: "365 days", unit: "Day", reverse: false }
  };
  const r2 = (v) => Math.round(v * 100) / 100;

  function multiplier(mode) { const p = MODES[mode].periods; return p * (p + 1) / 2; }

  function addDays(iso, n) {
    const d = new Date(iso + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /* rows: [{ i, date, deposit, total }] — deposits rounded to the penny */
  function plan(mode, amount, startIso) {
    const m = MODES[mode], rows = [];
    let total = 0;
    for (let i = 1; i <= m.periods; i++) {
      const k = m.reverse ? m.periods + 1 - i : i;
      const deposit = r2(k * amount);
      total = r2(total + deposit);
      rows.push({ i, date: addDays(startIso, (i - 1) * m.days), deposit, total });
    }
    return rows;
  }

  /* Interest on the growing balance at an annual equivalent rate, credited each period */
  function interest(rows, mode, aer) {
    if (!(aer > 0)) return 0;
    const per = Math.pow(1 + aer / 100, MODES[mode].days / 365) - 1;
    let bal = 0, earned = 0;
    rows.forEach((r) => { const x = bal * per; earned += x; bal += x + r.deposit; });
    return r2(earned);
  }

  function byMonth(rows) {
    const out = [];
    rows.forEach((r) => {
      const k = r.date.slice(0, 7), last = out[out.length - 1];
      if (last && last.month === k) { last.total = r2(last.total + r.deposit); last.n++; } else out.push({ month: k, total: r.deposit, n: 1 });
    });
    return out;
  }

  /* The challenge year: from September on, people are planning next January */
  function upcomingStart(today) {
    const d = today || new Date();
    const y = d.getMonth() >= 8 ? d.getFullYear() + 1 : d.getFullYear();
    return y + "-01-01";
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function niceDate(iso) { const [y, m, d] = iso.split("-").map(Number); return d + " " + MONTHS[m - 1].slice(0, 3) + " " + y; }
  function monthName(ym) { const [y, m] = ym.split("-").map(Number); return MONTHS[m - 1] + " " + y; }
  function money(v, cur) {
    const c = cur || "£";
    if (c === "£" && v < 1 && v > 0 && Math.round(v * 100) === v * 100) return Math.round(v * 100) + "p";
    return c + v.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
  }

  return { MODES, multiplier, plan, interest, byMonth, upcomingStart, niceDate, monthName, money, r2 };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SavingsChallenge;
} else {
  (function () {
    var box = document.getElementById("sc-tool");
    if (!box) return;
    var S = SavingsChallenge;
    var $ = function (id) { return document.getElementById(id); };
    var rows = [], key = "";

    function get(k) { try { return JSON.parse(window.localStorage.getItem(k) || "null"); } catch (e) { return null; } }
    function put(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }

    /* Open with a version already chosen: ?mode=reverse&amount=2 */
    var q = new URLSearchParams(window.location.search);
    if (q.get("mode") && S.MODES[q.get("mode")]) $("sc-mode").value = q.get("mode");
    if (q.get("amount") && Number(q.get("amount")) > 0) $("sc-amount").value = q.get("amount");
    if (q.get("start") && /^\d{4}-\d{2}-\d{2}$/.test(q.get("start"))) $("sc-start").value = q.get("start");
    if (!$("sc-start").value) $("sc-start").value = S.upcomingStart();

    function ticks() { return get(key) || []; }

    function progress() {
      var t = ticks(), saved = 0;
      rows.forEach(function (r) { if (t.indexOf(r.i) !== -1) saved += r.deposit; });
      var cur = $("sc-cur").value, total = rows.length ? rows[rows.length - 1].total : 0;
      $("sc-progress").textContent = t.length
        ? S.money(S.r2(saved), cur) + " saved so far — " + t.length + " of " + rows.length + " ticked, " + S.money(S.r2(total - saved), cur) + " to go"
        : "Tick each " + (S.MODES[$("sc-mode").value].unit.toLowerCase()) + " as you save it. Your ticks stay in this browser.";
    }

    function calc() {
      var mode = $("sc-mode").value, amount = Number($("sc-amount").value), start = $("sc-start").value, cur = $("sc-cur").value;
      var aer = Number($("sc-aer").value) || 0, err = $("sc-error"), m = S.MODES[mode];
      if (!(amount > 0) || !start) { err.textContent = "Enter an amount and a start date."; err.style.display = "block"; return; }
      err.style.display = "none";
      rows = S.plan(mode, amount, start);
      key = "loc-savings-challenge:" + mode + ":" + amount + ":" + start;
      var total = rows[rows.length - 1].total, biggest = rows.reduce(function (a, r) { return Math.max(a, r.deposit); }, 0);
      var earned = S.interest(rows, mode, aer);
      $("sc-total").textContent = S.money(total, cur);
      $("sc-total-label").textContent = "saved by " + S.niceDate(rows[rows.length - 1].date);
      $("sc-biggest").textContent = S.money(biggest, cur) + " (" + m.unit.toLowerCase() + " " + (m.reverse ? 1 : rows.length) + ")";
      $("sc-average").textContent = S.money(S.r2(total / 12), cur) + " a month";
      $("sc-interest").textContent = aer > 0 ? S.money(earned, cur) + " (estimate)" : "Add a savings rate to see it";
      $("sc-with-interest").textContent = S.money(S.r2(total + earned), cur);
      $("sc-unit-head").textContent = m.unit;

      var t = ticks();
      var tb = $("sc-rows");
      tb.innerHTML = "";
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        var on = t.indexOf(r.i) !== -1;
        tr.innerHTML = "<td>" + r.i + "</td><td>" + S.niceDate(r.date) + "</td><td>" + S.money(r.deposit, cur) + "</td><td>" + S.money(r.total, cur) +
          '</td><td><input type="checkbox" aria-label="Saved ' + m.unit.toLowerCase() + " " + r.i + '"' + (on ? " checked" : "") + "></td>";
        if (on) tr.className = "sc-done";
        tr.querySelector("input").addEventListener("change", function (e) {
          var list = ticks().filter(function (x) { return x !== r.i; });
          if (e.target.checked) list.push(r.i);
          put(key, list);
          tr.className = e.target.checked ? "sc-done" : "";
          progress();
        });
        tb.appendChild(tr);
      });
      var mb = $("sc-months");
      mb.innerHTML = "";
      S.byMonth(rows).forEach(function (x) {
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + S.monthName(x.month) + "</td><td>" + x.n + "</td><td>" + S.money(x.total, cur) + "</td>";
        mb.appendChild(tr);
      });
      progress();
    }

    /* "Aim for a total": the amount that gets there */
    $("sc-target").addEventListener("input", function () {
      var target = Number($("sc-target").value);
      if (target > 0) { $("sc-amount").value = Math.ceil(target / S.multiplier($("sc-mode").value) * 100) / 100; calc(); }
    });
    ["sc-mode", "sc-amount", "sc-start", "sc-cur", "sc-aer"].forEach(function (id) { $(id).addEventListener("input", calc); });
    $("sc-mode").addEventListener("change", calc);
    $("sc-print").addEventListener("click", function () { window.print(); });
    $("sc-clear").addEventListener("click", function () {
      try { window.localStorage.removeItem(key); } catch (e) { /* nothing */ }
      calc();
    });
    calc();
  })();
}
