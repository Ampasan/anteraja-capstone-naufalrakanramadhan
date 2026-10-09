import { formatDwell } from '../utils/format';

const LABEL_PERINGKAT = ['Peringkat 1', 'Peringkat 2', 'Peringkat 3'];

/**
 * Top3Hubs — tiga hub dengan dwell time rata-rata tertinggi.
 * Diurutkan berdasarkan nilai numerik mentah (bukan string terformat).
 * Layout: 3 kartu sejajar horizontal.
 */
export default function Top3Hubs({ hubs, onSelect, selectedId }) {
  return (
    <section
      aria-label="Top 3 Dwell Bottleneck"
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '0.875rem 1rem',
        boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <h2
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#0F172A',
            margin: 0,
          }}
        >
          Top 3 Dwell Tertinggi
        </h2>
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
          aria-label="Perlu tindakan segera"
        >
          Perlu Tindakan
        </span>
      </div>

      {/* 3 kartu sejajar — scroll horizontal di layar sempit */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {hubs.map((hub, idx) => {
          const dipilih = selectedId === hub.hub_id;
          return (
            <button
              key={hub.hub_id}
              onClick={() => onSelect(hub.hub_id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                background: dipilih ? '#FDF2F8' : '#F8F9FA',
                border: dipilih
                  ? '1px solid rgba(227,0,140,0.45)'
                  : '1px solid #F1F5F9',
                borderRadius: '10px',
                padding: '0.625rem 0.75rem 0.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                minWidth: 0,
                fontFamily: 'inherit',
                transition: 'border-color 0.12s, background 0.12s',
              }}
              aria-pressed={dipilih}
              aria-label={`${hub.name}, dwell rata-rata ${formatDwell(hub.mean_dwell)}, ${LABEL_PERINGKAT[idx]}`}
            >
              {/* Nama hub */}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {hub.name}
              </span>

              {/* Nilai dwell */}
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#E3008C',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.1',
                  fontVariantNumeric: 'tabular-nums',
                  display: 'block',
                }}
              >
                {formatDwell(hub.mean_dwell)}
              </span>

              {/* Label peringkat */}
              <span
                style={{
                  fontSize: '10px',
                  color: '#94A3B8',
                  fontWeight: '500',
                }}
              >
                {LABEL_PERINGKAT[idx]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
