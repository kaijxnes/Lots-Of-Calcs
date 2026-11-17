/* The "page not found" page. Two ways back to something useful:

   - the nearest real page above the address asked for, found by checking
     each parent folder in turn (/salary/uk/123-after-tax/ → /salary/uk/);
   - the calculators whose names match words in the address, so a typo like
     /mortage-calculator/ still offers the mortgage calculator. The search box
     starts with those words and can be edited. */
(function () {
  "use strict";
  var input = document.getElementById("nf-search");
  var grid = document.getElementById("nf-cards");
  if (!input || !grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".hub-card"));
  var heading = document.getElementById("nf-heading");
  var none = document.getElementById("nf-none");
  var POPULAR = ["/salary/", "/basic/", "/percent/", "/vat/", "/mortgage/", "/cashback/", "/number-to-words/", "/date-diff/", "/fractions/"];
  var IGNORE = { calculator: 1, calculators: 1, calc: 1, html: 1, htm: 1, php: 1, index: 1, the: 1, and: 1, www: 1 };

  var text = cards.map(function (c) {
    return (c.getAttribute("href") + " " + c.textContent).toLowerCase();
  });

  function words(s) {
    return s.toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 2 && !IGNORE[w]; });
  }

  function show(list) {
    cards.forEach(function (c) { c.hidden = true; });
    list.forEach(function (c) { c.hidden = false; grid.appendChild(c); });
  }

  function popular() {
    var list = [];
    POPULAR.forEach(function (href) {
      var c = cards.filter(function (x) { return x.getAttribute("href") === href; })[0];
      if (c) list.push(c);
    });
    return list;
  }

  function search() {
    var w = words(input.value);
    if (!w.length) {
      heading.textContent = "Popular calculators";
      none.hidden = true;
      show(popular());
      return;
    }
    /* A word matches in full, or by its first four letters to forgive a typo */
    var scored = cards.map(function (c, i) {
      var score = 0;
      w.forEach(function (word) {
        if (text[i].indexOf(word) !== -1) score += 2;
        else if (word.length >= 6 && text[i].indexOf(word.slice(0, 4)) !== -1) score += 1;
      });
      return { c: c, score: score };
    }).filter(function (x) { return x.score > 0; });
    scored.sort(function (a, b) { return b.score - a.score; });
    var list = scored.slice(0, 9).map(function (x) { return x.c; });
    heading.textContent = list.length ? "Calculators that might be what you wanted" : "Popular calculators";
    none.hidden = list.length > 0;
    show(list.length ? list : popular());
  }

  var asked = decodeURIComponent(window.location.pathname);
  input.value = words(asked).join(" ");
  input.addEventListener("input", search);
  search();

  /* The nearest page that exists above this address */
  var nearest = document.getElementById("nf-nearest");
  var parts = asked.replace(/\.html?$/, "").split("/").filter(Boolean);
  function tryParent() {
    if (!parts.length || !window.fetch) return;
    var url = "/" + parts.join("/") + "/";
    parts.pop();
    if (url === window.location.pathname) return tryParent();
    fetch(url, { method: "HEAD" }).then(function (r) {
      if (!r.ok || r.redirected) return tryParent();
      nearest.innerHTML = "";
      nearest.appendChild(document.createTextNode("Were you looking for "));
      var a = document.createElement("a");
      a.href = url;
      a.textContent = "lotsofcalcs.com" + url;
      nearest.appendChild(a);
      nearest.appendChild(document.createTextNode("?"));
      nearest.hidden = false;
    }).catch(function () { /* offline: the search below still works */ });
  }
  tryParent();
})();
