/* Space travel time (/how-long-to-get-to/): how long a straight-line trip
   from Earth to the Moon, the Sun, a planet or the nearest star takes at a
   given speed.

   Distances from Earth are NASA NSSDCA fact sheets: for the planets the
   minimum and maximum distance from Earth; for the Moon its mean perigee,
   mean distance and mean apogee; for the Sun Earth's perihelion, semimajor
   axis and aphelion. Proxima Centauri is 4.2465 light-years (NASA).
   The pages (tools/build-space-travel-pages.js) use this same module. */
var SpaceTravel = (function () {
  "use strict";
  var LY = 9460730472580.8; /* km in a light-year (IAU) */
  var C = 299792.458; /* speed of light, km/s */
  var MILE = 1.609344;

  /* d: distances in km. closest/farthest always; average where NASA gives one */
  var DEST = [
    { slug: "moon", name: "the Moon", short: "Moon", d: { closest: 363300, average: 384400, farthest: 405500 }, def: "average",
      trip: { craft: "Apollo 11", took: "about 3 days 4 hours", detail: "launched 16 July 1969 and went into orbit round the Moon on 19 July" } },
    { slug: "sun", name: "the Sun", short: "Sun", d: { closest: 147095000, average: 149598000, farthest: 152100000 }, def: "average",
      trip: { craft: "Parker Solar Probe", took: "86 days", detail: "launched 12 August 2018 and made its first close pass of the Sun on 6 November 2018, after a flyby of Venus" } },
    { slug: "mercury", name: "Mercury", short: "Mercury", d: { closest: 77300000, farthest: 221900000 }, def: "closest",
      trip: { craft: "MESSENGER", took: "about 6 years 7 months", detail: "launched 3 August 2004 and went into orbit on 18 March 2011, after flybys of Earth, Venus and Mercury to slow it down" } },
    { slug: "venus", name: "Venus", short: "Venus", d: { closest: 38200000, farthest: 261000000 }, def: "closest",
      trip: { craft: "Magellan", took: "about 15 months", detail: "launched 4 May 1989 and went into orbit on 10 August 1990" } },
    { slug: "mars", name: "Mars", short: "Mars", d: { closest: 54600000, farthest: 401400000 }, def: "closest",
      trip: { craft: "Perseverance", took: "203 days", detail: "launched 30 July 2020 and landed on 18 February 2021, travelling about 471 million km on its curved path" } },
    { slug: "jupiter", name: "Jupiter", short: "Jupiter", d: { closest: 588500000, farthest: 968500000 }, def: "closest",
      trip: { craft: "Juno", took: "about 4 years 11 months", detail: "launched 5 August 2011 and went into orbit on 5 July 2016, after swinging back past Earth in 2013" } },
    { slug: "saturn", name: "Saturn", short: "Saturn", d: { closest: 1205500000, farthest: 1658600000 }, def: "closest",
      trip: { craft: "Cassini", took: "about 6 years 8 months", detail: "launched 15 October 1997 and went into orbit on 1 July 2004, using flybys of Venus, Earth and Jupiter" } },
    { slug: "uranus", name: "Uranus", short: "Uranus", d: { closest: 2580600000, farthest: 3153500000 }, def: "closest",
      trip: { craft: "Voyager 2", took: "about 8 years 5 months", detail: "launched 20 August 1977 and flew past Uranus on 24 January 1986 (the only visit so far)" } },
    { slug: "neptune", name: "Neptune", short: "Neptune", d: { closest: 4319000000, farthest: 4711000000 }, def: "closest",
      trip: { craft: "Voyager 2", took: "about 12 years", detail: "launched 20 August 1977 and flew past Neptune on 25 August 1989 (the only visit so far)" } },
    { slug: "pluto", name: "Pluto", short: "Pluto", d: { closest: 4284700000, farthest: 7528000000 }, def: "closest",
      trip: { craft: "New Horizons", took: "about 9 years 6 months", detail: "launched 19 January 2006 and flew past Pluto on 14 July 2015, with a speed boost from Jupiter on the way" } },
    { slug: "proxima-centauri", name: "Proxima Centauri", short: "the nearest star", d: { average: 4.2465 * LY }, def: "average", star: true, trip: null }
  ];

  /* kmh: speed in km/h. note says where the figure comes from */
  var SPEEDS = [
    { slug: "walking", name: "Walking", how: "walking", kmh: 5, label: "5 km/h (3.1 mph)", note: "a steady walking pace" },
    { slug: "by-car", name: "By car", how: "driving at 70 mph", kmh: 70 * MILE, label: "70 mph (113 km/h)", note: "UK motorway speed limit" },
    { slug: "by-plane", name: "By plane", how: "flying in a passenger jet", kmh: 900, label: "900 km/h (559 mph)", note: "a typical airliner's cruising speed" },
    { slug: "speed-of-sound", name: "At the speed of sound", how: "at the speed of sound", kmh: 343 * 3.6, label: "1,235 km/h (767 mph)", note: "343 m/s, the speed of sound in air at 20 °C" },
    { slug: "space-station-speed", name: "At space station speed", how: "at the speed of the International Space Station", kmh: 17500 * MILE, label: "28,164 km/h (17,500 mph)", note: "the ISS's orbital speed (NASA)" },
    { slug: "apollo-speed", name: "At Apollo speed", how: "at Apollo 10's top speed", kmh: 24791 * MILE, label: "39,897 km/h (24,791 mph)", note: "Apollo 10 coming home from the Moon in 1969 (NASA)" },
    { slug: "fastest-spacecraft", name: "At the fastest spacecraft's speed", how: "at Parker Solar Probe's top speed", kmh: 430000 * MILE, label: "692,018 km/h (430,000 mph)", note: "Parker Solar Probe's top speed near the Sun, the fastest of any spacecraft (NASA)" },
    { slug: "speed-of-light", name: "At the speed of light", how: "at the speed of light", kmh: C * 3600, label: "299,792 km/s", note: "nothing can go faster" }
  ];

  var DIST_LABEL = { closest: "At its closest", average: "On average", farthest: "At its farthest" };

  function dest(slug) { for (var i = 0; i < DEST.length; i++) if (DEST[i].slug === slug) return DEST[i]; return null; }
  function speed(slug) { for (var i = 0; i < SPEEDS.length; i++) if (SPEEDS[i].slug === slug) return SPEEDS[i]; return null; }

  function hours(km, kmh) { return km / kmh; }

  function n0(v) { return Math.round(v).toLocaleString("en-GB"); }
  function plural(v, w) { return v + " " + w + (v === 1 ? "" : "s"); }

  /* A trip length in hours, in words: "3 minutes 2 seconds", "55.3 years" */
  function duration(h) {
    var s = h * 3600;
    if (s < 10) { var t = Math.round(s * 10) / 10; return t + (t === 1 ? " second" : " seconds"); }
    if (s < 60) return plural(Math.round(s), "second");
    if (s < 3600) { var m = Math.floor(s / 60), r = Math.round(s - m * 60); if (r === 60) { m++; r = 0; } return plural(m, "minute") + (r ? " " + plural(r, "second") : ""); }
    if (h < 48) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60) { hh++; mm = 0; } return plural(hh, "hour") + (mm ? " " + plural(mm, "minute") : ""); }
    var days = h / 24;
    if (days < 10) { var d = Math.floor(days), rh = Math.round((days - d) * 24); if (rh === 24) { d++; rh = 0; } return plural(d, "day") + (rh ? " " + plural(rh, "hour") : ""); }
    if (days < 730) return n0(days) + " days";
    var y = days / 365.25;
    if (y < 100) return (Math.round(y * 10) / 10).toLocaleString("en-GB") + " years";
    if (y < 1e6) return n0(y) + " years";
    if (y < 1e9) return (Math.round(y / 1e5) / 10).toLocaleString("en-GB") + " million years";
    return (Math.round(y / 1e8) / 10).toLocaleString("en-GB") + " billion years";
  }

  /* "54.6 million km (33.9 million miles)" */
  function bigNum(v) {
    if (v >= 1e12) return (Math.round(v / 1e11) / 10).toLocaleString("en-GB") + " trillion";
    if (v >= 1e9) return (Math.round(v / 1e8) / 10).toLocaleString("en-GB") + " billion";
    if (v >= 1e6) return (Math.round(v / 1e5) / 10).toLocaleString("en-GB") + " million";
    return n0(v);
  }
  function distance(km) { return bigNum(km) + " km (" + bigNum(km / MILE) + " miles)"; }

  return { DEST: DEST, SPEEDS: SPEEDS, DIST_LABEL: DIST_LABEL, LY: LY, C: C, MILE: MILE, dest: dest, speed: speed, hours: hours, duration: duration, distance: distance, bigNum: bigNum };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SpaceTravel;
} else {
  (function () {
    var box = document.getElementById("st-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var S = SpaceTravel;

    function fillDistances() {
      var d = S.dest($("st-dest").value), sel = $("st-dist"), keep = sel.value;
      while (sel.firstChild) sel.removeChild(sel.firstChild);
      ["closest", "average", "farthest"].forEach(function (k) {
        if (d.d[k] == null) return;
        var o = document.createElement("option");
        o.value = k;
        o.textContent = d.star ? "4.2465 light-years" : S.DIST_LABEL[k] + " — " + S.bigNum(d.d[k]) + " km";
        sel.appendChild(o);
      });
      sel.value = d.d[keep] != null ? keep : d.def;
      sel.disabled = sel.options.length < 2;
    }

    function kmh() {
      var p = $("st-speed").value;
      if (p !== "custom") return S.speed(p).kmh;
      var v = Number($("st-custom").value), u = $("st-unit").value;
      return u === "mph" ? v * S.MILE : u === "kms" ? v * 3600 : v;
    }

    function calc() {
      var d = S.dest($("st-dest").value), km = d.d[$("st-dist").value] || d.d[d.def];
      $("st-custom-row").style.display = $("st-speed").value === "custom" ? "" : "none";
      var v = kmh(), err = $("st-error");
      if (!(v > 0) || !isFinite(v)) { err.textContent = "Enter a speed above zero."; err.style.display = "block"; return; }
      if (v > S.C * 3600 * 1.0000001) { err.textContent = "Nothing can travel faster than light (299,792 km/s)."; err.style.display = "block"; return; }
      err.style.display = "none";
      $("st-time").textContent = S.duration(S.hours(km, v));
      $("st-what").textContent = "to reach " + d.name;
      $("st-km").textContent = S.distance(km);
      $("st-light").textContent = S.duration(S.hours(km, S.C * 3600));
    }

    $("st-dest").addEventListener("change", function () { fillDistances(); calc(); });
    ["st-dist", "st-speed", "st-unit"].forEach(function (id) { $(id).addEventListener("change", calc); });
    $("st-custom").addEventListener("input", calc);
    fillDistances();
    calc();
  })();
}
