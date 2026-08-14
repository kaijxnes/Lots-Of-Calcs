/* List prices in US dollars per million tokens, checked 14 August 2026.
   "cache" is the cache-read rate, which is a tenth of the standard input price
   at all three providers. Providers move these without much notice, so the
   price fields on the page are editable and these are only a starting point. */
const MODELS = [
  { g: "Anthropic", id: "opus-5", name: "Claude Opus 5", in: 5.0, out: 25.0 },
  { g: "Anthropic", id: "opus-4-8", name: "Claude Opus 4.8", in: 5.0, out: 25.0 },
  { g: "Anthropic", id: "sonnet-5", name: "Claude Sonnet 5", in: 2.0, out: 10.0,
    note: "Introductory rate to 31 August 2026. It goes to $3.00 / $15.00 after that." },
  { g: "Anthropic", id: "sonnet-4-6", name: "Claude Sonnet 4.6", in: 3.0, out: 15.0 },
  { g: "Anthropic", id: "haiku-4-5", name: "Claude Haiku 4.5", in: 1.0, out: 5.0,
    note: "200K context window — the others in this list are 1M." },
  { g: "Anthropic", id: "fable-5", name: "Claude Fable 5", in: 10.0, out: 50.0 },
  { g: "OpenAI", id: "gpt-5-6-sol", name: "GPT-5.6 Sol", in: 5.0, out: 30.0 },
  { g: "OpenAI", id: "gpt-5-6-terra", name: "GPT-5.6 Terra", in: 2.0, out: 12.0 },
  { g: "OpenAI", id: "gpt-5-6-luna", name: "GPT-5.6 Luna", in: 0.2, out: 1.2 },
  { g: "OpenAI", id: "gpt-5-5", name: "GPT-5.5", in: 5.0, out: 30.0 },
  { g: "OpenAI", id: "gpt-5-4", name: "GPT-5.4", in: 2.5, out: 15.0 },
  { g: "Google", id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", in: 2.0, out: 12.0,
    note: "Rate for prompts up to 200K tokens — longer prompts are metered higher." },
  { g: "Google", id: "gemini-3-6-flash", name: "Gemini 3.6 Flash", in: 0.75, out: 3.75,
    note: "Introductory rate to 31 December 2026. It goes to $1.50 / $7.50 after that." },
  { g: "Google", id: "gemini-3-1-flash-lite", name: "Gemini 3.1 Flash-Lite", in: 0.25, out: 1.5 }
];

/* Every provider prices a cache read at roughly a tenth of a fresh input token */
const CACHE_RATIO = 0.1;

const els = {
  model: document.getElementById("model"),
  modelNote: document.getElementById("model-note"),
  priceIn: document.getElementById("price-in"),
  priceOut: document.getElementById("price-out"),
  priceCache: document.getElementById("price-cache"),
  inTokens: document.getElementById("in-tokens"),
  outTokens: document.getElementById("out-tokens"),
  cachePct: document.getElementById("cache-pct"),
  requests: document.getElementById("requests"),
  period: document.getElementById("period"),
  tier: document.getElementById("tier"),
  currency: document.getElementById("currency"),
  fxField: document.getElementById("fx-field"),
  fxRate: document.getElementById("fx-rate"),
  error: document.getElementById("ai-error"),
  heroValue: document.getElementById("hero-value"),
  outPerRequest: document.getElementById("out-per-request"),
  outPer1k: document.getElementById("out-per-1k"),
  outDay: document.getElementById("out-day"),
  outMonth: document.getElementById("out-month"),
  outYear: document.getElementById("out-year"),
  outInputCost: document.getElementById("out-input-cost"),
  outOutputCost: document.getElementById("out-output-cost"),
  outBlended: document.getElementById("out-blended"),
  outTokensMonth: document.getElementById("out-tokens-month"),
  cacheRow: document.getElementById("cache-row"),
  outCacheSaving: document.getElementById("out-cache-saving"),
  tierRow: document.getElementById("tier-row"),
  outTierSaving: document.getElementById("out-tier-saving"),
  verdict: document.getElementById("verdict"),
  compareBody: document.getElementById("compare-body"),
  words: document.getElementById("words"),
  outWordTokens: document.getElementById("out-word-tokens"),
  outWordChars: document.getElementById("out-word-chars"),
  useAsInput: document.getElementById("use-as-input"),
  useAsOutput: document.getElementById("use-as-output")
};

