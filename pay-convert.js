/* Hourly ↔ salary converter (/hourly-to-salary/ and its pages): any one of
   hourly, daily, weekly, monthly or yearly pay to all the others, before
   tax. year = hourly × hours a week × paid weeks; a month is a twelfth of
   the year; a day is the working day the page states (8 hours, 7.5 in the
   UK) at the same hourly rate. */
(function () {
  var box = document.getElementById("pc-tool");
  if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  var sym = box.getAttribute("data-sym"), locale = box.getAttribute("data-locale"), day = Number(box.getAttribute("data-day"));
  function num(id) { var v = String($(id).value).replace(/[\s,£$€]/g, ""); return v === "" ? NaN : Number(v); }
  function money(v) { return sym + (Math.round(v * 100) / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function calc() {
    var amount = num("pc-amount"), hours = num("pc-hours"), weeks = num("pc-weeks"), per = $("pc-per").value, err = $("pc-error");
    if (!(amount >= 0) || !(hours > 0) || hours > 168 || !(weeks > 0) || weeks > 52) {
      err.textContent = "Enter your pay, hours a week (up to 168) and paid weeks (up to 52)."; err.style.display = "block"; return;
    }
    err.style.display = "none";
    var hourly = per === "hour" ? amount : per === "day" ? amount / day : per === "week" ? amount / hours : per === "month" ? amount * 12 / weeks / hours : amount / weeks / hours;
    var year = hourly * hours * weeks;
    var out = { year: year, month: year / 12, biweekly: year / 26, week: hourly * hours, day: hourly * day, hour: hourly };
    Array.prototype.forEach.call(box.querySelectorAll("[data-pc]"), function (el) { el.textContent = money(out[el.getAttribute("data-pc")]); });
  }
  var cur = $("pc-cur");
  if (cur) cur.addEventListener("change", function () {
    var o = cur.options[cur.selectedIndex];
    sym = o.getAttribute("data-sym"); locale = o.getAttribute("data-locale"); day = Number(o.getAttribute("data-day"));
    $("pc-hours").value = o.getAttribute("data-hours");
    Array.prototype.forEach.call(box.querySelectorAll(".r-label"), function (l) { l.textContent = l.textContent.replace(/\([\d.]+ hours\)/, "(" + day + " hours)"); });
    calc();
  });
  ["pc-amount", "pc-hours", "pc-weeks"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("pc-per").addEventListener("change", calc);
  calc();
})();
