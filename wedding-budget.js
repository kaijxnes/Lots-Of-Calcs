/* Wedding budget (/wedding-budget/): the total split by the percentages on
   the page (all editable), and the cost per guest. */
(function () {
  var box = document.getElementById("wb-tool"); if (!box) return;
  var $ = function (id) { return document.getElementById(id); }, N = Number(box.getAttribute("data-count"));
  function calc() {
    var total = Number($("wb-total").value) || 0, guests = Number($("wb-guests").value) || 0, c = $("wb-cur").value, sum = 0;
    var money = function (v) { return c + Math.round(v).toLocaleString("en-GB"); };
    for (var i = 0; i < N; i++) { var p = Number($("wb-p" + i).value) || 0; sum += p; $("wb-v" + i).textContent = money(total * p / 100); }
    $("wb-head").textContent = guests > 0 ? money(total / guests) : "—";
    $("wb-sum").textContent = (Math.round(sum * 10) / 10) + "%" + (Math.abs(sum - 100) > 0.05 ? " — adjust to 100%" : "");
  }
  box.addEventListener("input", calc); $("wb-cur").addEventListener("change", calc);
  calc();
})();
