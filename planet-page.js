/* The calculator on a generated planet page (/weight-on-other-planets/<body>/):
   your weight on Earth times the body's surface gravity as a multiple of
   Earth's (data-g on the box), in kg or pounds. */
(function () {
  var box = document.getElementById("planet-tool");
  if (!box) return;
  var g = Number(box.getAttribute("data-g"));
  var input = document.getElementById("p-weight");
  var unit = document.getElementById("p-unit");
  var out = document.getElementById("p-out");
  var label = document.getElementById("p-label");
  function calc() {
    var v = Number(String(input.value).replace(/[\s,]/g, ""));
    if (!isFinite(v) || v <= 0 || v > 1000) { out.textContent = "—"; return; }
    var u = unit.value;
    out.textContent = (Math.round(v * g * 10) / 10).toLocaleString("en-GB") + " " + u;
    label.textContent = "if you weigh " + v.toLocaleString("en-GB") + " " + u + " on Earth";
  }
  input.addEventListener("input", calc);
  unit.addEventListener("change", calc);
})();
