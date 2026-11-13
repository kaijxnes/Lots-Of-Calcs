/* The cheque writer (/cheque-writer/): an amount in figures becomes the
   words line and the figures box for a UK cheque, a US check, an Indian
   cheque or a euro cheque, drawn on a preview. Wording comes from
   number-words.js, the same module the number-in-words pages are built with. */
(function () {
  var box = document.getElementById("cw-tool");
  if (!box || typeof NumberWords === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var SYMBOL = { uk: "£", us: "$", in: "₹", eu: "€" };

  function figures(amount, style) {
    var cents = Math.round(amount * 100);
    var major = Math.floor(cents / 100), minor = cents % 100;
    var whole = style === "in" ? NumberWords.grouped(major, "indian") : major.toLocaleString("en-GB");
    if (style === "in") return SYMBOL.in + whole + (minor ? "." + (minor < 10 ? "0" : "") + minor : "/-");
    return SYMBOL[style] + whole + "." + (minor < 10 ? "0" : "") + minor;
  }

  function calc() {
    var raw = String($("cw-amount").value).replace(/[\s,£$€₹]/g, "");
    var amount = Number(raw);
    var style = $("cw-style").value;
    var err = $("cw-error");
    if (raw === "" || !isFinite(amount) || amount <= 0) { err.textContent = "Enter an amount above zero."; err.style.display = "block"; return; }
    if (amount >= 1e12) { err.textContent = "That's more than a cheque can carry."; err.style.display = "block"; return; }
    err.style.display = "none";
    var words = NumberWords.chequeWords(amount, style);
    $("cw-words").textContent = words;
    $("cw-figures").textContent = figures(amount, style);
    $("cq-words").textContent = words;
    $("cq-figures").textContent = figures(amount, style);
    $("cq-payee").textContent = $("cw-payee").value || "Payee name";
    $("cq-date").textContent = $("cw-date").value ? new Date($("cw-date").value + "T12:00:00").toLocaleDateString(style === "us" ? "en-US" : "en-GB") : "";
    $("cq-pay").textContent = style === "us" ? "Pay to the order of" : "Pay";
  }

  ["cw-amount", "cw-payee", "cw-date"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("cw-style").addEventListener("change", calc);
  if (!$("cw-date").value) {
    var d = new Date();
    $("cw-date").value = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  calc();
})();
