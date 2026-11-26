/* The rules object the tax code checker and the tax refund estimator share:
   GOV.UK's tax code wording (data/uk/tax-codes.json), the Marriage Allowance
   transfer, and the bands, flat rates and Personal Allowance from the UK and
   Scottish tax files in force. */
const fs = require("fs");
const path = require("path");
const registry = require("../tax/registry.js");
module.exports = function () {
  const ROOT = path.join(__dirname, "..", "..");
  const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
  const D = J("data/uk/tax-codes.json"), MA = J("data/uk/marriage-allowance.json"), RF = J("data/uk/tax-refunds.json");
  const cur = registry.currentFiles(registry.readAll());
  const bandsOf = (doc) => doc.items.find((i) => i.id === "gb-income-tax").charge.brackets;
  const ruk = bandsOf(cur.gb.doc), sct = bandsOf(cur["gb-sct"].doc);
  const paItem = cur.gb.doc.items.find((i) => i.id === "gb-personal-allowance").value;
  const rate = (b, name) => { const x = b.find((r) => r[2] === name); if (!x) throw new Error("tax code rules: no " + name + " band"); return x[1]; };
  return {
    D, MA, RF,
    R: {
      letters: D.letters, kCap: D.kCap, personalAllowance: paItem.taper, taperFrom: paItem.from, transfer: MA.transfer, collectLimit: RF.collectLimit, year: cur.gb.doc.taxYear.label,
      bands: { ruk: ruk.map((r) => [r[0], r[1]]), sct: sct.map((r) => [r[0], r[1]]) },
      flat: { BR: rate(ruk, "Basic rate"), D0: rate(ruk, "Higher rate"), D1: rate(ruk, "Additional rate"),
        CBR: rate(ruk, "Basic rate"), CD0: rate(ruk, "Higher rate"), CD1: rate(ruk, "Additional rate"),
        SBR: rate(sct, "Basic rate"), SD0: rate(sct, "Intermediate rate"), SD1: rate(sct, "Higher rate"), SD2: rate(sct, "Advanced rate"), SD3: rate(sct, "Top rate") }
    }
  };
};
