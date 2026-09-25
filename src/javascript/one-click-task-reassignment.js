'use strict';

const INCIDENTS = [
  {
    id: 'row-012',
    resi: '100024000012',
    layanan: 'cargo',
    label: 'CARGO',
    kurir: 'Teguh Wibowo',
    kendala: 'Kopling Jebol di Jl. Panjang',
    deskripsi: '186.8 kg · Mesin Pabrik',
    panelId: 'panel-012',
  },
  {
    id: 'row-015',
    resi: '100024000015',
    layanan: 'pharma',
    label: 'PHARMA',
    kurir: 'Budi Santoso',
    kendala: 'Mesin Mogok di Pancoran',
    deskripsi: '1.2 kg · Vaksin RS Siloam',
    panelId: 'panel-015',
  },
  {
    id: 'row-009',
    resi: '100024000009',
    layanan: 'frozen',
    label: 'FROZEN',
    kurir: 'Rizky Pratama',
    kendala: 'Dialihkan ke Doni Kurniawan',
    deskripsi: '4.5 kg (-2°C)',
    panelId: null,
  },
];

const COURIER_MAP = {
  'exec-kurir-012': {
    fr: 'Fajar Ramadhan',
    af: 'Ahmad Fauzi',
  },
  'exec-kurir-015': {
    dk: 'Doni Kurniawan',
    mh: 'Muhammad Hafidz',
  },
  'kurir-012': {
    ek: 'Eko Kurniawan',
    sr: 'Sandi Riyanto',
  },
  'kurir-015': {
    dk: 'Doni Kurniawan',
    mh: 'Muhammad Hafidz',
  },
};

const PanelManager = (() => {
  let _activePanel = null;

  function _openPanel(panelId) {
    // Tutup panel sebelumnya
    if (_activePanel) _closePanel(_activePanel, false);

    const panel = document.getElementById(panelId);
    const workspace = document.querySelector('.ocr-workspace');
    if (!panel || !workspace) return;

    panel.style.display = 'flex';
    workspace.setAttribute('data-active-panel', panelId);
    _activePanel = panelId;

    // Highlight baris tabel yang terkait
    _highlightRow(panelId, true);

    // Validasi awal saat panel dibuka
    ValidationManager.check(panelId);

    // Scroll ke panel di mobile
    if (window.innerWidth <= 900) {
      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }

  function _closePanel(panelId, clearActive = true) {
    const panel = document.getElementById(panelId);
    const workspace = document.querySelector('.ocr-workspace');
    if (!panel) return;

    panel.style.display = 'none';
    if (workspace) workspace.removeAttribute('data-active-panel');
    if (clearActive) _activePanel = null;

    _highlightRow(panelId, false);
  }

  function _highlightRow(panelId, active) {
    // panel-012 → ocr-row-012
    const rowClass = 'ocr-row-' + panelId.replace('panel-', '');
    const row = document.querySelector('.' + rowClass);
    if (!row) return;
    row.classList.toggle('ocr-row--active', active);
  }

  function init() {
    // Klik pada link resi / nama kurir yang mengarah ke panel
    document.querySelectorAll('[href^="#panel-"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const panelId = link.getAttribute('href').slice(1);
        if (_activePanel === panelId) {
          _closePanel(panelId);
        } else {
          _openPanel(panelId);
        }
      });
    });

    // Tombol tutup panel (.ocr-exec-close) yang href="#_"
    document.querySelectorAll('.ocr-exec-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const panel = btn.closest('.ocr-exec-panel');
        if (panel) _closePanel(panel.id);
      });
    });

    // Tombol "Batalkan / Pilih Kurir Lain"
    document.querySelectorAll('.ocr-exec-cancel-link').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const panel = btn.closest('.ocr-exec-panel');
        if (panel) _closePanel(panel.id);
      });
    });
  }

  return { init, openPanel: _openPanel, closePanel: _closePanel };
})();

