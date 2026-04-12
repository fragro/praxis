/* ═══════════════════════════════════════════════
   PRAXIS Platform Document — Theme Toggle
   Version 1.0 · 2026
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  function getPreferred() {
    var stored = localStorage.getItem('praxis-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('praxis-theme', theme);
  }

  // Apply immediately to prevent flash
  apply(getPreferred());

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      apply(current === 'dark' ? 'light' : 'dark');
    });
  });
})();
