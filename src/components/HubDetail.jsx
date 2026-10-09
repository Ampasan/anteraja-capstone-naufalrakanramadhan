import { formatDwell, formatNumber } from '../utils/format';

/**
 * HubDetail — panel detail hub yang dipilih.
 * Menampilkan semua metrik: dwell rata-rata, min, max, kunjungan, status prioritas.
 */
export default function HubDetail({ hub, onClose }) {
  if (!hub) return null;

  return (
    <div
      role="region"
      aria-label={`Detail ${hub.name}`}
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: '0 4px 6px -1px rgba(15,23,42,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '0.875rem',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', lineHeight: '1.3' }}>
            {hub.name}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            {hub.hub_id}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {hub.priority && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: '#FDF2F8',
                color: '#E3008C',
                border: '1px solid #FCE7F3',
                borderRadius: '9999px',
                padding: '2px 8px',
              }}
            >
              Prioritas
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Tutup detail hub"
            style={{
              background: '#F8F9FA',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              width: '26px',
              height: '26px',
              cursor: 'pointer',
              color: '#64748B',
              fontSize: '14px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'background 0.1s',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Grid metrik */}
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          margin: 0,
        }}
      >
        <MetrikItem label="Rata-rata Dwell" value={formatDwell(hub.mean_dwell)} accent={hub.priority} />
        <MetrikItem label="Kunjungan Selesai" value={formatNumber(hub.completed_visits)} />
        <MetrikItem label="Dwell Minimum" value={formatDwell(hub.min_dwell)} />
        <MetrikItem label="Dwell Maksimum" value={formatDwell(hub.max_dwell)} />
      </dl>

      {/* Status operasional */}
      <div
        style={{
          marginTop: '0.875rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '10px',
          background: hub.priority ? '#FDF2F8' : '#F0FDF4',
          border: `1px solid ${hub.priority ? '#FCE7F3' : '#D1FAE5'}`,
          fontSize: '12px',
          color: hub.priority ? '#E3008C' : '#059669',
          fontWeight: '500',
          lineHeight: '1.4',
        }}
        role="status"
      >
        {hub.priority
          ? 'Investigasi prioritas — dwell time melebihi ambang 6 jam.'
          : 'Beroperasi normal — dwell time dalam batas aman.'}
      </div>
    </div>
  );
}

function MetrikItem({ label, value, accent = false }) {
  return (
    <div
      style={{
        background: '#F8F9FA',
        borderRadius: '8px',
        padding: '0.5rem 0.75rem',
      }}
    >
      <dt
        style={{
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#94A3B8',
          marginBottom: '2px',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: '800',
          color: accent ? '#E3008C' : '#0F172A',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </dd>
    </div>
  );
}
