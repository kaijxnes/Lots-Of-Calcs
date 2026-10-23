#!/usr/bin/env python3
"""Generate the /salary/<n>-after-tax/ landing pages.

These pages exist to answer a search query — "25k after tax", "£30,000 after
tax" — so the headline figures have to be in the HTML as text, not computed by
script after the page loads. They are therefore baked in at build time, from
the rates in data/rates.json.

The arithmetic below is a second implementation of salary-calc.js. That is a
drift risk and it is handled, not ignored: the browser test suite recomputes
every page's own salary with the JavaScript and asserts it matches the baked
figures. If you change the maths in one place, change it in the other, and the
tests will tell you if you forgot.

    python3 tools/build-salary-pages.py                 # rebuild every page
    python3 tools/build-salary-pages.py 25000 30000     # rebuild some

Re-run it after any change to the tax year in rates.json.
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATES = os.path.join(ROOT, "data", "rates.json")

# The salaries with pages. Add to this list and re-run to create more; the
# cross-links between pages are generated from it, so they stay consistent.
SALARIES = [25000, 30000, 40000]

JURISDICTION = "uk-2026-27"


# --------------------------------------------------------------------------
# the same arithmetic as salary-calc.js
# --------------------------------------------------------------------------

def personal_allowance(gross, cfg):
    if gross <= cfg["allowanceTaperFrom"]:
        return cfg["personalAllowance"]
    lost = (gross - cfg["allowanceTaperFrom"]) * cfg["allowanceTaperPerPound"]
    return max(0.0, cfg["personalAllowance"] - lost)


def apply_bands(amount, bands):
    rows, lower, total = [], 0, 0.0
    for band in bands:
        upper = float("inf") if band.get("upTo") is None else band["upTo"]
        in_band = max(0.0, min(amount, upper) - lower)
        charged = in_band * (band["rate"] / 100.0)
        if in_band > 0:
            rows.append({
                "label": band["label"], "rate": band["rate"],
                "from": lower, "to": upper,
                "amount": in_band, "charged": charged,
            })
        total += charged
        lower = upper
        if amount <= upper:
            break
    return total, rows


def compute(gross, cfg):
    allowance = personal_allowance(gross, cfg)
    taxable = max(0.0, gross - allowance)
    tax, tax_rows = apply_bands(taxable, cfg["incomeTaxBands"])
    ni, ni_rows = apply_bands(gross, cfg["nationalInsurance"]["bands"])
    deductions = tax + ni
    net = gross - deductions
    return {
        "gross": gross, "allowance": allowance, "taxable": taxable,
        "income_tax": tax, "tax_rows": tax_rows,
        "ni": ni, "ni_rows": ni_rows,
        "deductions": deductions, "net": net,
        "per_month": net / 12, "per_week": net / 52, "per_day": net / 260,
        "deduction_rate": (deductions / gross * 100) if gross else 0.0,
        "marginal": marginal_rate(gross, cfg),
    }


def marginal_rate(gross, cfg):
    if gross <= 0:
        return 0.0
    def ded(g):
        a = personal_allowance(g, cfg)
        t, _ = apply_bands(max(0.0, g - a), cfg["incomeTaxBands"])
        n, _ = apply_bands(g, cfg["nationalInsurance"]["bands"])
        return t + n
    return (ded(gross + 1) - ded(gross)) * 100


# --------------------------------------------------------------------------
# formatting
# --------------------------------------------------------------------------

def money(v, dp=2):
    return "£{:,.{dp}f}".format(v, dp=dp)


def money0(v):
    return "£{:,.0f}".format(v)


def short(n):
    """25000 -> '25k', 32500 -> '32.5k' — how people actually search."""
    if n % 1000 == 0:
        return "{:g}k".format(n / 1000)
    return "{:g}k".format(n / 1000)


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def nice_date(iso):
    from datetime import date
    y, m, d = (int(x) for x in iso.split("-"))
    months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"]
    return "{} {} {}".format(d, months[m - 1], y)


# --------------------------------------------------------------------------
# page
# --------------------------------------------------------------------------

FOOTER = """    <footer class="site-footer">
      <p class="footer-categories">
        <a href="/general/">General</a>
        <a href="/business-analysis/">Business &amp; Analysis</a>
        <a href="/savings-investing/">Savings &amp; Investing</a>
        <a href="/everyday/">Everyday</a>
        <a href="/home-diy/">Home &amp; DIY</a>
        <a href="/betting-odds/">Betting &amp; Odds</a>
        <a href="/other/">Other</a>
      </p>
      <p>Built with plain HTML, CSS &amp; JavaScript — all calculations run locally in your browser.</p>
      <p><a href="/about/">About this site</a></p>
    </footer>"""


def faqs(gross, r, cfg):
    sym = cfg["symbol"]
    return [
        (
            "How much is {} after tax?".format(money0(gross)),
            "A {} salary leaves {} a year after income tax and National Insurance, "
            "which is {} a month or about {} a week. Income tax takes {} and National "
            "Insurance takes {}, so {}% of the gross never reaches your account. That "
            "assumes the standard personal allowance, no pension contributions and no "
            "student loan — each of those changes the figure."
            .format(money0(gross), money(r["net"]), money(r["per_month"]),
                    money(r["per_week"]), money(r["income_tax"]), money(r["ni"]),
                    round(r["deduction_rate"], 1)),
        ),
        (
            "How much is {} a year per month after tax?".format(money0(gross)),
            "{} a month. That is the annual take-home of {} divided by twelve. If you are "
            "paid monthly this is roughly what lands in your account, though the first "
            "month of a new job or a mid-year pay rise can differ while PAYE catches up — "
            "it works on a cumulative basis across the year rather than treating each "
            "month separately."
            .format(money(r["per_month"]), money(r["net"])),
        ),
        (
            "How much income tax do you pay on {}?".format(money0(gross)),
            "{}. The first {} is the personal allowance and is not taxed at all. That "
            "leaves {} of taxable income, charged at {}%. Income tax and National "
            "Insurance are separate deductions with separate rules, which is why the "
            "total taken is more than the tax figure alone."
            .format(money(r["income_tax"]), money0(cfg["personalAllowance"]),
                    money0(r["taxable"]), r["tax_rows"][0]["rate"] if r["tax_rows"] else 0),
        ),
        (
            "Is this the same in Scotland?",
            "No. Scotland sets its own income tax bands and rates, and they differ from "
            "England, Wales and Northern Ireland at almost every salary. National "
            "Insurance is identical UK-wide, so the NI figure above holds, but the income "
            "tax will not. The figures on this page are for England, Wales and Northern "
            "Ireland only.",
        ),
        (
            "Does this include pension contributions or a student loan?",
            "No, and both will reduce your take-home. A workplace pension is typically "
            "deducted before tax, so it lowers your taxable pay as well as your net pay. "
            "A student loan is taken as a percentage of earnings above a threshold that "
            "depends on which plan you are on. Either can be worth hundreds of pounds a "
            "year, so treat the figure here as take-home before those are applied.",
        ),
        (
            "What is the marginal rate on {}?".format(money0(gross)),
            "{}% — that is what is taken from the next pound you earn, as opposed to the "
            "{}% taken from your salary overall. The two differ because the personal "
            "allowance is tax-free, which pulls the average down below the rate you are "
            "actually charged at the top of your income. The marginal rate is the one "
            "that matters when weighing a pay rise or overtime."
            .format(round(r["marginal"]), round(r["deduction_rate"], 1)),
        ),
    ]


def build(gross, cfg, all_salaries):
    r = compute(gross, cfg)
    slug = "{}-after-tax".format(gross)
    url = "https://lotsofcalcs.com/salary/{}/".format(slug)
    title = "{} After Tax — Take-Home Pay {}".format(money0(gross), cfg["taxYear"])
    desc = ("{} a year is {} after tax and National Insurance — {} a month. Full "
            "breakdown of the deductions for the {} tax year."
            .format(money0(gross), money(r["net"]), money(r["per_month"]), cfg["taxYear"]))

    q = faqs(gross, r, cfg)

    ld = [
        {
            "@context": "https://schema.org", "@type": "WebPage",
            "name": title, "description": desc, "url": url,
            "isPartOf": {"@type": "WebSite", "name": "Lots Of Calcs",
                         "url": "https://lotsofcalcs.com/"},
        },
        {
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home",
                 "item": "https://lotsofcalcs.com/"},
                {"@type": "ListItem", "position": 2, "name": "Salary after tax",
                 "item": "https://lotsofcalcs.com/salary/"},
                {"@type": "ListItem", "position": 3,
                 "name": "{} after tax".format(money0(gross)), "item": url},
            ],
        },
        {
            "@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": a,
                 "acceptedAnswer": {"@type": "Answer", "text": b}} for a, b in q
            ],
        },
    ]
    ld_json = json.dumps(ld, indent=2, ensure_ascii=False).replace("<", "\\u003C")

    # ---- band breakdown rows ----
    tax_rows = "".join(
        '<tr><td>{}</td><td>{}%</td><td>{}</td><td>{}</td></tr>'.format(
            esc(row["label"]), row["rate"], money0(row["amount"]), money(row["charged"]))
        for row in r["tax_rows"]
    )
    ni_rows = "".join(
        '<tr><td>{}</td><td>{}%</td><td>{}</td><td>{}</td></tr>'.format(
            esc(row["label"]), row["rate"], money0(row["amount"]), money(row["charged"]))
        for row in r["ni_rows"] if row["rate"] > 0
    )

    # ---- cross-links to sibling salaries ----
    others = [s for s in all_salaries if s != gross]
    sib = "".join(
        '      <a class="hub-card" href="/salary/{n}-after-tax/">\n'
        '        <span class="icon">💷</span>\n'
        '        <div class="title">{m} after tax</div>\n'
        '        <div class="desc">{net} a year, {mo} a month.</div>\n'
        '      </a>\n'.format(
            n=s, m=money0(s),
            net=money0(compute(s, cfg)["net"]),
            mo=money0(compute(s, cfg)["per_month"]))
        for s in others
    )

    faq_html = "".join(
        '      <p class="faq-q">{}</p>\n      <p class="about-text">{}</p>\n'.format(esc(a), esc(b))
        for a, b in q
    )

    verified = cfg["lastVerified"]
    rates_line = (
        "Figures use the <strong>{year}</strong> tax year, which runs from {start} to {end}, "
        "for <strong>{applies}</strong>. {checked}"
        .format(year=cfg["taxYear"], start=nice_date(cfg["taxYearStart"]),
                end=nice_date(cfg["taxYearEnd"]), applies=esc(cfg["appliesTo"]),
                checked=("Rates last checked {}.".format(nice_date(verified)) if verified
                         else "These rates have not been verified against HMRC directly — "
                              "check <a href=\"https://www.gov.uk/income-tax-rates\" "
                              "rel=\"nofollow noopener\" target=\"_blank\">gov.uk</a> "
                              "before relying on them."))
    )

    return """<!DOCTYPE html>
