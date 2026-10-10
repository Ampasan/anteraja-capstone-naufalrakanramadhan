/**
 * Halaman laporan insiden lapangan (publik, tanpa login).
 *
 * Kurir melaporkan kendala langsung dari HP. Laporan masuk tabel yang sama
 * dengan insiden panel, jadi otomatis muncul di "Incident & One-Click Task
 * Reassignment". Seluruh panggilan memakai envelope { ok, data, message }.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { api, API_BASE_URL, ApiError } from '../../lib/api';
import { cn } from '../../lib/utils';

// ─── Tipe ────────────────────────────────────────────────────────────────────

interface CourierOption {
  id: string;
  name: string;
  courier_code: string;
  vehicle_type: string;
  license_plate: string;
  hub_name: string;
}

interface ActiveOrder {
  order_number: string;
}

interface CreatedIncident {
  id: string;
  incident_code: string;
  waybill_number: string;
  incident_category: string;
  kendala: string;
  courier: { name: string };
}

type CourierListState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; couriers: CourierOption[] };

// ─── Konstanta ────────────────────────────────────────────────────────────────

const INCIDENT_CATEGORIES = [
  'Cuaca / Hujan',
  'Anomali Suhu',
  'Mogok Kendaraan',
  'Ban Bocor',
  'Alamat tidak ditemukan',
  'Banjir',
  'Macet Total',
] as const;

const WEATHER_OPTIONS = ['Cerah', 'Berawan', 'Gerimis', 'Hujan Deras'] as const;
const TRAFFIC_OPTIONS = ['Lancar', 'Sedang', 'Padat', 'Macet Total'] as const;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const SELECT_CLASS = [
  'w-full h-11 bg-white border border-[#E2E8F0] rounded-lg',
  'text-sm text-[#0F172A] pl-3 pr-9',
  'appearance-none cursor-pointer',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:border-[#C91076]',
  'hover:border-[#CBD5E1]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

// ─── Util ─────────────────────────────────────────────────────────────────────

function fallbackMessage(status: number): string {
  if (status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (status === 422) return 'Periksa kembali isian yang wajib diisi.';
  if (status === 404) return 'Data yang diminta tidak ditemukan.';
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi beberapa saat lagi.';
  return 'Permintaan tidak bisa diproses. Coba lagi.';
}

/** Unggah foto bukti lewat multipart; Content-Type dibiarkan ke browser. */
async function uploadEvidence(incidentId: string, file: File, caption: string): Promise<boolean> {
  const body = new FormData();
  body.append('photo', file);
  if (caption) body.append('caption', caption);

  try {
    const response = await fetch(`${API_BASE_URL}/lapor/incidents/${incidentId}/evidence`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body,
    });
    if (!response.ok) return false;
    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return payload?.ok === true;
  } catch {
    return false;
  }
}

// ─── Sub-komponen ────────────────────────────────────────────────────────────

function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <legend className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]">
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FFF0F6] text-[11px] font-bold text-[#C91076]"
      >
        {index}
      </span>
      {children}
    </legend>
  );
}

