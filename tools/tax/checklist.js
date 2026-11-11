#!/usr/bin/env node
/* Verification checklists: one Markdown file per jurisdiction in
   data/tax/verify/, listing every figure its data file uses, item by item,
   next to the official pages to check it against.

       node tools/tax/checklist.js          write data/tax/verify/
       node tools/tax/check.js --write      does the same, with the index

   A person works down a checklist with the sources open, ticks each figure,
   and when every box is ticked sets "lastVerified" in the JSON file to that
   day's date. The checklists are generated, so they always match the data:
   change a rate and the next --write changes its line. */
const fs = require("fs");
const path = require("path");
const reg = require("./registry.js");

const OUT = path.join(reg.DATA, "verify");

/* The biggest audiences first; every other file follows alphabetically */
const PRIORITY = ["gb", "gb-sct", "us", "us-ca", "us-tx", "us-ny", "us-ny-nyc", "us-fl", "de", "ie", "au", "nz", "fr"];

const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString("en-GB") : Math.abs(n) >= 100 ? n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(n));

/* A table chosen by filing status or option: the same table op over each case */
function eachCase(sel, wrap) {
  const map = (o) => Object.keys(o).reduce((acc, k) => { acc[k] = wrap(o[k]); return acc; }, {});
  if (sel && sel.status) return { status: map(sel.status) };
  if (sel && sel.option) return { option: sel.option, cases: map(sel.cases) };
  return sel;
}
const pct = (n) => fmt(n) + "%";

function caseLabel(doc, kind, key, chainOptions) {
  if (kind === "status") return { single: "Single", married: "Married filing jointly", head: "Head of household", separate: "Married filing separately" }[key] || key;
  const o = chainOptions && chainOptions[kind];
  return (o && o.choices && o.choices[key]) || key;
}

/* Walks an expression and calls add(text) for each literal figure in it,
   described by where it sits */
function figures(expr, where, add, opts, role) {
  const at = (s) => (where ? where + " — " : "") + s;
  if (typeof expr === "number") {
    if (expr === 0) return; // a floor or an empty case, not a published figure
    add(at(role === "rate" ? "rate " + pct(expr) : (role || "amount") + " " + fmt(expr)));
    return;
  }
  if (!expr || typeof expr !== "object") return;
  if (Array.isArray(expr)) return expr.forEach((e) => figures(e, where, add, opts, role));
  const op = Object.keys(expr).find((k) => k !== "of" && k !== "note" && k !== "cases");

  if (op === "status" || op === "option") {
    const cases = op === "status" ? expr.status : expr.cases;
    const kind = op === "status" ? "status" : expr.option;
    Object.keys(cases).forEach((k) => figures(cases[k], (where ? where + ", " : "") + caseLabel(null, kind, k, opts), add, opts, role));
    return;
  }
  switch (op) {
    case "brackets":
      if (!Array.isArray(expr.brackets)) figures(eachCase(expr.brackets, (t) => ({ brackets: t })), where, add, opts);
      else expr.brackets.forEach((row) => add(at(`from ${fmt(row[0])}: ${pct(row[1])}${row[2] ? " (" + row[2] + ")" : ""}`)));
      figures(expr.of, where, add, opts);
      return;
    case "lookup":
      if (!Array.isArray(expr.lookup)) figures(eachCase(expr.lookup, (t) => ({ lookup: t, strict: expr.strict })), where, add, opts);
      else expr.lookup.forEach((row) => {
        if (typeof row[1] === "number") add(at(`${expr.strict ? "over" : "from"} ${fmt(row[0])}: ${fmt(row[1])}`));
        else figures(row[1], at(`${expr.strict ? "over" : "from"} ${fmt(row[0])}`), add, opts);
      });
      figures(expr.of, where, add, opts);
      return;
    case "pct":
      figures(expr.pct, where, add, opts, "rate");
      figures(expr.of, where, add, opts);
      return;
    case "taper":
      figures(expr.taper, where, add, opts, "full amount");
      figures(expr.from, where, add, opts, "reduced above");
      if (expr.per !== undefined) figures(expr.per, where, add, opts, "reduction per unit of excess");
      if (expr.step !== undefined) figures(expr.step, where, add, opts, "for each step of");
      if (expr.perStep !== undefined) figures(expr.perStep, where, add, opts, "reduced per step by");
      if (expr.pctPerStep !== undefined) figures(expr.pctPerStep, where, add, opts, "reduced per step by %");
      figures(expr.of, where, add, opts);
      return;
    case "clamp":
      figures(expr.clamp, where, add, opts);
      if (expr.min !== undefined) figures(expr.min, where, add, opts, "at least");
      if (expr.max !== undefined) figures(expr.max, where, add, opts, "at most");
      return;
    case "round":
      figures(expr.round, where, add, opts);
      return; // the rounding unit is arithmetic, not a published figure
    case "if": {
      const c = expr.if;
      const k = Object.keys(c).find((x) => x !== "note");
      const word = { gt: "over", gte: "at least", lt: "under", lte: "up to" }[k];
      figures(c[k][1], where, add, opts, "applies when " + word);
      figures(c[k][0], where, add, opts);
      figures(expr.then, where, add, opts, role);
      figures(expr.else, where, add, opts, role);
      return;
    }
    case "quadratic": {
      const q = expr.quadratic;
      add(at(`formula (a·y + b)·y + c, y = (x − ${fmt(q.offset || 0)}) / ${fmt(q.scale || 1)}: a = ${fmt(q.a || 0)}, b = ${fmt(q.b || 0)}, c = ${fmt(q.c || 0)}`));
      figures(q.of, where, add, opts);
      return;
    }
    case "input":
      return;
    case "min":
      return expr.min.forEach((e) => figures(e, where, add, opts, typeof e === "number" ? "capped at" : role));
    case "max":
      return expr.max.forEach((e) => figures(e, where, add, opts, typeof e === "number" && e !== 0 ? "at least" : role));
    case "sum": case "sub": case "mul": case "div":
      return expr[op].forEach((e, i) => {
        if (typeof e === "number" && (op === "mul" || op === "div") && e === 1) return;
        const r = op === "mul" || op === "div" ? "factor" : op === "sub" && i > 0 ? "less" : op === "sum" && i > 0 ? "plus" : role;
        figures(e, where, add, opts, r);
      });
  }
}

