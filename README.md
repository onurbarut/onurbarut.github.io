# onurbarut.github.io

Personal site for **Onur Barut, PhD** — Lead Machine Learning Engineer (Applied AI, GenAI & Search).
Live at [onurbarut.github.io](https://onurbarut.github.io).

A single static page (`index.html`) covering About, Now, Building, Selected work, Experience, Skills,
Publications, Open source, Teaching, Games and Contact, plus the **Wizardic Quest** browser
game under `games/`.

## No build step

Plain HTML, CSS and JavaScript — no Jekyll, no bundler, no framework, no dependencies.
The empty `.nojekyll` file tells GitHub Pages to serve the files as they are.
Editing a file and pushing it *is* the deploy.

## Preview locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Prefer a server over opening `index.html` from the file system — the page works over `file://`
too (every path is relative), but a server matches production.

Handy while testing: `?theme=light` or `?theme=dark` forces a palette for one page load,
overriding both the saved choice and the OS preference. It is never written to storage.

## Layout

```
index.html                 the whole page
404.html                   not-found page, same styling
assets/css/style.css       design tokens, light + dark palettes, print styles
assets/js/main.js          theme toggle, mobile nav, scroll-spy, scroll reveals
assets/img/onur.jpg        portrait
assets/img/favicon.svg     "OB" monogram
assets/Onur_Barut_CV.pdf   linked from the Download CV button
games/wizardic_quest/      HTML5 Canvas game (ES modules, no bundler)
robots.txt                 allow all
.nojekyll                  serve statically, do not run Jekyll
```

## Conventions worth keeping

- **Theme** — every colour is a CSS custom property. The dark palette is declared twice, under
  `@media (prefers-color-scheme: dark)` and under `:root[data-theme="dark"]`, so an explicit
  toggle wins in both directions. Contrast ratios for each token pair are documented at the top
  of `style.css`; keep them at or above 4.5:1 for body text.
- **Fonts** — the Google Fonts stylesheet loads asynchronously and the system fallback stacks
  carry the layout on their own. Nothing may depend on a webfont arriving.
- **Motion** — scroll reveals are opt-in: `main.js` adds `.has-reveal` only when motion is
  allowed *and* `IntersectionObserver` exists, so no-JS and reduced-motion visitors never meet
  a hidden element.
- **Budget** — CSS + JS together stay under 60 KB, and no third-party JavaScript ships.
- After editing the script, check it still parses: `node --check assets/js/main.js`.

## Updating current work

The Now section is a dated snapshot, not a launch history. When refreshing it,
update its date, the footer and the homepage sitemap date together. Keep project
claims grounded in confirmed details; add public product/repository links when
available. Teaching dates describe past work until a new term is confirmed.
The `/games/` landing page links to the playable Wizardic Quest prototype.
