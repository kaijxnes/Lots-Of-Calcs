/* On a /birthday/born-in-<year>/ page: the age now by the visitor's clock,
   before and after this year's birthday. */
(function () {
  var box = document.getElementById("born-tool");
  if (!box) return;
  var born = Number(box.getAttribute("data-year"));
  var y = new Date().getFullYear();
  var after = y - born, before = after - 1;
  document.getElementById("born-age").textContent = before < 0 ? "Not born yet" : (before === 0 ? "0 or 1" : before + " or " + after);
  document.getElementById("born-label").textContent = "years old in " + y + " — " + after + " once you've had your birthday this year, " + before + " before it";
})();
