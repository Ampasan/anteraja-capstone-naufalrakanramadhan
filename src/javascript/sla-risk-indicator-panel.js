const ModalManager = (() => {
  let _activeModal = null;

  function open(modalId) {
    if (_activeModal) close(_activeModal);

    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('sla-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    _activeModal = modalId;

    // Trap fokus ke elemen pertama yang bisa difokus
    requestAnimationFrame(() => {
      const focusable = modal.querySelector(
        'button, [href]:not([href="#_"]), input:not([type="checkbox"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    });
  }

  function close(modalId) {
    const modal = document.getElementById(modalId || _activeModal);
    if (!modal) return;

    modal.classList.remove('sla-modal--open');
    modal.setAttribute('aria-hidden', 'true');

    if (_activeModal === (modalId || _activeModal)) _activeModal = null;

    // Kembalikan fokus ke tombol yang membuka modal
    const trigger = document.querySelector(`[data-modal-trigger="${modal.id}"]`);
    if (trigger) trigger.focus();
  }

  function closeAll() {
    document.querySelectorAll('.sla-modal-overlay.sla-modal--open').forEach((m) => {
      close(m.id);
    });
  }

  function getActive() {
    return _activeModal;
  }

  function init() {
    // Tombol buka modal: href="#modal-*" atau href="#reassign-done"
    document.querySelectorAll('[href^="#modal-"], [href="#reassign-done"]').forEach((link) => {
      const target = link.getAttribute('href').slice(1);
      if (!target || target === '_') return;
      if (!document.getElementById(target)) return;

      // Tandai trigger untuk kembalikan fokus saat modal tutup
      link.setAttribute('data-modal-trigger', target);

      link.addEventListener('click', (e) => {
        e.preventDefault();
        // ReassignManager intercept untuk modal konfirmasi
        if (target === 'reassign-done') {
          ReassignManager.confirm(link);
          return;
        }
        open(target);
        RowHighlightManager.activateFromTrigger(link);
      });
    });

    // Tombol tutup modal: .sla-modal-close dan btn dengan href="#_" di dalam modal
    document.querySelectorAll('.sla-modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.sla-modal-overlay');
        if (modal) close(modal.id);
      });
    });

    // Tombol Batal / Tutup / Kembali di footer modal
    document.querySelectorAll(
      '.sla-modal-batal, .sla-mambang-btn-batal, .sla-mpantau-footer-actions .btn-secondary, .sla-mdetail-footer .btn-secondary'
    ).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.sla-modal-overlay');
        if (modal) close(modal.id);
      });
    });

    // Tombol "Kembali ke Panel" di modal sukses
    document.querySelectorAll('#reassign-done .btn-secondary').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        close('reassign-done');
        RowHighlightManager.clearAll();
      });
    });

    // Klik backdrop (area luar modal-card)
    document.querySelectorAll('.sla-modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(overlay.id);
      });
    });

    // Escape menutup modal aktif
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _activeModal) close(_activeModal);
    });
  }

  return { init, open, close, closeAll, getActive };
})();

/* ============================================================
   REASSIGN MANAGER
   Validasi form pengalihan dan transisi ke modal sukses.
   ============================================================ */
const ReassignManager = (() => {
  function _getWIBTime() {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  }

  function _fillSuccessModal(courierName) {
    const doneModal = document.getElementById('reassign-done');
    if (!doneModal) return;

    // Update nama kurir di teks sukses
    const desc = doneModal.querySelector('.sla-success-desc');
    if (desc) {
      const strongs = desc.querySelectorAll('strong');
      // strong[1] = nama kurir
      if (strongs[1]) strongs[1].textContent = courierName;
    }

    // Update timestamp di detail grid jika ada
    const timeEl = doneModal.querySelector('[data-success-time]');
    if (timeEl) timeEl.textContent = _getWIBTime();
  }

  function confirm(triggerEl) {
    const modal = document.getElementById('modal-pengalihan-cepat');
    if (!modal) {
      ModalManager.open('reassign-done');
      return;
    }

    // Ambil kurir yang dipilih
    const checkedRadio = modal.querySelector('.sla-rek-radio:checked');
    const courierName = checkedRadio
      ? (checkedRadio.closest('.sla-rek-option')?.querySelector('.sla-rek-name')?.textContent?.trim() ?? 'Kurir Terpilih')
      : 'Kurir Terpilih';

    _fillSuccessModal(courierName);

    // Tutup modal pengalihan, buka modal sukses
    ModalManager.close('modal-pengalihan-cepat');
    setTimeout(() => ModalManager.open('reassign-done'), 150);

    // Update baris tabel: ubah status jadi dialihkan
    RowHighlightManager.markReassigned();
  }

  function init() {
    // Validasi: disable tombol konfirmasi sampai kurir dipilih
    const modal = document.getElementById('modal-pengalihan-cepat');
    if (!modal) return;

    const confirmBtn = modal.querySelector('.sla-modal-konfirmasi');
    if (!confirmBtn) return;

    // Initial state: disable jika tidak ada radio checked
    _updateConfirmBtn(modal, confirmBtn);

    modal.querySelectorAll('.sla-rek-radio').forEach((radio) => {
      radio.addEventListener('change', () => _updateConfirmBtn(modal, confirmBtn));
    });
  }

  function _updateConfirmBtn(modal, btn) {
    const checked = modal.querySelector('.sla-rek-radio:checked');
    if (checked) {
      btn.removeAttribute('aria-disabled');
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.setAttribute('aria-disabled', 'true');
      btn.style.opacity = '0.45';
      btn.style.pointerEvents = 'none';
    }
  }

  return { init, confirm };
})();

