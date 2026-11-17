/* The stake box on an odds page (/odds-converter/7-2/): the odds are fixed
   by the page (data-dec, decimal odds), the stake is yours. Profit is
   stake × (decimal − 1); the return adds the stake back. */
(function () {
  var box = document.getElementById("op-tool");
  if (!box) return;
  var dec = Number(box.getAttribute("data-dec"));
  var $ = function (id) { return document.getElementById(id); };
  function calc() {
    var s = Number(String($("op-stake").value).replace(/[\s,£$€]/g, "")), cur = $("op-cur").value, err = $("op-error");
    if (!(s >= 0) || $("op-stake").value === "") { err.textContent = "Enter a stake."; err.style.display = "block"; return; }
    err.style.display = "none";
    var f = function (v) { return cur + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    $("op-profit").textContent = f(s * (dec - 1));
    $("op-return").textContent = f(s * dec);
  }
  $("op-stake").addEventListener("input", calc);
  $("op-cur").addEventListener("change", calc);
  calc();
})();
