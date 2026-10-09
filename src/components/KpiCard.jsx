/**
 * KpiCard — tile ringkasan metrik global.
 * Hanya data nyata, tidak ada angka rekayasa.
 */
export default function KpiCard({ label, value, accent = false }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontWeight: '700',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: '#94A3B8',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '30px',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-0.04em',
          color: accent ? '#E3008C' : '#0F172A',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
