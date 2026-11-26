/* Icons: every calculator and category card has an icon, written in the page
   sources as an emoji (easy to read and type) and turned into a line icon
   from the sprite /icons.svg when a page is written, so they look the same
   on every device. Country flags become a two-letter badge instead, since
   Windows shows flag emoji as letters anyway.

   The sprite holds only the icons named here; tools/build-icons.js makes it
   from the Lucide icon set (ISC licence). A new emoji needs an entry below
   and a rebuilt sprite, or the build stops and says which one is missing. */
const ICONS = {
  "💷": "banknote", "📈": "trending-up", "🗂️": "layout-grid", "🎲": "dices", "🌱": "sprout", "🏡": "house",
  "🏠": "door-open", "🏦": "landmark", "📋": "list", "⚖️": "scale", "📊": "chart-column", "🎓": "graduation-cap",
  "📅": "calendar", "🚗": "car", "🔢": "calculator", "🔁": "repeat", "🧾": "receipt", "🏷️": "tag", "⏱️": "timer",
  "💳": "credit-card", "🐷": "piggy-bank", "🔥": "flame", "🏛️": "scroll-text", "🍽️": "utensils", "🥣": "cooking-pot",
  "🌡️": "thermometer", "📐": "ruler", "🎂": "cake", "🗓️": "calendar-days", "🌍": "globe", "🪐": "orbit", "☀️": "sun",
  "📝": "type", "🧑‍🔬": "sigma", "💯": "percent", "➗": "divide", "🔤": "case-sensitive", "🖊️": "pen-line",
  "🧪": "flask-conical", "🎚️": "sliders-horizontal", "🤖": "bot", "💱": "arrow-left-right", "⏰": "alarm-clock",
  "🏢": "building-2", "💼": "briefcase", "👶": "baby", "📦": "package", "🏖️": "umbrella", "🌴": "tree-palm", "🧳": "luggage", "💍": "gem", "🔍": "search",
  "📉": "trending-down", "🎯": "target", "✉️": "mail", "🛟": "life-buoy", "🎄": "tree-pine", "🧓": "armchair",
  "🏘️": "building", "🔑": "key-round", "❄️": "snowflake", "🧮": "chart-line", "🪫": "battery-low", "🍁": "leaf",
  "🧑‍🤝‍🧑": "users", "🦃": "drumstick", "🍟": "wind", "❤️": "heart-pulse", "📏": "person-standing", "🏋️": "dumbbell",
  "🥚": "egg", "😴": "moon", "🤰": "calendar-heart", "🥗": "salad", "🍷": "wine", "⛽": "fuel", "🔌": "plug-zap",
  "🏃": "footprints", "💡": "lightbulb", "🎨": "paintbrush", "🧱": "brick-wall", "🔲": "grid-3x3", "⚡": "zap",
  "🐎": "trophy", "🔀": "shuffle", "🎰": "layers", "📆": "calendar-plus", "⏳": "hourglass", "🐕": "dog", "🐈": "cat",
  "🚀": "rocket", "📖": "book-open", "🎁": "gift", "👥": "briefcase-business", "👛": "wallet", "🕒": "clock", "🩺": "stethoscope", "🛣️": "route", "🪙": "coins", "💰": "hand-coins"
};
/* used by share.js and the homepage search, not by cards */
const EXTRA = ["link", "printer", "star", "search"];

/* regional-indicator pairs read straight off as ISO codes; Scotland's tag sequence by hand */
const FLAG_NAMES = { "GB": "UK", "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}": "SCT" };
function flagCode(e) {
  if (FLAG_NAMES[e]) return FLAG_NAMES[e];
  const cps = [...e].map((c) => c.codePointAt(0));
  if (cps.length === 2 && cps.every((c) => c >= 0x1f1e6 && c <= 0x1f1ff)) {
    const code = cps.map((c) => String.fromCharCode(c - 0x1f1e6 + 65)).join("");
    return FLAG_NAMES[code] || code;
  }
  return null;
}

/* emoji are compared without the variation selector (U+FE0F), which some
   sources include and some don't */
const norm = (e) => e.replace(/\uFE0F/g, "");
const BY = {};
Object.keys(ICONS).forEach((k) => { BY[norm(k)] = ICONS[k]; });

function svg(name) {
  const v = require("./assets.js").tag("icons.svg");
  return `<svg class="ico" aria-hidden="true"><use href="/icons.svg${v ? "?v=" + v : ""}#${name}"></use></svg>`;
}

/* The inside of an icon span for an emoji, or null if it isn't one we know */
function inner(emoji) {
  const e = emoji.trim();
  if (BY[norm(e)]) return svg(BY[norm(e)]);
  const code = flagCode(e);
  if (code) return `<b class="flag-code">${code}</b>`;
  return null;
}

/* Turn every emoji icon in a page into its line icon or flag badge */
const RE = /(<span class="(?:icon|cat-tile-icon)"(?: aria-hidden="true")?>)([^<]+)(<\/span>)/g;
/* and the category links on category pages: <a class="category-pill" ...>🏠 Home & DIY</a> */
const PILL = /(<a class="category-pill(?: current)?"[^>]*>)([^<\sA-Za-z0-9&]+)\s+/g;
function convert(html, where) {
  const fail = (e) => { throw new Error(`no icon for ${JSON.stringify(e)}${where ? " in " + where : ""}: add it to tools/lib/icons.js`); };
  return html.replace(RE, (all, open, e, close) => open + (inner(e) || fail(e)) + close)
    .replace(PILL, (all, open, e) => open + (inner(e) || fail(e)) + " ");
}

module.exports = { ICONS, EXTRA, convert, inner, svg };
