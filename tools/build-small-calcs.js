#!/usr/bin/env node
/* Builds the smaller stand-alone calculators, each a page and a script:

       /overtime-calculator/       overtime pay after tax (tax-engine.js)
       /credit-card-payoff/        months to clear a card, minimum vs fixed payments
       /fire-calculator/           the savings that let you retire early, and when
       /sleep-calculator/          when to go to bed (CDC hours by age)
       /random-number-generator/   numbers, dice, coin and pick-a-winner
       /word-counter/              words, characters, sentences, reading time
       /wedding-budget/            a budget split into its parts and per guest

       node tools/build-small-calcs.js

   The overtime page's worked example uses the UK tax rates, so this runs in
   the monthly rebuild. The sleep hours are the CDC's (quoted, with the
   link); nothing else on these pages depends on figures that change. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const { SITE, esc } = site;

const all = registry.readAll(), current = registry.currentFiles(all);
const gb = registry.chainFor(current.gb.doc, all), YEAR = current.gb.doc.taxYear.label;
const PLACES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/salary-places.json"), "utf8")).groups;
const gbp = (v) => TaxEngine.money(v, "GBP"), gbp0 = (v) => TaxEngine.money(v, "GBP", true);

function shell(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url, o.modified), site.breadcrumb([["Home", SITE + "/"], [o.name, url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: o.name, url, applicationCategory: o.appCat || "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(o.q)];
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

${o.body}
    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(o.q)}    </main>

${related.block(o.path)}
${site.FOOTER}
  </div>
${(o.scripts || []).map((s) => `  <script src="${s}"></script>`).join("\n")}
</body>
</html>
`;
}
const f = (id, label, value, extra) => `        <div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;

/* ---------- overtime ---------- */
function overtime() {
  const rate = 15, hours = 37.5, ot = 5, mult = 1.5;
  const base = rate * hours * 52, extra = rate * mult * ot * 52;
  const nb = TaxEngine.compute(gb, base, {}).net, nt = TaxEngine.compute(gb, base + extra, {}).net, keep = nt - nb;
  const options = PLACES.map((g) => `<optgroup label="${esc(g.label)}">${g.places.map((x) => `<option value="${esc(x.id)}" data-currency="${x.currency}"${x.id === "gb" ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("");
  const q = [
    ["How is overtime pay worked out?", `Hourly rate × the overtime multiplier × overtime hours. At ${gbp(rate)} an hour, time and a half is ${gbp(rate * 1.5)} an hour and double time ${gbp(rate * 2)}.`],
    ["How much of my overtime do I keep after tax?", `Overtime is taxed at your top rate, because it sits on top of your normal pay. In the example, ${ot} hours a week at time and a half adds ${gbp(extra / 52)} a week before tax but ${gbp(keep / 52)} after income tax and National Insurance — ${Math.round(keep / extra * 100)}% of it.`],
    ["Is overtime taxed more?", "No — it's taxed at the same rates as the rest of your pay. It can feel like more because it's all taxed at your highest rate, and a one-off big overtime month can put more through PAYE in that month, which usually evens out over the tax year."],
    ["Do I have to be paid for overtime?", "In the UK employers don't have to pay for overtime, but your average pay for all the hours you work mustn't fall below the National Minimum Wage; your contract sets the rate (see GOV.UK's overtime rights page). In the US, the Fair Labor Standards Act requires at least time and a half over 40 hours a week for non-exempt employees."]
  ];
  return shell({ path: "/overtime-calculator/", name: "Overtime Calculator", appCat: "FinanceApplication",
    title: "Overtime Calculator — Time and a Half and Double Time, After Tax",
    desc: `Work out overtime pay at time and a half or double time, and what you actually keep after tax. ${ot} hours a week at time and a half on ${gbp(rate)} an hour adds ${gbp(keep / 52)} a week to take-home pay.`,
    h1: "Overtime calculator", sub: "Overtime at time and a half, double time or any rate — before tax and what you keep after it.", q, scripts: ["/tax-engine.js", "/overtime.js"],
    body: `    <main class="tool" id="ot-tool">
      <div class="field"><label for="ot-place">Where you work</label><select id="ot-place">${options}</select></div>
      <div class="field-row">
${f("ot-rate", 'Normal hourly rate <span class="tool-hint" id="ot-cur">GBP</span>', rate)}
${f("ot-hours", "Normal hours a week", hours)}
      </div>
      <div class="field-row">
${f("ot-h1", "Overtime hours a week", ot)}
        <div class="field"><label for="ot-mult">Overtime rate</label><select id="ot-mult"><option value="1">Normal rate</option><option value="1.25">Time and a quarter</option><option value="1.5" selected>Time and a half</option><option value="2">Double time</option></select></div>
      </div>
      <div class="field-row">
${f("ot-h2", "Double-time hours a week (optional)", 0)}
${f("ot-weeks", "Weeks a year you do this", 52)}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Overtime rate an hour", "ot-otrate", gbp(rate * mult))}
${row("Overtime pay a week, before tax", "ot-week", gbp(extra / 52))}
${row("Overtime pay a year, before tax", "ot-year", gbp0(extra))}
${row("Extra take-home a week", "ot-keepweek", gbp(keep / 52), "highlight")}
${row("Extra take-home a year", "ot-keepyear", gbp0(keep))}
${row("Share you keep", "ot-share", Math.round(keep / extra * 100) + "%")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">After income tax and National Insurance (or the local equivalent) on your yearly pay with and without the overtime, using the ${YEAR} rates and each place's usual defaults (no pension or student loan). Weeks a year spreads occasional overtime over the year.</p>
    </main>
` });
}

/* ---------- credit card ---------- */
function creditCard() {
  const C = require("../credit-card.js");
  const bal = 3000, apr = 24.9, fixed = 150, min = C.payoff({ balance: bal, apr, mode: "min", pct: 1, floor: 25 }), fx = C.payoff({ balance: bal, apr, mode: "fixed", amount: fixed });
  const yrs = (m) => `${Math.floor(m / 12)} years ${m % 12} months`;
  const q = [
    ["How long will it take to pay off my credit card with minimum payments?", `It depends on how your card works out the minimum. A ${gbp0(bal)} balance at ${apr}% APR, paying 1% of the balance plus interest (at least £25), takes ${yrs(min.months)} and costs ${gbp0(min.interest)} in interest. Paying a fixed ${gbp0(fixed)} a month clears it in ${yrs(fx.months)} for ${gbp0(fx.interest)}.`],
    ["Why do minimum payments take so long?", "Because the minimum shrinks as the balance does: most of each payment goes on interest, and as the balance falls the minimum falls with it. Paying a fixed amount — even the first month's minimum, kept the same — clears it far sooner."],
    ["How is credit card interest worked out?", "Roughly the APR ÷ 12 on the balance each month. Card companies work it out daily and the APR includes some fees, so your statement will differ slightly; this is close enough to compare plans."],
    ["Should I move the balance to a 0% card?", "A 0% balance transfer can save a lot if you can clear the balance before the offer ends — set the APR to 0 here to see the monthly payment that does it, and remember the transfer fee."]
  ];
  return shell({ path: "/credit-card-payoff/", name: "Credit Card Payoff Calculator", appCat: "FinanceApplication",
    title: "Credit Card Payoff Calculator — Minimum Payments vs a Fixed Amount",
    desc: `How long it takes to clear a credit card and the interest it costs. ${gbp0(bal)} at ${apr}% on minimum payments takes ${yrs(min.months)}; ${gbp0(fixed)} a month clears it in ${yrs(fx.months)}.`,
    h1: "Credit card payoff calculator", sub: "How long your card takes to clear, and how much interest you pay, on minimum payments or a fixed amount.", q, scripts: ["/credit-card.js"],
    body: `    <main class="tool" id="cc-tool">
      <div class="field-row">
${f("cc-balance", "Balance", bal)}
${f("cc-apr", "Interest rate (APR %)", apr)}
      </div>
      <div class="field-row">
${f("cc-amount", "Fixed payment a month", fixed)}
        <div class="field"><label for="cc-cur">Currency</label><select id="cc-cur"><option value="£" selected>£</option><option value="$">$</option><option value="€">€</option></select></div>
      </div>
      <p class="tool-section-title">Your card's minimum payment</p>
      <div class="field-row">
${f("cc-pct", "% of the balance, plus that month's interest", 1)}
${f("cc-floor", "Or at least", 25)}
      </div>
      <p class="tool-hint">Your statement or card terms say how your minimum is worked out; the figures here are an example.</p>
      <p class="error-msg" id="cc-error" style="display:none;"></p>
      <div class="jo-grid">
        <div class="jo-side"><p class="tool-section-title" style="margin-top:0;">Minimum payments</p><div class="result-box"><div class="result-grid">
${row("Time to clear", "cc-min-time", yrs(min.months), "highlight")}
${row("Interest paid", "cc-min-int", gbp0(min.interest))}
${row("First payment", "cc-min-first", gbp(min.first))}
        </div></div></div>
        <div class="jo-side"><p class="tool-section-title" style="margin-top:0;">Fixed payment</p><div class="result-box"><div class="result-grid">
${row("Time to clear", "cc-fx-time", yrs(fx.months), "highlight")}
${row("Interest paid", "cc-fx-int", gbp0(fx.interest))}
${row("Interest saved", "cc-saved", gbp0(min.interest - fx.interest))}
        </div></div></div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Interest is the APR ÷ 12 on the balance each month, with no new spending. Card issuers calculate it daily, so your statement will differ a little.</p>
    </main>
` });
}

/* ---------- FIRE ---------- */
function fire() {
  const F = require("../fire.js");
  const ex = { spending: 30000, saved: 50000, monthly: 1500, ret: 5, rate: 4 };
  const r = F.plan(ex), target = ex.spending / (ex.rate / 100);
  const q = [
    ["What is FIRE?", "Financial independence, retire early: saving and investing enough that the investments can pay for your spending for the rest of your life, so work becomes optional."],
    ["How much do I need to retire early?", `A common rule of thumb is 25 times your yearly spending — the "4% rule". Spending ${gbp0(ex.spending)} a year, that's ${gbp0(target)}. A lower withdrawal rate (3% to 3.5%) is safer for a retirement that may last 40 years or more.`],
    ["Where does the 4% rule come from?", "From US research in the 1990s on how much could be withdrawn from a stock and bond portfolio, rising with inflation, without running out over 30 years in past markets. It's a rough guide, not a guarantee, and early retirements usually need to last longer than 30 years."],
    ["What return should I use?", "The return after inflation, because spending is in today's money. No rate is guaranteed and markets go through long bad patches, so it's worth trying a cautious figure as well as your central one."],
    ["Does this include the state pension?", "No. A state or workplace pension later on reduces how much your own investments need to cover from that age, so the real figure may be lower."]
  ];
  return shell({ path: "/fire-calculator/", name: "FIRE Calculator", appCat: "FinanceApplication",
    title: "FIRE Calculator — How Much to Retire Early, and When You Can",
    desc: `Your FIRE number (25× spending at a 4% withdrawal rate) and how many years until you reach it. Spending ${gbp0(ex.spending)} a year with ${gbp0(ex.saved)} saved and ${gbp0(ex.monthly)} a month: ${r.years} years.`,
    h1: "FIRE calculator", sub: "How much you need to retire early — and how long it takes to get there.", q, scripts: ["/fire.js"],
    body: `    <main class="tool" id="fire-tool">
      <div class="field-row">
${f("fire-spending", "Spending a year in retirement", ex.spending)}
${f("fire-saved", "Invested so far", ex.saved)}
      </div>
      <div class="field-row">
${f("fire-monthly", "You invest a month", ex.monthly)}
${f("fire-ret", "Return after inflation (% a year)", ex.ret)}
      </div>
      <div class="field-row">
${f("fire-rate", "Withdrawal rate (%)", ex.rate)}
${f("fire-age", "Your age now (optional)", "", ' placeholder="e.g. 30"')}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Your FIRE number", "fire-target", gbp0(target), "highlight")}
${row("Years to get there", "fire-years", `${r.years} years`, "highlight")}
${row("Age you'd reach it", "fire-at", "—")}
${row("Paid in by then", "fire-paid", gbp0(r.paid))}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">In today's money: returns are after inflation and added monthly. Before tax and fees.</p>
      <p class="tool-section-title" style="margin-top:20px;">At other withdrawal rates</p>
      <div class="table-scroll"><div style="min-width:320px;"><table class="out-table"><thead><tr><th>Withdrawal rate</th><th>Target</th><th>Years</th></tr></thead><tbody id="fire-table"></tbody></table></div></div>
    </main>
` });
}

/* ---------- sleep ---------- */
const CDC = { url: "https://www.cdc.gov/sleep/about/index.html", title: "CDC — About Sleep (May 2024)", rows: [
  ["Newborn", "0–3 months", 14, 17, ""], ["Infant", "4–12 months", 12, 16, " (including naps)"], ["Toddler", "1–2 years", 11, 14, " (including naps)"], ["Preschool", "3–5 years", 10, 13, " (including naps)"],
  ["School age", "6–12 years", 9, 12, ""], ["Teen", "13–17 years", 8, 10, ""], ["Adult", "18–60 years", 7, null, ""], ["Adult", "61–64 years", 7, 9, ""], ["Adult", "65 years and older", 7, 8, ""]] };
function sleep() {
  const hrs = (r) => r[3] ? `${r[2]}–${r[3]} hours${r[4]}` : `${r[2]} or more hours`;
  const opts = CDC.rows.map((r, i) => `<option value="${i}" data-min="${r[2]}" data-max="${r[3] || ""}"${i === 6 ? " selected" : ""}>${r[0]}, ${r[1]}: ${hrs(r)}</option>`).join("");
  const q = [
    ["How much sleep do adults need?", `The CDC recommends 7 or more hours a night for adults aged 18 to 60, 7 to 9 hours at 61 to 64, and 7 to 8 hours from 65.`],
    ["How much sleep do children need?", `The CDC recommends 9 to 12 hours for children aged 6 to 12 and 8 to 10 hours for teenagers; younger children need more, including naps. The full table is above.`],
    ["What time should I go to bed to wake up at 7am?", "For 7 hours' sleep, about 11:45pm if you take 15 minutes to fall asleep; for 8 hours, 10:45pm; for 9 hours, 9:45pm."],
    ["What about sleep cycles?", "You'll often read that sleep runs in 90-minute cycles and that you should time your alarm to the end of one. Neither the NHS nor the CDC gives that advice; both focus on getting enough hours and going to bed and getting up at the same time every day."]
  ];
  const table = CDC.rows.map((r) => [`${r[0]}`, r[1], hrs(r)]);
  return shell({ path: "/sleep-calculator/", name: "Sleep Calculator", appCat: "HealthApplication", modified: "2026-11-21",
    title: "Sleep Calculator — What Time to Go to Bed (or Wake Up)",
    desc: "What time to go to bed for the sleep you need, by age, using the CDC's recommended hours — or when you'll wake after a set amount of sleep. For 8 hours before a 7am alarm: 10:45pm.",
    h1: "Sleep calculator", sub: "When to go to bed for enough sleep, using the CDC's recommended hours by age.", q, scripts: ["/sleep.js"],
    body: `    <main class="tool" id="sl2-tool">
      <div class="field-row">
        <div class="field"><label for="sl2-mode">I want to</label><select id="sl2-mode"><option value="wake" selected>Wake up at…</option><option value="bed">Go to bed at…</option></select></div>
        <div class="field"><label for="sl2-time">Time</label><input type="time" id="sl2-time" value="07:00"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sl2-age">Age</label><select id="sl2-age">${opts}</select></div>
${f("sl2-fall", "Minutes to fall asleep", 15)}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid" id="sl2-out">
${row("Bedtime for 7 hours' sleep", "sl2-a", "11:45pm")}
${row("Bedtime for 8 hours' sleep", "sl2-b", "10:45pm", "highlight")}
${row("Bedtime for 9 hours' sleep", "sl2-c", "9:45pm")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Recommended hours from the <a href="${CDC.url}" rel="noopener">${CDC.title}</a>. Not medical advice: if you're often tired despite enough sleep, talk to a GP or doctor.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How much sleep you need, by age (CDC)</p>
${site.table(["Age group", "Age", "Recommended a day"], table, 380)}    </main>
` });
}

/* ---------- random ---------- */
function random() {
  const q = [
    ["Is this random number generator really random?", "It uses your browser's cryptographic random number generator (crypto.getRandomValues), the same source used for security keys, and avoids the small bias that simple methods introduce. Nothing is sent anywhere."],
    ["How do I pick a random winner?", "Paste the names or entries into the box, one per line, and press Pick. Each entry has the same chance; tick 'no repeats' to draw several different winners."],
    ["Can I generate numbers without duplicates?", "Yes — tick 'no repeats' and it draws each number at most once, like drawing raffle tickets from a hat."]
  ];
  return shell({ path: "/random-number-generator/", name: "Random Number Generator",
    title: "Random Number Generator — Numbers, Dice, Coin Flip and Pick a Winner",
    desc: "Generate random numbers in any range (with or without repeats), roll dice, flip a coin or pick a random winner from a list. Fair, using your browser's cryptographic randomness.",
    h1: "Random number generator", sub: "Random numbers, dice rolls, coin flips and prize-draw winners — fair, and nothing leaves your browser.", q, scripts: ["/random.js"],
    body: `    <main class="tool" id="rn-tool">
      <p class="tool-section-title" style="margin-top:0;">Random numbers</p>
      <div class="field-row">
${f("rn-min", "From", 1, ' step="1"')}
${f("rn-max", "To", 100, ' step="1"')}
      </div>
      <div class="field-row">
${f("rn-count", "How many", 1, ' step="1" max="1000"')}
        <div class="field"><label><input type="checkbox" id="rn-unique"> No repeats</label></div>
      </div>
      <p><button class="btn" type="button" id="rn-go">Generate</button></p>
      <div class="result-box"><div class="result-hero"><div class="value" id="rn-out" style="word-break:break-word;">—</div></div></div>

      <p class="tool-section-title">Dice and coin</p>
      <div class="field-row">
${f("rn-dice", "Dice", 2, ' step="1" max="100"')}
        <div class="field"><label for="rn-sides">Sides</label><select id="rn-sides"><option>4</option><option selected>6</option><option>8</option><option>10</option><option>12</option><option>20</option><option>100</option></select></div>
      </div>
      <p><button class="btn" type="button" id="rn-roll">Roll</button> <button class="btn btn-ghost" type="button" id="rn-flip">Flip a coin</button></p>
      <div class="result-box"><div class="result-hero"><div class="value" id="rn-dice-out">—</div><div class="label" id="rn-dice-total"></div></div></div>

      <p class="tool-section-title">Pick a winner</p>
      <div class="field no-share"><label for="rn-list">Entries, one per line</label><textarea id="rn-list" rows="6" placeholder="Alice&#10;Bob&#10;Charlie"></textarea></div>
      <div class="field-row">
${f("rn-winners", "Winners to pick", 1, ' step="1"')}
        <div class="field"><label><input type="checkbox" id="rn-wunique" checked> No repeats</label></div>
      </div>
      <p><button class="btn" type="button" id="rn-pick">Pick</button></p>
      <div class="result-box"><div class="result-hero"><div class="value" id="rn-pick-out" style="word-break:break-word;">—</div><div class="label" id="rn-pick-note"></div></div></div>
    </main>
` });
}

/* ---------- word counter ---------- */
function words() {
  const q = [
    ["How does the word counter count words?", "Anything separated by spaces or line breaks counts as a word, including numbers; hyphenated words like 'well-known' count once. Most word processors count the same way, though a few treat dashes and symbols differently."],
    ["How is reading time worked out?", "Words ÷ reading speed. It uses 200 words a minute for reading and 130 for speaking aloud, round figures often used for estimates; change them to your own pace."],
    ["Is my text saved or sent anywhere?", "No. It's counted in your browser and never leaves your device."]
  ];
  return shell({ path: "/word-counter/", name: "Word Counter",
    title: "Word Counter — Words, Characters, Sentences and Reading Time",
    desc: "Count words, characters (with and without spaces), sentences and paragraphs as you type, with reading and speaking time. Private: your text never leaves your browser.",
    h1: "Word counter", sub: "Words, characters, sentences and reading time, counted as you type. Your text stays on your device.", q, scripts: ["/word-counter.js"],
    body: `    <main class="tool" id="wc-tool">
      <div class="field no-share"><label for="wc-text">Your text</label><textarea id="wc-text" rows="10" placeholder="Type or paste your text here"></textarea></div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Words", "wc-words", "0", "highlight")}
${row("Characters", "wc-chars", "0")}
${row("Characters without spaces", "wc-nospace", "0")}
${row("Sentences", "wc-sentences", "0")}
${row("Paragraphs", "wc-paras", "0")}
${row("Reading time", "wc-read", "0 min")}
${row("Speaking time", "wc-speak", "0 min")}
        </div>
      </div>
      <div class="field-row" style="margin-top:12px;">
${f("wc-rwpm", "Reading speed (words a minute)", 200)}
${f("wc-swpm", "Speaking speed (words a minute)", 130)}
      </div>
    </main>
` });
}

/* ---------- wedding budget ---------- */
const WEDDING = [["Venue and catering", 45], ["Photography and video", 10], ["Clothes and rings", 10], ["Flowers and decoration", 8], ["Music and entertainment", 7], ["Ceremony and legal fees", 3], ["Stationery", 2], ["Hair and make-up", 2], ["Transport", 2], ["Other and contingency", 11]];
function wedding() {
  const total = 20000, guests = 80;
  const q = [
    ["How should I split my wedding budget?", "There's no right answer, but the venue and food are usually the biggest share, because they scale with the number of guests. Start from a split like the one here, change the percentages to match what matters to you, and keep something back for the unexpected."],
    ["How do I cut the cost of a wedding?", "The guest list drives most of the cost, so it's the biggest lever: every guest adds food, drink, a seat and often a favour. A weekday or off-season date, a shorter drinks reception and fewer printed extras also make a real difference."],
    ["What is the cost per guest?", `The total divided by guests: ${gbp0(total)} for ${guests} guests is ${gbp0(total / guests)} a head. Venue and catering on their own come to ${gbp0(total * 0.45 / guests)} a head on this split.`]
  ];
  const fields = WEDDING.map(([l, p], i) => `          <div class="result-row"><span class="r-label"><label for="wb-p${i}">${esc(l)}</label> <input type="number" id="wb-p${i}" value="${p}" min="0" max="100" step="any" inputmode="decimal" style="width:70px;display:inline-block;"> %</span><span class="r-value" id="wb-v${i}">${gbp0(total * p / 100)}</span></div>`).join("\n");
  return shell({ path: "/wedding-budget/", name: "Wedding Budget Calculator", appCat: "FinanceApplication",
    title: "Wedding Budget Calculator — Split Your Budget and Cost per Guest",
    desc: `Split a wedding budget into venue, catering, photography, clothes, flowers and the rest, and see the cost per guest. ${gbp0(total)} for ${guests} guests is ${gbp0(total / guests)} a head.`,
    h1: "Wedding budget calculator", sub: "Share out your wedding budget, see the cost per guest, and adjust the split to suit you.", q, scripts: ["/wedding-budget.js"],
    body: `    <main class="tool" id="wb-tool" data-count="${WEDDING.length}">
      <div class="field-row">
${f("wb-total", "Total budget", total)}
${f("wb-guests", "Guests", guests, ' step="1"')}
      </div>
      <div class="field" style="max-width:200px;"><label for="wb-cur">Currency</label><select id="wb-cur"><option value="£" selected>£</option><option value="$">$</option><option value="€">€</option></select></div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${fields}
          <div class="result-row highlight"><span class="r-label">Cost per guest</span><span class="r-value" id="wb-head">${gbp0(total / guests)}</span></div>
          <div class="result-row"><span class="r-label">Percentages add up to</span><span class="r-value" id="wb-sum">100%</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The split filled in is a starting point, not an average — change the percentages to match your plans.</p>
    </main>
` });
}

const PAGES = [["overtime-calculator", overtime], ["credit-card-payoff", creditCard], ["fire-calculator", fire], ["sleep-calculator", sleep], ["random-number-generator", random], ["word-counter", words], ["wedding-budget", wedding]];
PAGES.forEach(([dir, fn]) => site.write(dir, fn()));
console.log("built " + PAGES.map((p) => "/" + p[0] + "/").join(" "));
