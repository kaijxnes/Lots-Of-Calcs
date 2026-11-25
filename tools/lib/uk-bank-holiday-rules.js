/* The UK's usual bank holidays, worked out from the pattern they follow,
   for years GOV.UK hasn't published yet (its list runs about two years
   ahead). The pattern (Banking and Financial Dealings Act 1971 and the
   dates set each year by royal proclamation) is:

     all of the UK      New Year's Day, Good Friday, the early May bank
                        holiday (first Monday in May), the spring bank
                        holiday (last Monday in May), Christmas Day, Boxing Day
     England, Wales     Easter Monday, the summer bank holiday (last Monday
     and N. Ireland     in August)
     Scotland           2nd January, the summer bank holiday (first Monday in
                        August), St Andrew's Day (30 November)
     Northern Ireland   St Patrick's Day (17 March), Battle of the Boyne (12 July)

   A fixed-date holiday that falls on a weekend moves to the next weekday
   that isn't already a holiday. One-off changes (a coronation, a jubilee,
   a moved May bank holiday) can't be foreseen, so these are "expected"
   dates, and pages say so; tools/build-working-days-pages.js checks the
   pattern against every year GOV.UK has published before using it. */
const DAY = 86400000;
const utc = (y, m, d) => Date.UTC(y, m - 1, d);
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const dow = (t) => new Date(t).getUTCDay();
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return utc(y, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
}
const firstMonday = (y, m) => { let t = utc(y, m, 1); while (dow(t) !== 1) t += DAY; return t; };
const lastMonday = (y, m) => { let t = utc(y, m + 1, 1) - DAY; while (dow(t) !== 1) t -= DAY; return t; };

/* fixed dates: on a weekday they keep their day; on a weekend they take the
   next weekday not already taken (weekday holidays are placed first: if
   Christmas is a Sunday, Boxing Day keeps Monday and Christmas moves to
   Tuesday). Scotland's New Year pair moves in order instead (New Year's Day
   on a Sunday: Monday for New Year's Day, Tuesday for 2nd January), which
   inOrder asks for. */
function placeFixed(list, taken, inOrder) {
  const out = [];
  if (inOrder && list.some(([t]) => dow(t) % 6 === 0)) {
    let s = list[0][0];
    list.forEach(([t, title]) => {
      s = Math.max(s, t);
      while (dow(s) % 6 === 0 || taken.has(s)) s += DAY;
      taken.add(s); out.push({ date: iso(s), title, sub: s !== t });
      s += DAY;
    });
    return out;
  }
  list.filter(([t]) => dow(t) % 6 !== 0).forEach(([t, title]) => { taken.add(t); out.push({ date: iso(t), title, sub: false }); });
  list.filter(([t]) => dow(t) % 6 === 0).sort((a, b) => a[0] - b[0]).forEach(([t, title]) => {
    let s = t + DAY;
    while (dow(s) % 6 === 0 || taken.has(s)) s += DAY;
    taken.add(s); out.push({ date: iso(s), title, sub: true });
  });
  return out;
}

function expected(region, y) {
  const e = easter(y), movable = [[e - 2 * DAY, "Good Friday"], [firstMonday(y, 5), "Early May bank holiday"], [lastMonday(y, 5), "Spring bank holiday"]];
  if (region !== "scotland") movable.push([e + DAY, "Easter Monday"], [lastMonday(y, 8), "Summer bank holiday"]);
  else movable.push([firstMonday(y, 8), "Summer bank holiday"]);
  const taken = new Set(movable.map(([t]) => t));
  const groups = [[[utc(y, 1, 1), "New Year's Day"]].concat(region === "scotland" ? [[utc(y, 1, 2), "2nd January"]] : []),
    [[utc(y, 12, 25), "Christmas Day"], [utc(y, 12, 26), "Boxing Day"]]];
  if (region === "scotland") groups.push([[utc(y, 11, 30), "St Andrew's Day"]]);
  if (region === "northern-ireland") groups.push([[utc(y, 3, 17), "St Patrick's Day"]], [[utc(y, 7, 12), "Battle of the Boyne (Orangemen's Day)"]]);
  const fixed = groups.flatMap((g, i) => placeFixed(g, taken, region === "scotland" && i === 0));
  return movable.map(([t, title]) => ({ date: iso(t), title, sub: false })).concat(fixed).sort((a, b) => (a.date < b.date ? -1 : 1));
}

module.exports = { expected };
