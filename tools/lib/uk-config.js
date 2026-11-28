/* The config uk-calcs.js runs on: income tax and employee NI from the UK tax
   file in force (so they match the salary calculator), everything else from
   data/uk/rates-2026-27.json. Fails loudly if the tax file's shape changes. */
const fs = require("fs");
const path = require("path");
const registry = require("../tax/registry.js");

function ukConfig() {
  const root = path.join(__dirname, "..", "..");
  const R = JSON.parse(fs.readFileSync(path.join(root, "data/uk/rates-2026-27.json"), "utf8"));
  const gb = registry.currentFiles(registry.readAll()).gb.doc;
  if (gb.taxYear.label !== R.taxYear) throw new Error(`UK tax file is ${gb.taxYear.label} but data/uk is ${R.taxYear}: update data/uk for the new year`);
  const item = (id) => gb.items.find((x) => x.id === id);
  const pa = item("gb-personal-allowance").value, it = item("gb-income-tax").charge.brackets, ni = item("gb-ni").charge.brackets;
  const cfg = {
    year: gb.taxYear.label, pa: pa.taper, paTaperFrom: pa.from, paTaper: pa.per,
    basicBand: it[1][0], addlFrom: it[2][0], rates: it.map((b) => b[1]),
    niPT: ni[1][0], niUEL: ni[2][0], niMain: ni[1][1], niUpper: ni[2][1],
    div: R.dividends, ct: R.corporationTax, er: R.employerNI, cgt: R.capitalGains, iht: R.inheritanceTax,
    sp: R.statutoryPay, red: R.redundancy, hol: R.holiday, pen: R.pensions, ll: R.landlords
  };
  ["pa", "paTaperFrom", "basicBand", "addlFrom", "niPT", "niUEL", "niMain", "niUpper"].forEach((k) => { if (!(cfg[k] > 0)) throw new Error("uk-config: couldn't read " + k); });
  /* Scotland: the same allowance, NI and other rates, with the Scottish
     Income Tax bands from the gb-sct file in force (edges are taxable income) */
  const sctDoc = registry.currentFiles(registry.readAll())["gb-sct"].doc;
  if (sctDoc.taxYear.label !== gb.taxYear.label) throw new Error(`Scottish tax file is ${sctDoc.taxYear.label} but the UK file is ${gb.taxYear.label}`);
  const sb = sctDoc.items.find((x) => x.id === "gb-income-tax").charge.brackets;
  const scot = Object.assign({}, cfg, { edges: sb.map((b) => b[0]), rates: sb.map((b) => b[1]), bandNames: sb.map((b) => b[2]) });
  if (scot.edges.length !== 6 || scot.edges[0] !== 0) throw new Error("uk-config: unexpected Scottish bands");
  return { cfg, R, gb, scot };
}
module.exports = ukConfig;
