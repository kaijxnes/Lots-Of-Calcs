/* Fee schedules live in /data/rates.json so they can be corrected in one place
   without touching this page. Nothing is hardcoded here, which means that if
   the fetch fails there is no second copy to fall back on — the page says so
   and disables itself rather than calculating with figures baked into the
   JavaScript that could be years out of date. */
let RATES = null;
let loadFailed = false;

const els = {
  mode: document.getElementById("mode"),
  price: document.getElementById("price"),
  priceField: document.getElementById("price-field"),
  targetType: document.getElementById("target-type"),
  targetValue: document.getElementById("target-value"),
  targetField: document.getElementById("target-field"),
  itemCost: document.getElementById("item-cost"),
  shipCharged: document.getElementById("ship-charged"),
  shipCost: document.getElementById("ship-cost"),
  packaging: document.getElementById("packaging"),
  vatReg: document.getElementById("vat-reg"),
  currency: document.getElementById("currency"),
  error: document.getElementById("mp-error"),
  loadNote: document.getElementById("load-note"),
  ratesAsAt: document.getElementById("rates-as-at"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  outPrice: document.getElementById("out-price"),
  priceRow: document.getElementById("price-row"),
  outGross: document.getElementById("out-gross"),
  outFees: document.getElementById("out-fees"),
  outFeePct: document.getElementById("out-fee-pct"),
  outPayout: document.getElementById("out-payout"),
  outCosts: document.getElementById("out-costs"),
  outVat: document.getElementById("out-vat"),
  vatRow: document.getElementById("vat-row"),
  outProfit: document.getElementById("out-profit"),
  outMargin: document.getElementById("out-margin"),
  feeBody: document.getElementById("fee-body"),
  verdict: document.getElementById("verdict"),
  /* eBay */
  ebaySellerType: document.getElementById("ebay-seller-type"),
  ebayCategory: document.getElementById("ebay-category"),
  ebayCustomRate: document.getElementById("ebay-custom-rate"),
  ebayCustomField: document.getElementById("ebay-custom-field"),
  ebayAdRate: document.getElementById("ebay-ad-rate"),
  ebayShipInBase: document.getElementById("ebay-ship-in-base"),
  ebayPrivateNote: document.getElementById("ebay-private-note"),
  /* Etsy */
  etsyListingFee: document.getElementById("etsy-listing-fee"),
  etsyOffsite: document.getElementById("etsy-offsite"),
  etsyConversion: document.getElementById("etsy-conversion"),
  /* Amazon */
  amzCategory: document.getElementById("amz-category"),
  amzTier: document.getElementById("amz-tier"),
  amzUnits: document.getElementById("amz-units"),
  amzStorage: document.getElementById("amz-storage")
};

function platform() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "ebay-uk";
}

function money(v) {
  const symbol = els.currency.value;
  if (!isFinite(v)) return "—";
  const rounded = Math.round(Math.abs(v) * 100) / 100;
  const sign = v < 0 && rounded !== 0 ? "−" : "";
  return sign + symbol + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v, dp) {
  if (!isFinite(v)) return "—";
  return v.toFixed(dp === undefined ? 2 : dp) + "%";
}

