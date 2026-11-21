/* Expat tax scheme calculators: the Dutch 30% ruling (/30-percent-ruling-calculator/)
   and Spain's Beckham law (/beckham-law-calculator/).

   The same salary is worked out twice through tax-engine.js and the
   country's tax file, once with the scheme switched off and once on, so
   the figures always match the salary calculator. The page says which
   place, which option and its two values in data- attributes; any other
   <select data-option> (Spain's region, the Dutch salary norm) is passed
   through to both runs. */
(function () {
  var box = document.getElementById("ex-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var PLACE = box.getAttribute("data-place"), KEY = box.getAttribute("data-option"), OFF = box.getAttribute("data-off"), ON = box.getAttribute("data-on");
  var CUR = box.getAttribute("data-currency"), chain = null;
  var selects = Array.prototype.slice.call(box.querySelectorAll("select[data-option]"));
  var m0 = function (v) { return TaxEngine.money(v, CUR, true); }, m = function (v) { return TaxEngine.money(v, CUR); };

  function opts(on) {
    var o = {};
    selects.forEach(function (s) { o[s.getAttribute("data-option")] = s.value; });
    if (!on) o[KEY] = OFF;
    else if (!(KEY in o)) o[KEY] = ON;
    return o;
  }
  function tax(r) { return r.charges.filter(function (c) { return c.group === "tax"; }).reduce(function (a, c) { return a + c.amount; }, 0); }
  function social(r) { return r.totalDeductions - tax(r) - r.charges.filter(function (c) { return c.group === "pension"; }).reduce(function (a, c) { return a + c.amount; }, 0); }

  function calc() {
    if (!chain) return;
    var gross = Number(String($("ex-salary").value).replace(/[\s,€]/g, "")), err = $("ex-error");
    if (!(gross > 0) || gross > 1e9) { err.textContent = "Enter a salary a year."; err.style.display = "block"; return; }
    err.style.display = "none";
    var a = TaxEngine.compute(chain, gross, opts(false)), b = TaxEngine.compute(chain, gross, opts(true));
    [["off", a], ["on", b]].forEach(function (p) {
      var k = p[0], r = p[1];
      $("ex-" + k + "-tax").textContent = m0(tax(r));
      if ($("ex-" + k + "-social")) $("ex-" + k + "-social").textContent = m0(social(r));
      $("ex-" + k + "-net").textContent = m0(r.net);
      $("ex-" + k + "-month").textContent = m(r.net / 12);
      $("ex-" + k + "-rate").textContent = (Math.round(tax(r) / gross * 1000) / 10).toFixed(1) + "%";
    });
    if ($("ex-allowance")) $("ex-allowance").textContent = m0(b.values["nl-30-allowance"] || 0);
    var d = b.net - a.net, v = $("ex-verdict"), name = box.getAttribute("data-name");
    if (Math.abs(d) < 1) v.textContent = PLACE === "nl" ? "At this salary the 30% ruling makes no difference: pay has to be above the salary norm before any of it can be paid tax-free." : "At this salary the two come out the same.";
    else if (d > 0) v.textContent = name + " leaves you " + m0(d) + " a year better off — " + m(d / 12) + " a month more take-home pay.";
    else v.textContent = name + " would cost you " + m0(-d) + " a year (" + m(-d / 12) + " a month) at this salary, so it isn't worth opting in.";
  }

  ["ex-salary"].forEach(function (id) { $(id).addEventListener("input", calc); });
  selects.forEach(function (s) { s.addEventListener("change", calc); });
  TaxEngine.load(PLACE).then(function (c) { chain = c; calc(); }).catch(function () {
    $("ex-verdict").textContent = "The tax figures couldn't be loaded — check your connection and try again.";
  });
})();
