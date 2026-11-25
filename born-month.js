/* On a /birthday/born-in-<year>/<month>/ page: every row's age as of the
   visitor's own date (the page is built with the ages on its build date). */
(function () {
  var table = document.getElementById("bm-table");
  if (!table) return;
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var DAY = 86400000;
  function ymd(a, b) {
    var y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m -= 1; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    return [y, m, d];
  }
  var n = function (v) { return v.toLocaleString("en-GB"); };
  var label = today.getDate() + " " + MONTHS[today.getMonth()] + " " + today.getFullYear();
  Array.prototype.forEach.call(document.querySelectorAll(".bm-asof"), function (el) { el.textContent = label; });
  Array.prototype.forEach.call(table.querySelectorAll("tr[data-dob]"), function (tr) {
    var p = tr.getAttribute("data-dob").split("-"), dob = new Date(+p[0], +p[1] - 1, +p[2]);
    var c = tr.querySelectorAll("td");
    if (dob > today) { c[2].textContent = "Not born yet"; c[3].textContent = "—"; c[4].textContent = "—"; return; }
    var a = ymd(dob, today), lived = Math.round((today - dob) / DAY);
    var next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    var until = Math.round((next - today) / DAY);
    c[2].textContent = a[0] + " years, " + a[1] + " month" + (a[1] === 1 ? "" : "s") + ", " + a[2] + " day" + (a[2] === 1 ? "" : "s");
    c[3].textContent = n(lived);
    c[4].textContent = until === 0 ? "Today!" : n(until) + " day" + (until === 1 ? "" : "s");
  });
})();
