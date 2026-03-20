/* ═══════════════════════════════════════════════
   PRAXIS Platform Document — Navigation
   Version 1.0 · 2026
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  function navigate(sectionId, button) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.sb-btn').forEach(function (b) {
      b.classList.remove('active');
    });

    // Show target section
    var target = document.getElementById(sectionId);
    if (target) {
      target.classList.add('active');
    }

    // Activate button
    if (button) {
      button.classList.add('active');
    }

    // Scroll main content to top
    var main = document.querySelector('.main-content');
    if (main) {
      main.scrollTop = 0;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL hash without scrolling
    history.replaceState(null, '', '#' + sectionId);
  }

  function initNav() {
    // Wire up all sidebar buttons
    document.querySelectorAll('.sb-btn[data-section]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigate(btn.getAttribute('data-section'), btn);
      });
    });

    // Load from hash if present
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var targetBtn = document.querySelector('.sb-btn[data-section="' + hash + '"]');
      if (targetBtn) {
        navigate(hash, targetBtn);
        return;
      }
    }

    // Default: show first section
    var first = document.querySelector('.sb-btn[data-section]');
    if (first) {
      navigate(first.getAttribute('data-section'), first);
    }
  }

  document.addEventListener('DOMContentLoaded', initNav);
})();