const SYMBOL = { USD: "$", GBP: "£", EUR: "€" };

/* Requests are held as a yearly figure internally so the day, week, month and
   year lines stay consistent with each other whichever period was entered.
   A year is 365 days, so it is 365/7 weeks — using a flat 52 would quietly
   lose a day and a bit, and 1,000 a day would stop matching 7,000 a week. */
const PER_YEAR = { day: 365, week: 365 / 7, month: 12, year: 1 };

function num(el) {
  const raw = el.value.trim().replace(/[\s,]/g, "");
  if (raw === "") return null;
  const v = Number(raw);
  return isFinite(v) ? v : NaN;
}

function symbol() {
  return SYMBOL[els.currency.value] || "$";
}

/* Period totals are ordinary money, so two decimals and thousands separators */
function money(v) {
  if (!isFinite(v)) return "—";
  const rounded = Math.round(Math.abs(v) * 100) / 100;
  const sign = v < 0 && rounded !== 0 ? "−" : "";
  return sign + symbol() + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* A single request often costs a hundredth of a penny, and rounding that to
   two decimals just prints zero — so small figures keep more of themselves */
function moneyFine(v) {
  if (!isFinite(v)) return "—";
  const a = Math.abs(v);
  let dp;
  if (a === 0) dp = 2;
  else if (a < 0.001) dp = 7;
  else if (a < 0.01) dp = 6;
  else if (a < 1) dp = 4;
  else dp = 2;
  const sign = v < 0 ? "−" : "";
  return sign + symbol() + a.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: dp });
}