<html lang="en">
<head>
<script src="/consent.js"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lots Of Calcs">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://lotsofcalcs.com/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://lotsofcalcs.com/og-image.jpg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#1f2233">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
  <div class="page">
    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">{money_gross} after tax</h1>
      <p class="page-subtitle">What a {money_gross} salary actually leaves you, in the {year} tax year.</p>
    </header>

    <main class="tool">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="hero-net">{net}</div>
          <div class="label">Take-home pay, a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A month</span><span class="r-value" id="out-month">{per_month}</span></div>
          <div class="result-row"><span class="r-label">A week</span><span class="r-value" id="out-week">{per_week}</span></div>
          <div class="result-row"><span class="r-label">A working day</span><span class="r-value" id="out-day">{per_day}</span></div>
        </div>
      </div>

      <p class="about-text" style="margin-top:18px;">A salary of <strong>{money_gross}</strong> leaves <strong>{net}</strong> a year once income tax and National Insurance are taken off &mdash; <strong>{per_month}</strong> a month. The deductions come to {deductions}, or {ded_rate}% of the gross.</p>

      <p class="tool-section-title" style="margin-top:22px;">Where it goes</p>
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Gross salary</span><span class="r-value" id="out-gross">{money_gross}</span></div>
          <div class="result-row"><span class="r-label">Personal allowance (tax-free)</span><span class="r-value" id="out-allowance">{allowance}</span></div>
          <div class="result-row"><span class="r-label">Taxable income</span><span class="r-value" id="out-taxable">{taxable}</span></div>
          <div class="result-row"><span class="r-label">− Income tax</span><span class="r-value" id="out-tax">{tax}</span></div>
          <div class="result-row"><span class="r-label">− National Insurance</span><span class="r-value" id="out-ni">{ni}</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home pay</span><span class="r-value" id="out-net">{net}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">Try a different salary</p>
      <div class="field" style="max-width:320px;">
        <label for="salary">Gross annual salary</label>
        <input type="number" id="salary" value="{gross}" step="any" min="0" placeholder="0">
      </div>
      <p class="tool-hint" id="salary-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="salary-note">Change the figure and everything above updates. The page itself still describes {money_gross}.</p>

      <p class="tool-section-title" style="margin-top:22px;">The bands, line by line</p>
      <div class="table-scroll">
        <div style="min-width:420px;">
          <table class="out-table">
            <thead><tr><th>Band</th><th>Rate</th><th>Amount in band</th><th>Charged</th></tr></thead>
            <tbody>
              <tr><td>Personal allowance</td><td>0%</td><td>{allowance_0}</td><td>£0.00</td></tr>
              {tax_rows}
              {ni_rows}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Income tax is charged on taxable income &mdash; your salary after the personal allowance. National Insurance is charged on the gross salary instead, using its own thresholds, which is why the two are listed separately rather than added into one rate.</p>

      <p class="tool-hint" style="margin-top:14px;">{rates_line}</p>
      <p class="tool-hint">Assumes the standard tax code and personal allowance, no pension contributions, no student loan repayments, no benefits in kind and no other income. A working day is taken as one of 260 in a year. This is an estimate, not a payslip.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How {money_gross} after tax is worked out</p>
      <p class="about-text">Two separate deductions come out of a salary, and they work differently enough that adding them into a single percentage would be misleading.</p>
      <p class="about-text"><strong>Income tax</strong> ignores the first {allowance_0} entirely &mdash; the personal allowance. On {money_gross} that leaves {taxable_0} of taxable income, charged at {first_rate}%, giving {tax}. The allowance is the reason the headline rate overstates what you actually pay: the effective rate across the whole salary is lower than the band rate, because a chunk of your income was never taxed.</p>
      <p class="about-text"><strong>National Insurance</strong> is charged on gross pay rather than taxable income, with its own threshold at {ni_threshold}. On this salary it comes to {ni}. It happens to share a threshold with the personal allowance at the moment, which makes the two look like one deduction — they are not, and they have diverged before.</p>
      <p class="about-text">The difference between the two numbers people quote matters here. Your <strong>effective rate</strong> on {money_gross} is {ded_rate}% &mdash; what is taken across the whole salary. Your <strong>marginal rate</strong> is {marginal}% &mdash; what is taken from the next pound you earn. When you are weighing a pay rise, overtime or a second job, the marginal rate is the number that applies, and it is always the higher of the two.</p>
      <p class="about-text">Monthly pay is shown as a twelfth of the annual figure. Real payslips can differ, particularly in the first months of a new job or after a mid-year rise, because PAYE works cumulatively across the tax year rather than treating each month in isolation. It evens out by the end of the year.</p>
      <p class="about-text">What this leaves out is worth being clear about, because each item is real money. Pension contributions are usually taken before tax, so they reduce both your taxable pay and your take-home. Student loan repayments are a percentage of earnings above a plan-specific threshold. Salary sacrifice, company cars and medical insurance all change the picture. And Scotland sets its own income tax bands, so none of the tax figures here apply there &mdash; though the National Insurance does.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
{faq_html}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries</div>
    <div class="hub-grid">
{sib}      <a class="hub-card" href="/vat/">
        <span class="icon">🧾</span>
        <div class="title">Tax / VAT Calculator</div>
        <div class="desc">Add or remove VAT, plus a custom income tax band split.</div>
      </a>
    </div>

