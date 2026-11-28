# Project 1
This is my first commit for Codex.

## Checking the site

    node tools/test.js

Rebuilds every page (each builder stops if a figure isn't in its source's
quoted wording or a hand-checked example no longer comes out), checks every
page's title, description, canonical link and JSON-LD, checks internal links,
then opens every calculator in a headless browser at phone width and fails on
script errors, NaN or undefined results, or sideways scrolling. Add
`--no-build` to check what's already built, or `--only=gift` to test just
matching calculators.