function tokens(v) {
  if (!isFinite(v)) return "—";
  return Math.round(v).toLocaleString("en-GB");
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function clearResults() {
  els.heroValue.textContent = "—";
  ["outPerRequest", "outPer1k", "outDay", "outMonth", "outYear", "outInputCost",
   "outOutputCost", "outBlended", "outTokensMonth", "outCacheSaving", "outTierSaving"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.verdict.style.display = "none";
  els.compareBody.innerHTML = "";
}

function findModel(id) {
  return MODELS.find((m) => m.id === id) || null;
}

/* Filling the price boxes from a preset must not look like the user typed in
   them, or the select would immediately flip itself back to Custom */
let fillingPrices = false;

function applyPreset() {
  const m = findModel(els.model.value);
  if (!m) {
    els.modelNote.style.display = "none";
    return;
  }
  fillingPrices = true;
  els.priceIn.value = String(m.in);
  els.priceOut.value = String(m.out);
  els.priceCache.value = String(Math.round(m.in * CACHE_RATIO * 10000) / 10000);
  fillingPrices = false;
  els.modelNote.textContent = m.note || "";
  els.modelNote.style.display = m.note ? "block" : "none";
}

/* One request's cost in dollars, before any batch discount */
function costPerRequest(inTok, outTok, cachePct, pIn, pOut, pCache) {
  const cached = inTok * (cachePct / 100);
  const fresh = inTok - cached;
  return (fresh * pIn + cached * pCache + outTok * pOut) / 1e6;
}

function calculate() {
  const cur = els.currency.value;
  els.fxField.style.display = cur === "USD" ? "none" : "";

  const inTok = num(els.inTokens);
  const outTok = num(els.outTokens);
  const cachePctRaw = num(els.cachePct);
  const reqs = num(els.requests);
  const pIn = num(els.priceIn);
  const pOut = num(els.priceOut);
  const pCacheRaw = num(els.priceCache);

  if (inTok === null) return fail("Enter the number of input tokens in a typical request.");
  if (isNaN(inTok)) return fail("The input token count isn't a number.");
  if (inTok < 0) return fail("The input token count can't be negative.");

  if (outTok === null) return fail("Enter the number of output tokens you expect back.");
  if (isNaN(outTok)) return fail("The output token count isn't a number.");
  if (outTok < 0) return fail("The output token count can't be negative.");
  if (inTok === 0 && outTok === 0) return fail("A request with no tokens either way costs nothing — enter a token count.");

  const cachePct = cachePctRaw === null ? 0 : cachePctRaw;
  if (isNaN(cachePct)) return fail("The cached share isn't a number.");
  if (cachePct < 0 || cachePct > 100) return fail("The cached share has to be between 0% and 100%.");

  if (reqs === null) return fail("Enter how many requests you make.");
  if (isNaN(reqs)) return fail("The request count isn't a number.");
  if (reqs < 0) return fail("The request count can't be negative.");

  if (pIn === null || isNaN(pIn) || pIn < 0) return fail("Enter a valid input price per million tokens.");
  if (pOut === null || isNaN(pOut) || pOut < 0) return fail("Enter a valid output price per million tokens.");
  const pCache = pCacheRaw === null ? pIn * CACHE_RATIO : pCacheRaw;
  if (isNaN(pCache) || pCache < 0) return fail("Enter a valid cached input price per million tokens.");

  let fx = 1;
  if (cur !== "USD") {
    fx = num(els.fxRate);
    if (fx === null) return fail("Enter the exchange rate to use, or switch back to dollars.");
    if (isNaN(fx)) return fail("The exchange rate isn't a number.");
    if (fx <= 0) return fail("The exchange rate has to be greater than zero.");
  }

  setError("");

  const tierFactor = els.tier.value === "batch" ? 0.5 : 1;
  const reqYear = reqs * PER_YEAR[els.period.value];
  const reqMonth = reqYear / 12;
  const reqDay = reqYear / 365;

  const perRequest = costPerRequest(inTok, outTok, cachePct, pIn, pOut, pCache) * tierFactor * fx;
  const perYear = perRequest * reqYear;
  const perMonth = perYear / 12;

  const cachedTok = inTok * (cachePct / 100);
  const freshTok = inTok - cachedTok;
  const inputCostMonth = ((freshTok * pIn + cachedTok * pCache) / 1e6) * tierFactor * fx * reqMonth;
  const outputCostMonth = ((outTok * pOut) / 1e6) * tierFactor * fx * reqMonth;

  els.heroValue.textContent = money(perMonth);
  els.outPerRequest.textContent = moneyFine(perRequest);
  els.outPer1k.textContent = money(perRequest * 1000);
  els.outDay.textContent = `${money(perYear / 365)} over ${tokens(reqDay)} requests`;
  els.outMonth.textContent = money(perMonth);
  els.outYear.textContent = money(perYear);
  els.outInputCost.textContent = money(inputCostMonth);
  els.outOutputCost.textContent = money(outputCostMonth);

  const totalTok = (inTok + outTok) * reqMonth;
  els.outTokensMonth.textContent =
    `${tokens(inTok * reqMonth)} in, ${tokens(outTok * reqMonth)} out`;

  /* What a million tokens costs you in practice, once the input/output mix,
     the cached share and the tier are all folded in. It is the one number that
     compares cleanly against a headline price. */
  els.outBlended.textContent = totalTok > 0 ? moneyFine((perMonth / totalTok) * 1e6) : "—";

  const noCache = costPerRequest(inTok, outTok, 0, pIn, pOut, pCache) * tierFactor * fx;
  const cacheSaving = (noCache - perRequest) * reqMonth;
  els.cacheRow.style.display = cachePct > 0 ? "flex" : "none";
  els.outCacheSaving.textContent = money(cacheSaving);

  const noTier = costPerRequest(inTok, outTok, cachePct, pIn, pOut, pCache) * fx * reqMonth;
  els.tierRow.style.display = tierFactor !== 1 ? "flex" : "none";
  els.outTierSaving.textContent = money(noTier - perMonth);

  buildVerdict(perMonth, inputCostMonth, outputCostMonth, cachePct, cacheSaving, tierFactor);
  buildCompare(inTok, outTok, cachePct, tierFactor, fx, reqMonth, pIn, pOut, pCache);
}

function fail(message) {
  setError(message);
  clearResults();
}

function buildVerdict(perMonth, inputCost, outputCost, cachePct, cacheSaving, tierFactor) {
  const total = inputCost + outputCost;
  const parts = [`At this workload the bill is <strong>${money(perMonth)}</strong> a month.`];

  if (total > 0) {
    const outShare = (outputCost / total) * 100;
    if (outShare >= 60) {
      parts.push(`Output tokens are <strong>${Math.round(outShare)}%</strong> of it — shortening the answers will do more than shortening the prompt.`);
    } else if (outShare <= 25) {
      parts.push(`Input tokens are <strong>${Math.round(100 - outShare)}%</strong> of it — this is a prompt-heavy workload, which is exactly the shape prompt caching is built for.`);
    }
  }

  if (cachePct > 0) {
    parts.push(`Caching ${Math.round(cachePct)}% of the prompt is saving <strong>${money(cacheSaving)}</strong> a month.`);
  }
  if (tierFactor === 1) {
    parts.push(`If the work can wait, the Batch API would halve it.`);
  }

  els.verdict.innerHTML = parts.join(" ");
  els.verdict.style.display = "block";
}

function buildCompare(inTok, outTok, cachePct, tierFactor, fx, reqMonth, pIn, pOut, pCache) {
  const current = els.model.value;
  const rows = MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    group: m.g,
    pIn: m.in,
    pOut: m.out,
    month: costPerRequest(inTok, outTok, cachePct, m.in, m.out, m.in * CACHE_RATIO) * tierFactor * fx * reqMonth
  }));

  /* Custom prices are not one of the presets, so give them their own row —
     otherwise the table silently ignores what the user actually typed */
  if (current === "custom") {
    rows.push({
      id: "custom",
      name: "Your prices",
      group: "Custom",
      pIn: pIn,
      pOut: pOut,
      month: costPerRequest(inTok, outTok, cachePct, pIn, pOut, pCache) * tierFactor * fx * reqMonth
    });
  }

  rows.sort((a, b) => a.month - b.month);
  const currentRow = rows.find((r) => r.id === current);
  const cheapest = rows[0].month;

  els.compareBody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    let vs = "—";
    if (currentRow && r.id !== current) {
      const diff = r.month - currentRow.month;
      const cls = diff < 0 ? "pos" : "neg";
      vs = `<span class="${cls}">${diff < 0 ? "−" : "+"}${money(Math.abs(diff)).replace("−", "")}</span>`;
    } else if (r.id === current) {
      vs = "this one";
    }
    if (r.id === current) tr.className = "current";
    tr.innerHTML =
      `<td>${r.name}${r.month === cheapest ? " 🏆" : ""}</td>` +
      `<td>$${r.pIn.toFixed(2)}</td>` +
      `<td>$${r.pOut.toFixed(2)}</td>` +
      `<td>${money(r.month)}</td>` +
      `<td>${vs}</td>`;
    els.compareBody.appendChild(tr);
  });
}

