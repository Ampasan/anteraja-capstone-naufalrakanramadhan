(function () {
  'use strict';

  function initUserDropdown() {
    const avatarEl = document.querySelector('.sidebar-user-avatar');
    const userBlock = document.querySelector('.header-user-block');
    if (!avatarEl || !userBlock) return;

    // Make the whole user block a relative container
    userBlock.style.position = 'relative';

    // Convert avatar div into a clickable button
    avatarEl.setAttribute('role', 'button');
    avatarEl.setAttribute('tabindex', '0');
    avatarEl.setAttribute('aria-haspopup', 'true');
    avatarEl.setAttribute('aria-expanded', 'false');
    avatarEl.setAttribute('aria-label', 'Buka menu pengguna');
    avatarEl.removeAttribute('aria-hidden');
    avatarEl.classList.add('user-avatar-btn');

    // Build the dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.setAttribute('role', 'menu');
    dropdown.setAttribute('aria-label', 'Menu pengguna');
    dropdown.hidden = true;

    const nameEl   = userBlock.querySelector('.sidebar-user-name');
    const roleEl   = userBlock.querySelector('.sidebar-user-role');
    const userName = nameEl  ? nameEl.textContent.trim()  : 'Admin';
    const userRole = roleEl  ? roleEl.textContent.trim()  : '';

    dropdown.innerHTML = `
      <div class="user-dropdown__header">
        <div class="user-dropdown__avatar" aria-hidden="true">${avatarEl.textContent.trim()}</div>
        <div class="user-dropdown__info">
          <span class="user-dropdown__name">${userName}</span>
          <span class="user-dropdown__role">${userRole}</span>
        </div>
      </div>
      <div class="user-dropdown__divider" aria-hidden="true"></div>
      <ul class="user-dropdown__menu" role="none">
        <li role="none">
          <button type="button" class="user-dropdown__item user-dropdown__item--logout" role="menuitem" id="logoutBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Keluar / Logout
          </button>
        </li>
      </ul>
    `;

    userBlock.appendChild(dropdown);

    /* ── Toggle open / close ──────────────────────────────── */
    function openDropdown() {
      dropdown.hidden = false;
      avatarEl.setAttribute('aria-expanded', 'true');
      // Focus first focusable item
      const first = dropdown.querySelector('[role="menuitem"]');
      if (first) first.focus();
    }

    function closeDropdown() {
      dropdown.hidden = true;
      avatarEl.setAttribute('aria-expanded', 'false');
    }

    function toggleDropdown() {
      dropdown.hidden ? openDropdown() : closeDropdown();
    }

    avatarEl.addEventListener('click', toggleDropdown);

    avatarEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
      }
    });

    /* ── Close when clicking outside ──────────────────────── */
    document.addEventListener('click', function (e) {
      if (!userBlock.contains(e.target)) {
        closeDropdown();
      }
    });

    /* ── Close on Escape ───────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !dropdown.hidden) {
        closeDropdown();
        avatarEl.focus();
      }
    });

    /* ── Logout action ─────────────────────────────────────── */
    dropdown.querySelector('#logoutBtn').addEventListener('click', function () {
      closeDropdown();

      // Clear any session data
      sessionStorage.clear();
      // Keep remember-me in localStorage (intentionally preserved)

      // Resolve path back to login.html (works from any depth)
      // All admin pages are one level deep: src/html/*.html
      // login.html is at src/login.html
      const loginPath = resolveLoginPath();
      window.location.href = loginPath;
    });
  }

  /**
   * Resolve relative path to login.html from the current page location.
   */
  function resolveLoginPath() {
    const path = window.location.pathname;

    // Running via file:// or a dev server with /src/html/ structure
    if (path.includes('/html/')) {
      return '../login.html';
    }

    // Fallback: same directory
    return 'login.html';
  }

  /* ── Init ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserDropdown);
  } else {
    initUserDropdown();
  }

})();
