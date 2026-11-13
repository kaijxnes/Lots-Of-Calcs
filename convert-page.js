/* The converter on a generated /convert/<conversion>/ page. The box says what
   kind of conversion it is (data-kind) and, for straight multiplications, the
   factor (data-factor); the generator sets these from unit-converter.js so the
   page and the full converter always agree. */
(function () {
  var box = document.getElementById("cv-tool");
  if (!box) return;
  var kind = box.getAttribute("data-kind");
  var factor = Number(box.getAttribute("data-factor"));
  var unit = box.getAttribute("data-unit");
  var input = document.getElementById("cv-in");
  var inches = document.getElementById("cv-in2");
  var out = document.getElementById("cv-out");

  function num(el) { var v = Number(String(el.value).replace(/[\s,]/g, "")); return el.value.trim() === "" ? NaN : v; }
  function f(v, dp) { return (Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString("en-GB"); }
  function ftin(totalIn) {
    var ft = Math.floor(totalIn / 12), i = Math.round((totalIn - ft * 12) * 10) / 10;
    if (i >= 12) { ft += 1; i -= 12; }
    return ft + " ft " + f(i, 1) + " in";
  }
  function stlb(lb) {
    var st = Math.floor(lb / 14), l = Math.round((lb - st * 14) * 10) / 10;
    if (l >= 14) { st += 1; l -= 14; }
    return st + " st " + f(l, 1) + " lb";
  }

  function calc() {
    var v = num(input);
    if (!isFinite(v)) { out.textContent = "—"; return; }
    var text;
    if (kind === "ftin-cm") {
      var i2 = inches ? num(inches) : 0;
      text = f((v * 12 + (isFinite(i2) ? i2 : 0)) * 2.54, 1) + " cm";
    } else if (kind === "cm-ftin") text = ftin(v / 2.54);
    else if (kind === "m-ft") text = f(v * factor, 2) + " ft (" + ftin(v * factor * 12) + ")";
    else if (kind === "kg-stlb") text = stlb(v * factor) + " (" + f(v * factor, 1) + " lb)";
    else if (kind === "c-f") text = f(v * 9 / 5 + 32, 1) + " °F";
    else if (kind === "f-c") text = f((v - 32) * 5 / 9, 1) + " °C";
    else text = f(v * factor, factor > 50 || unit === "cm" ? 1 : 2) + " " + unit;
    out.textContent = text;
  }
  input.addEventListener("input", calc);
  if (inches) inches.addEventListener("input", calc);
})();
