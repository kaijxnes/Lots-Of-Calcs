/* Shareable links for every calculator.

   Adds a "Copy a link to these numbers" button under the first calculator
   on the page. The link carries every field that differs from the page's
   own starting value, keyed by the field's id (?vat-net=250&vat-rate=5), so
   it stays short. Opening such a link puts the values back and fires the
   fields' own input/change events, so each calculator recalculates exactly
   as if someone had typed them.

   Fields in rows the calculator adds itself (accumulator legs, chart ticks)
   aren't included: they don't exist until the calculator builds them. */
(function () {
  "use strict";
  var tool = document.querySelector("main.tool");
  if (!tool || !window.URLSearchParams) return;

  function fields() {
    return Array.prototype.slice.call(tool.querySelectorAll("input[id], select[id], textarea[id]")).filter(function (el) {
      if (el.type === "search" || el.type === "hidden" || el.type === "file" || el.type === "password" || el.type === "checkbox" || el.type === "radio") return false;
      if (el.closest(".dyn-row, table, .no-share")) return false;
      return true;
    });
  }
  var list = fields();
  if (!list.length) return;

  function initial(el) {
    if (el.tagName === "SELECT") {
      for (var i = 0; i < el.options.length; i++) if (el.options[i].defaultSelected) return el.options[i].value;
      return el.options.length ? el.options[0].value : "";
    }
    return el.defaultValue;
  }

  /* ---------- open a shared link ---------- */
  var q = new URLSearchParams(window.location.search), applied = false;
  list.forEach(function (el) {
    if (!q.has(el.id)) return;
    var v = q.get(el.id);
    if (el.tagName === "SELECT" && !Array.prototype.some.call(el.options, function (o) { return o.value === v; })) return;
    el.value = v;
    applied = true;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  /* ---------- copy a link ---------- */
  function link() {
    var out = new URLSearchParams();
    /* keep any of the page's own settings (?model=, ?mode=…) that aren't field ids */
    q.forEach(function (v, k) { if (!list.some(function (el) { return el.id === k; })) out.set(k, v); });
    fields().forEach(function (el) {
      if (String(el.value) !== String(initial(el)) && el.value !== "") out.set(el.id, el.value);
    });
    var s = out.toString();
    return window.location.origin + window.location.pathname + (s ? "?" + s : "");
  }

  var bar = document.createElement("p");
  bar.className = "share-bar";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-ghost share-btn";
  btn.innerHTML = '<svg class="ico" aria-hidden="true"><use href="/icons.svg#link"></use></svg>Copy link';
  btn.title = "Copy a link to these numbers";
  btn.setAttribute("aria-label", "Copy a link to these numbers");
  var note = document.createElement("span");
  note.className = "share-note";
  note.setAttribute("aria-live", "polite");
  btn.addEventListener("click", function () {
    var url = link();
    function done(ok) {
      note.textContent = ok ? "Link copied — paste it anywhere." : url;
      setTimeout(function () { if (ok) note.textContent = ""; }, 4000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
    else done(false);
    if (navigator.share && /Android|iPhone|iPad/.test(navigator.userAgent)) navigator.share({ title: document.title, url: url }).catch(function () { /* closed */ });
  });
  bar.appendChild(btn);
  /* print or save as PDF: the print stylesheet hides the page furniture */
  if (window.print) {
    var pr = document.createElement("button");
    pr.type = "button";
    pr.className = "btn btn-ghost share-btn no-print";
    pr.innerHTML = '<svg class="ico" aria-hidden="true"><use href="/icons.svg#printer"></use></svg>Print';
    pr.title = "Print or save as PDF";
    pr.setAttribute("aria-label", "Print or save as PDF");
    pr.addEventListener("click", function () { window.print(); });
    bar.appendChild(pr);
  }
  bar.appendChild(note);
  tool.appendChild(bar);

  /* ---------- save on this device ----------
     Keeps the link to these numbers (the same one "Copy a link" makes) in
     localStorage, listed under the calculator with the date, to reopen or
     delete later. Nothing leaves the device. */
  var KEY = "loc-saved";
  function readSaved() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return null; } }
  if (readSaved() !== null) {
    var sv = document.createElement("button");
    sv.type = "button";
    sv.className = "btn btn-ghost share-btn no-print";
    sv.innerHTML = '<svg class="ico" aria-hidden="true"><use href="/icons.svg#star"></use></svg>Save';
    sv.title = "Save these numbers on this device";
    sv.setAttribute("aria-label", "Save these numbers on this device");
    bar.insertBefore(sv, note);
    var listBox = document.createElement("div");
    listBox.className = "saved-calcs no-print";
    tool.appendChild(listBox);
    var here = window.location.pathname;
    function draw() {
      var all = readSaved() || [], mine = all.filter(function (x) { return x.path === here; });
      if (!mine.length) { listBox.innerHTML = ""; return; }
      listBox.innerHTML = '<h2 class="tool-section-title">Saved on this device</h2><ul>' + mine.map(function (x) {
        return '<li><a href="' + x.url.replace(/"/g, "&quot;") + '">' + x.label.replace(/</g, "&lt;") + '</a> <button type="button" class="saved-del" data-t="' + x.t + '" aria-label="Delete saved calculation">✕</button></li>';
      }).join("") + "</ul>";
    }
    sv.addEventListener("click", function () {
      var all = readSaved() || [], url = link(), when = new Date();
      var label = when.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " + when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      all.unshift({ path: here, url: url, label: label, t: when.getTime() });
      try { localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100))); note.textContent = "Saved — find it below, on this device."; } catch (e) { note.textContent = "Couldn't save (private browsing?)."; }
      draw();
    });
    listBox.addEventListener("click", function (e) {
      var t = e.target.getAttribute && e.target.getAttribute("data-t");
      if (!t) return;
      try { localStorage.setItem(KEY, JSON.stringify((readSaved() || []).filter(function (x) { return String(x.t) !== t; }))); } catch (err) { /* ignore */ }
      draw();
    });
    draw();
  }
  if (applied) note.textContent = "Showing the numbers from a shared link.";
})();