function num(el) {
  if (!el) return 0;
  const raw = String(el.value).trim().replace(/[\s,]/g, "");
  if (raw === "") return 0;
  const v = Number(raw);
  return isFinite(v) ? v : NaN;
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---- fee engines, one per platform ----
   Each returns a list of named lines so the breakdown table shows what was
   charged and why, rather than a single opaque total. Fees are returned
   excluding VAT; the VAT on them is added afterwards, because whether it is a
   real cost depends on the seller's registration. */

function ebayFees(price, shipCharged) {
  const cfg = RATES.marketplaceFees["ebay-uk"];
  const isBusiness = els.ebaySellerType.value === "business";
  const shipInBase = els.ebayShipInBase.value === "yes";
  const base = price + (shipInBase ? shipCharged : 0);
  const lines = [];

  if (!isBusiness) {
    lines.push({ label: "Private seller — no eBay selling fees", amount: 0 });
    return lines;
  }

  const catId = els.ebayCategory.value;
  let ratePct;
  if (catId === "custom") {
    ratePct = num(els.ebayCustomRate);
  } else {
    const cat = cfg.categories.find((c) => c.id === catId);
    ratePct = cat ? cat.ratePct : 0;
  }
  lines.push({ label: `Final value fee (${pct(ratePct)} of ${money(base)})`, amount: base * (ratePct / 100) });

  /* The per-order fee steps up above a threshold, so it is worked out from the
     order total rather than assumed */
  const tier = cfg.perOrderFee.tiers.find((t) => t.upTo === null || base <= t.upTo);
  lines.push({ label: "Per-order fee", amount: tier.amount, fixed: tier.amount });

  const reg = cfg.regulatoryOperatingFeePct.value;
  lines.push({ label: `Regulatory operating fee (${pct(reg)})`, amount: base * (reg / 100) });

  const adRate = num(els.ebayAdRate);
  if (adRate > 0) {
    lines.push({ label: `Promoted listings (${pct(adRate)} of ${money(base)})`, amount: base * (adRate / 100) });
  }

  return lines;
}

function etsyFees(price, shipCharged) {
  const cfg = RATES.marketplaceFees.etsy;
  const base = price + shipCharged;
  const lines = [];

  lines.push({ label: "Listing fee", amount: num(els.etsyListingFee), fixed: num(els.etsyListingFee) });
  lines.push({
    label: `Transaction fee (${pct(cfg.transactionFeePct.value)} of ${money(base)})`,
    amount: base * (cfg.transactionFeePct.value / 100)
  });
  lines.push({
    label: `Payment processing (${pct(cfg.paymentProcessing.percent)} + ${money(cfg.paymentProcessing.fixed)})`,
    amount: base * (cfg.paymentProcessing.percent / 100) + cfg.paymentProcessing.fixed,
    fixed: cfg.paymentProcessing.fixed
  });

  const offsiteId = els.etsyOffsite.value;
  if (offsiteId !== "none") {
    const tier = cfg.offsiteAds.tiers.find((t) => t.id === offsiteId);
    if (tier) {
      /* The cap bites on expensive orders and is the reason a big sale is not
         proportionally worse off */
      const raw = base * (tier.ratePct / 100);
      const capped = Math.min(raw, cfg.offsiteAds.capPerOrder);
      lines.push({
        label: `Offsite Ads (${pct(tier.ratePct)}${capped < raw ? `, capped at ${money(cfg.offsiteAds.capPerOrder)}` : ""})`,
        amount: capped
      });
    }
  }

  if (els.etsyConversion.value === "yes") {
    const c = cfg.currencyConversionPct.value;
    lines.push({ label: `Currency conversion (${pct(c)})`, amount: base * (c / 100) });
  }

  return lines;
}

function amazonFees(price, shipCharged) {
  const cfg = RATES.marketplaceFees["amazon-uk"];
  const base = price + shipCharged;
  const lines = [];

  const cat = cfg.categories.find((c) => c.id === els.amzCategory.value) || cfg.categories[0];
  /* Several categories charge a reduced rate below a price threshold, so the
     applicable tier depends on what the item sells for */
  let ratePct = cat.ratePct;
  if (cat.lowPriceTiers) {
    const tier = cat.lowPriceTiers.find((t) => base <= t.upTo);
    if (tier) ratePct = tier.ratePct;
  }
  const referral = Math.max(base * (ratePct / 100), cfg.minimumReferralFee.amount);
  const hitMinimum = referral > base * (ratePct / 100);
  lines.push({
    label: `Referral fee (${pct(ratePct)}${hitMinimum ? `, raised to the ${money(cfg.minimumReferralFee.amount)} minimum` : ""})`,
    amount: referral
  });

  const tier = cfg.fulfilment.tiers.find((t) => t.id === els.amzTier.value);
  if (tier) {
    let fulfil = tier.amount;
    const lp = cfg.fulfilment.lowPriceThreshold;
    if (base <= lp.amount) fulfil = Math.max(0, fulfil - lp.reductionPerUnit);
    const surcharge = fulfil * (cfg.fulfilment.surchargePct.value / 100);
    lines.push({
      label: `FBA fulfilment — ${tier.label}${base <= lp.amount ? " (Low-Price FBA)" : ""}`,
      amount: fulfil,
      fixed: fulfil
    });
    lines.push({
      label: `Fuel & logistics surcharge (${pct(cfg.fulfilment.surchargePct.value, 1)})`,
      amount: surcharge,
      fixed: surcharge
    });
  }

  const units = num(els.amzUnits);
  if (units > 0) {
    lines.push({
      label: `Professional plan (${money(cfg.professionalPlan.monthlyAmount)} ÷ ${units} units)`,
      amount: cfg.professionalPlan.monthlyAmount / units,
      fixed: cfg.professionalPlan.monthlyAmount / units
    });
  }

  const storage = num(els.amzStorage);
  if (storage > 0) lines.push({ label: "Monthly storage, per unit", amount: storage, fixed: storage });

  return lines;
}

function feesFor(plat, price, shipCharged) {
  if (plat === "etsy") return etsyFees(price, shipCharged);
  if (plat === "amazon-uk") return amazonFees(price, shipCharged);
  return ebayFees(price, shipCharged);
}

/* Everything that depends on the sale price, in one place, so the reverse
   solver can call it repeatedly without duplicating the fee logic. */
function evaluate(plat, price) {
  const cfg = RATES.marketplaceFees[plat];
  const shipCharged = num(els.shipCharged);
  const itemCost = num(els.itemCost);
  const shipCost = num(els.shipCost);
  const packaging = num(els.packaging);
  const vatRegistered = els.vatReg.value === "yes";

  const lines = feesFor(plat, price, shipCharged);
  const feesExVat = lines.reduce((s, l) => s + l.amount, 0);

  /* VAT on the platform's fees is reclaimable if you are registered, so it is
     only a real cost to sellers who are not. */
  const feeVat = feesExVat * (cfg.vatOnFeesPct / 100);
  const feesTotal = vatRegistered ? feesExVat : feesExVat + feeVat;

  const gross = price + shipCharged;

  /* A registered seller owes output VAT on the sale itself — a fifth of the
     gross, not 20% on top of it, because the price already includes it. */
  const outputVat = vatRegistered ? gross / 6 : 0;

  const payout = gross - feesTotal;
  const costs = itemCost + shipCost + packaging;
  const profit = payout - costs - outputVat;
  const margin = gross > 0 ? (profit / gross) * 100 : 0;

  return {
    lines: lines,
    feesExVat: feesExVat,
    feeVat: feeVat,
    feesTotal: feesTotal,
    gross: gross,
    outputVat: outputVat,
    payout: payout,
    costs: costs,
    profit: profit,
    margin: margin,
    vatRegistered: vatRegistered
  };
}

/* Fees are piecewise — minimum referral fees, per-order tiers, Low-Price FBA
   thresholds and the Offsite Ads cap all create steps — so this bisects rather
   than solving algebraically. Profit rises monotonically with price, which is
   all bisection needs. */
function solvePrice(plat, targetType, target) {
  let lo = 0;
  let hi = 100000;

  const value = (p) => {
    const r = evaluate(plat, p);
    return targetType === "margin" ? r.margin : r.profit;
  };

  if (value(hi) < target) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (value(mid) < target) lo = mid;
    else hi = mid;
  }
  return hi;
}

