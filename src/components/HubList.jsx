import { formatDwell, formatNumber } from '../utils/format';

/**
 * HubList — daftar hub yang bisa dicari dan difilter.
 * Filter state dikelola di App.jsx — tidak ada filter lokal di sini.
 */
export default function HubList({
  hubs,
  priorityOnly,
  onPriorityToggle,
  selectedId,
  onSelect,
}) {
  return (
    <section
      aria-label="Daftar Hub"
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)',
      }}
    >
      {/* Header daftar */}
      <div
        style={{
          padding: '0.75rem 1rem 0.625rem',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>
            Daftar Hub
          </span>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            ({hubs.length} terpantau)
          </span>
        </div>

        {/* Tombol filter prioritas */}
        <button
          onClick={onPriorityToggle}
          aria-pressed={priorityOnly}
          style={{
            fontSize: '11px',
            fontWeight: '600',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            border: priorityOnly ? 'none' : '1px solid #E2E8F0',
            background: priorityOnly ? '#E3008C' : '#ffffff',
            color: priorityOnly ? '#ffffff' : '#64748B',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {priorityOnly ? 'Tampilkan semua' : 'Prioritas saja'}
        </button>
      </div>

      {/* Daftar kosong */}
      {hubs.length === 0 ? (
        <div
          role="status"
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            fontSize: '13px',
            color: '#94A3B8',
            lineHeight: '1.5',
          }}
        >
          {priorityOnly
            ? 'Tidak ada hub prioritas yang cocok.'
            : 'Tidak ada hub yang sesuai pencarian.'}
          <br />
          <span style={{ fontSize: '12px' }}>Coba ubah kata kunci atau filter.</span>
        </div>
      ) : (
        <ul
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
          role="listbox"
          aria-label="Pilih hub untuk melihat detail"
        >
          {hubs.map((hub, idx) => {
            const dipilih = selectedId === hub.hub_id;
            return (
              <li
                key={hub.hub_id}
                role="option"
                aria-selected={dipilih}
                style={{
                  borderBottom:
                    idx < hubs.length - 1 ? '1px solid #F1F5F9' : 'none',
                }}
              >
                <button
                  onClick={() => onSelect(dipilih ? null : hub.hub_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    background: dipilih ? '#FDF2F8' : 'transparent',
                    border: 'none',
                    padding: '0.625rem 1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.1s',
                    /* Garis merah kiri untuk hub prioritas */
                    boxShadow: hub.priority ? 'inset 3px 0 0 #E3008C' : undefined,
                  }}
                  aria-label={`${hub.name}, dwell ${formatDwell(hub.mean_dwell)}${hub.priority ? ', prioritas investigasi' : ''}`}
                >
                  {/* Nama + jumlah kunjungan */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {hub.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                      {formatNumber(hub.completed_visits)} kunjungan selesai
                    </div>
                  </div>

                  {/* Dwell + label prioritas */}
                  <div
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: hub.priority ? '#E3008C' : '#0F172A',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatDwell(hub.mean_dwell)}
                    </span>
                    {hub.priority && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '700',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: '#E3008C',
                        }}
                        aria-label="prioritas investigasi"
                      >
                        PRIORITAS
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
