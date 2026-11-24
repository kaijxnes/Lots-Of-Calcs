/* Light or dark theme. Runs in the <head> before the page is drawn, so a
   saved choice applies without a flash. With no saved choice it follows the
   device's own light or dark setting. Adds a "Light mode / Dark mode" button to the footer. The choice
   is kept on this device only (localStorage). */
(function () {
  "use strict";
  var KEY = "loc-theme", root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) { if (t === "light") root.setAttribute("data-theme", "light"); else root.removeAttribute("data-theme"); }
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  function system() { return mq && mq.matches ? "light" : "dark"; }
  apply(saved() || system());
  /* follow the device if it switches (say, at sunset) and nothing is saved */
  if (mq) {
    var onChange = function () { if (!saved()) { apply(system()); if (window.__themeLabel) window.__themeLabel(); } };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
  }
  function addButton() {
    var foot = document.querySelector(".site-footer");
    if (!foot || document.querySelector(".theme-toggle")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "theme-toggle";
    function label() { var light = root.getAttribute("data-theme") === "light"; b.textContent = light ? "☾ Dark mode" : "☀ Light mode"; b.setAttribute("aria-pressed", light ? "true" : "false"); }
    b.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      apply(next); label();
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: just this page */ }
    });
    label();
    window.__themeLabel = label;
    var p = document.createElement("p"); p.appendChild(b);
    foot.appendChild(p);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton); else addButton();
})();
