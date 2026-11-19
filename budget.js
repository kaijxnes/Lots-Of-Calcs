/* 50/30/20 budget calculator (/50-30-20-budget/): take-home pay split into
   needs, wants and savings. Take-home comes from a salary through
   tax-engine.js and the place's rules in data/tax/ (default options, so no
   pension or student loan unless the place's defaults include them), or is
   typed in directly. The split can be changed, e.g. to 70/20/10. */
(function () {
  var box = document.getElementById("bg-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var loc = $("bg-location"), STORE = "salary-location";
  var chain = null, currency = "GBP", loading = 0;
  function money(v, whole) { return TaxEngine.money(v, currency, whole); }
  function store(v) {
    try { if (v === undefined) return window.localStorage.getItem(STORE); window.localStorage.setItem(STORE, v); } catch (e) { /* private mode */ }
    return null;
  }
  function selected() { return loc.options[loc.selectedIndex]; }
  function manual() { return loc.value === "manual"; }

  function calc() {
    var err = $("bg-error");
    var amount = Number(String($("bg-amount").value).replace(/[\s,]/g, ""));
    var needs = Number($("bg-needs").value), wants = Number($("bg-wants").value), save = Number($("bg-save").value);
    if (!(amount > 0)) { err.textContent = manual() ? "Enter your monthly take-home pay." : "Enter your salary."; err.style.display = "block"; return; }
    if (!(needs >= 0 && wants >= 0 && save >= 0) || Math.abs(needs + wants + save - 100) > 0.01) {
      err.textContent = "The three percentages need to add up to 100 (now " + (needs + wants + save) + ")."; err.style.display = "block"; return;
    }
    if (!manual() && !chain) return;
    err.style.display = "none";
    var month = manual() ? amount : TaxEngine.compute(chain, amount, {}).net / 12;
    var parts = { needs: month * needs / 100, wants: month * wants / 100, save: month * save / 100 };
    $("bg-takehome").textContent = money(month) + " a month";
    $("bg-takehome-row").style.display = manual() ? "none" : "";
    ["needs", "wants", "save"].forEach(function (k) {
      $("bg-" + k + "-m").textContent = money(parts[k]);
      $("bg-" + k + "-w").textContent = money(parts[k] * 12 / 52);
      $("bg-" + k + "-y").textContent = money(parts[k] * 12, true);
    });
    $("bg-needs-pct").textContent = needs + "%";
    $("bg-wants-pct").textContent = wants + "%";
    $("bg-save-pct").textContent = save + "%";
    /* three months of needs, built from the savings share */
    var fund = parts.needs * 3;
    $("bg-fund").textContent = parts.save > 0
      ? money(fund, true) + " — about " + Math.ceil(fund / parts.save) + " months of the savings share"
      : money(fund, true);
  }

  function switchTo(first) {
    if (manual()) {
      chain = null;
      $("bg-amount-label").textContent = "Take-home pay a month";
      $("bg-cur-note").textContent = "";
      if (!first) $("bg-amount").value = "2000";
      calc();
      return;
    }
    var opt = selected(), next = opt.getAttribute("data-currency");
    $("bg-amount-label").textContent = "Salary a year, before tax";
    if (!first && (next !== currency || Number($("bg-amount").value) < 10000)) $("bg-amount").value = opt.getAttribute("data-gross");
    currency = next;
    $("bg-cur-note").textContent = "in " + currency;
    if (!first) store(loc.value);
    var ticket = ++loading;
    TaxEngine.load(loc.value).then(function (c) {
      if (ticket !== loading) return;
      chain = c;
      calc();
    }).catch(function () {
      if (ticket !== loading) return;
      $("bg-error").textContent = "The tax figures for " + opt.textContent + " couldn't be loaded — check your connection and try again.";
      $("bg-error").style.display = "block";
    });
  }

  ["bg-amount", "bg-needs", "bg-wants", "bg-save"].forEach(function (id) { $(id).addEventListener("input", calc); });
  loc.addEventListener("change", function () { switchTo(false); });
  document.querySelectorAll("[data-split]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.getAttribute("data-split").split("/");
      $("bg-needs").value = p[0]; $("bg-wants").value = p[1]; $("bg-save").value = p[2];
      calc();
    });
  });

  /* a page for a salary keeps its place; the calculator remembers the visitor's */
  function has(id) { return !!id && Array.prototype.some.call(loc.options, function (o) { return o.value === id; }); }
  var start = window.location.hash.slice(1);
  if (!has(start) && box.getAttribute("data-remember") === "1") start = store();
  if (has(start) && start !== loc.value) { loc.value = start; switchTo(false); } else switchTo(true);
})();
