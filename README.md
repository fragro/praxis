# PRAXIS

Static website for the PRAXIS manifesto. No build step, no frameworks, no dependencies. Pure HTML/CSS/JS.

## Quick Start

Open `index.html` in a browser, or serve locally:

```bash
python3 -m http.server 8080
```

## Structure

```
├── index.html        Full platform document (twelve sections, sidebar nav)
├── manifesto.html    Standalone manifesto — "Build the Lifeboat"
├── css/style.css     Styles and design tokens
├── js/nav.js         Sidebar navigation logic
└── README.md
```

## Notes

- Sections toggle via sidebar; each is linkable via URL hash (e.g. `index.html#vision`)
- Fonts load from Google Fonts (Syne, DM Sans, DM Mono) with system fallbacks for offline use
- Print styles included; sidebar hidden in print view
- Works fully offline
