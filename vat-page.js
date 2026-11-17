/* The small calculator on a VAT amount page (/vat/100/): an amount and a
   rate, with VAT added to it and taken out of it, side by side. Adding:
   amount × (1 + rate). Removing: amount ÷ (1 + rate) — at 20% the VAT in a
   VAT-inclusive price is a sixth of it, not 20%. */
(function () {
  var box = document.getElementById("vp-tool");
  if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function money(v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function calc() {
    var a = Number(String($("vp-amount").value).replace(/[\s,£]/g, "")), r = Number($("vp-rate").value) / 100, err = $("vp-error");
    if (!(a >= 0) || $("vp-amount").value === "" || !(r >= 0)) { err.textContent = "Enter an amount."; err.style.display = "block"; return; }
    err.style.display = "none";
    var gross = a * (1 + r), net = a / (1 + r);
    $("vp-add-vat").textContent = money(a * r);
    $("vp-add-total").textContent = money(gross);
    $("vp-rem-net").textContent = money(net);
    $("vp-rem-vat").textContent = money(a - net);
  }
  ["vp-amount"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("vp-rate").addEventListener("change", calc);
  calc();
})();
