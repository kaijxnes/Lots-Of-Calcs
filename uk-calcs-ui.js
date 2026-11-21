/* The page code for the UK calculators built by tools/build-uk-calcs.js.
   The maths is uk-calcs.js; the figures come from the page (data-cfg). */
(function () {
  var box = document.querySelector(".uk-tool");
  if (!box || typeof UKCalcs === "undefined") return;
  var U = UKCalcs, cfg = JSON.parse(box.getAttribute("data-cfg")), id = box.id;
  var $ = function (x) { return document.getElementById(x); };
  function n(x) { var el = $(x); if (!el) return 0; var v = Number(String(el.value).replace(/[\s,£%]/g, "")); return isFinite(v) ? v : 0; }
  function g0(v) { return (v < 0 ? "−£" : "£") + Math.round(Math.abs(v)).toLocaleString("en-GB"); }
  function g2(v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function set(x, v) { var el = $(x); if (el) el.textContent = v; }
  function insideIR35(income, fee) {
    var pot = Math.max(0, income - fee), e = cfg.er;
    var salary = pot > e.threshold ? (pot + e.threshold * e.rate / 100) / (1 + e.rate / 100) : pot;
    return salary - U.incomeTax(cfg, salary, 0).total - U.employeeNI(cfg, salary);
  }
  function allSalary(profit, ea) { var lo = 0, hi = profit; for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (m + U.employerNI(cfg, m, ea) > profit) hi = m; else lo = m; } return lo; }

  var calc = {
    dv: function () {
      var o = n("dv-other"), d = n("dv-div"), r = U.incomeTax(cfg, o, d);
      set("dv-tax", g0(r.divTax)); set("dv-keep", g0(d - r.divTax)); set("dv-ns", g0(r.nsTax)); set("dv-rate", d > 0 ? (r.divTax / d * 100).toFixed(1) + "%" : "—");
    },
    sd: function () {
      var p = n("sd-profit"), s = n("sd-salary"), ea = $("sd-ea").checked, r = U.director(cfg, p, s, ea);
      set("sd-sal", g0(r.salary)); set("sd-erni", g0(r.erNI)); set("sd-ct", g0(r.ct)); set("sd-div", g0(r.div)); set("sd-it", g0(r.incomeTax)); set("sd-dt", g0(r.divTax)); set("sd-eeni", g0(r.eeNI)); set("sd-net", g0(r.net));
      var rows = [["£" + cfg.er.threshold.toLocaleString("en-GB") + " (secondary threshold)", cfg.er.threshold], ["£" + cfg.niPT.toLocaleString("en-GB") + " (primary threshold)", cfg.niPT], ["All as salary", allSalary(p, ea)]].map(function (x) {
        var d = U.director(cfg, p, x[1], ea); return { l: x[0], d: d };
      });
      var best = rows.reduce(function (a, b) { return b.d.net > a.d.net ? b : a; });
      $("sd-table").innerHTML = rows.map(function (x) { var b = x === best ? "<strong>" : "", e = x === best ? "</strong>" : ""; return "<tr><td>" + x.l + "</td><td>" + g0(x.d.salary) + "</td><td>" + g0(x.d.div) + "</td><td>" + g0(x.d.totalTax) + "</td><td>" + b + g0(x.d.net) + e + "</td></tr>"; }).join("");
    },
    ct: function () {
      var inc = n("ct-rate") * n("ct-days"), i = insideIR35(inc, n("ct-fee")), o = U.director(cfg, Math.max(0, inc - n("ct-exp")), cfg.niPT, false).net;
      set("ct-inc", g0(inc)); set("ct-in", g0(i)); set("ct-in-m", g2(i / 12)); set("ct-out", g0(o)); set("ct-out-m", g2(o / 12)); set("ct-diff", g0(o - i));
    },
    cg: function () {
      var inc = n("cg-income"), taxable = Math.max(0, inc - U.allowance(cfg, inc)), r = U.cgt(cfg, n("cg-gain"), taxable, $("cg-badr").checked);
      set("cg-taxable", g0(r.chargeable)); set("cg-basic", g0(r.inBasic)); set("cg-higher", g0(r.chargeable - r.inBasic)); set("cg-tax", g0(r.tax));
    },
    ih: function () {
      var r = U.iht(cfg, { estate: n("ih-estate"), home: n("ih-home"), transferNRB: Math.min(100, n("ih-tnrb")), transferRNRB: Math.min(100, n("ih-trnrb")), charity: n("ih-charity") });
      set("ih-nrb", g0(r.nrb)); set("ih-rnrb", g0(r.rnrb)); set("ih-taxable", g0(r.taxable)); set("ih-rate", r.rate + "%"); set("ih-tax", g0(r.tax));
    },
    mp: function () {
      var awe = n("mp-salary") > 0 ? n("mp-salary") / 52 : n("mp-awe"), r = U.smp(cfg, awe);
      set("mp-first", g2(r.first) + " a week"); set("mp-rest", g2(r.rest) + " a week"); set("mp-total", g2(r.total));
      set("mp-elig", r.eligible ? "Yes, if you meet the service conditions" : "No — average earnings below £" + cfg.sp.lowerEarningsLimit + " a week");
    },
    rd: function () {
      var r = U.redundancy(cfg, n("rd-age"), n("rd-years"), n("rd-weekly"));
      set("rd-weeks", String(r.weeks)); set("rd-week", g2(r.weekPay)); set("rd-total", r.eligible ? g0(r.total) : "None — you need " + cfg.red.minYears + " years' service");
    },
    hl: function () {
      var r = U.holiday(cfg, Math.min(7, n("hl-days")), Math.min(12, n("hl-months")) / 12), h = n("hl-hours");
      set("hl-full", (Math.round(r.full * 10) / 10) + " days"); set("hl-due", (Math.round(r.due * 10) / 10) + " days");
      set("hl-irr", h > 0 ? (Math.round(h * cfg.hol.irregularPct / 100 * 10) / 10) + " hours" : "—");
    },
    pd: function () {
      var pot = n("pd-pot"), take = $("pd-lump").value === "1", lump = take ? Math.min(pot * cfg.pen.taxFreePct / 100, cfg.pen.lumpSumAllowance) : 0;
      var r = U.drawdown(pot - lump, n("pd-yearly"), n("pd-growth"));
      set("pd-lumpout", g0(lump)); set("pd-left", g0(pot - lump)); set("pd-years", isFinite(r.years) && r.years < 100 ? Math.round(r.years) + " years" : "100+ years");
    },
    bl: function () {
      var price = n("bl-price"), rent = n("bl-rent") * 12, costs = n("bl-costs"), interest = n("bl-interest"), other = n("bl-other");
      var pre = rent - costs, profit = pre - interest;
      var tax = Math.max(0, U.incomeTax(cfg, other + Math.max(0, pre), 0).total - U.incomeTax(cfg, other, 0).total - Math.min(interest, Math.max(0, pre)) * cfg.ll.financeCostCredit / 100);
      set("bl-gross", price > 0 ? (rent / price * 100).toFixed(2) + "%" : "—"); set("bl-net", price > 0 ? (pre / price * 100).toFixed(2) + "%" : "—");
      set("bl-profit", g0(profit)); set("bl-tax", g0(tax)); set("bl-after", g0(profit - tax));
    }
  }[id];
  if (!calc) return;
  box.addEventListener("input", calc); box.addEventListener("change", calc);
  calc();
})();
