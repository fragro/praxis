(function () {
  'use strict';

  var isHomePage = window.location.pathname === '/';

  function navigate(sectionId, button) {
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });
    document.querySelectorAll('.sb-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    var target = document.getElementById(sectionId);
    if (target) { target.classList.add('active'); }
    if (button) { button.classList.add('active'); }
    var main = document.querySelector('.main-content');
    if (main) { main.scrollTop = 0; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '#' + sectionId);
  }

  function initNav() {
    if (!isHomePage) return;

    document.querySelectorAll('.sb-btn[data-section]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        navigate(btn.getAttribute('data-section'), btn);
      });
    });

    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var targetBtn = document.querySelector('.sb-btn[data-section="' + hash + '"]');
      if (targetBtn) { navigate(hash, targetBtn); return; }
    }
    var first = document.querySelector('.sb-btn[data-section]');
    if (first) { navigate(first.getAttribute('data-section'), first); }
  }

  document.addEventListener('DOMContentLoaded', initNav);
})();
