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
  btn.textContent = "🔗 Copy a link to these numbers";
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
  bar.appendChild(note);
  tool.appendChild(bar);
  if (applied) note.textContent = "Showing the numbers from a shared link.";
})();