const ModalManager = (() => {
  let _activeModal = null;

  function _open(modalId) {
    if (_activeModal) _close(_activeModal);
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('ocr-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    _activeModal = modalId;

    // Fokus ke elemen pertama yang bisa difokus di dalam modal
    requestAnimationFrame(() => {
      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    });
  }

  function _close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('ocr-modal--open');
    modal.setAttribute('aria-hidden', 'true');
    if (_activeModal === modalId) _activeModal = null;
  }

  function _closeAll() {
    document.querySelectorAll('.ocr-modal-overlay.ocr-modal--open').forEach((m) => {
      _close(m.id);
    });
  }

  function init() {
    // Link yang membuka modal
    document.querySelectorAll('[href^="#modal-"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const modalId = link.getAttribute('href').slice(1);
        _open(modalId);
      });
    });

    // Tombol yang menutup modal: href="#_" atau .ocr-modal-close
    document.querySelectorAll('.ocr-modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.ocr-modal-overlay');
        if (modal) _close(modal.id);
      });
    });

    // Klik backdrop (luar modal-card) menutup modal
    document.querySelectorAll('.ocr-modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) _close(overlay.id);
      });
    });

    // Escape menutup modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _activeModal) _close(_activeModal);
    });
  }

  return { init, open: _open, close: _close, closeAll: _closeAll };
})();

const ValidationManager = (() => {
  function _getConfirmBtn(panelId) {
    const panel = document.getElementById(panelId);
    return panel ? panel.querySelector('.ocr-exec-confirm-btn') : null;
  }

  function check(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const confirmBtn = _getConfirmBtn(panelId);
    if (!confirmBtn) return;

    const radioChecked = panel.querySelector('input[type="radio"]:checked');
    const isValid = !!radioChecked;

    // Ganti dari <a> ke button-like state via aria + visual
    if (isValid) {
      confirmBtn.removeAttribute('aria-disabled');
      confirmBtn.style.opacity = '1';
      confirmBtn.style.pointerEvents = 'auto';
      confirmBtn.style.cursor = 'pointer';
    } else {
      confirmBtn.setAttribute('aria-disabled', 'true');
      confirmBtn.style.opacity = '0.45';
      confirmBtn.style.pointerEvents = 'none';
      confirmBtn.style.cursor = 'not-allowed';
    }
  }

  function init() {
    // Dengarkan perubahan radio di semua panel
    document.querySelectorAll('.ocr-exec-panel input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const panel = radio.closest('.ocr-exec-panel');
        if (panel) check(panel.id);
      });
    });

    // Dengarkan perubahan radio di modal assign
    document.querySelectorAll('.ocr-modal-overlay .ocr-kurir-list input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const modal = radio.closest('.ocr-modal-overlay');
        if (!modal) return;
        const textarea = modal.querySelector('.ocr-form-textarea');
        const confirmBtn = modal.querySelector('.ocr-modal-footer .btn-primary');
        if (!confirmBtn) return;

        const kuriChosen = !!modal.querySelector('.ocr-kurir-list input[type="radio"]:checked');
        const alasanFilled = textarea ? textarea.value.trim().length > 0 : true;
        _setModalConfirm(confirmBtn, kuriChosen && alasanFilled);
      });
    });

    document.querySelectorAll('.ocr-modal-overlay .ocr-form-textarea').forEach((textarea) => {
      textarea.addEventListener('input', () => {
        const modal = textarea.closest('.ocr-modal-overlay');
        if (!modal) return;
        const radio = modal.querySelector('.ocr-kurir-list input[type="radio"]:checked');
        const confirmBtn = modal.querySelector('.ocr-modal-footer .btn-primary');
        if (!confirmBtn) return;

        const kuriChosen = !!radio;
        const alasanFilled = textarea.value.trim().length > 0;
        _setModalConfirm(confirmBtn, kuriChosen && alasanFilled);
      });
    });

    // Set initial state: disable tombol konfirmasi modal yang belum diisi
    document.querySelectorAll('.ocr-modal-overlay').forEach((modal) => {
      const confirmBtn = modal.querySelector('.ocr-modal-footer .btn-primary[href^="#modal-sukses"]');
      if (confirmBtn) _setModalConfirm(confirmBtn, false);
    });
  }

  function _setModalConfirm(btn, valid) {
    if (valid) {
      btn.removeAttribute('aria-disabled');
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.setAttribute('aria-disabled', 'true');
      btn.style.opacity = '0.45';
      btn.style.pointerEvents = 'none';
    }
  }

  return { init, check };
})();