{footer}
  </div>
  <script src="/salary-calc.js"></script>
  <script src="/salary-after-tax.js"></script>
</body>
</html>
""".format(
        title=esc(title), desc=esc(desc), url=url, ld=ld_json,
        money_gross=money0(gross), gross=gross, year=cfg["taxYear"],
        net=money(r["net"]), per_month=money(r["per_month"]),
        per_week=money(r["per_week"]), per_day=money(r["per_day"]),
        allowance=money(r["allowance"]), allowance_0=money0(r["allowance"]),
        taxable=money(r["taxable"]), taxable_0=money0(r["taxable"]),
        tax=money(r["income_tax"]), ni=money(r["ni"]),
        deductions=money(r["deductions"]), ded_rate=round(r["deduction_rate"], 1),
        marginal=round(r["marginal"]),
        first_rate=r["tax_rows"][0]["rate"] if r["tax_rows"] else 0,
        ni_threshold=money0(cfg["nationalInsurance"]["bands"][0]["upTo"]),
        tax_rows=tax_rows, ni_rows=ni_rows, faq_html=faq_html, sib=sib,
        rates_line=rates_line, footer=FOOTER,
    )


def main():
    cfg = json.load(open(RATES, encoding="utf-8"))["taxBands"][JURISDICTION]
    wanted = [int(a) for a in sys.argv[1:]] or SALARIES

    for gross in wanted:
        if gross not in SALARIES:
            print("!! {} is not in SALARIES; add it there so cross-links include it"
                  .format(gross))
        out_dir = os.path.join(ROOT, "salary", "{}-after-tax".format(gross))
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "index.html")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(gross, cfg, SALARIES))
        r = compute(gross, cfg)
        print("built /salary/{}-after-tax/  net {}  ({}/mo)"
              .format(gross, money(r["net"]), money(r["per_month"])))


if __name__ == "__main__":
    main()
