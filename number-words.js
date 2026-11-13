/* Numbers in words, shared by the browser (window.NumberWords) and the page
   generators (tools/lib/words.js re-exports this).

   British English (with "and": one hundred and five), American English
   (without it), and the Indian system (lakh and crore), plus ordinals,
   years as they're said, and cheque wording. The British form matches
   number-to-words.js, the live converter; tools/build-number-pages.js
   checks that on every build. */
var NumberWords = (function () {
  "use strict";
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
    "eighteen", "nineteen"];
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const SCALES = ["", "thousand", "million", "billion", "trillion"];
  
  function two(n) {
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  }
  
  /* 0–999; and: whether to put "and" after hundred */
  function three(n, and) {
    const h = Math.floor(n / 100), r = n % 100;
    let out = h ? ONES[h] + " hundred" : "";
    if (r) out += (h ? (and ? " and " : " ") : "") + two(r);
    return out;
  }
  
  /* Short scale (British and American). british: true adds the two British "and"s */
  function shortScale(n, british) {
    if (n === 0) return "zero";
    const groups = [];
    let x = n;
    while (x > 0) { groups.push(x % 1000); x = Math.floor(x / 1000); }
    const parts = [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i];
      if (!g) continue;
      let text = three(g, british) + (SCALES[i] ? " " + SCALES[i] : "");
      if (british && i === 0 && g < 100 && parts.length) text = "and " + text;
      parts.push(text);
    }
    return parts.join(" ");
  }
  
  /* Indian system: crore (10^7), lakh (10^5), thousand, hundred */
  function indian(n) {
    if (n === 0) return "zero";
    const crore = Math.floor(n / 10000000), lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000), rest = n % 1000;
    const parts = [];
    if (crore) parts.push((crore >= 100 ? indian(crore) : two(crore)) + " crore");
    if (lakh) parts.push(two(lakh) + " lakh");
    if (thousand) parts.push(two(thousand) + " thousand");
    if (rest) parts.push(three(rest, false));
    return parts.join(" ");
  }
  
  const ORD = { one: "first", two: "second", three: "third", five: "fifth", eight: "eighth", nine: "ninth", twelve: "twelfth" };
  function ordinal(words) {
    const m = words.match(/([a-z]+)$/);
    const last = m[1];
    let o;
    if (ORD[last]) o = ORD[last];
    else if (last.endsWith("y")) o = last.slice(0, -1) + "ieth";
    else o = last + "th";
    return words.slice(0, words.length - last.length) + o;
  }
  
  function ordinalSuffix(n) {
    const t = n % 100;
    if (t >= 11 && t <= 13) return n + "th";
    return n + (["th", "st", "nd", "rd"][n % 10] || "th");
  }
  
  function grouped(n, system) {
    if (system !== "indian") return n.toLocaleString("en-GB");
    const s = String(n);
    if (s.length <= 3) return s;
    const last = s.slice(-3);
    return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last;
  }
  
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  
  function roman(n) {
    if (n < 1 || n > 3999) return null;
    const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
  }
  
  /* How a year is usually said: nineteen ninety-nine, nineteen oh five,
     two thousand and three, twenty twenty-six, twenty-one hundred */
  function yearSpoken(n) {
    const hi = Math.floor(n / 100), lo = n % 100;
    if (n >= 2000 && n <= 2009) return n === 2000 ? "two thousand" : "two thousand and " + ONES[lo];
    if (lo === 0) return two(hi) + " hundred";
    if (lo < 10) return two(hi) + " oh " + ONES[lo];
    return two(hi) + " " + two(lo);
  }

  /* The words line of a cheque. amount in major units (may have pence).
     style: "uk" | "us" | "in" | "eu" */
  function chequeWords(amount, style) {
    var cents = Math.round(amount * 100);
    var major = Math.floor(cents / 100), minor = cents % 100;
    if (style === "us") {
      return cap(shortScale(major, false)) + " and " + (minor < 10 ? "0" : "") + minor + "/100 dollar" + (major === 1 && minor === 0 ? "" : "s");
    }
    if (style === "in") {
      var r = "Rupees " + tcase(indian(major));
      if (minor) r += " and Paise " + tcase(two(minor));
      return r + " Only";
    }
    var names = style === "eu" ? ["euro", "euros", "cent", "cents"] : ["pound", "pounds", "penny", "pence"];
    if (major === 0 && minor > 0) return cap(two(minor)) + " " + (minor === 1 ? names[2] : names[3]) + " only";
    var line = cap(shortScale(major, true)) + " " + (major === 1 ? names[0] : names[1]);
    if (minor) line += " and " + two(minor) + " " + (minor === 1 ? names[2] : names[3]);
    return line + " only";
  }
  function tcase(s) { return s.replace(/(^|[ -])([a-z])/g, function (m, a, c) { return a + c.toUpperCase(); }); }

  return { yearSpoken: yearSpoken, british: function (n) { return shortScale(n, true); }, american: function (n) { return shortScale(n, false); },
    indian: indian, ordinal: ordinal, ordinalSuffix: ordinalSuffix, grouped: grouped, cap: cap, roman: roman, chequeWords: chequeWords };
})();

if (typeof module !== "undefined" && module.exports) module.exports = NumberWords;
