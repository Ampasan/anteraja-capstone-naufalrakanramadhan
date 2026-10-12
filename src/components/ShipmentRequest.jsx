import { useEffect, useState } from 'react';

const API_URL = '/api/shipments';

const EMPTY_FORM = { trackingNumber: '', weight: '', distance: '' };

/**
 * ShipmentRequest — halaman form permintaan shipment.
 * Submit dikirim ke /api/shipments; server menilai SUCCESS atau VALIDATION_ERROR
 * dan menyimpan riwayat yang ditampilkan ulang di panel kanan.
 */
export default function ShipmentRequest() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [history, setHistory] = useState([]);
  const [historyState, setHistoryState] = useState('loading');

  // Memakai rantai .then() alih-alih async/await supaya setState hanya
  // dieksekusi di dalam callback promise, bukan sinkron di body effect.
  function loadHistory() {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setHistory(data.history);
        setHistoryState('ready');
      })
      .catch(() => setHistoryState('error'));
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function handleRetry() {
    setHistoryState('loading');
    loadHistory();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setFieldErrors({});

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.status === 'SUCCESS') {
        setForm(EMPTY_FORM);
        // POST sudah diterima server, jadi shipment pasti ada di riwayat.
        // Dimasukkan langsung (bukan fetch ulang) agar banner dan riwayat
        // tampil pada render yang sama, tanpa jeda "Memuat riwayat...".
        setHistory((prev) => [data.shipment, ...prev]);
        setResult({ status: 'SUCCESS', shipment: data.shipment });
      } else {
        setResult({ status: 'VALIDATION_ERROR' });
        const errors = {};
        for (const item of data.errors ?? []) errors[item.field] = item.message;
        setFieldErrors(errors);
      }
    } catch {
      setResult({ status: 'REQUEST_FAILED' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shipment-grid">
      {/* ── Form ── */}
      <section
        aria-label="Form permintaan shipment"
        style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)',
          alignSelf: 'start',
        }}
      >
        <h1
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#0F172A',
            letterSpacing: '-0.01em',
            margin: '0 0 0.25rem',
          }}
        >
          Shipment Request
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#64748B',
            margin: '0 0 1.125rem',
            lineHeight: '1.5',
          }}
        >
          Isi tracking number, bobot, dan jarak pengiriman, lalu kirim permintaan.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <Field
            id="tracking-number"
            name="trackingNumber"
            label="Tracking Number"
            placeholder="ANT-001"
            value={form.trackingNumber}
            onChange={handleChange}
            error={fieldErrors.trackingNumber}
            disabled={submitting}
          />
          <div className="shipment-field-row">
            <Field
              id="weight"
              name="weight"
              label="Weight (kg)"
              placeholder="5"
              value={form.weight}
              onChange={handleChange}
              error={fieldErrors.weight}
              disabled={submitting}
              inputMode="decimal"
            />
            <Field
              id="distance"
              name="distance"
              label="Distance (km)"
              placeholder="25"
              value={form.distance}
              onChange={handleChange}
              error={fieldErrors.distance}
              disabled={submitting}
              inputMode="decimal"
            />
          </div>

          <button
            type="submit"
            className="shipment-submit"
            disabled={submitting}
            style={{ marginTop: '0.375rem' }}
          >
            {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>

          {result && (
            <div
              id="result-status"
              role="status"
              data-status={result.status}
              className={`shipment-result shipment-result--${result.status === 'SUCCESS' ? 'ok' : 'error'}`}
            >
              <span className="shipment-result-label">{result.status}</span>
              <span className="shipment-result-detail">
                {result.status === 'SUCCESS'
                  ? `Shipment ${result.shipment.trackingNumber} diterima dan masuk Request History.`
                  : result.status === 'VALIDATION_ERROR'
                    ? 'Permintaan ditolak. Periksa kembali isian yang ditandai merah.'
                    : 'Permintaan gagal terkirim. Periksa koneksi lalu coba lagi.'}
              </span>
            </div>
          )}
        </form>
      </section>

      {/* ── Request History ── */}
      <section
        aria-label="Request History"
        style={{
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 1px 2px 0 rgba(15,23,42,0.04)',
          alignSelf: 'start',
        }}
      >
        <h2
          style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#64748B',
            margin: '0 0 0.75rem',
          }}
        >
          Request History
        </h2>

        {historyState === 'loading' && (
          <p role="status" style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Memuat riwayat permintaan...
          </p>
        )}

        {historyState === 'error' && (
          <div role="alert" style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>
            <p style={{ margin: '0 0 0.5rem' }}>Riwayat gagal dimuat. Periksa koneksi server lalu muat ulang halaman.</p>
            <button type="button" className="shipment-retry" onClick={handleRetry}>
              Muat ulang riwayat
            </button>
          </div>
        )}

        {historyState === 'ready' && history.length === 0 && (
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Belum ada permintaan. Kirim form untuk menambah riwayat.
          </p>
        )}

        {historyState === 'ready' && history.length > 0 && (
          <ul id="request-history" className="shipment-history">
            {history.map((item) => (
              <li key={item.requestedAt} className="shipment-history-item" data-tracking={item.trackingNumber}>
                <div className="shipment-history-top">
                  <span className="shipment-history-tracking">{item.trackingNumber}</span>
                  <span className="shipment-history-badge">SUCCESS</span>
                </div>
                <span className="shipment-history-meta">
                  {item.weight} kg · {item.distance} km
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ id, name, label, error, ...inputProps }) {
  return (
    <div className="shipment-field">
      <label htmlFor={id} className="shipment-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        className={`shipment-input${error ? ' shipment-input--invalid' : ''}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="shipment-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