function itemLines(item, opts) {
  const lines = [];
  const add = (t) => lines.push(t);
  if (item.value !== undefined) figures(item.value, "", add, opts);
  if (item.charge !== undefined) figures(item.charge, "", add, opts);
  if (item.show && item.value && typeof item.value === "object" && !lines.length) return lines;
  return lines.filter((t, i) => !/^amount 0$/.test(t) && lines.indexOf(t) === i);
}

function render(doc, chainOptions) {
  const opts = Object.assign({}, chainOptions || {}, doc.options || {});
  const out = [];
  out.push(`# ${doc.name} — ${doc.taxYear.label} verification checklist`, "");
  out.push(`Generated from \`data/tax/${doc.file}\` by \`tools/tax/checklist.js\`. Do not edit: change the data file and run \`node tools/tax/check.js --write\`.`, "");
  out.push(`- Tax year: ${doc.taxYear.label} (${doc.taxYear.start} to ${doc.taxYear.end})`);
  out.push(`- Currency: ${doc.currency}`);
  out.push(`- Rates last checked: ${doc.lastChecked || "not yet"}`);
  out.push(`- Verified by a person: ${doc.lastVerified || "**not yet**"}`);
  if (doc.parent) out.push(`- Adds to: \`${doc.parent}\` (check that one too)`);
  if ((doc.provisional || []).length) out.push(`- Provisional items: ${doc.provisional.map((p) => "`" + (p.item || p.id || p) + "`").join(", ")}`);
  out.push("");
  out.push("## Check against", "");
  if (doc.verifyAt) out.push(`- **Start here:** ${doc.verifyAt}`);
  (doc.sources || []).forEach((s) => out.push(`- ${s.title}${s.url ? ": " + s.url : ""}`));
  out.push("");
  out.push("## Figures", "");
  out.push("Tick each figure once it matches the official source. Amounts are yearly, in " + doc.currency + ", unless the line says otherwise.", "");
  (doc.items || []).forEach((item) => {
    const lines = itemLines(item, opts);
    if (!lines.length) return;
    out.push(`### ${item.label} (\`${item.id}\`)`, "");
    if (item.note) out.push(`> ${item.note}`, "");
    lines.forEach((l) => out.push(`- [ ] ${l}`));
    out.push("");
  });
  if ((doc.remove || []).length) {
    out.push("### Removed from the parent", "");
    doc.remove.forEach((id) => out.push(`- [ ] \`${id}\` does not apply here`));
    out.push("");
  }
  if ((doc.tests || []).length) {
    out.push("## Spot checks", "");
    out.push("Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.", "");
    doc.tests.forEach((t) => {
      const o = t.options ? " with " + Object.keys(t.options).map((k) => `${k} = ${t.options[k]}`).join(", ") : "";
      const exp = Object.keys(t.expect).map((k) => `${k} ${fmt(t.expect[k])}`).join("; ");
      out.push(`- [ ] ${fmt(t.gross)}${o}: ${exp}${t.note ? " — " + t.note : ""}`);
    });
    out.push("");
  }
  if ((doc.notModelled || []).length) {
    out.push("## Not modelled (confirm the page says so)", "");
    doc.notModelled.forEach((n) => out.push(`- ${n}`));
    out.push("");
  }
  out.push("## Sign off", "");
  out.push(`When every box is ticked, set \`"lastVerified": "YYYY-MM-DD"\` (today) in \`data/tax/${doc.file}\` and run \`node tools/tax/check.js --write\`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.`, "");
  return out.join("\n");
}

