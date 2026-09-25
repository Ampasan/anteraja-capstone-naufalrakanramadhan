/**
 * live-monitoring-map.js
 * Modul interaktivitas untuk halaman Live Monitoring Map
 *
 * Struktur modul:
 *  - StateManager      : State machine terpusat (satu sumber kebenaran)
 *  - PopupManager      : Buka / tutup / dismiss popup detail kurir
 *  - FocusRouteManager : Aktifkan / nonaktifkan mode fokus rute
 *  - ManifestManager   : Ciutkan / buka kembali sidebar daftar kurir
 *  - FullMapManager    : Masuk / keluar mode peta penuh
 *  - ToastManager      : Tutup cold-chain toast
 *  - ModalManager      : Buka / tutup modal pengalihan darurat
 *  - FilterManager     : Filter tab status kurir (Semua / Online / Idle / Offline)
 *  - ServiceFilter     : Filter pills layanan di topbar
 *  - SearchManager     : Live-search daftar kurir
 *  - ClockManager      : Jam live & timestamp siklus
 *  - Init              : Bootstrap semua modul
 */

'use strict';

/* ============================================================
   STATE MANAGER
   Satu-satunya yang boleh membaca/menulis state global.
   State ditulis sebagai data-attribute di <body> supaya
   CSS selector body:has([data-state~="..."]) tetap bisa
   dipakai untuk styling jika diperlukan.
   ============================================================ */
const StateManager = (() => {
  // Nilai state yang mungkin aktif bersamaan
  const _states = new Set();

  function activate(state) {
    _states.add(state);
    document.body.dataset.mapState = [..._states].join(' ');
  }

  function deactivate(state) {
    _states.delete(state);
    document.body.dataset.mapState = [..._states].join(' ');
  }

  function isActive(state) {
    return _states.has(state);
  }

  function reset(...states) {
    if (states.length === 0) {
      _states.clear();
    } else {
      states.forEach((s) => _states.delete(s));
    }
    document.body.dataset.mapState = [..._states].join(' ');
  }

  return { activate, deactivate, isActive, reset };
})();

/* ============================================================
   POPUP MANAGER
   Mengelola popup detail kurir di atas peta.
   ============================================================ */
const PopupManager = (() => {
  const POPUP_ID = 'popup-courier-budi';

  function _getPopup() {
    return document.getElementById(POPUP_ID);
  }

  function open() {
    const popup = _getPopup();
    if (!popup) return;

    // Reset dismiss state sebelumnya
    StateManager.deactivate('dismiss-courier');

    popup.style.display = 'flex';
    popup.setAttribute('aria-hidden', 'false');
    StateManager.activate('popup-open');

    // Fokus aksesibilitas
    requestAnimationFrame(() => {
      const focusable = popup.querySelector('button, [href], [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    });
  }

  function dismiss() {
    const popup = _getPopup();
    if (!popup) return;

    popup.style.display = 'none';
    popup.setAttribute('aria-hidden', 'true');

    // Reset state turunan
    StateManager.reset('popup-open', 'focus-route');
    FocusRouteManager.deactivate();
  }

  function isOpen() {
    return StateManager.isActive('popup-open');
  }

  function init() {
    // Semua trigger yang membuka popup: courier card + SVG marker
    document.querySelectorAll('[data-open-popup="courier-budi"], [href="#popup-courier-budi"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    });

    // Tombol tutup popup
    document.querySelectorAll('[data-dismiss-popup], [href="#dismiss-courier"], .popup-close-btn').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        dismiss();
      });
    });

    // ESC menutup popup
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) dismiss();
    });
  }

  return { init, open, dismiss, isOpen };
})();

/* ============================================================
   FOCUS ROUTE MANAGER
   Mode fokus rute: memperluas popup, highlight card kurir,
   dan menampilkan banner "Fokus Rute Aktif".
   ============================================================ */
