/* The inflation calculator at /inflation/.

   Price indices come from data/inflation/series.json (built by
   tools/build-inflation.js from the ONS and BLS downloads). A year uses its
   annual average index; "latest" uses the most recent month published. The
   page is generated with £100 from 2000 already worked out; this takes over
   once the data has loaded. */
(function () {
  var el = {
    country: document.getElementById("inf-country"),
    measure: document.getElementById("inf-measure"),
    amount: document.getElementById("inf-amount"),
    from: document.getElementById("inf-from"),
    to: document.getElementById("inf-to"),
    error: document.getElementById("inf-error"),
    worth: document.getElementById("inf-worth"),
    label: document.getElementById("inf-label"),
    total: document.getElementById("inf-total"),
    avg: document.getElementById("inf-avg"),
    back: document.getElementById("inf-back"),
    backLabel: document.getElementById("inf-back-label"),
    source: document.getElementById("inf-source")
  };
  if (!el.country) return;

  var MEASURES = {
    UK: [["uk-cpi", "CPI"], ["uk-cpih", "CPIH"], ["uk-rpi", "RPI long-run (from 1800)"]],
    US: [["us-cpi", "CPI-U"]]
  };
  var data = null;

  function series() { return data.series[el.measure.value]; }

  function money(s, v) {
    if (!isFinite(v)) return "—";
    return s.symbol + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(v) { return isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) + "%" : "—"; }

  function years(s) {
    return Object.keys(s.annual).map(Number).sort(function (a, b) { return b - a; });
  }

  function fill(select, list, keep) {
    select.textContent = "";
    list.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0];
      opt.textContent = o[1];
      select.appendChild(opt);
    });
    if (keep !== undefined && list.some(function (o) { return String(o[0]) === String(keep); })) select.value = keep;
  }

  /* Year lists follow the measure: CPI starts in 1988, the long-run series in 1800 */
  function drawYears() {
    var s = series();
    var ys = years(s);
    var wantFrom = Number(el.from.value);
    if (ys.indexOf(wantFrom) === -1) {
      // Nearest year the measure has
      wantFrom = ys.reduce(function (best, y) { return Math.abs(y - wantFrom) < Math.abs(best - wantFrom) ? y : best; }, ys[0]);
    }
    var keepTo = el.to.value;
    fill(el.from, ys.map(function (y) { return [y, String(y)]; }), wantFrom);
    fill(el.to, [["latest", s.latest.label + " (latest)"]].concat(ys.map(function (y) { return [y, String(y)]; })), keepTo);
    var link = document.createElement("a");
    link.href = s.url;
    link.rel = "nofollow noopener";
    link.target = "_blank";
    link.textContent = s.source;
    el.source.textContent = s.note + " Source: ";
    el.source.appendChild(link);
    el.source.appendChild(document.createTextNode("."));
  }

  function drawMeasures() {
    fill(el.measure, MEASURES[el.country.value]);
  }

  function setError(message) {
    el.error.textContent = message || "";
    el.error.style.display = message ? "block" : "none";
  }

  function calculate() {
    if (!data) return;
    var s = series();
    var amount = Number(String(el.amount.value).replace(/[\s,£$]/g, ""));
    if (!isFinite(amount) || amount < 0) return setError("Enter an amount of money.");
    setError("");

    var from = Number(el.from.value);
    var latest = el.to.value === "latest";
    var fromIdx = s.annual[from];
    var toIdx = latest ? s.latest.value : s.annual[el.to.value];
    var toLabel = latest ? s.latest.label : el.to.value;
    var span = latest ? s.latest.year + (s.latest.month - 0.5) / 12 - (from + 0.5) : Number(el.to.value) - from;

    var ratio = toIdx / fromIdx;
    var a = s.symbol + amount.toLocaleString("en-GB", { maximumFractionDigits: 2 });
    el.worth.textContent = money(s, amount * ratio);
    el.label.textContent = a + " in " + from + ", in " + toLabel + " money";
    el.total.textContent = pct((ratio - 1) * 100);
    el.avg.textContent = span > 0 ? pct((Math.pow(ratio, 1 / span) - 1) * 100) : "—";
    el.backLabel.textContent = a + " in " + toLabel + ", in " + from + " money";
    el.back.textContent = money(s, amount / ratio);
  }

  el.country.addEventListener("change", function () {
    drawMeasures();
    drawYears();
    calculate();
  });
  el.measure.addEventListener("change", function () {
    drawYears();
    calculate();
  });
  [el.amount].forEach(function (x) { x.addEventListener("input", calculate); });
  [el.from, el.to].forEach(function (x) { x.addEventListener("change", calculate); });

  fetch("/data/inflation/series.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (json) {
      data = json;
      calculate();
    })
    .catch(function () {
      el.amount.disabled = el.from.disabled = el.to.disabled = el.country.disabled = el.measure.disabled = true;
      setError("The price data could not be loaded, so the calculator is switched off. The tables below are unaffected.");
    });
})();
