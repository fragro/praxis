# PRAXIS Platform Manifesto
## Local Website

---

### Overview

This is the PRAXIS strategic platform document, formatted as a self-contained local website. It requires no server, no build step, and no internet connection beyond loading Google Fonts on first view. Open `index.html` in any modern browser to read it.

---

### Project Structure

```
praxis-site/
├── manifesto.html      The manifesto — "Build the Lifeboat"
├── index.html          Full platform document (all nine sections)
├── css/
│   └── style.css       All styles and design tokens
├── js/
│   └── nav.js          Sidebar navigation logic
└── README.md           This file
```

---

### How to Open

**Option 1 — Direct file open**
Double-click `index.html`. It will open in your default browser.

**Option 2 — Local server (recommended for best performance)**
```bash
# Python 3
cd praxis-site
python3 -m http.server 8080
# Then open: http://localhost:8080
```

**Option 3 — VS Code Live Server**
Right-click `index.html` → Open with Live Server

---

### Sharing

To share this document with a coalition partner or organizer:

1. Zip the entire `praxis-site/` folder
2. Send the zip file
3. Recipient unzips and opens `index.html`

No accounts, no logins, no tracking, no external dependencies (except Google Fonts on first load, which degrades gracefully offline with system sans-serif fallbacks).

---

### Sections

| Section | Content |
|---|---|
| 01 — Vision | Win condition, dual power framework, narrative architecture |
| 02 — Values | Relational existence, reciprocity, mutual aid, steady state, restorative justice |
| 03 — Foundations | Bookchin, Rojava, Zapatistas, assembly tradition, historical precedents |
| 04 — Architecture | Seven-layer platform design, core principles |
| 05 — Power | Five paths to political authority, the dialectic, the fight as organizing |
| 06 — Technology | Rails/React stack, progressive resilience, event sourcing |
| 07 — Civic Engine | Six roles, Civic Points, quest engine |
| 08 — Communications | Five channels, content calendar |
| 09 — Coalition | Scaling architecture, coalition targets, international |
| 10 — Implementation | Five-phase build, five parallel tracks |
| 11 — Working Groups | Platform, Governance, Communications, Coalition, Research |
| 12 — Resources | Team, Year 1 budget, grant strategy, essential reading |

---

### Offline Fonts

The site loads Syne, DM Sans, and DM Mono from Google Fonts. If used offline or in a restricted environment, the browser falls back to system sans-serif and monospace fonts. The layout remains fully functional.

To fully self-host fonts, download them from [Google Fonts](https://fonts.google.com) and update the `@import` at the top of `css/style.css` with local `@font-face` declarations.

---

### Notes

- Printing: All sections print when using browser Print (Ctrl+P / Cmd+P). Sidebar is hidden in print view.
- URL hash navigation: Each section is linkable via `#section-id` (e.g., `index.html#nyc-mission`)
- No JavaScript frameworks, no dependencies, no build tools required

---

*PRAXIS — Participatory Revolutionary Autonomous eXperience and Infrastructure Stack*
*FREE & Cooperation Tulsa · Tulsa, Oklahoma*