const SuccessManager = (() => {
  function _getWIBTime() {
    // Dapatkan waktu lokal diformat HH:MM:SS WIB
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  }

  function _fillSuccess(successModalId, selectedCourierName, resi) {
    const modal = document.getElementById(successModalId);
    if (!modal) return;

    // Update nama kurir baru di teks subtitle
    const subtitle = modal.querySelector('.ocr-success-subtitle');
    if (subtitle) {
      subtitle.querySelectorAll('strong').forEach((el, i) => {
        // strong pertama = resi, kedua = nama kurir
        if (i === 1) el.textContent = selectedCourierName;
      });
    }

    // Update kurir baru di detail grid
    const detailItems = modal.querySelectorAll('.ocr-success-detail-item');
    detailItems.forEach((item) => {
      const label = item.querySelector('.ocr-success-detail-label');
      const val = item.querySelector('.ocr-success-detail-val');
      if (!label || !val) return;
      if (label.textContent.trim() === 'Kurir Baru') {
        val.textContent = selectedCourierName;
      }
      if (label.textContent.trim() === 'Waktu Eksekusi') {
        val.textContent = _getWIBTime();
      }
    });
  }

  function _resolveConfirmBtn(el) {
    // Bisa dipanggil dari panel exec atau modal assign
    const panel = el.closest('.ocr-exec-panel');
    const modal = el.closest('.ocr-modal-overlay');

    if (panel) {
      // Cari resi dari panel id: panel-012 → 012
      const suffix = panel.id.replace('panel-', '');
      const radioName = 'exec-kurir-' + suffix;
      const checked = panel.querySelector(`input[name="${radioName}"]:checked`);
      const courierName = checked
        ? (COURIER_MAP[radioName]?.[checked.value] ?? checked.value)
        : '—';
      const successId = 'modal-sukses-' + suffix;
      _fillSuccess(successId, courierName, suffix);

      // Tambah ke audit log
      const incident = INCIDENTS.find((i) => i.panelId === panel.id);
      if (incident) {
        AuditManager.addEntry({
          resi: incident.resi,
          label: incident.label,
          kurirAsal: incident.kurir,
          kurirBaru: courierName,
        });
      }

      ModalManager.open(successId);
      PanelManager.closePanel(panel.id);
      return;
    }

    if (modal) {
      // Modal assign — suffix dari id: modal-assign-012 → 012
      const suffix = modal.id.replace('modal-assign-', '');
      const radioName = 'kurir-' + suffix;
      const checked = modal.querySelector(`input[name="${radioName}"]:checked`);
      const courierName = checked
        ? (COURIER_MAP[radioName]?.[checked.value] ?? checked.value)
        : '—';
      const successId = 'modal-sukses-' + suffix;
      _fillSuccess(successId, courierName, suffix);

      const incident = INCIDENTS.find((i) => i.resi.endsWith(suffix));
      if (incident) {
        const alasanEl = modal.querySelector('.ocr-form-textarea');
        AuditManager.addEntry({
          resi: incident.resi,
          label: incident.label,
          kurirAsal: incident.kurir,
          kurirBaru: courierName,
          alasan: alasanEl ? alasanEl.value.trim() : '',
        });
      }

      ModalManager.close(modal.id);
      ModalManager.open(successId);
    }
  }

  function init() {
    // Tangkap semua tombol konfirmasi
    document.querySelectorAll('.ocr-exec-confirm-btn, .ocr-modal-footer .btn-primary[href^="#modal-sukses"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.getAttribute('aria-disabled') === 'true') return;
        _resolveConfirmBtn(btn);
      });
    });
  }

  return { init };
})();

