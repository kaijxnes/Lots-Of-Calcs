/* FIRE calculator (/fire-calculator/): the target is spending ÷ the
   withdrawal rate (25× spending at 4%); savings grow monthly at the real
   return ÷ 12, with the monthly amount added, until they reach it. All in
   today's money. */
const Fire = (function () {
  function plan(o) {
    const target = o.spending / (o.rate / 100), r = (o.ret || 0) / 100 / 12;
    let bal = o.saved || 0, m = 0, paid = o.saved || 0;
    while (bal < target && m < 1200) { bal = bal * (1 + r) + (o.monthly || 0); paid += o.monthly || 0; m++; }
    return { target, months: m, years: Math.round(m / 12 * 10) / 10, paid, reached: bal >= target };
  }
  return { plan };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Fire;
else (function () {
  var box = document.getElementById("fire-tool"); if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function n(id) { var s = String($(id).value).replace(/[\s,£$€]/g, ""); return s === "" ? NaN : Number(s); }
  function money(v) { return Math.round(v).toLocaleString("en-GB"); }
  function calc() {
    var o = { spending: n("fire-spending"), saved: n("fire-saved") || 0, monthly: n("fire-monthly") || 0, ret: n("fire-ret") || 0, rate: n("fire-rate") };
    if (!(o.spending > 0) || !(o.rate > 0)) return;
    var r = Fire.plan(o), age = n("fire-age");
    $("fire-target").textContent = money(r.target);
    $("fire-years").textContent = r.reached ? (r.months === 0 ? "You're there already" : r.years + " years") : "Over 100 years — save more or spend less";
    $("fire-at").textContent = r.reached && age > 0 ? Math.floor(age + r.months / 12) + "" : "—";
    $("fire-paid").textContent = money(r.paid);
    $("fire-table").innerHTML = [3, 3.5, 4, 4.5, 5].map(function (w) { var x = Fire.plan(Object.assign({}, o, { rate: w })); return "<tr><td>" + w + "%</td><td>" + money(x.target) + "</td><td>" + (x.reached ? x.years + " years" : "100+") + "</td></tr>"; }).join("");
  }
  ["fire-spending", "fire-saved", "fire-monthly", "fire-ret", "fire-rate", "fire-age"].forEach(function (id) { $(id).addEventListener("input", calc); });
  calc();
})();