const FocusRouteManager = (() => {
  function activate() {
    if (!PopupManager.isOpen()) PopupManager.open();

    StateManager.activate('focus-route');

    const popup = document.getElementById('popup-courier-budi');
    if (!popup) return;

    // Lebar popup diperlebar
    popup.style.width = '385px';
    popup.style.border = '2px solid #B8005A';

    // Banner "Fokus Rute Aktif" muncul
    const banner = popup.querySelector('.focus-route-banner');
    if (banner) banner.style.display = 'flex';

    // Avatar jadi solid pink
    const avatar = popup.querySelector('.popup-avatar');
    if (avatar) {
      avatar.style.backgroundColor = '#B8005A';
      avatar.style.color = '#FFFFFF';
    }

    // Card kurir highlight
    const card = document.querySelector('.courier-card.is-selected');
    if (card) {
      card.style.backgroundColor = '#FFF0F5';
      card.style.borderColor = '#F5C2D6';
      const name = card.querySelector('.courier-name');
      if (name) name.style.color = '#B8005A';
      const body = card.querySelector('.courier-card-body');
      if (body) body.style.backgroundColor = '#FFF8FB';

      // Tag "AKTIF" → "TERPILIH"
      const tag = card.querySelector('.tag-pink');
      if (tag) {
        tag.dataset.originalText = tag.textContent.trim();
        tag.textContent = 'TERPILIH';
      }
    }

    // Tombol "Fokus Rute" → "Sedang Fokus"
    const focusBtn = popup.querySelector('.focus-route-btn');
    if (focusBtn) {
      focusBtn.dataset.originalLabel = focusBtn.textContent.trim();
      // Pertahankan SVG icon, ganti hanya text node
      const textNode = [...focusBtn.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
      );
      if (textNode) textNode.textContent = ' Sedang Fokus';
      else focusBtn.append(' Sedang Fokus');
    }
  }

  function deactivate() {
    StateManager.deactivate('focus-route');

    const popup = document.getElementById('popup-courier-budi');
    if (!popup) return;

    // Reset popup ke ukuran normal
    popup.style.width = '';
    popup.style.border = '';

    // Sembunyikan banner
    const banner = popup.querySelector('.focus-route-banner');
    if (banner) banner.style.display = 'none';

    // Reset avatar
    const avatar = popup.querySelector('.popup-avatar');
    if (avatar) {
      avatar.style.backgroundColor = '';
      avatar.style.color = '';
    }

    // Reset card
    const card = document.querySelector('.courier-card.is-selected');
    if (card) {
      card.style.backgroundColor = '';
      card.style.borderColor = '';
      const name = card.querySelector('.courier-name');
      if (name) name.style.color = '';
      const body = card.querySelector('.courier-card-body');
      if (body) body.style.backgroundColor = '';

      const tag = card.querySelector('.tag-pink');
      if (tag && tag.dataset.originalText) {
        tag.textContent = tag.dataset.originalText;
      }
    }

    // Reset tombol
    const focusBtn = popup.querySelector('.focus-route-btn');
    if (focusBtn && focusBtn.dataset.originalLabel) {
      const textNode = [...focusBtn.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
      );
      if (textNode) textNode.textContent = ' Fokus Rute';
    }
  }

  function init() {
    document.querySelectorAll('[href="#fokus-rute-aktif"], .focus-route-btn').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (StateManager.isActive('focus-route')) {
          deactivate();
        } else {
          activate();
        }
      });
    });
  }

  return { init, activate, deactivate };
})();

/* ============================================================
   MANIFEST MANAGER
   Ciutkan / tampilkan kembali sidebar daftar kurir.
   ============================================================ */
