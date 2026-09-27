import anterajaLogo from '../../../assets/anteraja_logo.png';

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center text-center gap-3 pb-6 border-b border-[#E2E8F0]">
      {/* Logo bulat Anteraja */}
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F0E6EC] shadow-[0_4px_12px_rgba(153,0,76,0.18)] flex items-center justify-center bg-white">
        <img
          src={anterajaLogo}
          alt="Logo Anteraja"
          className="w-full h-full object-contain"
        />
      </div>

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