const AuditManager = (() => {
  function addEntry({ resi, label, kurirAsal, kurirBaru, alasan = '' }) {
    const list = document.querySelector('.ocr-audit-list');
    if (!list) return;

    const time = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });

    const alasanText = alasan ? ` Alasan: ${alasan.substring(0, 60)}${alasan.length > 60 ? '…' : ''}.` : '';

    const li = document.createElement('li');
    li.className = 'ocr-audit-item ocr-audit-item--new';
    li.innerHTML = `
      <div class="ocr-audit-timeline" aria-hidden="true">
        <span class="ocr-audit-dot ocr-audit-dot-berhasil"></span>
        <span class="ocr-audit-line"></span>
      </div>
      <div class="ocr-audit-content">
        <div class="ocr-audit-header">
          <span class="ocr-audit-action">Pengalihan Berhasil</span>
          <time class="ocr-audit-time">${time} WIB</time>
        </div>
        <p class="ocr-audit-meta">
          Resi <strong class="ocr-audit-resi">#${resi}</strong>
          (${label}) dari <strong>${kurirAsal}</strong> → <strong>${kurirBaru}</strong>.${alasanText}
          Admin: <strong>Reza Bramantyo</strong>.
          <span class="ocr-audit-dur">1.2 dtk</span>
        </p>
      </div>`;

    // Tambahkan di awal list supaya terbaru di atas
    list.insertBefore(li, list.firstChild);

    // Update counter di footer audit modal
    const footer = document.querySelector('#modal-audit-log .ocr-modal-footer span');
    if (footer) {
      const match = footer.textContent.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1], 10) + 1;
        footer.textContent = `${count} pengalihan berhasil pada siklus ini`;
      }
    }

    // Animasi masuk
    requestAnimationFrame(() => li.classList.add('ocr-audit-item--visible'));
  }

  return { addEntry };
})();

const FilterManager = (() => {
  let _activeFilter = 'semua';

  function _applyFilter(filter) {
    _activeFilter = filter;
    const rows = document.querySelectorAll('.ocr-incident-list .ocr-incident-row');

    rows.forEach((row) => {
      const tag = row.querySelector('.ocr-resi-tag');
      if (!tag) return;
      const layanan = tag.textContent.trim().toLowerCase();

      if (filter === 'semua') {
        row.hidden = false;
      } else {
        row.hidden = !layanan.includes(filter);
      }
    });

    // Tutup panel eksekusi jika baris-nya tersembunyi
    const activePanel = document.querySelector('.ocr-exec-panel[style*="flex"]');
    if (activePanel) {
      const suffix = activePanel.id.replace('panel-', '');
      const row = document.querySelector('.ocr-row-' + suffix);
      if (row && row.hidden) PanelManager.closePanel(activePanel.id);
    }
  }

  function init() {
    const pills = document.querySelectorAll('.ocr-filter-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active state
        pills.forEach((p) => {
          p.classList.remove('ocr-filter-pill-active');
          p.removeAttribute('aria-current');
        });
        pill.classList.add('ocr-filter-pill-active');
        pill.setAttribute('aria-current', 'true');

        // Ekstrak kata kunci filter dari teks pill
        const text = pill.textContent.trim().toLowerCase();
        let filter = 'semua';
        if (text.includes('cargo')) filter = 'cargo';
        else if (text.includes('pharma')) filter = 'pharma';
        else if (text.includes('frozen')) filter = 'frozen';
        else if (text.includes('instant')) filter = 'instant';
        else if (text.includes('same day')) filter = 'same day';
        else if (text.includes('next day')) filter = 'next day';
        else if (text.includes('regular')) filter = 'regular';
        else if (text.includes('dokumen')) filter = 'dokumen';

        _applyFilter(filter);
      });
    });
  }

  return { init };
})();

