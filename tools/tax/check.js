#!/usr/bin/env node
/* Validates the tax registry and runs every jurisdiction's worked examples.

     node tools/tax/check.js            check everything
     node tools/tax/check.js --write    also regenerate data/tax/index.json
     node tools/tax/check.js us-ca      only jurisdictions whose id starts with us-ca
     node tools/tax/check.js --table    print a summary of every jurisdiction

   Exits non-zero on any failure, so it can gate a commit. */
const fs = require("fs");
const path = require("path");
const TaxEngine = require("../../tax-engine.js");
const reg = require("./registry.js");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const TABLE = args.includes("--table");
const only = args.filter((a) => !a.startsWith("--"));

const errors = [];
const warnings = [];
let testsRun = 0;

function err(where, msg) { errors.push(where + ": " + msg); }
function warn(where, msg) { warnings.push(where + ": " + msg); }

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ["country", "state", "region", "city", "county"];

function checkBrackets(where, v) {
  if (Array.isArray(v)) {
    let last = -Infinity;
    v.forEach((row, i) => {
      if (!Array.isArray(row) || typeof row[0] !== "number" || typeof row[1] !== "number") {
        return err(where, "bracket row " + i + " must be [from, rate%, label?]");
      }
      if (row[0] <= last) err(where, "bracket thresholds must ascend (row " + i + ")");
      if (row[1] < 0 || row[1] > 100) err(where, "bracket rate " + row[1] + " is not a percentage");
      last = row[0];
    });
    if (v.length && v[0][0] !== 0) warn(where, "first bracket starts at " + v[0][0] + ", not 0");
  } else if (v && typeof v === "object") {
    const cases = v.status || v.cases;
    if (!cases) return err(where, "brackets must be a list or a status/option choice");
    Object.keys(cases).forEach((k) => checkBrackets(where + "[" + k + "]", cases[k]));
  }
}

/* Walks an expression looking for bracket tables to sanity-check */
function walkExpr(where, e) {
  if (!e || typeof e !== "object") return;
  if (Array.isArray(e)) return e.forEach((x) => walkExpr(where, x));
  if (Object.prototype.hasOwnProperty.call(e, "brackets")) checkBrackets(where, e.brackets);
  Object.keys(e).forEach((k) => { if (k !== "brackets") walkExpr(where, e[k]); });
}

function validateDoc(file, doc) {
  const w = file;
  ["id", "name", "kind", "country", "taxYear", "items", "sources", "notModelled", "tests"].forEach((k) => {
    if (doc[k] === undefined) err(w, "missing '" + k + "'");
  });
  if (!("parent" in doc)) err(w, "missing 'parent' (use null for a root)");
  if (!("lastVerified" in doc)) err(w, "missing 'lastVerified' (null until checked against a primary source)");
  if (doc.lastVerified !== null && doc.lastVerified !== undefined && !DATE.test(doc.lastVerified)) err(w, "lastVerified must be null or YYYY-MM-DD");
  if (doc.kind && KINDS.indexOf(doc.kind) === -1) err(w, "kind must be one of " + KINDS.join(", "));
  if (!doc.parent && (!doc.currency || !doc.locale)) err(w, "a root jurisdiction needs currency and locale");
  if (doc.taxYear) {
    if (!doc.taxYear.label || !DATE.test(doc.taxYear.start || "") || !DATE.test(doc.taxYear.end || "")) err(w, "taxYear needs label, start, end");
    const expected = doc.id + "." + reg.slugYear(doc.taxYear.label) + ".json";
    if (path.basename(file) !== expected) err(w, "file should be named " + expected);
  }
  if (!Array.isArray(doc.sources) || !doc.sources.length) err(w, "needs at least one source");
  else doc.sources.forEach((s, i) => { if (!s.title || !s.url) err(w, "source " + i + " needs title and url"); });
  if (!Array.isArray(doc.tests) || !doc.tests.length) err(w, "needs at least one worked test");
  const ids = {};
  (doc.items || []).forEach((item, i) => {
    const iw = w + " item " + (item.id || i);
    if (!item.id || !item.label) err(iw, "needs id and label");
    if (ids[item.id]) err(iw, "duplicate id");
    ids[item.id] = true;
    const hasCharge = "charge" in item;
    const hasValue = "value" in item;
    if (hasCharge === hasValue) err(iw, "needs exactly one of value or charge");
    if (hasCharge && ["tax", "social"].indexOf(item.group) === -1) err(iw, "charge group must be tax or social");
    walkExpr(iw, hasCharge ? item.charge : item.value);
  });
}

/* Every combination of every option, so a rule that only breaks for one
   filing status or one region still gets exercised */
function optionCombos(options) {
  let combos = [{}];
  Object.keys(options || {}).forEach((k) => {
    const next = [];
    Object.keys(options[k].choices).forEach((v) => combos.forEach((c) => next.push(Object.assign({}, c, { [k]: v }))));
    combos = next;
  });
  return combos;
}

function round2(x) { return Math.round(x * 100) / 100; }

