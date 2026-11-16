/* Which pay rise pages exist, shared by tools/build-pay-rise-pages.js (which
   makes them) and tools/build-tax-pages.js (whose UK salary pages link to
   them): every UK salary page amount, at these percentages. */
const config = require("./salary-pages-config.js");

const PCTS = [2, 3, 4, 5, 6, 10];
const SALARIES = config.SALARIES.GBP.slice();
const slug = (pct, salary) => `${pct}-percent-on-${salary}`;
const url = (pct, salary) => `/pay-rise-calculator/${slug(pct, salary)}/`;
const has = (pct, salary) => PCTS.includes(pct) && SALARIES.includes(salary);
const pctUrl = (pct) => `/pay-rise-calculator/${pct}-percent/`;

module.exports = { PCTS, SALARIES, slug, url, has, pctUrl };
