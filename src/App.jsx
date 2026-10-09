import { useState, useMemo } from 'react';
import { useHubData } from './hooks/useHubData';
import { formatDwell, formatNumber } from './utils/format';
import KpiCard from './components/KpiCard';
import Top3Hubs from './components/Top3Hubs';
import HubList from './components/HubList';
import HubMap from './components/HubMap';
import HubDetail from './components/HubDetail';
import AiInsight from './components/AiInsight';
import './App.css';

export default function App() {
  const { hubs, top3Hubs, kpis, aiSummary, loading, error } = useHubData();

  // Satu state filter bersama — dipakai oleh peta DAN daftar hub
  const [search, setSearch] = useState('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const filteredHubs = useMemo(() => {
    return hubs.filter((hub) => {
      const cocokPrioritas = !priorityOnly || hub.priority;
      const q = search.trim().toLowerCase();
      const cocokCari =
        !q ||
        hub.name.toLowerCase().includes(q) ||
        hub.hub_id.toLowerCase().includes(q);
      return cocokPrioritas && cocokCari;
    });
  }, [hubs, search, priorityOnly]);

  const selectedHub = hubs.find((h) => h.hub_id === selectedId) ?? null;

  function handleSelect(id) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handlePriorityToggle() {
    setPriorityOnly((v) => !v);
    setSelectedId(null);
  }

  // ── Memuat ──
  if (loading) {
    return (
      <div className="state-screen" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span className="state-text">Memuat data hub...</span>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="state-screen" role="alert">
        <div className="state-icon state-icon--error" aria-hidden="true">!</div>
        <span className="state-title">Gagal memuat data</span>
        <span className="state-text">
          {error} Pastikan file tersedia di{' '}
          <code>public/data/</code>.
        </span>
      </div>
    );
  }

  // ── Data kosong ──
  if (hubs.length === 0) {
    return (
      <div className="state-screen" role="status">
        <div className="state-icon" aria-hidden="true">—</div>
        <span className="state-title">Belum ada data hub</span>
        <span className="state-text">
          Periksa file metrics.json dan locations.json.
        </span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="topbar" role="banner">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <img
              src="/anteraja_logo.png"
              alt="Anteraja"
              height="26"
              className="brand-logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'inline';
              }}
            />
            <span className="brand-fallback" aria-hidden="true">Anteraja</span>
            <div className="topbar-divider" aria-hidden="true" />
            <span className="topbar-title">Hub Dwell Monitor</span>
          </div>
        </div>
      </header>

      <main className="main-content" id="main">
        {/* ── KPI ── */}
        <section aria-label="Ringkasan global" className="kpi-row">
          <KpiCard label="Total Hub" value={formatNumber(kpis.totalHubs)} />
          <KpiCard
            label="Total Kunjungan"
            value={formatNumber(kpis.completedVisits)}
          />
          <KpiCard
            label="Rata-rata Dwell Global"
            value={formatDwell(kpis.globalMeanDwell)}
          />
          <KpiCard
            label="Hub Prioritas"
            value={formatNumber(kpis.priorityHubCount)}
            accent
          />
        </section>

        {/* ── Layout dua kolom ── */}
        <div className="body-grid">

          {/* ── Kolom peta (kiri) ── */}
          <div className="map-column">
            <div className="map-header">
              <div className="map-header-left">
                <h2>Peta Hub Anteraja</h2>
                <p>Lokasi hub dan status dwell time</p>
              </div>
              <div className="map-header-chips">
                <button
                  className={`map-chip ${!priorityOnly ? 'active' : 'inactive'}`}
                  onClick={() => priorityOnly && handlePriorityToggle()}
                  aria-pressed={!priorityOnly}
                >
                  Semua ({hubs.length})
                </button>
                <button
                  className={`map-chip ${priorityOnly ? 'active' : 'inactive'}`}
                  onClick={() => !priorityOnly && handlePriorityToggle()}
                  aria-pressed={priorityOnly}
                >
                  Prioritas ({kpis.priorityHubCount})
                </button>
              </div>
            </div>

            <div className="map-wrap">
              <HubMap
                hubs={filteredHubs}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>

            <div className="map-legend" aria-label="Keterangan warna marker">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#E3008C' }} aria-hidden="true" />
                Prioritas (&gt;6j)
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#10B981' }} aria-hidden="true" />
                Normal
              </div>
            </div>
          </div>

          {/* ── Panel kanan ── */}
          <aside className="right-panel" aria-label="Panel pemantauan hub">

            {/* Pencarian */}
            <div className="search-bar">
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12zM14 14l-2.5-2.5"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <label htmlFor="hub-search" className="sr-only">Cari nama hub atau lokasi</label>
              <input
                id="hub-search"
                type="search"
                placeholder="Cari nama hub atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="search-clear"
                  aria-label="Hapus pencarian"
                >
                  ×
                </button>
              )}
            </div>

            {/* Top 3 */}
            <Top3Hubs
              hubs={top3Hubs}
              selectedId={selectedId}
              onSelect={handleSelect}
            />

            {/* Daftar hub */}
            <HubList
              hubs={filteredHubs}
              priorityOnly={priorityOnly}
              onPriorityToggle={handlePriorityToggle}
              selectedId={selectedId}
              onSelect={handleSelect}
            />

            {/* Detail hub (desktop — di dalam panel kanan) */}
            {selectedHub && (
              <div className="detail-desktop">
                <HubDetail hub={selectedHub} onClose={() => setSelectedId(null)} />
              </div>
            )}

            {/* Ringkasan AI */}
            <AiInsight summary={aiSummary} />
          </aside>
        </div>

        {/* Detail hub (mobile — di bawah peta) */}
        {selectedHub && (
          <div className="detail-mobile">
            <HubDetail hub={selectedHub} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </main>

      <footer className="app-footer" role="contentinfo">
        <span>Anteraja Hub Dwell Monitor</span>
        <span aria-hidden="true">·</span>
        <span>Data operasional internal</span>
      </footer>
    </div>
  );
}