function showPanels(plat) {
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.style.display = el.dataset.panel === plat ? "" : "none";
  });
  if (plat === "ebay-uk") {
    const isPrivate = els.ebaySellerType.value === "private";
    els.ebayPrivateNote.style.display = isPrivate ? "block" : "none";
    document.querySelectorAll("[data-ebay-business]").forEach((el) => {
      el.style.display = isPrivate ? "none" : "";
    });
    els.ebayCustomField.style.display =
      !isPrivate && els.ebayCategory.value === "custom" ? "" : "none";
  }
}

function clearResults() {
  els.heroValue.textContent = "—";
  ["outPrice", "outGross", "outFees", "outFeePct", "outPayout", "outCosts", "outVat", "outProfit", "outMargin"]
    .forEach((k) => { els[k].textContent = "—"; });
  els.feeBody.innerHTML = "";
  els.verdict.style.display = "none";
}

function calculate() {
  const plat = platform();
  showPanels(plat);

  if (loadFailed) return;
  if (!RATES) return;

  const cfg = RATES.marketplaceFees[plat];
  els.ratesAsAt.textContent =
    `Fees as at ${formatDate(cfg.effectiveFrom)}. ` +
    (cfg.lastVerified ? `Last checked ${formatDate(cfg.lastVerified)}. ` : "These figures have not been verified against the platform's own schedule. ") +
    `Always check the current schedule at ${cfg.name}`;
  els.ratesAsAt.innerHTML = els.ratesAsAt.textContent.replace(
    cfg.name, `<a href="${cfg.source}" rel="nofollow noopener" target="_blank">${escapeHtml(cfg.name)}</a>`
  ) + " before relying on these numbers.";

  const reverse = els.mode.value === "target";
  els.priceField.style.display = reverse ? "none" : "";
  els.targetField.style.display = reverse ? "" : "none";
  els.priceRow.style.display = reverse ? "flex" : "none";

  /* Shared validation */
  const checks = [
    [els.itemCost, "item cost"],
    [els.shipCharged, "shipping charged to the buyer"],
    [els.shipCost, "shipping cost to you"],
    [els.packaging, "packaging cost"]
  ];
  for (const [el, label] of checks) {
    const v = num(el);
    if (isNaN(v)) return fail(`The ${label} isn't a number.`);
    if (v < 0) return fail(`The ${label} can't be negative.`);
  }

  if (plat === "ebay-uk" && els.ebaySellerType.value === "business" && els.ebayCategory.value === "custom") {
    const r = num(els.ebayCustomRate);
    if (isNaN(r) || r < 0 || r > 100) return fail("The custom final value fee rate has to be between 0% and 100%.");
  }
  if (plat === "ebay-uk") {
    const a = num(els.ebayAdRate);
    if (isNaN(a) || a < 0 || a > 100) return fail("The promoted listing rate has to be between 0% and 100%.");
  }
  if (plat === "amazon-uk") {
    const u = num(els.amzUnits);
    if (isNaN(u) || u < 0) return fail("Units sold per month can't be negative.");
    const s = num(els.amzStorage);
    if (isNaN(s) || s < 0) return fail("Storage cost can't be negative.");
  }

  let price;

  if (reverse) {
    const target = num(els.targetValue);
    const targetType = els.targetType.value;
    if (isNaN(target)) return fail("The target isn't a number.");
    if (targetType === "margin" && target >= 100) return fail("A margin of 100% or more is not reachable — the fees alone make it impossible.");
    price = solvePrice(plat, targetType, target);
    if (price === null) {
      return fail("That target can't be reached at any sensible price. Lower the target, or cut the item and shipping costs.");
    }
    /* Sellers list in round pennies, so give them a price they can actually use */
    price = Math.ceil(price * 100) / 100;
  } else {
    price = num(els.price);
    if (isNaN(price)) return fail("The sale price isn't a number.");
    if (price < 0) return fail("The sale price can't be negative.");
    if (price === 0) {
      setError("");
      clearResults();
      return;
    }
  }

  setError("");

  const r = evaluate(plat, price);

  els.outPrice.textContent = money(price);
  els.outGross.textContent = money(r.gross);
  els.outFees.textContent = money(r.feesTotal);
  els.outFeePct.textContent = r.gross > 0 ? pct((r.feesTotal / r.gross) * 100) : "—";
  els.outPayout.textContent = money(r.payout);
  els.outCosts.textContent = money(r.costs);
  els.vatRow.style.display = r.vatRegistered ? "flex" : "none";
  els.outVat.textContent = money(r.outputVat);
  els.outProfit.textContent = money(r.profit);
  els.outMargin.textContent = pct(r.margin);

  els.heroValue.textContent = reverse ? money(price) : money(r.profit);
  els.heroLabel.textContent = reverse ? "List it at" : "Profit";

  const rows = r.lines.map((l) =>
    `<tr><td>${escapeHtml(l.label)}</td><td>${money(l.amount)}</td></tr>`
  );
  rows.push(`<tr><td>Fees before VAT</td><td>${money(r.feesExVat)}</td></tr>`);
  rows.push(
    `<tr><td>VAT on fees (${pct(cfg.vatOnFeesPct, 0)})${r.vatRegistered ? " — reclaimable, not counted" : ""}</td>` +
    `<td>${r.vatRegistered ? "−" + money(r.feeVat).replace("−", "") : money(r.feeVat)}</td></tr>`
  );
  rows.push(`<tr class="current"><td>Total fees</td><td>${money(r.feesTotal)}</td></tr>`);
  els.feeBody.innerHTML = rows.join("");

  buildVerdict(r, price, reverse, plat);
}

