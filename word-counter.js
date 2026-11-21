/* Word counter (/word-counter/): counts as you type; nothing leaves the page. */
(function () {
  var box = document.getElementById("wc-tool"); if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function mins(words, wpm) { if (!words || !(wpm > 0)) return "0 min"; var s = Math.round(words / wpm * 60); return s < 60 ? s + " sec" : Math.floor(s / 60) + " min" + (s % 60 ? " " + (s % 60) + " sec" : ""); }
  function calc() {
    var t = $("wc-text").value, w = (t.match(/\S+/g) || []).length;
    $("wc-words").textContent = w.toLocaleString("en-GB");
    $("wc-chars").textContent = t.length.toLocaleString("en-GB");
    $("wc-nospace").textContent = t.replace(/\s/g, "").length.toLocaleString("en-GB");
    $("wc-sentences").textContent = (t.match(/[^.!?]*[A-Za-z0-9][^.!?]*([.!?]+|$)/g) || []).filter(function (s) { return s.trim(); }).length;
    $("wc-paras").textContent = t.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
    $("wc-read").textContent = mins(w, Number($("wc-rwpm").value));
    $("wc-speak").textContent = mins(w, Number($("wc-swpm").value));
  }
  ["wc-text", "wc-rwpm", "wc-swpm"].forEach(function (id) { $(id).addEventListener("input", calc); });
  calc();
})();