const RowHighlightManager = (() => {
  function activateFromTrigger(trigger) {
    clearAll();

    // Cari baris terdekat dari trigger (jika trigger ada di dalam tabel)
    const row = trigger.closest('tr.sla-row');
    if (row) {
      row.classList.add('sla-row--active');
      return;
    }

    // Jika trigger di luar tabel (banner prioritas dsb), highlight baris pertama kritis
    const firstKritis = document.querySelector('tr.sla-row-kritis');
    if (firstKritis) firstKritis.classList.add('sla-row--active');
  }

  function markReassigned() {
    const active = document.querySelector('tr.sla-row--active');
    if (!active) return;

    // Ubah warna baris jadi "dialihkan"
    active.classList.remove('sla-row-kritis', 'sla-row-waspada', 'sla-row--active');
    active.classList.add('sla-row-aman');

    // Ubah status pill SLA di baris menjadi hijau
    const slaPill = active.querySelector('.sla-sla-pill');
    if (slaPill) {
      slaPill.className = 'sla-sla-pill sla-sla-aman';
      slaPill.innerHTML = `
        <span class="sla-sla-dot sla-dot-aman" aria-hidden="true"></span>
        Dialihkan
      `;
    }

    // Ubah aksi cell: sembunyikan tombol Alihkan, tampilkan tombol Detail
    const aksiCell = active.querySelector('.sla-aksi-group');
    if (aksiCell) {
      const alihkanBtn = aksiCell.querySelector('.sla-btn-alihkan');
      if (alihkanBtn) alihkanBtn.style.display = 'none';
    }
  }

  function clearAll() {
    document.querySelectorAll('tr.sla-row--active').forEach((r) => r.classList.remove('sla-row--active'));
  }

  return { activateFromTrigger, markReassigned, clearAll };
})();

const FilterManager = (() => {
  let _activeFilter = 'semua';

  function _applyFilter(filter) {
    _activeFilter = filter;
    const rows = document.querySelectorAll('tr.sla-row');
    rows.forEach((row) => {
      if (filter === 'semua') {
        row.hidden = false;
        return;
      }
      row.hidden = !row.classList.contains(`sla-row-${filter}`);
    });
  }

  function init() {
    const tabs = document.querySelectorAll('.sla-status-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();

        tabs.forEach((t) => {
          t.classList.remove('sla-tab-active');
          t.removeAttribute('aria-current');
        });
        tab.classList.add('sla-tab-active');
        tab.setAttribute('aria-current', 'true');

        const text = tab.textContent.toLowerCase().trim();
        let filter = 'semua';
        if (text.startsWith('kritis')) filter = 'kritis';
        else if (text.startsWith('waspada')) filter = 'waspada';
        else if (text.startsWith('aman')) filter = 'aman';

        _applyFilter(filter);
      });
    });
  }

  return { init };
})();

const ServiceFilter = (() => {
  function init() {
    const pills = document.querySelectorAll('.sla-service-pill');
    const resetBtn = document.querySelector('.sla-reset-filter');

    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();

        // Toggle: klik pill aktif → reset ke "Semua"
        if (pill.classList.contains('sla-pill-active') && !pill.textContent.includes('Semua')) {
          _activatePill(pills[0]); // "Semua" selalu pill pertama
          _applyServiceFilter('semua');
          return;
        }

        _activatePill(pill);

        const text = pill.textContent.toLowerCase().trim();
        const filter = text.replace(/\s*\(\d+\)\s*$/, '').trim();
        _applyServiceFilter(filter);
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        _activatePill(pills[0]);
        _applyServiceFilter('semua');
      });
    }
  }

  function _activatePill(target) {
    document.querySelectorAll('.sla-service-pill').forEach((p) => {
      p.classList.remove('sla-pill-active');
      p.removeAttribute('aria-current');
    });
    target.classList.add('sla-pill-active');
    target.setAttribute('aria-current', 'true');
  }

  function _applyServiceFilter(filter) {
    const rows = document.querySelectorAll('tr.sla-row');
    rows.forEach((row) => {
      if (filter === 'semua') {
        row.hidden = false;
        return;
      }
      const tag = row.querySelector('.sla-layanan-tag');
      const tagText = tag ? tag.textContent.toLowerCase().trim() : '';
      row.hidden = !tagText.includes(filter);
    });
  }

  return { init };
})();

