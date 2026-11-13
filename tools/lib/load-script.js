/* Runs one of the site's browser scripts in Node with a dummy DOM, and hands
   back the named functions and constants, so a page generator can use exactly
   the same maths as the live calculator instead of a copy that could drift.

       const { toRoman } = load("roman-numerals.js", ["toRoman"]); */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");

function stubElement() {
  return new Proxy(function () {}, {
    get(target, key) {
      if (key === "addEventListener" || key === "removeEventListener" || key === "appendChild" || key === "setAttribute") return () => {};
      if (key === "classList") return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (key === "style" || key === "dataset") return {};
      if (key === "selectedOptions") return [{ text: "" }];
      if (key === "options") return [];
      if (key === Symbol.toPrimitive) return () => "";
      return "";
    },
    set() { return true; }
  });
}

function load(file, names) {
  const el = stubElement();
  const ctx = {
    document: {
      getElementById: () => el, querySelector: () => el, querySelectorAll: () => [],
      addEventListener() {}, createElement: () => stubElement(), body: el
    },
    window: { addEventListener() {}, location: { hash: "" } }, navigator: {}, localStorage: { getItem() { return null; }, setItem() {} },
    console, setTimeout() {}, clearTimeout() {}
  };
  vm.createContext(ctx);
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(src + "\n;this.__out = {" + names.map((n) => `${n}: typeof ${n} !== "undefined" ? ${n} : undefined`).join(", ") + "};", ctx);
  names.forEach((n) => { if (ctx.__out[n] === undefined) throw new Error(file + " has no " + n); });
  return ctx.__out;
}

module.exports = { load };
