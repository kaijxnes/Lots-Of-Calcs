/* Overtime calculator (/overtime-calculator/): overtime pay before tax, and
   the extra take-home — the year's pay worked out by tax-engine.js with
   and without the overtime, so it's taxed at your top rate as it really is. */
(function () {
  var box = document.getElementById("ot-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var chain = null, cur = "GBP", ticket = 0;
  function n(id) { var v = Number(String($(id).value).replace(/[\s,]/g, "")); return isFinite(v) ? v : 0; }
  function calc() {
    if (!chain) return;
    var rate = n("ot-rate"), hours = n("ot-hours"), h1 = n("ot-h1"), h2 = n("ot-h2"), mult = Number($("ot-mult").value), weeks = Math.min(52, n("ot-weeks"));
    var base = rate * hours * 52, extra = (rate * mult * h1 + rate * 2 * h2) * weeks;
    var keep = TaxEngine.compute(chain, base + extra, {}).net - TaxEngine.compute(chain, base, {}).net;
    var m = function (v) { return TaxEngine.money(v, cur); };
    $("ot-otrate").textContent = m(rate * mult);
    $("ot-week").textContent = m(extra / 52); $("ot-year").textContent = TaxEngine.money(extra, cur, true);
    $("ot-keepweek").textContent = m(keep / 52); $("ot-keepyear").textContent = TaxEngine.money(keep, cur, true);
    $("ot-share").textContent = extra > 0 ? Math.round(keep / extra * 100) + "%" : "—";
  }
  function load() {
    var sel = $("ot-place"), opt = sel.options[sel.selectedIndex], t = ++ticket;
    cur = opt.getAttribute("data-currency"); $("ot-cur").textContent = cur; chain = null;
    TaxEngine.load(sel.value).then(function (c) { if (t === ticket) { chain = c; calc(); } });
  }
  ["ot-rate", "ot-hours", "ot-h1", "ot-h2", "ot-weeks"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("ot-mult").addEventListener("change", calc);
  $("ot-place").addEventListener("change", load);
  load();
})();
