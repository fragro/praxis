# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static website for the PRAXIS manifesto. PRAXIS is a practice (not a product) for building parallel democratic infrastructure. It builds exactly three things: the Civic Engine (engagement progression for civic work), the Assembly Playbook (methodology for running assemblies), and integration glue (guides connecting existing OSS tools). Everything else is harvested from the open-source ecosystem. No build step, no frameworks, no dependencies. Pure HTML/CSS/JS.

## How to Run

Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Architecture

- **`index.html`** — Single-page document containing all twelve sections. Each section is a `<div id="..." class="section">` toggled by navigation. Sections: vision, values, foundations, architecture, power, technology, civic-engine, communications, coalition, implementation, working-groups, resources.
- **`manifesto.html`** — Standalone manifesto ("Build the Lifeboat") — publishable independently, links back to the full document.
- **`css/style.css`** — All styles. Design tokens are CSS custom properties in `:root`. Fonts loaded via Google Fonts `@import` (Syne, DM Sans, DM Mono) with system fallbacks. Includes print styles and responsive breakpoint at 900px.
- **`js/nav.js`** — Sidebar navigation. IIFE that shows/hides sections by toggling `.active` class, manages URL hash state, and handles initial load from hash.

## Key Patterns

- Sections are shown/hidden via `display: none` / `.active { display: block }`, not routing
- Sidebar buttons use `data-section` attributes mapping to section `id` values
- The site is designed to work fully offline (fonts degrade to system fallbacks)
- No mobile hamburger menu is implemented, sidebar simply hides at 900px or below
- The document is a universal manifesto with no specific dates, names, or city-specific details
- PRAXIS is described as a practice/methodology, never as a platform or application
- No em dashes in body copy
