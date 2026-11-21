/* Job offer comparison (/job-offer-comparison/): two jobs side by side,
   each in any place the salary calculator covers.

   For each offer: take-home pay on salary + bonus through tax-engine.js
   (the place's default options), plus the employer's pension contribution
   (paid on top, so not taxed now), plus any other yearly benefits, less
   the yearly cost of getting to work. That "real value" is what the two
   offers are compared on; per hour uses the weekly hours given. */
(function () {
  var box = document.getElementById("jo-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var SIDES = ["a", "b"], state = { a: { chain: null, cur: "GBP", ticket: 0 }, b: { chain: null, cur: "GBP", ticket: 0 } };

  function num(id) { var v = Number(String($(id).value).replace(/[\s,]/g, "")); return isFinite(v) ? v : 0; }

  function value(side) {
    var st = state[side];
    if (!st.chain) return null;
    var salary = num("jo-" + side + "-salary"), bonus = num("jo-" + side + "-bonus");
    var r = TaxEngine.compute(st.chain, salary + bonus, {});
    var pension = salary * num("jo-" + side + "-pension") / 100;
    var perks = num("jo-" + side + "-perks"), commute = num("jo-" + side + "-commute") * 12;
    var hours = num("jo-" + side + "-hours");
    var real = r.net + pension + perks - commute;
    return { net: r.net, pension: pension, perks: perks, commute: commute, real: real, perHour: hours > 0 ? real / (hours * 52) : NaN, cur: st.cur };
  }

  function calc() {
    var v = { a: value("a"), b: value("b") };
    SIDES.forEach(function (s) {
      var x = v[s];
      if (!x) return;
      var m = function (n) { return TaxEngine.money(n, x.cur, true); };
      $("jo-" + s + "-net").textContent = m(x.net);
      $("jo-" + s + "-month").textContent = TaxEngine.money(x.net / 12, x.cur);
      $("jo-" + s + "-pension-out").textContent = m(x.pension);
      $("jo-" + s + "-perks-out").textContent = m(x.perks);
      $("jo-" + s + "-commute-out").textContent = "−" + m(x.commute);
      $("jo-" + s + "-real").textContent = m(x.real);
      $("jo-" + s + "-hour").textContent = isFinite(x.perHour) ? TaxEngine.money(x.perHour, x.cur) : "—";
    });
    var verdict = $("jo-verdict");
    if (!v.a || !v.b) { verdict.textContent = "Loading the tax figures…"; return; }
    if (v.a.cur !== v.b.cur) {
      verdict.textContent = "The two offers are in different currencies (" + v.a.cur + " and " + v.b.cur + "). Convert one at today's exchange rate to compare the real values — and remember living costs differ too.";
      return;
    }
    var d = v.a.real - v.b.real, m0 = function (n) { return TaxEngine.money(n, v.a.cur, true); };
    if (Math.abs(d) < 1) { verdict.textContent = "The two offers come out the same once tax, pension, perks and commuting are counted."; return; }
    var better = d > 0 ? "Offer A" : "Offer B", by = Math.abs(d);
    verdict.textContent = better + " is worth " + m0(by) + " more a year (" + TaxEngine.money(by / 12, v.a.cur) + " a month) once tax, pension, perks and commuting are counted." +
      (isFinite(v.a.perHour) && isFinite(v.b.perHour) && (v.a.perHour > v.b.perHour) !== (d > 0) ? " Per hour worked, though, the other offer pays more." : "");
  }

  function load(side, first) {
    var sel = $("jo-" + side + "-place"), opt = sel.options[sel.selectedIndex], st = state[side];
    var next = opt.getAttribute("data-currency");
    if (!first && next !== st.cur) $("jo-" + side + "-salary").value = opt.getAttribute("data-gross");
    st.cur = next;
    $("jo-" + side + "-cur").textContent = next;
    st.chain = null;
    var ticket = ++st.ticket;
    TaxEngine.load(sel.value).then(function (c) {
      if (ticket !== st.ticket) return;
      st.chain = c;
      calc();
    }).catch(function () {
      $("jo-verdict").textContent = "The tax figures for " + opt.textContent + " couldn't be loaded — check your connection and try again.";
    });
  }

  SIDES.forEach(function (s) {
    ["salary", "bonus", "pension", "perks", "commute", "hours"].forEach(function (f) { $("jo-" + s + "-" + f).addEventListener("input", calc); });
    $("jo-" + s + "-place").addEventListener("change", function () { load(s, false); });
    load(s, true);
  });
})();