const ManifestManager = (() => {
  function _getAside() {
    return document.querySelector('.courier-telemetry-aside');
  }

  function _getWorkspace() {
    return document.querySelector('.live-map-workspace');
  }

  function collapse() {
    const aside = _getAside();
    const workspace = _getWorkspace();
    if (!aside || !workspace) return;

    aside.style.display = 'none';
    workspace.dataset.manifestCollapsed = 'true';
    StateManager.activate('manifest-collapsed');

    // Tombol "Tampilkan Daftar Kurir" muncul di floating filter
    const openBtn = document.querySelector('.manifest-drawer-open-btn');
    if (openBtn) openBtn.style.display = 'inline-flex';

    // Swap tombol peta penuh
    _swapFullMapButtons(true);
  }

  function expand() {
    const aside = _getAside();
    const workspace = _getWorkspace();
    if (!aside || !workspace) return;

    aside.style.display = '';
    delete workspace.dataset.manifestCollapsed;
    StateManager.deactivate('manifest-collapsed');

    const openBtn = document.querySelector('.manifest-drawer-open-btn');
    if (openBtn) openBtn.style.display = 'none';

    // Kembalikan tombol peta penuh ke keadaan normal (kecuali full-map aktif)
    if (!StateManager.isActive('full-map')) {
      _swapFullMapButtons(false);
    }
  }

  function _swapFullMapButtons(collapsed) {
    const enterBtn = document.querySelector('.full-map-enter-control');
    const exitBtn = document.querySelector('.full-map-exit-control');
    if (!enterBtn || !exitBtn) return;

    if (collapsed) {
      enterBtn.style.display = 'none';
      exitBtn.style.display = 'inline-flex';
    } else {
      enterBtn.style.display = '';
      exitBtn.style.display = 'none';
    }
  }

  function init() {
    // Arrow tutup manifest
    document.querySelectorAll('[href="#manifest-collapsed"], .manifest-toggle-btn').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        collapse();
      });
    });

    // Tombol "Tampilkan Daftar Kurir" / manifest drawer open
    document.querySelectorAll('.manifest-drawer-open-btn, [data-open-manifest]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        expand();
      });
    });
  }

  return { init, collapse, expand };
})();

/* ============================================================
   FULL MAP MANAGER
   Masuk / keluar mode peta penuh.
   ============================================================ */
const FullMapManager = (() => {
  function _getWorkspace() {
    return document.querySelector('.live-map-workspace');
  }

  function enter() {
    const workspace = _getWorkspace();
    if (!workspace) return;

    StateManager.activate('full-map');
    workspace.dataset.fullMap = 'true';

    // Sembunyikan sidebar dan popup
    const aside = document.querySelector('.courier-telemetry-aside');
    if (aside) aside.style.display = 'none';
    const popup = document.getElementById('popup-courier-budi');
    if (popup) popup.style.display = 'none';

    // Grid menjadi 1 kolom penuh
    workspace.style.gridTemplateColumns = 'minmax(0, 1fr)';

    // Swap tombol header
    const enterBtn = document.querySelector('.full-map-enter-control');
    const exitBtn = document.querySelector('.full-map-exit-control');
    if (enterBtn) enterBtn.style.display = 'none';
    if (exitBtn) exitBtn.style.display = 'inline-flex';
  }

  function exit() {
    const workspace = _getWorkspace();
    if (!workspace) return;

    StateManager.deactivate('full-map');
    delete workspace.dataset.fullMap;

    // Tampilkan kembali sidebar (kecuali manifest di-collapse secara terpisah)
    if (!StateManager.isActive('manifest-collapsed')) {
      const aside = document.querySelector('.courier-telemetry-aside');
      if (aside) aside.style.display = '';
    }

    // Reset grid
    workspace.style.gridTemplateColumns = '';

    // Swap tombol header
    const enterBtn = document.querySelector('.full-map-enter-control');
    const exitBtn = document.querySelector('.full-map-exit-control');
    if (enterBtn) enterBtn.style.display = '';
    if (exitBtn) exitBtn.style.display = 'none';

    // Jika manifest masih collapsed, pertahankan state-nya
    if (StateManager.isActive('manifest-collapsed')) {
      enterBtn.style.display = 'none';
      exitBtn.style.display = 'inline-flex';
    }
  }

  function init() {
    // Tombol "Peta Penuh"
    document.querySelectorAll('.full-map-enter-control, [href="#full-map"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        enter();
      });
    });

    // Tombol "Keluar Peta Penuh" — juga reset manifest-collapsed
    document.querySelectorAll('.full-map-exit-control, [href="#_"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        // Hanya intercept jika state aktif; biarkan link biasa (#_) jalan
        if (StateManager.isActive('full-map') || StateManager.isActive('manifest-collapsed')) {
          e.preventDefault();
          exit();
          ManifestManager.expand(); // reset manifest juga
        }
      });
    });

    // Escape keluar dari full-map
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && StateManager.isActive('full-map')) exit();
    });
  }

  return { init, enter, exit };
})();

