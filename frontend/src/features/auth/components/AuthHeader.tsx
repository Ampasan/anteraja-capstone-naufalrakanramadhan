/** Berkas yang sama dengan favicon di index.html — sekali unduh, bukan dua. */
const anterajaLogo = '/anteraja_logo.png';

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center text-center gap-3 pb-6 border-b border-[#E2E8F0]">
      {/* Logo Anteraja — dibiarkan persegi sesuai aslinya, tidak dibulatkan */}
      <img
        src={anterajaLogo}
        alt="Logo Anteraja"
        className="h-12 w-auto max-w-[180px] object-contain drop-shadow-[0_3px_8px_rgba(153,0,76,0.18)]"
      />

      {/* Nama brand */}
      <p className="text-sm font-bold tracking-widest text-[#99004C] uppercase">
        Anteraja
      </p>

      {/* Judul panel */}
      <h1 className="text-[21px] font-bold text-[#0F172A] leading-tight -mt-1">
        Dispatch Ops Control Tower
      </h1>

      {/* Subtitle */}
      <p className="text-[13px] text-[#64748B] leading-snug max-w-[300px]">
        Masuk ke sistem pemantauan dan operasional kurir{' '}
        <span className="font-semibold text-[#99004C]">SATRIA</span>
      </p>
    </div>
  );
}
