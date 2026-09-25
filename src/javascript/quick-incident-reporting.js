const ModalManager = (() => {
  let _activeModal = null;
  let _lastTrigger = null;

  function open(modalId) {
    if (_activeModal) _close(_activeModal, false);

    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('qir-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    _activeModal = modalId;

    // Fokus ke elemen pertama yang bisa difokus di dalam modal
    requestAnimationFrame(() => {
      const focusable = modal.querySelector(
        'button, [href]:not([href="#_"]):not([href="#"]), input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
      else {
        // Fallback: fokus ke close button
        const closeBtn = modal.querySelector('.qir-modal-close');
        if (closeBtn) closeBtn.focus();
      }
    });
  }

  function _close(modalId, restoreFocus = true) {
    const modal = document.getElementById(modalId || _activeModal);
    if (!modal) return;

    modal.classList.remove('qir-modal--open');
    modal.setAttribute('aria-hidden', 'true');

    if (_activeModal === (modalId || _activeModal)) _activeModal = null;

    // Kembalikan fokus ke trigger yang membuka modal
    if (restoreFocus && _lastTrigger) {
      _lastTrigger.focus();
      _lastTrigger = null;
    }
  }

  function closeActive() {
    if (_activeModal) _close(_activeModal);
  }

  function init() {
    // Intercept semua link yang membuka modal: href="#modal-*"
    document.querySelectorAll('[href^="#modal-"]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = trigger.getAttribute('href').slice(1);
        if (!document.getElementById(modalId)) return;
        _lastTrigger = trigger;
        open(modalId);
      });
    });

    // Intercept tombol tutup: .qir-modal-close
    document.querySelectorAll('.qir-modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.qir-modal-overlay');
        if (modal) _close(modal.id);
      });
    });

    // Intercept tombol "Tutup" / "Selesai" di footer modal (href="#_")
    document.querySelectorAll('.qir-modal-footer [href="#_"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.qir-modal-overlay');
        if (modal) _close(modal.id);
      });
    });

    // Klik backdrop (area di luar qir-modal-card) menutup modal
    document.querySelectorAll('.qir-modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) _close(overlay.id);
      });
    });

    // Escape menutup modal aktif
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _activeModal) closeActive();
    });
  }

  return { init, open, closeActive };
})();

const FilterManager = (() => {
  let _activeStatus = 'semua';
  let _activeKategori = 'semua';

  // Map: nilai filter status → class CSS pada row
  const STATUS_MAP = {
    kritis:  ['qir-row-escalated'],
    waspada: ['qir-row-reported', 'qir-row-ack'],
    selesai: ['qir-row-resolved'],
  };

  // Map: nilai filter kategori → class CSS pada elemen kendala di dalam row
  const KATEGORI_MAP = {
    'anomali suhu': 'qir-kendala-coldchain',
    'ban bocor':    'qir-kendala-vehicle',
    'banjir / macet': 'qir-kendala-banjir',
    'segel rusak':  'qir-kendala-segel',
  };

  function _applyFilters() {
    const rows = document.querySelectorAll('.qir-incident-row');
    let visibleCount = 0;

    rows.forEach((row) => {
      const passStatus = _checkStatus(row);
      const passKategori = _checkKategori(row);
      const visible = passStatus && passKategori;
      row.hidden = !visible;
      if (visible) visibleCount++;
    });

    // Update badge jumlah aktif
    const badge = document.querySelector('.qir-active-badge');
    if (badge) {
      badge.textContent = `${visibleCount} Kendala Aktif`;
    }
  }

  function _checkStatus(row) {
    if (_activeStatus === 'semua') return true;
    const allowed = STATUS_MAP[_activeStatus] || [];
    return allowed.some((cls) => row.classList.contains(cls));
  }

  function _checkKategori(row) {
    if (_activeKategori === 'semua') return true;
    const targetClass = KATEGORI_MAP[_activeKategori];
    if (!targetClass) return true;
    return !!row.querySelector(`.${targetClass}`);
  }

  function _setActiveTab(tab, tabs) {
    tabs.forEach((t) => {
      t.classList.remove('qir-tab-active');
      t.removeAttribute('aria-current');
    });
    tab.classList.add('qir-tab-active');
    tab.setAttribute('aria-current', 'true');
  }

  function _setActivePill(pill, pills) {
    pills.forEach((p) => {
      p.classList.remove('qir-kat-active');
      p.removeAttribute('aria-current');
    });
    pill.classList.add('qir-kat-active');
    pill.setAttribute('aria-current', 'true');
  }

  function _parseStatusFromTab(text) {
    const t = text.toLowerCase();
    if (t.startsWith('kritis')) return 'kritis';
    if (t.startsWith('waspada')) return 'waspada';
    if (t.startsWith('selesai')) return 'selesai';
    return 'semua';
  }

  function _parseKategoriFromPill(text) {
    const t = text.toLowerCase().replace(/\s*\(\d+\)\s*$/, '').trim();
    if (t === 'semua') return 'semua';
    if (t.includes('anomali')) return 'anomali suhu';
    if (t.includes('ban bocor')) return 'ban bocor';
    if (t.includes('banjir')) return 'banjir / macet';
    if (t.includes('segel')) return 'segel rusak';
    return 'semua';
  }

  function init() {
    // Status tabs
    const tabs = document.querySelectorAll('.qir-status-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        _setActiveTab(tab, tabs);
        _activeStatus = _parseStatusFromTab(tab.textContent.trim());
        _applyFilters();
      });
    });

    // Kategori pills
    const pills = document.querySelectorAll('.qir-kat-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        _setActivePill(pill, pills);
        _activeKategori = _parseKategoriFromPill(pill.textContent.trim());
        _applyFilters();
      });
    });
  }

  return { init };
})();

