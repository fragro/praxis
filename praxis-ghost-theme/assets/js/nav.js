/* ═══════════════════════════════════════════════
   PRAXIS Ghost Theme — Navigation
   Version 2.0 · 2026
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  function initNav() {
    // Highlight active sidebar link based on current URL
    var currentPath = window.location.pathname;
    document.querySelectorAll('.sb-btn').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && currentPath === href) {
        link.classList.add('active');
      } else if (href && currentPath.startsWith(href) && href !== '/') {
        link.classList.add('active');
      }
    });

    // Mobile sidebar toggle
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Create mobile toggle button if it doesn't exist
    if (!document.querySelector('.mobile-menu-btn')) {
      var menuBtn = document.createElement('button');
      menuBtn.className = 'mobile-menu-btn';
      menuBtn.setAttribute('aria-label', 'Toggle menu');
      menuBtn.innerHTML = '<span></span><span></span><span></span>';
      document.body.appendChild(menuBtn);

      menuBtn.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        menuBtn.classList.toggle('active');
      });

      // Close sidebar when a link is clicked (mobile)
      sidebar.querySelectorAll('.sb-btn').forEach(function (link) {
        link.addEventListener('click', function () {
          sidebar.classList.remove('open');
          menuBtn.classList.remove('active');
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initNav);
})();