function Field({
  label,
  required,
  help,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-[#374151]">
        {label} {required && <span className="text-[#C91076]" aria-hidden="true">*</span>}
      </label>
      {children}
      {help && <p className="text-[12px] text-[#64748B]">{help}</p>}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  children,
  ariaLabel,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex items-center w-full">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        disabled={disabled}
        className={SELECT_CLASS}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      <span className="absolute right-3 text-[#94A3B8] pointer-events-none flex items-center">
        <ChevronDown size={16} />
      </span>
    </div>
  );
}

function SuccessCard({ incident, photoStatus }: { incident: CreatedIncident; photoStatus: boolean | null }) {
  const rows: Array<[string, string]> = [
    ['Kode insiden', incident.incident_code || '-'],
    ['Nomor resi', incident.waybill_number || '-'],
    ['Kategori', incident.incident_category || '-'],
    ['Pelapor', incident.courier?.name ?? '-'],
  ];

  return (
    <div
      tabIndex={-1}
      className="flex flex-col items-center rounded-2xl border border-[#E2E8F0] bg-white px-6 py-10 text-center shadow-[0_4px_6px_-1px_rgba(15,23,42,0.07),0_2px_4px_-2px_rgba(15,23,42,0.05)]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0F6]">
        <CheckCircle2 size={30} className="text-[#C91076]" />
      </span>
      <h2 className="mt-4 text-[20px] font-bold text-[#0F172A]">Laporan terkirim</h2>
      <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#64748B]">
        Insiden {incident.incident_category || 'kendala'} untuk resi {incident.waybill_number || '-'} sudah
        tercatat di pusat insiden hub.
      </p>

      <dl className="mt-6 w-full divide-y divide-[#F1F5F9] rounded-xl border border-[#E2E8F0] text-left">
        {rows.map(([term, value]) => (
          <div key={term} className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-[12px] text-[#64748B]">{term}</dt>
            <dd className="text-[13px] font-semibold text-[#0F172A]">{value}</dd>
          </div>
        ))}
      </dl>

      {photoStatus !== null && (
        <p
          className={cn(
            'mt-4 rounded-lg border px-3 py-2.5 text-[12px]',
            photoStatus
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700',
          )}
        >
          {photoStatus
            ? 'Foto bukti sudah terlampir pada laporan ini.'
            : 'Insiden tersimpan, tetapi foto gagal diunggah. Kirim fotonya ke hub bila diminta.'}
        </p>
      )}
    </div>
  );
}

// ─── Halaman utama ───────────────────────────────────────────────────────────

export function FieldReportPage() {
  const [couriers, setCouriers] = useState<CourierListState>({ kind: 'loading' });
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [courierId, setCourierId] = useState('');
  const [resi, setResi] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState('');
  const [traffic, setTraffic] = useState('');
  const [temperature, setTemperature] = useState('');

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    incident: CreatedIncident;
    photoStatus: boolean | null;
  } | null>(null);

  const bannerRef = useRef<HTMLDivElement>(null);
  const courierSelectRef = useRef<HTMLSelectElement>(null);

  // ── Daftar kurir pelapor ─────────────────────────────────────────────────

  const loadCouriers = async () => {
    setCouriers({ kind: 'loading' });
    try {
      const data = await api<{ couriers: CourierOption[] }>('/lapor/couriers');
      const list = data.couriers ?? [];
      setCouriers(list.length ? { kind: 'ready', couriers: list } : { kind: 'empty' });
    } catch {
      setCouriers({ kind: 'error' });
    }
  };

  useEffect(() => {
    void loadCouriers();
  }, []);

  const courierGroups = useMemo(() => {
    if (couriers.kind !== 'ready') return [];
    const groups = new Map<string, CourierOption[]>();
    for (const c of couriers.couriers) {
      const key = c.hub_name || 'Tanpa hub';
      const arr = groups.get(key) ?? [];
      arr.push(c);
      groups.set(key, arr);
    }
    return [...groups.entries()];
  }, [couriers]);

  // ── Daftar resi milik kurir terpilih ─────────────────────────────────────

  useEffect(() => {
    if (!courierId) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    setOrdersLoading(true);
    api<{ orders: ActiveOrder[] }>(`/lapor/couriers/${encodeURIComponent(courierId)}/orders`)
      .then((data) => {
        if (!cancelled) setOrders(data.orders ?? []);
      })
      .catch(() => {
        // Daftar ini hanya pembantu pengisian; kegagalan memuatnya tidak
        // menghalangi kurir mengetik resi sendiri.
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courierId]);

  // ── Foto bukti ───────────────────────────────────────────────────────────

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handlePhotoChange = (file: File | null) => {
    setBanner(null);
    if (!file) return;

    if (!/^image\//.test(file.type)) {
      setBanner('Berkas itu bukan foto. Pilih berkas JPEG atau PNG.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setBanner('Foto lebih dari 5 MB. Kompres atau foto ulang dengan ukuran lebih kecil.');
      return;
    }
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(photoPreview ?? '');
      return file;
    });
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  // ── Kirim laporan ────────────────────────────────────────────────────────

  const showBanner = (message: string) => {
    setBanner(message);
    bannerRef.current?.scrollIntoView({ block: 'center' });
  };

  const resetForm = () => {
    clearPhoto();
    setCourierId('');
    setResi('');
    setCategory('');
    setTitle('');
    setDescription('');
    setLocation('');
    setWeather('');
    setTraffic('');
    setTemperature('');
    setSubmitted(null);
    setBanner(null);
    setOrders([]);
    courierSelectRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBanner(null);

    if (!courierId) {
      showBanner('Pilih kurir pelapor terlebih dahulu.');
      courierSelectRef.current?.focus();
      return;
    }

    const payload = {
      courier_id: courierId,
      order_number: resi.trim(),
      incident_category: category,
      title: title.trim(),
      description: description.trim() || null,
      location_address: location.trim() || null,
      weather_condition: weather || null,
      traffic_condition: traffic || null,
      temperature_c: temperature === '' ? null : Number(temperature),
    };

    setSubmitting(true);
    try {
      const incident = await api<CreatedIncident>('/lapor/incidents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const photoStatus = photo ? await uploadEvidence(incident.id, photo, incident.kendala ?? '') : null;
      setSubmitted({ incident, photoStatus });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : fallbackMessage(0);
      showBanner(message || 'Laporan gagal dikirim. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Tampilan ─────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <header className="bg-[#0F172A] text-white">
          <div className="mx-auto w-full max-w-[560px] px-4 pt-8 pb-10">
            <p className="text-[13px] font-bold uppercase tracking-widest text-[#F9A8D4]">
              Anteraja <span className="ml-1 font-semibold normal-case tracking-normal text-slate-300">Laporan Lapangan</span>
            </p>
            <h1 className="mt-2 text-[22px] font-bold leading-tight">Laporkan kendala di jalan</h1>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[560px] px-4 py-6">
          <SuccessCard incident={submitted.incident} photoStatus={submitted.photoStatus} />
          <button
            type="button"
            onClick={resetForm}
            className="mt-4 w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC]"
          >
            Kirim laporan lain
          </button>
          <p className="mt-6 text-center text-[12px] text-[#94A3B8]">
            Halaman laporan lapangan. Tidak memerlukan akun panel.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-[#0F172A] text-white">
        <div className="mx-auto w-full max-w-[560px] px-4 pt-8 pb-10">
          <p className="text-[13px] font-bold uppercase tracking-widest text-[#F9A8D4]">
            Anteraja <span className="ml-1 font-semibold normal-case tracking-normal text-slate-300">Laporan Lapangan</span>
          </p>
          <h1 className="mt-2 text-[22px] font-bold leading-tight">Laporkan kendala di jalan</h1>
          <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-slate-300">
            Isi insiden yang kamu temui saat mengantar. Laporan langsung terlihat di pusat insiden hub, dan
            tugas bisa dialihkan ke kurir lain tanpa menunggu chat.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] px-4 py-6">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          className="flex flex-col gap-6 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.02)]"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-[18px] font-bold text-[#0F172A]">Laporan insiden baru</h2>
            <p className="text-[12px] text-[#64748B]">
              Isian bertanda <span className="text-[#C91076]" aria-hidden="true">*</span> wajib diisi.
            </p>
          </div>

          {banner && (
            <div
              ref={bannerRef}
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
              <p className="flex-1 text-[13px] text-red-700">{banner}</p>
              <button
                type="button"
                onClick={() => setBanner(null)}
                aria-label="Tutup pesan galat"
                className="text-red-400 transition-colors hover:text-red-600"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* ── 01 Pelapor & kiriman ─────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <SectionLabel index="01">Pelapor &amp; kiriman</SectionLabel>

            <Field label="Kurir pelapor" required>
              {couriers.kind === 'ready' ? (
                <SelectField
                  value={courierId}
                  onChange={setCourierId}
                  placeholder="Pilih kurir pelapor..."
                  ariaLabel="Pilih kurir pelapor"
                >
                  {courierGroups.map(([hub, list]) => (
                    <optgroup key={hub} label={hub}>
                      {list.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.courier_code} · {c.vehicle_type}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </SelectField>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <SelectField
                    value=""
                    onChange={() => undefined}
                    placeholder={
                      couriers.kind === 'loading'
                        ? 'Memuat daftar kurir...'
                        : couriers.kind === 'error'
                          ? 'Daftar kurir gagal dimuat'
                          : 'Belum ada kurir terdaftar'
                    }
                    ariaLabel="Pilih kurir pelapor"
                    disabled
                  />
                  {couriers.kind === 'loading' && (
                    <p className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                      <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                      Mengambil daftar kurir dari server.
                    </p>
                  )}
                  {couriers.kind === 'error' && (
                    <p className="text-[12px] text-red-600">Periksa koneksi internet, lalu coba lagi.</p>
                  )}
                  {couriers.kind === 'empty' && (
                    <p className="text-[12px] text-[#64748B]">Hubungi admin hub bila nama kamu belum muncul.</p>
                  )}
                  {couriers.kind === 'error' && (
                    <button
                      type="button"
                      onClick={() => void loadCouriers()}
                      className="flex w-fit items-center gap-1.5 text-[12px] font-semibold text-[#C91076] transition-colors hover:text-[#E51A8A]"
                    >
                      <RefreshCw size={13} aria-hidden="true" />
                      Coba lagi
                    </button>
                  )}
                </div>
              )}
            </Field>

            <Field
              label="Nomor resi"
              required
              help={
                ordersLoading
                  ? 'Memuat paket aktif...'
                  : orders.length
                    ? `${orders.length} paket aktif tercatat. Pilih dari daftar atau ketik resi lain.`
                    : 'Ketik nomor resi paket yang sedang kamu bawa.'
              }
              htmlFor="resi"
            >
              <input
                id="resi"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                list="resi-list"
                maxLength={32}
                required
                value={resi}
                onChange={(e) => setResi(e.target.value)}
                placeholder="100024000123"
                className="w-full h-11 bg-white border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:border-[#C91076] disabled:opacity-50"
              />
              <datalist id="resi-list">
                {orders.map((o) => (
                  <option key={o.order_number} value={o.order_number} />
                ))}
              </datalist>
            </Field>
          </fieldset>

          {/* ── 02 Kendala ───────────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <SectionLabel index="02">Kendala</SectionLabel>

            <Field label="Kategori insiden" required>
              <SelectField
                value={category}
                onChange={setCategory}
                placeholder="Pilih kategori..."
                ariaLabel="Pilih kategori insiden"
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectField>
            </Field>

            <Field
              label="Judul singkat"
              required
              help="Satu baris, cukup jelas untuk dibaca admin hub."
              htmlFor="title"
            >
              <input
                id="title"
                type="text"
                maxLength={150}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ban belakang kempis di Jl. Ahmad Yani"
                className="w-full h-11 bg-white border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:border-[#C91076]"
              />
            </Field>

            <Field
              label="Catatan tambahan"
              help="Perkiraan waktu berhenti, kondisi muatan, atau langkah yang sudah diambil."
              htmlFor="description"
            >
              <textarea
                id="description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Perkiraan waktu berhenti, kondisi muatan, atau langkah yang sudah diambil."
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:border-[#C91076] resize-y"
              />
            </Field>
          </fieldset>

          {/* ── 03 Lokasi kejadian ───────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <SectionLabel index="03">Lokasi kejadian</SectionLabel>

            <Field
              label="Alamat atau titik jalan"
              help="Isi kalau tahu persis; kosongkan bila sedang di jalan tol."
              htmlFor="location"
            >
              <div className="relative flex items-center w-full">
                <span className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
                  <MapPin size={16} />
                </span>
                <input
                  id="location"
                  type="text"
                  maxLength={255}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jl. Raya Bogor KM 20, dekat lampu merah"
                  className="w-full h-11 bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:border-[#C91076]"
                />
              </div>
            </Field>
          </fieldset>

          {/* ── 04 Kondisi saat ini ──────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <SectionLabel index="04">Kondisi saat ini</SectionLabel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cuaca">
                <SelectField
                  value={weather}
                  onChange={setWeather}
                  placeholder="Cuaca belum dipilih"
                  ariaLabel="Pilih cuaca"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </SelectField>
              </Field>

              <Field label="Lalu lintas">
                <SelectField
                  value={traffic}
                  onChange={setTraffic}
                  placeholder="Lalu lintas belum dipilih"
                  ariaLabel="Pilih lalu lintas"
                >
                  {TRAFFIC_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </SelectField>
              </Field>
            </div>

            <Field
              label="Suhu muatan (°C)"
              help="Wajib diisi untuk kiriman Frozen atau PHARMA."
              htmlFor="temperature"
            >
              <input
                id="temperature"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={-30}
                max={60}
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="4.5"
                className="w-full h-11 bg-white border border-[#E2E8F0] rounded-lg px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#C91076] focus:border-[#C91076]"
              />
            </Field>
          </fieldset>

          {/* ── 05 Foto bukti ───────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-4">
            <SectionLabel index="05">Foto bukti</SectionLabel>

            <Field label="Foto kendala" help="JPEG atau PNG, maksimal 5 MB. Boleh dilewati." htmlFor="photo">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="photo"
                  className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition-colors hover:bg-[#F8FAFC]"
                >
                  <Camera size={16} className="text-[#C91076]" aria-hidden="true" />
                  Pilih foto
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/*"
                  className="sr-only"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />

                {photo && photoPreview && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                    <img
                      src={photoPreview}
                      alt="Pratinjau foto bukti"
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="truncate text-[12px] font-medium text-[#374151]">{photo.name}</p>
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="w-fit text-[12px] font-semibold text-[#C91076] transition-colors hover:text-[#E51A8A]"
                      >
                        Hapus foto
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Field>
          </fieldset>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C91076] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#E51A8A] active:bg-[#A00060] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {submitting ? 'Mengirim...' : 'Kirim laporan'}
            </button>
            <p className="text-center text-[12px] text-[#94A3B8]">
              Laporan masuk ke pusat insiden hub secara real-time.
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-[12px] text-[#94A3B8]">
          Halaman laporan lapangan. Tidak memerlukan akun panel; laporan hanya terbatas pada insiden yang kamu
          isi sendiri.
        </p>
      </main>
    </div>
  );
}
