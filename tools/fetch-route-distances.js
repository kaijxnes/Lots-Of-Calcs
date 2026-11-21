#!/usr/bin/env node
/* Fetches driving distances and times for the fuel cost route pages from
   the OSRM demo server (OpenStreetMap road data) into data/fuel/routes.json.

       node tools/fetch-route-distances.js

   Run by hand when routes are added — roads rarely change, so it isn't part
   of the monthly rebuild. One request a second, as the demo server's usage
   policy asks. Points are city centres; the distance is the fastest route. */
const fs = require("fs");
const path = require("path");
const https = require("https");

const FILE = path.join(__dirname, "..", "data/fuel/routes.json");
const PLACES = {
  london: ["London", 51.5072, -0.1276], manchester: ["Manchester", 53.4808, -2.2426], birmingham: ["Birmingham", 52.4862, -1.8904],
  leeds: ["Leeds", 53.8008, -1.5491], liverpool: ["Liverpool", 53.4084, -2.9916], glasgow: ["Glasgow", 55.8642, -4.2518],
  edinburgh: ["Edinburgh", 55.9533, -3.1883], bristol: ["Bristol", 51.4545, -2.5879], cardiff: ["Cardiff", 51.4816, -3.1791],
  newcastle: ["Newcastle", 54.9783, -1.6178], sheffield: ["Sheffield", 53.3811, -1.4701], nottingham: ["Nottingham", 52.9548, -1.1581],
  brighton: ["Brighton", 50.8225, -0.1372], southampton: ["Southampton", 50.9097, -1.4044], oxford: ["Oxford", 51.752, -1.2577],
  cambridge: ["Cambridge", 52.2053, 0.1218], york: ["York", 53.96, -1.0873], norwich: ["Norwich", 52.6309, 1.2974],
  plymouth: ["Plymouth", 50.3755, -4.1427], exeter: ["Exeter", 50.7184, -3.5339], newquay: ["Newquay", 50.4155, -5.0737],
  aberdeen: ["Aberdeen", 57.1497, -2.0943], inverness: ["Inverness", 57.4778, -4.2247], swansea: ["Swansea", 51.6214, -3.9436],
  bath: ["Bath", 51.3811, -2.359], blackpool: ["Blackpool", 53.8175, -3.0357], bournemouth: ["Bournemouth", 50.7192, -1.8808],
  dover: ["Dover", 51.1279, 1.3134], keswick: ["Keswick", 54.6013, -3.1347], leicester: ["Leicester", 52.6369, -1.1398],
  portsmouth: ["Portsmouth", 50.8198, -1.088], hull: ["Hull", 53.7676, -0.3274], coventry: ["Coventry", 52.4068, -1.5197]
};
const ROUTES = [
  ["london", ["manchester", "birmingham", "leeds", "liverpool", "glasgow", "edinburgh", "bristol", "cardiff", "newcastle", "brighton", "newquay", "plymouth", "exeter", "bath", "york", "oxford", "cambridge", "norwich", "southampton", "bournemouth", "dover", "nottingham", "sheffield", "aberdeen", "inverness", "swansea", "blackpool", "keswick", "leicester", "portsmouth", "hull", "coventry"]],
  ["manchester", ["birmingham", "leeds", "liverpool", "glasgow", "edinburgh", "newcastle", "blackpool", "keswick", "sheffield", "york", "bristol", "cardiff", "newquay"]],
  ["birmingham", ["bristol", "leeds", "liverpool", "cardiff", "newcastle", "glasgow", "edinburgh", "newquay", "nottingham"]],
  ["edinburgh", ["glasgow", "aberdeen", "inverness", "newcastle"]],
  ["glasgow", ["inverness", "aberdeen"]],
  ["leeds", ["newcastle", "york", "liverpool", "sheffield"]],
  ["bristol", ["cardiff", "newquay", "exeter"]]
];

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "lotsofcalcs-route-fetch" } }, (res) => {
      let body = ""; res.on("data", (c) => (body += c)); res.on("end", () => res.statusCode === 200 ? resolve(JSON.parse(body)) : reject(new Error(res.statusCode + " " + body.slice(0, 200))));
    }).on("error", reject);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const out = { _note: "Driving distances (fastest route, city centre to city centre) from the OSRM demo server, which routes on OpenStreetMap road data. Fetched by tools/fetch-route-distances.js.", source: { title: "OSRM routing on OpenStreetMap data (© OpenStreetMap contributors)", url: "https://project-osrm.org/" }, fetched: new Date().toISOString().slice(0, 10), places: {}, routes: [] };
  Object.entries(PLACES).forEach(([k, v]) => (out.places[k] = { name: v[0], lat: v[1], lon: v[2] }));
  for (const [from, tos] of ROUTES) {
    for (const to of tos) {
      const a = PLACES[from], b = PLACES[to];
      const r = await get(`https://router.project-osrm.org/route/v1/driving/${a[2]},${a[1]};${b[2]},${b[1]}?overview=false`);
      if (r.code !== "Ok") throw new Error(from + "-" + to + ": " + r.code);
      out.routes.push({ from, to, km: Math.round(r.routes[0].distance / 100) / 10, minutes: Math.round(r.routes[0].duration / 60) });
      process.stdout.write(".");
      await wait(1100);
    }
  }
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n");
  console.log(`\n${out.routes.length} routes written`);
})().catch((e) => { console.error(e.message); process.exit(1); });