/* Accessibility touches shared by every calculator page:
   - tab buttons in a role="tablist" get role="tab" and aria-selected, kept
     in step with the "active" class each page's own script toggles;
   - selects and inputs that calculators add in rows (accumulator legs,
     savings items) get an aria-label from their placeholder or data-field
     when they have no label of their own. */
(function () {
  "use strict";
  function tabs() {
    Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), function (list) {
      var btns = list.querySelectorAll("button");
      function sync() { Array.prototype.forEach.call(btns, function (b) { b.setAttribute("role", "tab"); b.setAttribute("aria-selected", b.classList.contains("active") ? "true" : "false"); }); }
      sync();
      if (window.MutationObserver) new MutationObserver(sync).observe(list, { subtree: true, attributes: true, attributeFilter: ["class"] });
    });
  }
  function labels(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("select, input, textarea"), function (el) {
      if (el.type === "hidden" || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.closest("label")) return;
      if (el.id && document.querySelector('label[for="' + el.id + '"]')) return;
      var name = el.getAttribute("placeholder") || (el.getAttribute("data-field") || "").replace(/[-_]/g, " ");
      if (name) el.setAttribute("aria-label", name.charAt(0).toUpperCase() + name.slice(1));
    });
  }
  tabs(); labels();
  if (window.MutationObserver) new MutationObserver(function (m) { m.forEach(function (r) { Array.prototype.forEach.call(r.addedNodes, function (n) { if (n.nodeType === 1) labels(n); }); }); }).observe(document.body, { childList: true, subtree: true });
})();

/* Thousands separators in money fields: 250000 shows as 250,000 as you
   type. Number inputs can't show commas, so a money field (by its label:
   salary, price, amount, balance...; not years, rates, counts) becomes a
   text field with a numeric keypad. Its .value still gives the plain number
   ("250000"), so every calculator reads it exactly as before, and setting
   .value formats it. */
(function () {
  "use strict";
  var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (!desc || !desc.get || !desc.set) return;
  var MONEY = /([£$€]|salary|price|amount|income|balance|loan|deposit|bill\b|spend|spent|sav(ed|ing)|goal|cost|profit|budget|\bpay\b|paid|payment|earn|borrow|principal|turnover|revenue|gross|wage|mortgage|debt|\bpot\b|contribution|tax due|cashback|\bfee\b|invest|dividend|expenses|insurance|bonus|day rate|value|down payment|\brent\b|stake|childcare|food|commute|council tax|home left|estate|pension pot|lump sum)/i;
  var NOT = /(%|percent|\bapr\b|\((years?|yrs)\)|years worked|full years|\bage\b|people|hours?\b|number of|how many|count|\bterm\b|kwh|mile|\bkm\b|\bweeks?\b|\bdays\b|minutes|guests|credits|points|odds|decimal|fraction|height|weight|depth|diameter|width|length|power|watts|efficiency|mpg|distance|dice|\bp per\b|interest rate|return)/i;
  function fmt(raw) {
    var m = /^(-?)(\d*)(\.\d*)?$/.exec(raw);
    if (!m) return raw;
    return m[1] + m[2].replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (m[3] || "");
  }
  var clean = function (s) { return String(s).replace(/[^0-9.\-]/g, ""); };
  function labelOf(el) {
    var t = (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute("aria-label") || "";
    return t.trim();
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[type="number"]'), function (el) {
    var label = labelOf(el);
    if (!label || !MONEY.test(label) || NOT.test(label)) return;
    var v = desc.get.call(el);
    el.type = "text";
    el.setAttribute("inputmode", "decimal");
    el.setAttribute("autocomplete", "off");
    Object.defineProperty(el, "value", {
      configurable: true,
      get: function () { return clean(desc.get.call(this)); },
      set: function (x) { desc.set.call(this, fmt(clean(x))); }
    });
    desc.set.call(el, fmt(clean(v)));
    el.addEventListener("input", function () {
      var shown = desc.get.call(el), pos = el.selectionStart || 0;
      var keep = shown.slice(0, pos).replace(/[^0-9.\-]/g, "").length;
      var f = fmt(clean(shown));
      if (f === shown) return;
      desc.set.call(el, f);
      /* put the cursor back after the same number of digits */
      var i = 0, n = 0;
      while (i < f.length && n < keep) { if (/[0-9.\-]/.test(f.charAt(i))) n++; i++; }
      try { el.setSelectionRange(i, i); } catch (e) { /* not focused */ }
    }, true);
  });
})();
