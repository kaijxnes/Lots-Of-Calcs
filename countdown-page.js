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
  }
  tick();
  setInterval(tick, 1000);
})();
