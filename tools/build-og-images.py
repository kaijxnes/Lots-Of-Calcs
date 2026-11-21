#!/usr/bin/env python3
"""Share images (1200x630) for social previews: og/<calculator>.jpg for every
calculator card on the homepage, and the site-wide og-image.jpg.

    python3 tools/build-og-images.py

Rendered with Playwright's Chromium from a small HTML template using each
card's icon, title and description, so they match the site. Re-run when
calculators are added; tools/lib/site.js picks the image for each page from
its first path segment (falling back to og-image.jpg)."""
import html, json, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
index = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
cards = []
for m in re.finditer(r'<a class="hub-card" href="/([a-z0-9-]+)/">\s*<span class="icon">([^<]*)</span>\s*<div class="title">([^<]*)</div>\s*<div class="desc">([^<]*)</div>', index):
    cards.append(m.groups())
seen = set(); cards = [c for c in cards if not (c[0] in seen or seen.add(c[0]))]

TPL = """<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px}
body{background:radial-gradient(circle at 30% 0%,#2a2f48,#12141f 70%);font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#f4f5fb;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box}
.icon{font-size:120px;line-height:1;margin-bottom:28px}
.title{font-size:72px;font-weight:800;line-height:1.08;letter-spacing:-0.01em;max-width:1020px}
.desc{font-size:34px;color:#b4b8d2;margin-top:22px;line-height:1.3;max-width:1000px}
.brand{position:absolute;left:90px;bottom:54px;font-size:30px;font-weight:700;color:#ff9f43}
.free{position:absolute;right:90px;bottom:54px;font-size:26px;color:#989cbb}
</style></head><body>
<div class="icon">%ICON%</div><div class="title">%TITLE%</div><div class="desc">%DESC%</div>
<div class="brand">lotsofcalcs.com</div><div class="free">Free · runs in your browser</div>
</body></html>"""

def render(page, icon, title, desc, out):
    page.set_content(TPL.replace("%ICON%", icon).replace("%TITLE%", html.escape(html.unescape(title))).replace("%DESC%", html.escape(html.unescape(desc))))
    page.wait_for_timeout(50)
    page.screenshot(path=out, type="jpeg", quality=82)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
    render(pg, "🧮", "Lots Of Calcs", "Free calculators for money, tax, everyday life and more — all in your browser.", os.path.join(ROOT, "og-image.jpg"))
    for slug, icon, title, desc in cards:
        render(pg, icon, title, desc, os.path.join(ROOT, "og", slug + ".jpg"))
    b.close()
keep = {c[0] + ".jpg" for c in cards}
for f in os.listdir(os.path.join(ROOT, "og")):
    if f not in keep: os.remove(os.path.join(ROOT, "og", f))
print(f"built og-image.jpg and {len(cards)} calculator images")