/* Roughly four characters or three-quarters of a word per token for ordinary
   English prose. Every model tokenises differently, so this is an estimate and
   nothing more — see the note on the page. */
const TOKENS_PER_WORD = 1.33;
const CHARS_PER_TOKEN = 4;

function estimateWords() {
  const w = num(els.words);
  if (w === null || isNaN(w) || w < 0) {
    els.outWordTokens.textContent = "—";
    els.outWordChars.textContent = "—";
    return null;
  }
  const t = Math.round(w * TOKENS_PER_WORD);
  els.outWordTokens.textContent = tokens(t) + " tokens";
  els.outWordChars.textContent = "about " + tokens(t * CHARS_PER_TOKEN) + " characters";
  return t;
}

els.model.addEventListener("change", () => {
  applyPreset();
  calculate();
});

[els.priceIn, els.priceOut, els.priceCache].forEach((el) =>
  el.addEventListener("input", () => {
    if (!fillingPrices) {
      els.model.value = "custom";
      els.modelNote.style.display = "none";
    }
    calculate();
  })
);

[els.inTokens, els.outTokens, els.cachePct, els.requests, els.fxRate].forEach((el) =>
  el.addEventListener("input", calculate)
);
[els.period, els.tier, els.currency].forEach((el) => el.addEventListener("change", calculate));

els.words.addEventListener("input", estimateWords);
els.useAsInput.addEventListener("click", () => {
  const t = estimateWords();
  if (t === null) return;
  els.inTokens.value = String(t);
  calculate();
});
els.useAsOutput.addEventListener("click", () => {
  const t = estimateWords();
  if (t === null) return;
  els.outTokens.value = String(t);
  calculate();
});

applyPreset();
calculate();
estimateWords();
