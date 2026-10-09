/**
 * AiInsight — menampilkan ringkasan AI sebagai teks biasa.
 * Data ditampilkan sebagai teks, bukan kode yang bisa dieksekusi.
 */
export default function AiInsight({ summary }) {
  if (!summary?.current_summary) return null;

  const { summary: teks, next_checks } = summary.current_summary;

  return (
    <section
      aria-label="Ringkasan AI"
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '0.875rem 1rem',
        boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)',
      }}
    >
      <h2
        style={{
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#94A3B8',
          margin: '0 0 0.5rem',
        }}
      >
        Ringkasan AI
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: '#0F172A',
          lineHeight: '1.6',
          margin: next_checks?.length > 0 ? '0 0 0.625rem' : '0',
        }}
      >
        {teks}
      </p>
      {next_checks?.length > 0 && (
        <>
          <p
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748B',
              margin: '0 0 0.375rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Langkah Selanjutnya
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.125rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            {next_checks.map((item, i) => (
              <li
                key={i}
                style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}
              >
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
