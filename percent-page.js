/* The small calculator on a "what is X% of Y" page (/percent/20-percent-of-50/):
   X% of Y, Y plus X% and Y minus X%, as the numbers change. */
(function () {
  var box = document.getElementById("pp-tool");
  if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function num(id) { return Number(String($(id).value).replace(/[\s,%]/g, "")); }
  function fmt(v) { return (Math.round(v * 10000) / 10000).toLocaleString("en-GB", { maximumFractionDigits: 4 }); }
  function calc() {
    var x = num("pp-pct"), y = num("pp-num"), err = $("pp-error");
    if ($("pp-pct").value === "" || $("pp-num").value === "" || !isFinite(x) || !isFinite(y)) {
      err.textContent = "Enter a percentage and a number."; err.style.display = "block"; return;
    }
    err.style.display = "none";
    var part = y * x / 100;
    $("pp-of").textContent = fmt(part);
    $("pp-plus").textContent = fmt(y + part);
    $("pp-minus").textContent = fmt(y - part);
  }
  $("pp-pct").addEventListener("input", calc);
  $("pp-num").addEventListener("input", calc);
  calc();
})();
