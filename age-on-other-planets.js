/* Age on other planets (/age-on-other-planets/): how many of each planet's
   years have passed since a birth date, and when the next birthday there falls.

   ORBIT is NASA's NSSDCA Planetary Fact Sheet: orbital period in Earth days
   and length of day in hours. The planet pages (tools/build-planet-pages.js)
   read the same table. */
var PlanetAges = (function () {
  "use strict";
  var ORBIT = {
    Mercury: [88.0, 4222.6], Venus: [224.7, 2802.0], Earth: [365.2, 24.0], Mars: [687.0, 24.7],
    Jupiter: [4331, 9.9], Saturn: [10747, 10.7], Uranus: [30589, 17.2], Neptune: [59800, 16.1], Pluto: [90560, 153.3]
  };
  var DAY = 86400000;

  /* born, now: Date. Returns one row per planet */
  function ages(born, now) {
    var days = (now - born) / DAY;
    return Object.keys(ORBIT).map(function (name) {
      var period = ORBIT[name][0];
      var age = days / period;
      var next = new Date(born.getTime() + Math.ceil(age + 1e-9) * period * DAY);
      if (name === "Earth") {
        /* Earth uses the calendar: whole years since birth and the next real birthday */
        var n = new Date(born.getTime());
        n.setFullYear(now.getFullYear());
        if (n <= now) n.setFullYear(now.getFullYear() + 1);
        next = n;
        age = n.getFullYear() - born.getFullYear() - 1 + ((now - new Date(n.getTime()).setFullYear(n.getFullYear() - 1)) / (n - new Date(n.getTime()).setFullYear(n.getFullYear() - 1)));
      }
      return { name: name, age: age, days: days, next: next, period: period };
    });
  }
  return { ORBIT: ORBIT, ages: ages };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PlanetAges;
} else {
  (function () {
    var input = document.getElementById("ap-born");
    if (!input) return;
    var body = document.getElementById("ap-body");
    var err = document.getElementById("ap-error");
    function fmtAge(v) { return v >= 10 ? Math.floor(v).toLocaleString("en-GB") : (Math.floor(v * 100) / 100).toLocaleString("en-GB"); }
    function calc() {
      var born = new Date(input.value + "T00:00:00");
      var now = new Date();
      if (!input.value || isNaN(born) || born > now) { err.textContent = "Enter a date of birth in the past."; err.style.display = "block"; return; }
      err.style.display = "none";
      var rows = PlanetAges.ages(born, now);
      body.textContent = "";
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        var next = r.next.getFullYear() > 9999 ? "—" : r.next.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        [r.name, fmtAge(r.age), next].forEach(function (t, i) {
          var td = document.createElement("td");
          if (i === 0 && r.name === "Earth") { var b = document.createElement("strong"); b.textContent = t; td.appendChild(b); } else td.textContent = t;
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      document.getElementById("ap-days").textContent = Math.floor(rows[0].days).toLocaleString("en-GB") + " days";
    }
    input.addEventListener("input", calc);
    calc();
  })();
}