function fail(message) {
  setError(message);
  clearResults();
}

function buildVerdict(r, price, reverse, plat) {
  const parts = [];
  const takePct = r.gross > 0 ? (r.feesTotal / r.gross) * 100 : 0;

  if (reverse) {
    parts.push(`To hit that target you need to list at <strong>${money(price)}</strong>.`);
  }

  if (r.feesTotal > 0) {
    parts.push(`${plat === "ebay-uk" && els.ebaySellerType.value === "private"
      ? "eBay takes nothing from a private sale"
      : `The platform takes <strong>${money(r.feesTotal)}</strong>, or ${pct(takePct)} of the ${money(r.gross)} the buyer paid`}.`);
  }

  /* Fixed fees are what quietly ruin low-value selling. Each fee line declares
     its own fixed portion, so a charge like Etsy's "4% + 20p" contributes only
     the 20p here rather than the whole line. Called out only when it is
     actually material, not as a standing warning. */
  const fixed = r.lines.reduce((s, l) => s + (l.fixed || 0), 0);
  if (fixed > 0 && r.gross > 0 && (fixed / r.gross) > 0.05) {
    parts.push(`<strong>${money(fixed)}</strong> of that is fixed per-order and per-unit charges — ` +
      `${pct((fixed / r.gross) * 100)} of this order on its own. Fixed fees do not shrink with the price, ` +
      `so they hit cheap items hardest.`);
  }

  if (r.profit < 0) {
    parts.push(`<strong>This sale loses you ${money(-r.profit)}.</strong>`);
  } else if (r.margin < 10 && r.margin >= 0) {
    parts.push(`A ${pct(r.margin)} margin leaves very little room for a return, a refund or a postage price rise.`);
  }

  els.verdict.innerHTML = parts.join(" ");
  els.verdict.style.display = parts.length ? "block" : "none";
}

