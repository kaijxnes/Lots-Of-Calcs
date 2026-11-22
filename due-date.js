/* Pregnancy due date calculator (tools/build-due-date-pages.js): 280 days
   from the first day of the last period, with today's weeks and days. Uses
   the visitor's own local date for "today". */
(function () {
  "use strict";
  var box = document.getElementById("dd-tool");
  if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  var DUE = Number(box.getAttribute("data-due")), EARLY = Number(box.getAttribute("data-early")), LATE = Number(box.getAttribute("data-late"));
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function day(y, m, d) { return new Date(y, m, d, 12); }
  function add(d, n) { return day(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function dm(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function run() {
    var v = $("dd-lmp").value;
    if (!v) return;
    var p = v.split("-"), lmp = day(+p[0], +p[1] - 1, +p[2]), due = add(lmp, DUE);
    var n = new Date(), today = day(n.getFullYear(), n.getMonth(), n.getDate());
    var since = Math.round((today - lmp) / 86400000), left = Math.round((due - today) / 86400000);
    $("dd-due").textContent = dm(due);
    $("dd-due-label").textContent = "estimated due date (" + DAYS[due.getDay()] + ")";
    $("dd-early").textContent = dm(add(lmp, EARLY));
    $("dd-late").textContent = dm(add(lmp, LATE));
    if (since < 0) $("dd-now").textContent = "That date is in the future";
    else if (since > LATE) $("dd-now").textContent = "More than 42 weeks ago";
    else $("dd-now").textContent = Math.floor(since / 7) + " weeks " + (since % 7) + " day" + (since % 7 === 1 ? "" : "s");
    $("dd-left").textContent = since < 0 || since > LATE ? "—" : left > 0 ? left + " day" + (left === 1 ? "" : "s") : left === 0 ? "Today" : Math.abs(left) + " day" + (left === -1 ? "" : "s") + " past";
  }
  $("dd-lmp").addEventListener("input", run);
  $("dd-lmp").addEventListener("change", run);
  run();
})();