const SearchManager = (() => {
  function init() {
    const input = document.querySelector('.qir-search-input');
    if (!input) return;

    let _timer;

    input.addEventListener('input', () => {
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        const q = input.value.toLowerCase().trim();
        const rows = document.querySelectorAll('.qir-incident-row');

        rows.forEach((row) => {
          // Jangan override row yang sudah disembunyikan FilterManager
          if (row.dataset.filteredOut === 'true') return;

          if (!q) {
            row.hidden = false;
            return;
          }
          const text = row.textContent.toLowerCase();
          row.hidden = !text.includes(q);
        });
      }, 200);
    });

    // Reset saat field dikosongkan
    input.addEventListener('search', () => {
      if (!input.value) {
        document.querySelectorAll('.qir-incident-row').forEach((r) => (r.hidden = false));
      }
    });
  }

  return { init };
})();

const ClipboardManager = (() => {
  function _showCopiedTip(icon) {
    const tip = document.createElement('span');
    tip.textContent = 'Tersalin!';
    tip.className = 'qir-copy-tip';
    icon.parentElement.appendChild(tip);

    requestAnimationFrame(() => tip.classList.add('qir-copy-tip--visible'));
    setTimeout(() => {
      tip.classList.remove('qir-copy-tip--visible');
      setTimeout(() => tip.remove(), 200);
    }, 1500);
  }

  function init() {
    document.querySelectorAll('.qir-copy-icon').forEach((icon) => {
      icon.setAttribute('role', 'button');
      icon.setAttribute('tabindex', '0');
      icon.setAttribute('aria-label', 'Salin nomor resi');

      const handler = () => {
        const resiEl = icon.closest('.qir-resi-num');
        if (!resiEl) return;

        // Ambil hanya text node (bukan inner SVG)
        const resiText = [...resiEl.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .join('')
          .trim();

        if (!resiText) return;

        if (navigator.clipboard) {
          navigator.clipboard.writeText(resiText).then(() => _showCopiedTip(icon));
        } else {
          // Fallback untuk browser lama
          const ta = document.createElement('textarea');
          ta.value = resiText;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          _showCopiedTip(icon);
        }
      };

      icon.addEventListener('click', handler);
      icon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  return { init };
})();

const ClockManager = (() => {
  // Timestamp insiden dalam format ISO (diambil dari atribut datetime pada <time>)
  function _updateRelativeTimes() {
    const now = Date.now();
    document.querySelectorAll('.qir-waktu-text[datetime]').forEach((el) => {
      const dt = new Date(el.getAttribute('datetime')).getTime();
      if (isNaN(dt)) return;

      const diffMs = now - dt;
      const diffMin = Math.floor(diffMs / 60000);

      let label;
      if (diffMin < 1)       label = 'Baru saja';
      else if (diffMin < 60) label = `${diffMin} mnt lalu`;
      else                   label = `${Math.floor(diffMin / 60)} jam lalu`;

      // Perbarui hanya bagian teks "(X mnt lalu)" yang ada di dalam elemen
      const current = el.textContent;
      el.textContent = current.replace(/\(.*?\)/, `(${label})`);
    });
  }

  function init() {
    _updateRelativeTimes();
    setInterval(_updateRelativeTimes, 60_000);
  }

  return { init };
})();

function _injectDynamicStyles() {
  const style = document.createElement('style');
  style.id = 'qir-dynamic-styles';
  style.textContent = `
    /* Modal open state via JS — menggantikan :target */
    .qir-modal-overlay.qir-modal--open {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }
    .qir-modal-overlay.qir-modal--open .qir-modal-card {
      transform: translateY(0) scale(1) !important;
    }

    /* Tooltip salin resi */
    .qir-copy-tip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background-color: #0F172A;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
      z-index: 100;
    }
    .qir-resi-num {
      position: relative;
    }
    .qir-copy-tip--visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  document.head.appendChild(style);
}

function init() {
  _injectDynamicStyles();

  // Set semua modal aria-hidden=true di awal (dikontrol JS)
  document.querySelectorAll('.qir-modal-overlay').forEach((m) => {
    m.setAttribute('aria-hidden', 'true');
  });

  ModalManager.init();
  FilterManager.init();
  SearchManager.init();
  ClipboardManager.init();
  ClockManager.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
