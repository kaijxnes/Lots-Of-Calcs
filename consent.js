/* Analytics consent gate.
   Google Analytics is not loaded at all until the visitor accepts. This is the
   conservative reading of PECR: the tag never runs, so no cookie is set and no
   request reaches Google before a choice is made. Declining is one click, the
   same as accepting. */
(function () {
  var GA_ID = "G-5GSHPQLBZW";
  var KEY = "loc-analytics-consent";
  var loaded = false;

  /* Private browsing and blocked site data both make storage throw rather than
     return null, so every access is guarded. With no storage available the
     answer is treated as "not yet decided", which means analytics stays off. */
  function read() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function write(value) {
    try {
      window.localStorage.setItem(KEY, value);
    } catch (e) {
      /* Nothing to do — the choice simply will not persist to the next visit */
    }
  }

  function loadAnalytics() {
    if (loaded) return;
    loaded = true;

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  /* Someone who accepted before, then declined, still holds the cookies from
     the accepted period. Clearing them is what makes withdrawal mean anything. */
  function clearAnalyticsCookies() {
    var names = document.cookie.split(";").map(function (c) {
      return c.split("=")[0].trim();
    }).filter(function (n) {
      return n === "_ga" || n.indexOf("_ga_") === 0 || n === "_gid" || n.indexOf("_gat") === 0;
    });

    var host = location.hostname;
    /* A cookie only expires if it is overwritten against the same domain and
       path it was set on, so every plausible variant is covered */
    var domains = ["", host, "." + host];
    var parts = host.split(".");
    if (parts.length > 2) domains.push("." + parts.slice(-2).join("."));

    names.forEach(function (name) {
      domains.forEach(function (d) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" +
          (d ? "; domain=" + d : "");
      });
    });
  }

  function el(id) {
    return document.getElementById(id);
  }

  function hide() {
    var b = el("consent-banner");
    if (b) b.remove();
  }

  function decide(value) {
    write(value);
    hide();
    if (value === "granted") loadAnalytics();
    else clearAnalyticsCookies();
    renderFooterLink();
    document.dispatchEvent(new CustomEvent("loc-consent-change"));
  }

  /* The banner is a bottom bar rather than a modal wall: it does not block the
     calculators, and nothing on this site depends on the answer. */
  function show(returnFocus) {
    if (el("consent-banner")) return;

    var wrap = document.createElement("div");
    wrap.id = "consent-banner";
    wrap.className = "consent-banner";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-labelledby", "consent-title");
    wrap.setAttribute("aria-describedby", "consent-text");
    wrap.innerHTML =
      '<div class="consent-inner">' +
        '<div class="consent-copy">' +
          '<p class="consent-title" id="consent-title">Analytics cookies</p>' +
          '<p class="consent-text" id="consent-text">The calculators themselves send nothing anywhere &mdash; they run entirely in your browser either way. ' +
          'Separately, may I use Google Analytics to count visits and see which calculators get used? ' +
          'It sets two cookies and helps decide what gets built next. ' +
          '<a href="/about/">More detail</a>.</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<button type="button" class="btn btn-ghost" id="consent-reject">No thanks</button>' +
          '<button type="button" class="btn btn-ghost" id="consent-accept">Allow analytics</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    el("consent-accept").addEventListener("click", function () { decide("granted"); });
    el("consent-reject").addEventListener("click", function () { decide("denied"); });

    /* Focus is only moved when the banner was deliberately reopened — stealing
       it on arrival would be hostile to anyone using a keyboard or reader */
    if (returnFocus) el("consent-reject").focus();
  }

  /* Withdrawing has to be as easy as consenting, so the control lives in the
     footer of every page. It is added by script because it is useless without
     script — with JavaScript off, nothing is ever loaded to consent to. */
  function renderFooterLink() {
    var footer = document.querySelector(".site-footer");
    if (!footer) return;

    var existing = el("consent-settings-row");
    if (existing) existing.remove();

    var state = read();
    var row = document.createElement("p");
    row.id = "consent-settings-row";
    row.className = "consent-settings";

    var label = state === "granted"
      ? "Analytics on"
      : state === "denied" ? "Analytics off" : "Analytics off";

    row.innerHTML = '<span class="consent-state">' + label + '</span> &middot; ' +
      '<button type="button" class="consent-link" id="consent-change">Change</button>';
    footer.appendChild(row);

    el("consent-change").addEventListener("click", function () {
      hide();
      show(true);
    });
  }

  /* The About page offers the same control inline, next to the explanation */
  function wireAboutPage() {
    var btn = el("about-consent-open");
    if (!btn) return;
    var state = el("about-consent-state");
    var label = function () {
      if (!state) return;
      var v = read();
      state.textContent = v === "granted" ? "Currently on."
        : v === "denied" ? "Currently off." : "Not yet chosen — currently off.";
    };
    label();
    btn.addEventListener("click", function () { hide(); show(true); });
    document.addEventListener("loc-consent-change", label);
  }

  function init() {
    var state = read();
    if (state === "granted") loadAnalytics();
    else if (state !== "denied") show(false);
    renderFooterLink();
    wireAboutPage();
  }

  /* Exposed so the About page can offer the same control inline */
  window.LocConsent = {
    open: function () { hide(); show(true); },
    state: read
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
