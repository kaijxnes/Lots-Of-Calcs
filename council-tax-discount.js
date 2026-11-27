/* Council Tax discount calculator (/council-tax-single-person-discount/):
   the single person discount and other discounts in England and Wales.
   Rules from GOV.UK and the Local Government Finance Act 1992 s5 in
   data/uk/council-tax-discount.json (`R`):
     - a full bill assumes at least 2 adults; some people are 'disregarded'
       (full-time students, apprentices, carers and others) and don't count;
     - 25% off if only one adult counts (you live alone, or everyone else is
       disregarded), 50% off if nobody counts;
     - no bill if everyone is a full-time student, and 100% off if everyone
       is severely mentally impaired or a full-time student;
     - the Disabled Band Reduction Scheme charges the next band down, using
       the band proportions in s5 (6:7:8:9:11:13:15:18, plus 21 for band I
       in Wales); in band A it's 17% off instead.
   Children under 18 aren't counted, so only adults are entered. The page is
   built from these same functions (tools/build-council-tax-discount-pages.js). */
var CouncilTaxDiscount = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* adults living there as their main home: counted (not disregarded, including
     you if you're not), students (full-time), smi (severely mentally impaired),
     other (otherwise disregarded) */
  function discount(R, a) {
    var n = a.counted || 0, s = a.students || 0, m = a.smi || 0, o = a.other || 0;
    if (n + s + m + o === 0) return { pct: 0, why: "none" };
    if (n >= 2) return { pct: 0, why: "full" };
    if (n === 1) return { pct: R.single, why: "single" };
    if (o === 0 && m === 0) return { pct: 100, why: "students" };
    if (o === 0) return { pct: 100, why: "smi" };
    return { pct: R.allDisregarded, why: "disregarded" };
  }
  /* o: bill (full yearly bill for your band), country ("england" | "wales"), band (0 = A), disabled (bool), plus the adults */
  function calc(R, o) {
    var bill = Math.max(0, o.bill || 0), ratios = R.ratios[o.country] || R.ratios.england, b = Math.min(ratios.length - 1, Math.max(0, o.band || 0));
    var reduced = !o.disabled ? bill : b === 0 ? bill * (1 - R.bandAReduction / 100) : bill * ratios[b - 1] / ratios[b];
    var d = discount(R, o), due = reduced * (1 - d.pct / 100);
    return { bill: p2(bill), reduced: p2(reduced), bandSaving: p2(bill - reduced), pct: d.pct, why: d.why, discount: p2(reduced - due), due: p2(due), saving: p2(bill - due), monthly10: p2(due / 10), monthly12: p2(due / 12) };
  }
  return { discount: discount, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CouncilTaxDiscount;
} else {
  (function () {
    var box = document.getElementById("ct-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var WHY = {
      none: "Enter at least one adult who lives there.",
      full: "Two or more adults count, so there's no discount for who lives there.",
      single: "Single person discount: only one adult counts. You need to apply to your council.",
      students: "Everyone is a full-time student, so the home doesn't have to pay Council Tax. If you do get a bill, you can apply for an exemption.",
      smi: "100% off: everyone is severely mentally impaired or a full-time student. You need to apply to your council.",
      disregarded: "50% off: nobody living there counts as an adult for Council Tax. You need to apply to your council."
    };
    var OUT = ["ct-due", "ct-bandsave", "ct-disc", "ct-saving", "ct-m10", "ct-m12"];
    function bands() {
      var w = $("ct-country").value === "wales", sel = $("ct-band"), keep = sel.value;
      sel.innerHTML = "";
      (w ? "ABCDEFGHI" : "ABCDEFGH").split("").forEach(function (l, i) { var op = document.createElement("option"); op.value = i; op.textContent = "Band " + l; sel.appendChild(op); });
      sel.value = Number(keep) < sel.options.length ? keep : "3";
    }
    function run() {
      var err = $("ct-error"), bill = num("ct-bill"), a = { counted: num("ct-counted"), students: num("ct-students"), smi: num("ct-smi"), other: num("ct-other") };
      var bad = !(bill >= 0) || bill > 1e6 ? "Enter your yearly Council Tax." : Object.keys(a).some(function (k) { return !(a[k] >= 0) || a[k] > 50 || a[k] % 1; }) ? "Enter whole numbers of people." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ct-note").textContent = ""; return; }
      var r = CouncilTaxDiscount.calc(R, { bill: bill, country: $("ct-country").value, band: Number($("ct-band").value), disabled: $("ct-disabled").checked, counted: a.counted, students: a.students, smi: a.smi, other: a.other });
      $("ct-due").textContent = money(r.due);
      $("ct-band-row").style.display = $("ct-disabled").checked ? "" : "none";
      $("ct-bandsave").textContent = money(r.bandSaving);
      $("ct-disc").textContent = r.pct + "% (" + money(r.discount) + ")";
      $("ct-saving").textContent = money(r.saving);
      $("ct-m10").textContent = money(r.monthly10);
      $("ct-m12").textContent = money(r.monthly12);
      $("ct-note").textContent = WHY[r.why];
    }
    $("ct-country").addEventListener("change", function () { bands(); run(); });
    ["ct-bill", "ct-counted", "ct-students", "ct-smi", "ct-other"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["ct-band", "ct-disabled"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
