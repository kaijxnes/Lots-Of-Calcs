/* Recent calculators and the bookmark hint.

   On this device only (localStorage — nothing is sent anywhere), remembers
   the last few calculators used, so the homepage can show "Your recent
   calculators", and how often calculators are used here, so someone who
   keeps coming back gets one quiet suggestion to bookmark the page. The hint
   is a single line, never a pop-up; dismissing it (or bookmarking with the
   shortcut) hides it for good. Both can be cleared from the homepage. */
(function () {
  "use strict";
  var RECENT = "loc-recent", VISITS = "loc-visits", HINT = "loc-bookmark-hint", MAX = 8;

  function get(key) { try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function set(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: nothing remembered */ } }
  function del(key) { try { window.localStorage.removeItem(key); } catch (e) { /* nothing to do */ } }

  var path = window.location.pathname;
  /* A calculator page: one with something to type into or choose */
  var isCalc = path !== "/" && !!document.querySelector("main.tool input:not([type=search]), main.tool select, main.calculator button.key");

  /* ---------- remember this calculator ---------- */
  if (isCalc) {
    var h1 = document.querySelector("h1");
    var title = (h1 ? h1.textContent : document.title.split(" — ")[0]).replace(/\s+/g, " ").trim();
    var list = (get(RECENT) || []).filter(function (r) { return r && r.p !== path; });
    list.unshift({ p: path, t: title.slice(0, 80), d: Date.now() });
    set(RECENT, list.slice(0, MAX));

    var today = new Date().toISOString().slice(0, 10);
    var v = get(VISITS) || { n: 0, days: [], pages: {} };
    v.n = (v.n || 0) + 1;
    v.days = (v.days || []).filter(function (d) { return d !== today; }).concat([today]).slice(-10);
    v.pages = v.pages || {};
    v.pages[path] = (v.pages[path] || 0) + 1;
    set(VISITS, v);

    /* ---------- the bookmark hint ---------- */
    var seen;
    try { seen = window.sessionStorage.getItem(HINT); } catch (e) { seen = "1"; }
    var dismissed = get(HINT) === "dismissed";
    /* someone who's come back on another day and used a calculator a few
       times, or has opened this one before — and only once per visit */
    var returning = v.days.length >= 2 && v.n >= 3;
    if (!dismissed && !seen && (returning || v.pages[path] >= 3)) showHint();
  }

  function showHint() {
    var tool = document.querySelector("main.calculator, main.tool");
    if (!tool) return;
    try { window.sessionStorage.setItem(HINT, "1"); } catch (e) { /* fine */ }
    var ua = navigator.userAgent || "";
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var android = /Android/.test(ua);
    var mac = /Mac/.test(navigator.platform || ua);
    var how = ios ? "Tap the Share button, then <strong>Add to Home Screen</strong> or <strong>Add Bookmark</strong>"
      : android ? "Open your browser's menu and tap <strong>Add to Home screen</strong> or the bookmark star"
      : "Press <kbd>" + (mac ? "⌘" : "Ctrl") + "</kbd>+<kbd>D</kbd> to bookmark it";
    var p = document.createElement("p");
    p.className = "bookmark-hint";
    p.setAttribute("role", "note");
    p.innerHTML = '<span aria-hidden="true">⭐</span> <span>Use this often? ' + how + ".</span>";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "bookmark-hint-close";
    close.setAttribute("aria-label", "Don't show this again");
    close.textContent = "×";
    close.addEventListener("click", function () { set(HINT, "dismissed"); p.remove(); });
    p.appendChild(close);
    tool.parentNode.insertBefore(p, tool.nextSibling);
    /* bookmarked with the shortcut: no need to ask again */
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) { set(HINT, "dismissed"); if (p.parentNode) p.remove(); }
    });
  }

  /* ---------- the homepage: your recent calculators ---------- */
  if (path === "/") {
    var recent = (get(RECENT) || []).filter(function (r) { return r && r.p && r.p.charAt(0) === "/"; });
    var firstGroup = document.querySelector("[data-group]");
    if (!recent.length || !firstGroup) return;

    var cardFor = function (r) {
      var exact = document.querySelector('a.hub-card[href="' + r.p.replace(/"/g, "") + '"]:not(.hub-more)');
      if (exact) return exact.cloneNode(true);
      /* a page inside a calculator (a salary, a price): its calculator's icon */
      var parent = null, parts = r.p.split("/").filter(Boolean);
      while (parts.length && !parent) {
        parts.pop();
        parent = document.querySelector('a.hub-card[href="/' + parts.join("/") + (parts.length ? "/" : "") + '"]:not(.hub-more)');
      }
      var a = document.createElement("a");
      a.className = "hub-card";
      a.href = r.p;
      var icon = document.createElement("span");
      icon.className = "icon";
      icon.textContent = parent ? parent.querySelector(".icon").textContent : "🧮";
      var t = document.createElement("div");
      t.className = "title";
      t.textContent = r.t;
      var d = document.createElement("div");
      d.className = "desc";
      d.textContent = parent ? parent.querySelector(".title").textContent : "Recently used";
      a.appendChild(icon); a.appendChild(t); a.appendChild(d);
      return a;
    };

    var head = document.createElement("div");
    head.className = "hub-group-title recent-title";
    var label = document.createElement("span");
    label.textContent = "Your recent calculators";
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "recent-clear";
    clear.textContent = "Clear";
    clear.title = "Forget the calculators you've used on this device";
    head.appendChild(label);
    head.appendChild(clear);
    var grid = document.createElement("div");
    grid.className = "hub-grid recent-grid";
    recent.slice(0, 6).forEach(function (r) {
      var c = cardFor(r);
      c.removeAttribute("hidden");
      grid.appendChild(c);
    });
    firstGroup.parentNode.insertBefore(head, firstGroup);
    firstGroup.parentNode.insertBefore(grid, firstGroup);
    clear.addEventListener("click", function () {
      del(RECENT); del(VISITS);
      head.remove(); grid.remove();
    });
    /* while searching, results come first */
    var search = document.getElementById("hub-search");
    if (search) search.addEventListener("input", function () {
      var on = search.value.trim() !== "";
      head.hidden = on; grid.hidden = on;
    });
  }
})();
