/* The live countdown on a /days-until/<event>/ page. The page lists the
   event's dates for the coming years (data-dates, ISO); this picks the first
   one that hasn't finished yet, by the visitor's own clock. */
(function () {
  var box = document.getElementById("cd-tool");
  if (!box) return;
  var dates = box.getAttribute("data-dates").split(",");
  var name = box.getAttribute("data-name");
  var $ = function (id) { return document.getElementById(id); };
  function pick(now) {
    for (var i = 0; i < dates.length; i++) {
      var end = new Date(dates[i] + "T00:00:00");
      end.setDate(end.getDate() + 1);
      if (end > now) return new Date(dates[i] + "T00:00:00");
    }
    return null;
  }
  function tick() {
    var now = new Date();
    var target = pick(now);
    if (!target) return;
    var ms = target - now;
    if (ms <= 0) {
      $("cd-days").textContent = "Today";
      $("cd-label").textContent = "it's " + name + "!";
      $("cd-detail").textContent = "";
      return;
    }
    var days = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    var sleeps = Math.ceil(ms / 86400000);
    $("cd-days").textContent = days + (days === 1 ? " day" : " days");
    $("cd-label").textContent = "until " + name + ", " + target.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("cd-detail").textContent = days + "d " + h + "h " + m + "m " + s + "s · " + sleeps + (sleeps === 1 ? " sleep" : " sleeps") + " · " + Math.floor(days / 7) + " weeks and " + (days % 7) + " days";
    breakdown(now, target, days, ms);
  }
  /* the whole days strictly between today and the day itself */
  var lastKey = "";
  function breakdown(now, target, days, ms) {
    var grid = $("cd-grid");
    if (!grid) return;
    grid.hidden = false;
    $("cd-weeks").textContent = Math.floor(days / 7) + (Math.floor(days / 7) === 1 ? " week" : " weeks") + ", " + (days % 7) + (days % 7 === 1 ? " day" : " days");
    $("cd-hours").textContent = Math.floor(ms / 3600000).toLocaleString("en-GB");
    var key = now.toDateString() + "|" + target.toDateString();
    if (key === lastKey) return;
    lastKey = key;
    var hols = {};
    if (typeof UK_BANK_HOLIDAYS !== "undefined") UK_BANK_HOLIDAYS["england-and-wales"].forEach(function (x) { hols[x.date] = true; });
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    var weekdays = 0, working = 0, saturdays = 0;
    while (d < end) {
      var wd = d.getDay();
      var iso = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
      if (wd > 0 && wd < 6) { weekdays++; if (!hols[iso]) working++; }
      if (wd === 6) saturdays++;
      d.setDate(d.getDate() + 1);
    }
    $("cd-weekdays").textContent = weekdays.toLocaleString("en-GB");
    if ($("cd-working")) $("cd-working").textContent = working.toLocaleString("en-GB");
    $("cd-weekends").textContent = saturdays.toLocaleString("en-GB");
  }
  tick();
  setInterval(tick, 1000);
})();
