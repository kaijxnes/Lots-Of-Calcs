/* The small calculator on a "20% off £50" page (/discount/20-percent-off-50/):
   sale price, saving and the total discount, with an optional extra
   percentage off the reduced price (taken off after the first discount,
   the way shops apply it). */
(function () {
  var box = document.getElementById("dp-tool");
  if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function num(id) { var v = String($(id).value).replace(/[\s,%£$€]/g, ""); return v === "" ? NaN : Number(v); }
  function money(v) { return "£" + (Math.round(v * 100) / 100).toLocaleString("en-GB", { minimumFractionDigits: Math.round(v * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 }); }
  function calc() {
    var price = num("dp-price"), pct = num("dp-pct"), extra = num("dp-extra"), err = $("dp-error");
    if (!isFinite(extra)) extra = 0;
    if (!isFinite(price) || !isFinite(pct) || price < 0 || pct < 0 || pct > 100 || extra < 0 || extra > 100) {
      err.textContent = "Enter a price and a discount between 0 and 100%."; err.style.display = "block"; return;
    }
    err.style.display = "none";
    var after = price * (100 - pct) / 100 * (100 - extra) / 100;
    $("dp-sale").textContent = money(after);
    $("dp-save").textContent = money(price - after);
    $("dp-total").textContent = price > 0 ? (Math.round((1 - after / price) * 1000) / 10) + "%" : "—";
  }
  ["dp-price", "dp-pct", "dp-extra"].forEach(function (id) { $(id).addEventListener("input", calc); });
  calc();
})();
