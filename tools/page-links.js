/* Links between page families: a salary page pointing at "how much could I
   borrow on this salary", a mortgage page at the stamp duty on the home it
   buys, and so on. Each family's pages are read from the folders that exist,
   so a link is only made to a page that's really there, and nobody has to
   keep lists in step. (Generators that make the target pages run before the
   ones linking to them in the monthly build; on a first build, run twice.) */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const cache = {};
function numbers(rel) {
  if (cache[rel]) return cache[rel];
  const dir = path.join(ROOT, rel);
  const out = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^\d+$/.test(d) && fs.existsSync(path.join(dir, d, "index.html"))).map(Number).sort((a, b) => a - b) : [];
  cache[rel] = out;
  return out;
}
function nearest(list, v) {
  return list.length ? list.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), list[0]) : null;
}
const exact = (rel, v) => (numbers(rel).includes(v) ? `/${rel}/${v}/` : null);
const near = (rel, v) => { const n = nearest(numbers(rel), v); return n === null ? null : { value: n, url: `/${rel}/${n}/` }; };
const money = (sym, v) => sym + Math.round(v).toLocaleString(sym === "$" ? "en-US" : "en-GB");

module.exports = {
  /* "How much can I borrow on £40,000?" */
  borrowUk: (salary) => exact("mortgage-affordability/uk", salary),
  borrowUkNear: (salary) => near("mortgage-affordability/uk", salary),
  borrowUs: (salary) => exact("mortgage-affordability/us", salary),
  borrowUsNear: (salary) => near("mortgage-affordability/us", salary),
  borrowIe: (salary) => exact("mortgage-affordability/ireland", salary),
  borrowFr: (salary) => exact("mortgage-affordability/france", salary),
  /* stamp duty on a home price, mortgage payments on a loan */
  stampDutyNear: (price) => near("stamp-duty-calculator", price),
  mortgageUkNear: (amount) => near("mortgage", amount),
  mortgageUsNear: (amount) => near("mortgage/us", amount),
  selfEmployed: (profit) => exact("self-employed-tax-calculator", profit),
  /* the 50/30/20 budget on a UK salary */
  budgetUk: (salary) => exact("50-30-20-budget", salary),
  /* what a UK salary costs the employer */
  employerCost: (salary) => exact("employer-cost-calculator", salary),
  salaryUk: (salary) => (fs.existsSync(path.join(ROOT, "salary", `${salary}-after-tax`, "index.html")) ? `/salary/${salary}-after-tax/` : null),
  money
};
