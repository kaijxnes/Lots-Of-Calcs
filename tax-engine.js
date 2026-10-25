/* Take-home pay from a gross salary, for any jurisdiction in /data/tax/.

   Every rate, threshold and rule lives in the data files; this file only
   knows how to evaluate them. Each jurisdiction is a list of items evaluated
   in order. An item is either a "value" (an intermediate such as taxable
   income, kept so later items can refer to it) or a "charge" (an amount that
   comes out of pay, such as income tax or a social contribution).

   Jurisdictions stack. A US state names the federal file as its parent, so a
   California profile is the federal items followed by California's. A child
   item with the same id as a parent item replaces it in place, which is how
   Scotland swaps the UK's income tax for its own while keeping National
   Insurance.

   The same file runs in the browser (live calculators) and in node (the page
   generator and the test suite), so there is exactly one implementation of
   the arithmetic. data/tax/README.md documents the expression language. */
const TaxEngine = (function () {
  "use strict";

  /* Keys each operator accepts. Anything else is a typo in a data file, and
     failing loudly beats quietly ignoring half a rule. Order matters: clamp
     takes "min" and "max" as modifiers, so it is recognised before the min
     and max operators are. */
  const OPS = {
    clamp: ["clamp", "min", "max"],
    taper: ["taper", "of", "from", "per", "step", "perStep", "pctPerStep", "stepMode"],
    pct: ["pct", "of"],
    brackets: ["brackets", "of"],
    lookup: ["lookup", "of", "strict"],
    if: ["if", "then", "else"],
    round: ["round", "to", "mode"],
    quadratic: ["quadratic"],
    option: ["option", "cases"],
    status: ["status"],
    sum: ["sum"],
    sub: ["sub"],
    mul: ["mul"],
    div: ["div"],
    min: ["min"],
    max: ["max"]
  };
  const CONDITIONS = ["gt", "gte", "lt", "lte"];

  function fail(message, expr) {
    throw new Error(message + (expr === undefined ? "" : " in " + JSON.stringify(expr)));
  }

  function opOf(expr) {
    for (const op in OPS) {
      if (Object.prototype.hasOwnProperty.call(expr, op)) {
        for (const key in expr) {
          if (OPS[op].indexOf(key) === -1 && key !== "note") fail("unexpected key '" + key + "' for " + op, expr);
        }
        return op;
      }
    }
    return fail("unknown expression", expr);
  }

  /* Picks the case for the current options. Used for numbers, bracket
     schedules and lookup tables alike, so any of them can differ by filing
     status or by an option such as region. */
  function pick(v, ctx) {
    while (v && typeof v === "object" && !Array.isArray(v)) {
      let name;
      let cases;
      if (Object.prototype.hasOwnProperty.call(v, "status") && Object.keys(v).every((k) => k === "status" || k === "note")) {
        name = "status";
        cases = v.status;
      } else if (Object.prototype.hasOwnProperty.call(v, "option") && Object.prototype.hasOwnProperty.call(v, "cases")) {
        name = v.option;
        cases = v.cases;
      } else {
        return v;
      }
      const chosen = ctx.options[name];
      if (Object.prototype.hasOwnProperty.call(cases, chosen)) v = cases[chosen];
      else if (Object.prototype.hasOwnProperty.call(cases, "default")) v = cases["default"];
      else fail("no case for " + name + "=" + chosen, v);
    }
    return v;
  }

  function table(v, ctx, what) {
    const t = pick(v, ctx);
    if (!Array.isArray(t)) fail(what + " must be a list", v);
    return t;
  }

  /* Charges each slice of the base at its own rate. Rows are [from, rate%]
     with an optional label; a row applies from its threshold up to the next. */
  function brackets(rows, base, sink) {
    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      const from = rows[i][0];
      const to = i + 1 < rows.length ? rows[i + 1][0] : Infinity;
      if (base <= from) break;
      const amount = Math.min(base, to) - from;
      const charged = amount * (rows[i][1] / 100);
      total += charged;
      if (sink) sink.push({ label: rows[i][2] || "", rate: rows[i][1], from: from, to: to, amount: amount, charged: charged });
    }
    return total;
  }

  function condition(c, ctx) {
    const keys = Object.keys(c).filter((k) => k !== "note");
    if (keys.length !== 1 || CONDITIONS.indexOf(keys[0]) === -1) fail("bad condition", c);
    const pair = c[keys[0]];
    const a = evaluate(pair[0], ctx);
    const b = evaluate(pair[1], ctx);
    switch (keys[0]) {
      case "gt": return a > b;
      case "gte": return a >= b;
      case "lt": return a < b;
      default: return a <= b;
    }
  }

  function evaluate(expr, ctx, sink) {
    if (typeof expr === "number") return expr;
    if (typeof expr === "string") {
      if (expr === "gross") return ctx.gross;
      if (Object.prototype.hasOwnProperty.call(ctx.values, expr)) return ctx.values[expr];
      return fail("reference to '" + expr + "' before it is defined");
    }
    if (!expr || typeof expr !== "object" || Array.isArray(expr)) return fail("bad expression", expr);

    const ev = (e) => evaluate(e, ctx);
    switch (opOf(expr)) {
      case "status":
      case "option":
        return evaluate(pick(expr, ctx), ctx, sink);
      case "sum":
        return expr.sum.reduce((acc, e) => acc + ev(e), 0);
      case "sub":
        return expr.sub.slice(1).reduce((acc, e) => acc - ev(e), ev(expr.sub[0]));
      case "mul":
        return expr.mul.reduce((acc, e) => acc * ev(e), 1);
      case "div": {
        const d = ev(expr.div[1]);
        return d === 0 ? 0 : ev(expr.div[0]) / d;
      }
      case "min":
        return Math.min.apply(null, expr.min.map(ev));
      case "max":
        return Math.max.apply(null, expr.max.map(ev));
      case "pct":
        return (ev(expr.pct) / 100) * ev(expr.of);
      case "brackets":
        return brackets(table(expr.brackets, ctx, "brackets"), ev(expr.of), sink);
      case "taper": {
        /* An allowance that shrinks as income rises past a threshold. Either
           continuously ("per" unit of excess) or in whole steps, the way many
           US exemptions lose a slice "for each $2,500 or part thereof". */
        const amount = ev(expr.taper);
        const excess = Math.max(0, ev(expr.of === undefined ? "gross" : expr.of) - ev(expr.from));
        let reduction;
        if (expr.step !== undefined) {
          const step = ev(expr.step);
          const units = expr.stepMode === "floor" ? Math.floor(excess / step) : Math.ceil(excess / step);
          if (expr.perStep !== undefined) reduction = units * ev(expr.perStep);
          else if (expr.pctPerStep !== undefined) reduction = amount * (units * ev(expr.pctPerStep)) / 100;
          else fail("stepped taper needs perStep or pctPerStep", expr);
        } else if (expr.per !== undefined) {
          reduction = excess * ev(expr.per);
        } else {
          fail("taper needs per or step", expr);
        }
        return Math.max(0, amount - reduction);
      }
      case "clamp": {
        let v = ev(expr.clamp);
        if (expr.min !== undefined) v = Math.max(v, ev(expr.min));
        if (expr.max !== undefined) v = Math.min(v, ev(expr.max));
        return v;
      }
      case "if":
        return condition(expr.if, ctx) ? evaluate(expr.then, ctx, sink) : evaluate(expr.else, ctx, sink);
      case "round": {
        const v = ev(expr.round);
        const to = expr.to === undefined ? 1 : expr.to;
        const mode = expr.mode || "nearest";
        /* Divide-then-multiply drifts by float error (0.1 + 0.2 territory),
           so nudge before flooring and tidy the result back to the unit */
        const q = v / to;
        const r = mode === "down" ? Math.floor(q + 1e-9) : mode === "up" ? Math.ceil(q - 1e-9) : Math.round(q);
        return Number((r * to).toFixed(10));
      }
      case "lookup": {
        /* Step table: the value of the last row whose threshold has been
           reached. "strict" means a row applies only above its threshold,
           for tables written "over $X" rather than "$X or more". */
        const rows = table(expr.lookup, ctx, "lookup");
        const x = ev(expr.of);
        let value = 0;
        for (const row of rows) if (expr.strict ? x > row[0] : x >= row[0]) value = evaluate(row[1], ctx);
        return value;
      }
      case "quadratic": {
        /* (a·y + b)·y + c with y = (x − offset) / scale — the shape of
           Germany's statutory income tax formula */
        const q = expr.quadratic;
        const y = (ev(q.of) - (q.offset || 0)) / (q.scale || 1);
        return ((q.a || 0) * y + (q.b || 0)) * y + (q.c || 0);
      }
    }
    return fail("unhandled expression", expr);
  }

  /* Flattens a parent→child chain into one ordered item list */
  function merge(chain) {
    const items = [];
    const options = {};
    const where = {};
    chain.forEach((doc) => {
      Object.keys(doc.options || {}).forEach((k) => { options[k] = doc.options[k]; });
      (doc.remove || []).forEach((id) => {
        if (!(id in where)) fail(doc.id + " removes unknown item '" + id + "'");
        items[where[id]] = null;
      });
      (doc.items || []).forEach((item) => {
        const entry = Object.assign({ jurisdiction: doc.id }, item);
        if (Object.prototype.hasOwnProperty.call(where, item.id) && items[where[item.id]]) {
          items[where[item.id]] = entry;
        } else {
          where[item.id] = items.length;
          items.push(entry);
        }
      });
    });
    return { items: items.filter(Boolean), options: options };
  }

  function resolveOptions(spec, given) {
    const out = {};
    Object.keys(spec).forEach((k) => {
      const choices = spec[k].choices || {};
      const v = given && given[k] !== undefined ? given[k] : spec[k].default;
      if (!Object.prototype.hasOwnProperty.call(choices, v)) fail("unknown " + k + " '" + v + "'");
      out[k] = v;
    });
    return out;
  }

  function run(merged, gross, options) {
    const ctx = { gross: gross, options: options, values: {} };
    const charges = [];
    const shown = [];
    merged.items.forEach((item) => {
      const isCharge = Object.prototype.hasOwnProperty.call(item, "charge");
      const expr = isCharge ? item.charge : item.value;
      if (expr === undefined) fail("item '" + item.id + "' has neither value nor charge");
      const rows = [];
      const v = evaluate(expr, ctx, rows);
      if (!isFinite(v)) fail("item '" + item.id + "' evaluated to " + v);
      ctx.values[item.id] = v;
      const out = { id: item.id, label: item.label, amount: v, jurisdiction: item.jurisdiction, rows: rows };
      if (isCharge) {
        out.group = item.group || "tax";
        charges.push(out);
      } else if (item.show) {
        shown.push(out);
      }
    });
    const total = charges.reduce((acc, c) => acc + c.amount, 0);
    return { values: ctx.values, charges: charges, shown: shown, total: total };
  }

  /* chain: jurisdiction documents from the root down, e.g. [federal, state] */
  function compute(chain, gross, given) {
    if (!Array.isArray(chain) || !chain.length) fail("compute needs a list of jurisdiction documents");
    const merged = merge(chain);
    const options = resolveOptions(merged.options, given);
    const r = run(merged, gross, options);
    const next = run(merged, gross + 1, options);
    const net = gross - r.total;
    const byGroup = {};
    r.charges.forEach((c) => { byGroup[c.group] = (byGroup[c.group] || 0) + c.amount; });
    return {
      gross: gross,
      options: options,
      values: r.values,
      charges: r.charges,
      shown: r.shown,
      byGroup: byGroup,
      totalDeductions: r.total,
      net: net,
      /* A "working day" is one of 260 — 5 days across 52 weeks. A
         convention, not a payroll figure, and pages say so. */
      perMonth: net / 12,
      perWeek: net / 52,
      perDay: net / 260,
      /* What share of the gross never reaches you */
      deductionRate: gross > 0 ? (r.total / gross) * 100 : 0,
      /* What is taken from the next unit earned — the number that matters
         when weighing a pay rise or overtime */
      marginalRate: gross >= 0 ? (next.total - r.total) * 100 : 0
    };
  }

  /* ---- loading ---- */

  const cache = {};

  function getJSON(url) {
    if (!cache[url]) {
      cache[url] = fetch(url, { cache: "no-cache" }).then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
        return res.json();
      });
    }
    return cache[url];
  }

  /* Resolves an id like "us-ca" to its document chain via the index */
  function load(id, base) {
    const root = base || "/data/tax/";
    return getJSON(root + "index.json").then((index) => {
      const chain = [];
      function step(current) {
        const entry = index.jurisdictions[current];
        if (!entry) return Promise.reject(new Error("no jurisdiction '" + current + "'"));
        return getJSON(root + entry.file).then((doc) => {
          chain.unshift(doc);
          return doc.parent ? step(doc.parent) : chain;
        });
      }
      return step(id);
    });
  }

  /* ---- formatting ----

     English pages throughout, but each currency written its own way: lakh
     grouping for rupees, no decimals for yen. Shared by the page generator and
     the live calculators so the baked and recalculated figures look the same. */

  const MONEY = {
    GBP: { locale: "en-GB", display: "symbol", decimals: 2 },
    USD: { locale: "en-US", display: "symbol", decimals: 2 },
    EUR: { locale: "en-IE", display: "symbol", decimals: 2 },
    NOK: { locale: "en-GB", display: "narrowSymbol", decimals: 2 },
    SEK: { locale: "en-GB", display: "narrowSymbol", decimals: 2 },
    DKK: { locale: "en-GB", display: "narrowSymbol", decimals: 2 },
    JPY: { locale: "en-US", display: "symbol", decimals: 0 },
    INR: { locale: "en-IN", display: "symbol", decimals: 2 },
    AUD: { locale: "en-AU", display: "symbol", decimals: 2 },
    NZD: { locale: "en-NZ", display: "symbol", decimals: 2 }
  };

  /* whole: drop the pence/cents, for headline salary figures */
  function money(v, currency, whole) {
    if (typeof v !== "number" || !isFinite(v)) return "—";
    const m = MONEY[currency] || { locale: "en-GB", display: "symbol", decimals: 2 };
    const dp = whole ? 0 : m.decimals;
    const rounded = Math.round(Math.abs(v) * Math.pow(10, dp)) / Math.pow(10, dp);
    const text = new Intl.NumberFormat(m.locale, {
      style: "currency", currency: currency, currencyDisplay: m.display,
      minimumFractionDigits: dp, maximumFractionDigits: dp
    }).format(rounded);
    return (v < 0 && rounded !== 0 ? "−" : "") + text;
  }

  return {
    compute: compute,
    evaluate: evaluate,
    merge: merge,
    load: load,
    money: money,
    OPS: OPS
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = TaxEngine;
