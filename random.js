/* Random number generator (/random-number-generator/): numbers, dice, a
   coin and prize draws, from crypto.getRandomValues with rejection sampling
   so every outcome is equally likely. */
(function () {
  var box = document.getElementById("rn-tool"); if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function rand(n) { /* 0 … n−1, unbiased */
    var max = Math.floor(4294967296 / n) * n, a = new Uint32Array(1);
    do { crypto.getRandomValues(a); } while (a[0] >= max);
    return a[0] % n;
  }
  function draw(list, k, unique) {
    var out = [], pool = list.slice();
    for (var i = 0; i < k; i++) {
      if (unique) { if (!pool.length) break; out.push(pool.splice(rand(pool.length), 1)[0]); }
      else out.push(list[rand(list.length)]);
    }
    return out;
  }
  $("rn-go").addEventListener("click", function () {
    var lo = Math.ceil(Number($("rn-min").value)), hi = Math.floor(Number($("rn-max").value)), k = Math.min(1000, Math.max(1, Math.floor(Number($("rn-count").value) || 1)));
    if (!isFinite(lo) || !isFinite(hi) || hi < lo) { $("rn-out").textContent = "Set 'from' below 'to'."; return; }
    var size = hi - lo + 1, unique = $("rn-unique").checked;
    if (unique && k > size) { $("rn-out").textContent = "Only " + size + " different numbers in that range."; return; }
    var out;
    if (unique) { var seen = {}; out = []; while (out.length < k) { var v = lo + rand(size); if (!seen[v]) { seen[v] = 1; out.push(v); } } }
    else { out = []; for (var i = 0; i < k; i++) out.push(lo + rand(size)); }
    $("rn-out").textContent = out.join(", ");
  });
  $("rn-roll").addEventListener("click", function () {
    var d = Math.min(100, Math.max(1, Math.floor(Number($("rn-dice").value) || 1))), s = Number($("rn-sides").value), r = [];
    for (var i = 0; i < d; i++) r.push(1 + rand(s));
    $("rn-dice-out").textContent = r.join("  ");
    $("rn-dice-total").textContent = d > 1 ? "Total " + r.reduce(function (a, b) { return a + b; }, 0) : "";
  });
  $("rn-flip").addEventListener("click", function () { $("rn-dice-out").textContent = rand(2) ? "Heads" : "Tails"; $("rn-dice-total").textContent = ""; });
  $("rn-pick").addEventListener("click", function () {
    var list = $("rn-list").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!list.length) { $("rn-pick-out").textContent = "Add some entries first."; $("rn-pick-note").textContent = ""; return; }
    var k = Math.max(1, Math.floor(Number($("rn-winners").value) || 1)), w = draw(list, k, $("rn-wunique").checked);
    $("rn-pick-out").textContent = w.join(", ");
    $("rn-pick-note").textContent = "From " + list.length + " entr" + (list.length === 1 ? "y" : "ies");
  });
})();
