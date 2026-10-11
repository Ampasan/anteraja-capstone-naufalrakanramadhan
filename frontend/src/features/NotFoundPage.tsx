import { MapPinned } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#F8FAFC] p-4" aria-labelledby="not-found-title">
      <section className="w-full max-w-lg border border-[#E2E8F0] bg-white p-6 text-center shadow-[0_4px_6px_-1px_rgba(15,23,42,0.07)] sm:p-10">
        <MapPinned aria-hidden="true" className="mx-auto mb-5 text-[#C91076]" size={40} />
        <p className="font-mono text-sm font-bold text-[#C91076]">404 · RUTE TIDAK DITEMUKAN</p>
        <h1 id="not-found-title" className="mt-2 text-2xl font-extrabold text-[#0F172A] sm:text-3xl">Halaman ini tidak tersedia</h1>
        <p className="mt-3 break-all text-sm leading-6 text-[#475569]">Alamat <code className="rounded bg-[#FFF0F6] px-1.5 py-0.5 text-[#9F005C]">{location.pathname}</code> tidak cocok dengan rute aplikasi.</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#C91076] px-5 text-sm font-bold text-white hover:bg-[#9F005C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076] focus-visible:ring-offset-2">Kembali ke aplikasi</Link>
      </section>
    </main>
  );
}