/* ============================================================
   TOAST MANAGER
   Tutup cold-chain alert toast.
   ============================================================ */
const ToastManager = (() => {
  function _getToast() {
    return document.querySelector('.actionable-coldchain-toast');
  }

  function dismiss() {
    const toast = _getToast();
    if (!toast) return;

    toast.style.display = 'none';
    toast.setAttribute('aria-hidden', 'true');
    StateManager.activate('toast-dismissed');
  }

  function show() {
    const toast = _getToast();
    if (!toast) return;

    toast.style.display = 'flex';
    toast.setAttribute('aria-hidden', 'false');
    StateManager.deactivate('toast-dismissed');
  }

  function init() {
    // Semua trigger dismiss toast: tombol "Abaikan", X close, dan label for="dismiss-coldchain"
    document.querySelectorAll(
      '[for="dismiss-coldchain"], .toast-close-link, [data-dismiss-toast]'
    ).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        dismiss();
      });
    });
  }

  return { init, dismiss, show };
})();

/* ============================================================
   MODAL MANAGER
   Buka / tutup modal pengalihan darurat.
   ============================================================ */
const ModalManager = (() => {
  function _getModal() {
    return document.getElementById('modal-emergency-reassign');
  }

  function open() {
    const modal = _getModal();
    if (!modal) return;

    modal.classList.add('modal--open');
    modal.setAttribute('aria-hidden', 'false');
    StateManager.activate('emergency-modal');

    // Fokus aksesibilitas ke elemen pertama di modal
    requestAnimationFrame(() => {
      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    });
  }

  function close() {
    const modal = _getModal();
    if (!modal) return;

    modal.classList.remove('modal--open');
    modal.setAttribute('aria-hidden', 'true');
    StateManager.deactivate('emergency-modal');
  }

  function init() {
    // Trigger buka: label yang dulu for="open-emergency-reassign" + SVG marker Rizky
    document.querySelectorAll(
      '[for="open-emergency-reassign"], [data-open-emergency-modal]'
    ).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    });

    // Tombol tutup modal: Batalkan + X
    document.querySelectorAll('.modal-close, [data-close-modal]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        close();
      });
    });

    // Klik backdrop (luar modal card)
    const modal = _getModal();
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }

    // Escape menutup modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && StateManager.isActive('emergency-modal')) close();
    });
  }

  return { init, open, close };
})();

/* ============================================================
   FILTER MANAGER
   Filter tab status kurir: Semua / Online / Idle / Offline
   ============================================================ */
const FilterManager = (() => {
  function init() {
    const tabs = document.querySelectorAll('.manifest-tab-btn');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active state
        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Tentukan filter dari teks tab
        const text = tab.textContent.toLowerCase().trim();
        let filter = 'semua';
        if (text.includes('online')) filter = 'online';
        else if (text.includes('idle')) filter = 'idle';
        else if (text.includes('offline')) filter = 'offline';

        _applyFilter(filter);
      });
    });
  }

  function _applyFilter(filter) {
    const cards = document.querySelectorAll('.courier-card, .courier-card-list > article');
    cards.forEach((card) => {
      if (filter === 'semua') {
        card.hidden = false;
        return;
      }

      // Cari badge status di card
      const badge = card.querySelector('.badge');
      const badgeText = badge ? badge.textContent.toLowerCase() : '';
      const tagText = card.querySelector('.tag-service-type')
        ? card.querySelector('.tag-service-type').textContent.toLowerCase()
        : '';

      let match = false;
      if (filter === 'online') match = badgeText.includes('online') || tagText.includes('aktif');
      else if (filter === 'idle') match = tagText.includes('idle') || badgeText.includes('idle');
      else if (filter === 'offline') match = tagText.includes('offline') || badgeText.includes('offline');

      card.hidden = !match;
    });
  }

  return { init };
})();

