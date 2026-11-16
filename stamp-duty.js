/* Stamp duty calculator (/stamp-duty-calculator/): the tax on buying a home
   in England and Northern Ireland (SDLT), Scotland (LBTT) or Wales (LTT).

   Rates are data/property/uk-stamp-duty.json (from GOV.UK, Revenue
   Scotland and the Welsh Government), which the generator writes into the
   page as UK_STAMP_DUTY so the browser and the pages use the same figures.
   Each band's rate applies only to the part of the price within it.
     England: first-time buyers pay 0% to £300,000 and 5% to £500,000, with
       no relief above £500,000; additional homes pay 5% on top of every band
       (price £40,000 or more); non-UK residents 2% on top.
     Scotland: first-time buyers have a £175,000 nil band; additional homes
       pay the Additional Dwelling Supplement, 8% of the whole price.
     Wales: no first-time buyer relief; additional homes use the higher
       residential rates. */
var StampDuty = (function () {
  "use strict";
  /* bands: [[from, rate%]...] -> rows for price */
  function slices(price, bands, extra) {
    var rows = [], total = 0;
    for (var i = 0; i < bands.length; i++) {
      var from = bands[i][0], to = i + 1 < bands.length ? bands[i + 1][0] : Infinity;
      var part = Math.min(price, to) - from;
      if (part <= 0) continue;
      var rate = bands[i][1] + (extra || 0);
      var tax = part * rate / 100;
      rows.push({ from: from, to: to === Infinity ? null : to, rate: rate, part: part, tax: tax });
      total += tax;
    }
    return { rows: rows, total: total };
  }

  /* region: england | scotland | wales; buyer: home | ftb | additional */
  function calc(R, region, price, buyer, nonResident) {
    var d = R[region], out, note = "";
    if (region === "england") {
      var extra = (buyer === "additional" && price >= d.additional.minPrice ? d.additional.surcharge : 0) + (nonResident ? d.nonResident.surcharge : 0);
      if (buyer === "ftb" && price <= d.firstTimeBuyer.maxPrice) out = slices(price, d.firstTimeBuyer.bands, nonResident ? d.nonResident.surcharge : 0);
      else {
        if (buyer === "ftb") note = "First-time buyer relief doesn't apply above £" + d.firstTimeBuyer.maxPrice.toLocaleString("en-GB") + ", so standard rates are charged.";
        out = slices(price, d.bands, extra);
      }
    } else if (region === "scotland") {
      var bands = d.bands;
      if (buyer === "ftb") { bands = d.bands.slice(); bands[1] = [d.firstTimeBuyer.nilBand, bands[1][1]]; }
      out = slices(price, bands, 0);
      if (buyer === "additional" && price >= d.additional.minPrice) {
        var ads = price * d.additional.ads / 100;
        out.rows.push({ from: null, to: null, rate: d.additional.ads, part: price, tax: ads, ads: true });
        out.total += ads;
      }
    } else {
      if (buyer === "ftb") note = "Wales has no first-time buyer relief, so the main rates apply.";
      out = slices(price, buyer === "additional" ? d.higherBands : d.bands, 0);
    }
    out.note = note;
    out.effective = price > 0 ? out.total / price * 100 : 0;
    return out;
  }
  function pounds(v) { return "£" + Math.round(v).toLocaleString("en-GB"); }
  return { calc: calc, slices: slices, pounds: pounds };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StampDuty;
} else {
  (function () {
    var box = document.getElementById("sd-tool");
    if (!box || typeof UK_STAMP_DUTY === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var S = StampDuty, R = UK_STAMP_DUTY;
    function band(r) {
      if (r.ads) return "Additional Dwelling Supplement (" + r.rate + "% of the price)";
      return (r.to ? S.pounds(r.from) + "–" + S.pounds(r.to) : "Over " + S.pounds(r.from)) + " at " + r.rate + "%";
    }
    function calc() {
      var price = Number(String($("sd-price").value).replace(/[\s,£]/g, "")), region = $("sd-region").value, err = $("sd-error");
      $("sd-nr-row").style.display = region === "england" ? "" : "none";
      if (!(price >= 0) || $("sd-price").value === "") { err.textContent = "Enter the price."; err.style.display = "block"; return; }
      if (price > 1e9) { err.textContent = "That's beyond what this is useful for."; err.style.display = "block"; return; }
      err.style.display = "none";
      var r = S.calc(R, region, price, $("sd-buyer").value, region === "england" && $("sd-nr").checked);
      $("sd-total").textContent = S.pounds(r.total);
      $("sd-label").textContent = R[region].tax + " (" + R[region].short + ")";
      $("sd-eff").textContent = (Math.round(r.effective * 100) / 100).toLocaleString("en-GB") + "% of the price";
      $("sd-note").textContent = r.note;
      $("sd-note").style.display = r.note ? "block" : "none";
      var body = $("sd-bands");
      while (body.firstChild) body.removeChild(body.firstChild);
      r.rows.forEach(function (row) {
        var tr = document.createElement("tr");
        [band(row), S.pounds(row.part), S.pounds(row.tax)].forEach(function (t) { var td = document.createElement("td"); td.textContent = t; tr.appendChild(td); });
        body.appendChild(tr);
      });
    }
    ["sd-price"].forEach(function (id) { $(id).addEventListener("input", calc); });
    ["sd-region", "sd-buyer", "sd-nr"].forEach(function (id) { $(id).addEventListener("change", calc); });
    calc();
  })();
}