const SearchManager = (() => {
  function init() {
    const input = document.querySelector('.sla-search-input');
    if (!input) return;

    let _timer;

    input.addEventListener('input', () => {
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        const q = input.value.toLowerCase().trim();
        const rows = document.querySelectorAll('tr.sla-row');

        rows.forEach((row) => {
          if (!q) {
            row.hidden = false;
            return;
          }
          row.hidden = !row.textContent.toLowerCase().includes(q);
        });
      }, 200);
    });

    // Bersihkan saat input dikosongkan
    input.addEventListener('search', () => {
      if (!input.value) {
        document.querySelectorAll('tr.sla-row').forEach((r) => (r.hidden = false));
      }
    });
  }

  return { init };
})();

const ClockManager = (() => {
  function _getWIBTime() {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
  }

  function init() {
    const el = document.querySelector('.sla-meta-update');
    if (!el) return;

    function tick() {
      el.textContent = `Update: ${_getWIBTime()}`;
    }

    tick();
    setInterval(tick, 1000);
  }

  return { init };
})();

const ToggleManager = (() => {
  function init() {
    const toggles = document.querySelectorAll('.sla-toggle-input');
    toggles.forEach((toggle) => {
      // Set aria-checked awal
      toggle.setAttribute('aria-checked', toggle.checked ? 'true' : 'false');
      toggle.setAttribute('role', 'switch');

      toggle.addEventListener('change', () => {
        toggle.setAttribute('aria-checked', toggle.checked ? 'true' : 'false');
      });
    });

    // Tombol "Simpan Konfigurasi" di modal ambang batas
    const simpanBtn = document.querySelector('.sla-mambang-btn-simpan');
    if (simpanBtn) {
      simpanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Kumpulkan nilai semua toggle dan input
        const config = _collectConfig();
        _showSaveConfirm(config);
        ModalManager.close('modal-ambang-batas');
      });
    }

    // Tombol "Kembalikan ke Default SOP"
    const defaultBtn = document.querySelector('.sla-mambang-btn-default');
    if (defaultBtn) {
      defaultBtn.addEventListener('click', () => {
        toggles.forEach((t) => {
          t.checked = true;
          t.setAttribute('aria-checked', 'true');
        });
        // Reset input number ke default
        document.querySelectorAll('.sla-ambang-input').forEach((inp) => {
          if (inp.dataset.default) inp.value = inp.dataset.default;
        });
      });
    }
  }

  function _collectConfig() {
    const result = {};
    document.querySelectorAll('.sla-toggle-input').forEach((t, i) => {
      result[`toggle_${i}`] = t.checked;
    });
    return result;
  }

  function _showSaveConfirm(config) {
    // Tampilkan notifikasi singkat (toast mini)
    let toast = document.getElementById('sla-save-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sla-save-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = 'Konfigurasi ambang batas berhasil disimpan.';
    toast.classList.add('sla-save-toast--visible');
    setTimeout(() => toast.classList.remove('sla-save-toast--visible'), 3000);
  }

  return { init };
})();

function _injectDynamicStyles() {
  const style = document.createElement('style');
  style.id = 'sla-dynamic-styles';
  style.textContent = `
    /* Modal open via JS class */
    .sla-modal-overlay.sla-modal--open {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }
    .sla-modal-overlay.sla-modal--open .sla-modal-card {
      transform: translateY(0) scale(1) !important;
    }

    /* Baris tabel aktif */
    tr.sla-row--active {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    /* Save toast notifikasi */
    #sla-save-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(16px);
      background-color: #0F172A;
      color: #FFFFFF;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 9999;
      white-space: nowrap;
    }
    #sla-save-toast.sla-save-toast--visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;
  document.head.appendChild(style);
}

function init() {
  _injectDynamicStyles();

  // Set semua modal ke aria-hidden=true di awal
  document.querySelectorAll('.sla-modal-overlay').forEach((m) => {
    m.setAttribute('aria-hidden', 'true');
  });

  ModalManager.init();
  ReassignManager.init();
  FilterManager.init();
  ServiceFilter.init();
  SearchManager.init();
  ClockManager.init();
  ToggleManager.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