/* ============================================================
   SERVICE FILTER
   Filter pills layanan di topbar (Semua / Frozen / Same Day …)
   ============================================================ */
const ServiceFilter = (() => {
  function init() {
    const pills = document.querySelectorAll('.service-pill-btn');
    if (!pills.length) return;

    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();

        pills.forEach((p) => {
          p.classList.remove('active');
          p.removeAttribute('aria-current');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-current', 'true');
      });
    });
  }

  return { init };
})();

/* ============================================================
   SEARCH MANAGER
   Live-search daftar kurir di sidebar.
   ============================================================ */
const SearchManager = (() => {
  function init() {
    const input = document.querySelector('.manifest-search-input');
    if (!input) return;

    let _timer;

    input.addEventListener('input', () => {
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        const q = input.value.toLowerCase().trim();
        const cards = document.querySelectorAll(
          '.courier-card, .courier-card-list > article'
        );
        cards.forEach((card) => {
          if (!q) {
            card.hidden = false;
            return;
          }
          card.hidden = !card.textContent.toLowerCase().includes(q);
        });
      }, 200);
    });

    // Bersihkan saat input dikosongkan via tombol X browser
    input.addEventListener('search', () => {
      if (!input.value) {
        document.querySelectorAll('.courier-card, .courier-card-list > article').forEach((c) => {
          c.hidden = false;
        });
      }
    });
  }

  return { init };
})();

/* ============================================================
   CLOCK MANAGER
   Update timestamp "Siklus Siang" dan live dot di nav.
   ============================================================ */
const ClockManager = (() => {
  function _pad(n) {
    return String(n).padStart(2, '0');
  }

  function _getWIBNow() {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
  }

  function init() {
    // Tidak ada clock display di halaman ini yang perlu di-update secara real-time.
    // Nav live dot sudah punya animasi CSS (nav-live-pulse), tidak perlu JS.
    // Placeholder ini siap diisi jika ada komponen jam yang ditambahkan.
  }

  return { init };
})();

/* ============================================================
   CSS INJECTION
   Tambahkan rule untuk state yang dikelola JS menggantikan
   rule CSS :target dan :checked yang sudah di-comment.
   ============================================================ */
function _injectDynamicStyles() {
  const style = document.createElement('style');
  style.id = 'lmm-dynamic-styles';
  style.textContent = `
    /* Modal open state via JS */
    #modal-emergency-reassign.modal--open {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }

    #modal-emergency-reassign.modal--open .modal-card {
      transform: none;
    }

    /* Manifest drawer open btn — hidden by default */
    .manifest-drawer-open-btn {
      display: none;
    }

    /* Full-map exit button — hidden by default */
    .full-map-exit-control {
      display: none;
    }
  `;
  document.head.appendChild(style);
}

/* ============================================================
   INIT — bootstrap semua modul saat DOM siap
   ============================================================ */
function init() {
  _injectDynamicStyles();

  // Set initial aria-hidden pada modal
  const emergencyModal = document.getElementById('modal-emergency-reassign');
  if (emergencyModal) {
    emergencyModal.setAttribute('aria-hidden', 'true');
  }

  // Set initial aria-hidden pada popup
  const popup = document.getElementById('popup-courier-budi');
  if (popup) {
    popup.setAttribute('aria-hidden', 'true');
  }

  // Set initial display untuk elemen yang dikelola JS
  const manifestOpenBtn = document.querySelector('.manifest-drawer-open-btn');
  if (manifestOpenBtn) manifestOpenBtn.style.display = 'none';

  const exitBtn = document.querySelector('.full-map-exit-control');
  if (exitBtn) exitBtn.style.display = 'none';

  // Bootstrap semua modul
  PopupManager.init();
  FocusRouteManager.init();
  ManifestManager.init();
  FullMapManager.init();
  ToastManager.init();
  ModalManager.init();
  FilterManager.init();
  ServiceFilter.init();
  SearchManager.init();
  ClockManager.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