const SearchManager = (() => {
  function _normalize(str) {
    return str.toLowerCase().trim();
  }

  function _getRowText(row) {
    return _normalize(row.textContent);
  }

  function init() {
    const input = document.querySelector('.ocr-search-input');
    if (!input) return;

    let _debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => {
        const query = _normalize(input.value);
        const rows = document.querySelectorAll('.ocr-incident-list .ocr-incident-row');

        rows.forEach((row) => {
          if (!query) {
            row.hidden = false;
            return;
          }
          const text = _getRowText(row);
          row.hidden = !text.includes(query);
        });

        // Tutup panel jika baris-nya hilang dari pencarian
        const activePanel = document.querySelector('.ocr-exec-panel[style*="flex"]');
        if (activePanel) {
          const suffix = activePanel.id.replace('panel-', '');
          const row = document.querySelector('.ocr-row-' + suffix);
          if (row && row.hidden) PanelManager.closePanel(activePanel.id);
        }
      }, 200);
    });

    // Bersihkan saat search dikosongkan (klik ×)
    input.addEventListener('search', () => {
      if (!input.value) {
        document.querySelectorAll('.ocr-incident-list .ocr-incident-row').forEach((r) => {
          r.hidden = false;
        });
      }
    });
  }

  return { init };
})();

const ClockManager = (() => {
  let _seconds = 3;
  let _interval;

  function _update() {
    const el = document.querySelector('.ocr-sync-indicator');
    if (!el) return;

    const textNode = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (textNode) {
      if (_seconds === 0) {
        textNode.textContent = ' Sinkronisasi Hub (baru saja)';
        _seconds = 30;
      } else {
        textNode.textContent = ` Sinkronisasi Hub (${_seconds} dtk lalu)`;
        _seconds--;
      }
    }
  }

  function init() {
    if (!document.querySelector('.ocr-sync-indicator')) return;
    _interval = setInterval(_update, 1000);
  }

  return { init };
})();

function _injectModalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .ocr-modal-overlay.ocr-modal--open {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }
    .ocr-modal-overlay.ocr-modal--open .ocr-modal-card {
      transform: translateY(0) scale(1) !important;
    }
    .ocr-exec-panel[style*="display: flex"] {
      display: flex !important;
    }
    .ocr-workspace[data-active-panel="panel-012"],
    .ocr-workspace[data-active-panel="panel-015"] {
      grid-template-columns: 1fr 380px;
    }
    .ocr-incident-row.ocr-row--active {
      background-color: #FFF5FB;
      border-left: 3px solid var(--color-primary);
      padding-left: calc(var(--space-xl) - 3px);
    }
    @keyframes ocr-audit-fadein {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ocr-audit-item--new {
      opacity: 0;
    }
    .ocr-audit-item--visible {
      animation: ocr-audit-fadein 0.3s ease-out forwards;
    }
    @media (max-width: 1199px) {
      .ocr-workspace[data-active-panel="panel-012"],
      .ocr-workspace[data-active-panel="panel-015"] {
        grid-template-columns: 1fr 340px;
      }
    }
    @media (max-width: 900px) {
      .ocr-workspace[data-active-panel="panel-012"],
      .ocr-workspace[data-active-panel="panel-015"] {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

function init() {
  _injectModalStyles();

  document.querySelectorAll('.ocr-exec-panel').forEach((p) => {
    p.style.display = 'none';
  });
  document.querySelectorAll('.ocr-modal-overlay').forEach((m) => {
    m.setAttribute('aria-hidden', 'true');
  });

  PanelManager.init();
  ModalManager.init();
  ValidationManager.init();
  SuccessManager.init();
  FilterManager.init();
  SearchManager.init();
  ClockManager.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
