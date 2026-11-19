/* Emergency fund calculator (/emergency-fund-calculator/): a few months of
   essential spending set aside, and how long it takes to get there.

   Target = essential spending a month × months of cover. Time to reach it:
   month by month, interest on the balance (annual rate ÷ 12) then the
   month's saving, until the balance reaches the target. */
const EmergencyFund = (function () {
  function monthsToReach(target, saved, monthly, rate) {
    if (saved >= target) return 0;
    if (!(monthly > 0)) return Infinity;
    const i = (rate || 0) / 100 / 12;
    let bal = saved, n = 0;
    while (bal < target && n < 1200) { bal = bal * (1 + i) + monthly; n++; }
    return bal >= target ? n : Infinity;
  }
  return { monthsToReach };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = EmergencyFund;
} else {
  (function () {
    var box = document.getElementById("ef-tool");
    if (!box) return;
    var E = EmergencyFund, $ = function (id) { return document.getElementById(id); };
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-ef-item]"));
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function money(v, cur, whole) { return cur + v.toLocaleString("en-GB", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }); }
    function when(n) {
      if (n === 0) return "You're already there";
      if (!isFinite(n)) return "Not at this rate — add a monthly amount";
      var t = new Date(); t.setMonth(t.getMonth() + n);
      return n + " month" + (n === 1 ? "" : "s") + " (" + MONTHS[t.getMonth()] + " " + t.getFullYear() + ")";
    }
    function calc() {
      var cur = $("ef-cur").value, total = 0;
      items.forEach(function (el) { total += Number(el.value) || 0; });
      var cover = Number($("ef-months").value) || 3, saved = Number($("ef-saved").value) || 0, monthly = Number($("ef-monthly").value) || 0, rate = Number($("ef-rate").value) || 0;
      var target = total * cover;
      $("ef-total").textContent = money(total, cur) + " a month";
      $("ef-target").textContent = money(target, cur, true);
      $("ef-target-label").textContent = cover + " months of essential spending";
      $("ef-gap").textContent = money(Math.max(0, target - saved), cur, true);
      $("ef-when").textContent = when(E.monthsToReach(target, saved, monthly, rate));
      var tb = $("ef-table");
      tb.innerHTML = "";
      [3, 6, 9, 12].forEach(function (c) {
        var tr = document.createElement("tr"), t = total * c;
        tr.innerHTML = "<td>" + c + " months</td><td>" + money(t, cur, true) + "</td><td>" + when(E.monthsToReach(t, saved, monthly, rate)) + "</td>";
        tb.appendChild(tr);
      });
    }
    items.concat([$("ef-months"), $("ef-saved"), $("ef-monthly"), $("ef-rate"), $("ef-cur")]).forEach(function (el) { el.addEventListener("input", calc); });
    calc();
  })();
}