/* Every checklist, keyed by file name, plus the README that lists them */
function build(all) {
  const cur = reg.currentFiles(all);
  const files = {};
  const ids = Object.keys(cur).sort((a, b) => {
    const pa = PRIORITY.indexOf(a), pb = PRIORITY.indexOf(b);
    if (pa !== -1 || pb !== -1) return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
    return a.localeCompare(b);
  });
  const rows = [];
  ids.forEach((id) => {
    const { file, doc } = cur[id];
    let opts = {};
    let p = doc.parent;
    while (p && cur[p]) { opts = Object.assign({}, cur[p].doc.options || {}, opts); p = cur[p].doc.parent; }
    files[id + ".md"] = render(Object.assign({ file }, doc), opts);
    const count = (files[id + ".md"].match(/^- \[ \]/gm) || []).length;
    rows.push(`| ${PRIORITY.includes(id) ? "**" + doc.name + "**" : doc.name} | [${id}](${id}.md) | ${doc.taxYear.label} | ${count} | ${doc.lastChecked || "—"} | ${doc.lastVerified || "—"} |`);
  });
  files["README.md"] = [
    "# Tax data verification checklists",
    "",
    "Generated by `tools/tax/checklist.js` (and `node tools/tax/check.js --write`). One file per jurisdiction, listing every figure in its data file next to the official sources. Work through one, tick every box, then set `lastVerified` in the data file.",
    "",
    "The biggest audiences are listed first, in bold. \"Checked\" is the monthly comparison with published sources; \"verified\" is a person signing off a whole checklist.",
    "",
    "| Jurisdiction | Checklist | Tax year | Lines | Checked | Verified |",
    "|---|---|---|---:|---|---|",
    ...rows,
    ""
  ].join("\n");
  return files;
}

/* Writes the checklists (removing ones for ids that no longer exist), or with
   dryRun reports which are out of date */
function sync(all, dryRun) {
  const files = build(all);
  const stale = [];
  if (!dryRun) fs.mkdirSync(OUT, { recursive: true });
  const existing = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => f.endsWith(".md")) : [];
  Object.keys(files).forEach((name) => {
    const full = path.join(OUT, name);
    if (fs.existsSync(full) && fs.readFileSync(full, "utf8") === files[name]) return;
    stale.push(name);
    if (!dryRun) fs.writeFileSync(full, files[name]);
  });
  existing.filter((f) => !files[f]).forEach((f) => {
    stale.push(f);
    if (!dryRun) fs.unlinkSync(path.join(OUT, f));
  });
  return stale;
}

module.exports = { render, build, sync };

if (require.main === module) {
  const changed = sync(reg.readAll(), false);
  console.log(changed.length ? "wrote " + changed.length + " checklist file(s)" : "checklists up to date");
}
