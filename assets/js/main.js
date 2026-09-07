/* =============================================================================
   main.js — theme control, mobile nav disclosure, scroll-spy, scroll reveals.
   No dependencies, no network calls; safe to run from file://.
   ============================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'ob-theme';

  /* ---------------------------------------------------------------------------
     Theme
     Precedence: ?theme= (this load only)  >  localStorage  >  prefers-color-scheme
     --------------------------------------------------------------------------- */

  /** Read ?theme=light|dark from the URL. Used by the screenshot harness. */
  function themeFromQuery() {
    var value = null;
    try {
      value = new URLSearchParams(window.location.search).get('theme');
    } catch (err) {
      // URLSearchParams missing or a malformed query string — fall through.
      value = null;
    }
    return value === 'light' || value === 'dark' ? value : null;
  }

  /** Read the persisted choice; storage can throw in private/blocked contexts. */
  function themeFromStorage() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (err) {
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // Storage unavailable — the choice simply does not survive the session.
    }
  }

  /** The theme the page is actually rendering right now. */
  function currentTheme() {
    if (root.dataset.theme === 'light' || root.dataset.theme === 'dark') {
      return root.dataset.theme;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /** Keep the theme-color meta in step with whatever palette is painting. */
  function syncMeta(theme) {
    // The document declares a media-scoped pair so the colour is right with JS
    // off too. Once we know which palette is actually painting, that pair has
    // to collapse: an explicit toggle can disagree with prefers-color-scheme,
    // and a stale media-scoped tag would keep winning.
    var color = theme === 'dark' ? '#131312' : '#fbfaf7';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].removeAttribute('media');
      metas[i].setAttribute('content', color);
    }
  }

  /** Pin an explicit theme. The inline style must be kept in step with the
      attribute: the <head> bootstrap writes `style.colorScheme`, and an inline
      style outranks every CSS rule, so leaving it stale would keep the browser
      painting native chrome (scrollbars, form controls) for the old theme. */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    syncMeta(theme);
    syncToggle(theme);
  }

  function syncToggle(theme) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var next = theme === 'dark' ? 'light' : 'dark';
    // Name-describes-the-action only. Pairing this label with aria-pressed
    // would announce "Switch to light theme … pressed", which contradicts
    // itself; the label alone already conveys the current state.
    btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    btn.setAttribute('title', 'Switch to ' + next + ' theme');
  }

  var queryTheme = themeFromQuery();
  var chosenTheme = queryTheme || themeFromStorage();

  if (chosenTheme) {
    // An explicit choice: the <head> bootstrap already pinned it to avoid a
    // flash; this pass keeps the button label and theme-color meta in step.
    applyTheme(chosenTheme);
  } else {
    // No explicit choice — leave data-theme off so the prefers-color-scheme
    // block in style.css keeps driving the palette, and follow a live OS
    // switch instead of freezing whatever was set at load.
    syncMeta(currentTheme());
    syncToggle(currentTheme());

    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (dark) {
      var onSchemeChange = function () {
        if (root.hasAttribute('data-theme')) return; // user has since chosen
        syncMeta(currentTheme());
        syncToggle(currentTheme());
      };
      if (dark.addEventListener) dark.addEventListener('change', onSchemeChange);
      else if (dark.addListener) dark.addListener(onSchemeChange);
    }
  }

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      // A ?theme= override is for this load only and is never written back.
      if (!queryTheme) persistTheme(next);
    });
  }

  /* ---------------------------------------------------------------------------
     Mobile navigation disclosure
     --------------------------------------------------------------------------- */
  var navToggle = document.getElementById('nav-toggle');
  var navPanel = document.getElementById('nav-panel');

  function setNavOpen(open) {
    if (!navToggle || !navPanel) return;
    navPanel.hidden = !open;
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (navToggle && navPanel) {
    setNavOpen(false);

    navToggle.addEventListener('click', function () {
      setNavOpen(navPanel.hidden);
    });

    // Close after choosing a destination.
    navPanel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNavOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !navPanel.hidden) {
        setNavOpen(false);
        navToggle.focus();
      }
    });

    // Click outside the header dismisses the panel.
    document.addEventListener('click', function (event) {
      if (navPanel.hidden) return;
      if (event.target.closest('.site-header')) return;
      setNavOpen(false);
    });

    // Leaving the mobile breakpoint must not strand an open panel.
    // Kept in step with the `@media (min-width: 62rem)` rule in style.css.
    var wide = window.matchMedia('(min-width: 62rem)');
    var onWideChange = function (event) {
      if (event.matches) setNavOpen(false);
    };
    if (wide.addEventListener) wide.addEventListener('change', onWideChange);
    else if (wide.addListener) wide.addListener(onWideChange);
  }

  /* ---------------------------------------------------------------------------
     Scroll-spy — marks the nav link for the section in view
     --------------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('[data-nav] a[href^="#"]')
  );

  if (navLinks.length && 'IntersectionObserver' in window) {
    var linksById = {};
    var sections = [];

    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var section = document.getElementById(id);
      if (!section) return;
      if (!linksById[id]) {
        linksById[id] = [];
        sections.push(section);
      }
      linksById[id].push(link);
    });

    var visible = {};

    var setCurrent = function (id) {
      navLinks.forEach(function (link) {
        var match = link.getAttribute('href') === '#' + id;
        if (match) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        // Highlight the topmost section currently in the band below the header.
        for (var i = 0; i < sections.length; i += 1) {
          if (visible[sections[i].id]) {
            setCurrent(sections[i].id);
            return;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------------------------------------------------------------------------
     Scroll reveals — strictly opt-in.
     The CSS only hides `.reveal` beneath `.has-reveal`, and that class is added
     here only when motion is allowed AND IntersectionObserver exists. So a
     no-JS visitor, an old browser, or anyone with prefers-reduced-motion set
     never encounters an element stuck at opacity: 0.
     --------------------------------------------------------------------------- */
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealTargets = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (!reduceMotion && revealTargets.length && 'IntersectionObserver' in window) {
    root.classList.add('has-reveal');

    var revealObserver = new IntersectionObserver(
      function (entries, self) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          self.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.02 }
    );

    revealTargets.forEach(function (target) {
      revealObserver.observe(target);
    });

    // Safety net: if anything is still hidden shortly after load — an observer
    // that never fired, a headless render, a print job — show it regardless.
    window.addEventListener('load', function () {
      window.setTimeout(function () {
        revealTargets.forEach(function (target) {
          target.classList.add('is-in');
        });
      }, 1200);
    });
  }
})();