function formatDate(iso) {
  if (!iso) return "an unknown date";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/* Populates the selects that are driven by the fee file, so adding a category
   to rates.json is enough to make it appear here. */
function buildOptions() {
  const ebay = RATES.marketplaceFees["ebay-uk"];
  els.ebayCategory.innerHTML =
    ebay.categories.map((c) => `<option value="${c.id}">${escapeHtml(c.label)} — ${pct(c.ratePct)}</option>`).join("") +
    '<option value="custom">Another category — enter the rate</option>';

  const etsy = RATES.marketplaceFees.etsy;
  els.etsyListingFee.value = String(etsy.listingFee.amount);
  els.etsyOffsite.innerHTML =
    '<option value="none">Not an Offsite Ads sale</option>' +
    etsy.offsiteAds.tiers.map((t) => `<option value="${t.id}">${escapeHtml(t.label)}</option>`).join("");

  const amz = RATES.marketplaceFees["amazon-uk"];
  els.amzCategory.innerHTML = amz.categories.map((c) =>
    `<option value="${c.id}">${escapeHtml(c.label)} — ${pct(c.ratePct)}${c.lowPriceTiers ? " (less on cheap items)" : ""}</option>`
  ).join("");
  els.amzTier.innerHTML =
    '<option value="">No fulfilment fee (FBM — you ship it)</option>' +
    amz.fulfilment.tiers.map((t) => `<option value="${t.id}">${escapeHtml(t.label)} — ${money(t.amount)}</option>`).join("");
  els.amzTier.value = "small-parcel";
}

/* If the fee file cannot be loaded there is nothing honest to calculate with,
   so the page says so plainly rather than falling back to figures baked into
   the JavaScript that could be years out of date. */
function handleLoadFailure() {
  loadFailed = true;
  els.loadNote.innerHTML =
    "<strong>The fee schedules could not be loaded.</strong> Rather than show figures that might be out of date, " +
    "this calculator has switched itself off. Reload the page to try again — and in the meantime, every platform " +
    "publishes its own fee calculator.";
  els.loadNote.style.display = "block";
  clearResults();
  document.querySelectorAll(".tool input, .tool select").forEach((el) => { el.disabled = true; });
}

fetch("/data/rates.json", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then((data) => {
    if (!data || !data.marketplaceFees) throw new Error("unexpected shape");
    RATES = data;
    buildOptions();
    calculate();
  })
  .catch(handleLoadFailure);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active")) return;
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    calculate();
  });
});

document.addEventListener("input", (e) => {
  if (e.target.closest(".tool")) calculate();
});
document.addEventListener("change", (e) => {
  if (e.target.closest(".tool")) calculate();
});