function runDoc(file, doc, all) {
  let chain;
  try {
    chain = reg.chainFor(doc, all);
  } catch (e) {
    return err(file, e.message);
  }

  /* Child items that reuse a parent id replace it — only on purpose */
  const parentIds = {};
  chain.slice(0, -1).forEach((d) => (d.items || []).forEach((it) => { parentIds[it.id] = d.id; }));
  (doc.items || []).forEach((it) => {
    if (parentIds[it.id] && !it.replaces) err(file, "item '" + it.id + "' collides with " + parentIds[it.id] + " — add \"replaces\": true if that is intended");
    if (it.replaces && !parentIds[it.id]) err(file, "item '" + it.id + "' says it replaces something but no parent has that id");
  });

  const merged = TaxEngine.merge(chain);
  const combos = optionCombos(merged.options);

  /* Smoke test across the income range */
  const grid = [0, 1000, 10000, 25000, 40000, 60000, 85000, 120000, 200000, 500000, 2000000];
  combos.forEach((opts) => {
    let prevNet = -Infinity;
    grid.forEach((g) => {
      let r;
      try {
        r = TaxEngine.compute(chain, g, opts);
      } catch (e) {
        return err(file, "at " + g + " " + JSON.stringify(opts) + ": " + e.message);
      }
      /* Only a refundable credit, declared with mayBeNegative, can pay out
         more than was earned */
      const refundable = r.charges.some((c) => merged.items.find((it) => it.id === c.id).mayBeNegative);
      if (r.net > g + 0.005 && !refundable) err(file, "net exceeds gross at " + g + " " + JSON.stringify(opts));
      r.charges.forEach((c) => { if (c.amount < -0.005 && !merged.items.find((it) => it.id === c.id).mayBeNegative) warn(file, c.id + " is negative (" + round2(c.amount) + ") at " + g + " " + JSON.stringify(opts)); });
      /* Cliffs written into the law (a credit lost at exactly $X) are real,
         so a falling take-home is a warning to look at, not a failure. The
         marginal rate is not checked: at a statutory step it is legitimately
         huge for that one dollar. */
      if (r.net + 0.005 < prevNet) warn(file, "take-home falls as gross rises to " + g + " " + JSON.stringify(opts));
      prevNet = r.net;
    });
  });

  /* Worked examples */
  (doc.tests || []).forEach((t, i) => {
    testsRun++;
    const tw = file + " test " + i + " (" + t.gross + (t.options ? " " + JSON.stringify(t.options) : "") + ")";
    if (!t.note) warn(tw, "has no working shown");
    let r;
    try {
      r = TaxEngine.compute(chain, t.gross, t.options || {});
    } catch (e) {
      return err(tw, e.message);
    }
    Object.keys(t.expect || {}).forEach((k) => {
      let got;
      if (k === "net") got = r.net;
      else if (k === "totalDeductions") got = r.totalDeductions;
      else if (Object.prototype.hasOwnProperty.call(r.values, k)) got = r.values[k];
      else return err(tw, "expects unknown item '" + k + "'");
      if (Math.abs(got - t.expect[k]) > 0.0101) err(tw, k + " = " + round2(got) + ", expected " + t.expect[k]);
    });
  });
}

function main() {
  let all;
  try {
    all = reg.readAll();
  } catch (e) {
    console.error("could not read registry: " + e.message);
    process.exit(1);
  }

  const seen = {};
  all.forEach(({ file, doc }) => {
    const key = doc.id + "@" + (doc.taxYear && doc.taxYear.label);
    if (seen[key]) err(file, "same id and tax year as " + seen[key]);
    seen[key] = file;
  });

  const selected = all.filter(({ doc }) => !only.length || only.some((o) => doc.id === o || doc.id.startsWith(o + "-")));
  selected.forEach(({ file, doc }) => validateDoc(file, doc));
  if (!errors.length) selected.forEach(({ file, doc }) => runDoc(file, doc, all));

  const index = reg.buildIndex(all);
  const indexPath = path.join(reg.DATA, "index.json");
  const text = JSON.stringify(index, null, 2) + "\n";
  if (WRITE) {
    fs.writeFileSync(indexPath, text);
  } else if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, "utf8") !== text) {
    err("data/tax/index.json", "out of date — run node tools/tax/check.js --write");
  }

  if (TABLE) {
    const cur = reg.currentFiles(all);
    console.log("id".padEnd(14) + "name".padEnd(34) + "year".padEnd(10) + "verified".padEnd(12) + "provisional");
    Object.keys(cur).sort().forEach((id) => {
      const d = cur[id].doc;
      console.log(id.padEnd(14) + d.name.slice(0, 32).padEnd(34) + d.taxYear.label.padEnd(10) +
        String(d.lastVerified || "—").padEnd(12) + ((d.provisional || []).length ? d.provisional.length + " item(s)" : ""));
    });
    console.log("");
  }

  warnings.forEach((w) => console.log("warn  " + w));
  errors.forEach((e) => console.log("FAIL  " + e));
  console.log(selected.length + " file(s), " + testsRun + " worked test(s), " + warnings.length + " warning(s), " + errors.length + " failure(s)");
  process.exit(errors.length ? 1 : 0);
}

main();
