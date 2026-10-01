import { useState } from "react";
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  Camera,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

export interface EvidenceModalData {
  title?: string;
  resi: string;
  serviceType?: string;
  category?: string;
  detail?: string;
  caption?: string;
  imageUrl: string;
  publicId?: string;
  timestamp?: string;
  fromCourier?: string;
  fromCourierCode?: string;
  toCourier?: string;
  toCourierCode?: string;
  location?: string;
}

interface EvidencePhotoModalProps {
  open: boolean;
  data: EvidenceModalData | null;
  onClose: () => void;
}

/** Inner component — keyed by imageUrl so React remounts it (resetting state)
 *  each time a different image is opened. No useEffect needed. */
function EvidenceImageViewer({
  imageUrl,
  resi,
  publicId,
  onDownload,
}: {
  imageUrl: string;
  resi: string;
  publicId?: string;
  onDownload: () => void;
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="flex-[1.2] flex flex-col gap-2.5">
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden border border-[#CBD5E1] bg-slate-950 flex items-center justify-center min-h-[260px] sm:min-h-[340px] max-h-[460px] shadow-inner",
          isZoomed ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        onClick={() => setIsZoomed((z) => !z)}
        title={isZoomed ? "Klik untuk perkecil foto" : "Klik untuk perbesar foto"}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <div className="w-8 h-8 border-3 border-[#C91076] border-t-transparent rounded-full animate-spin" />
            <span className="text-[12px] font-medium">
              Memuat foto bukti Cloudinary...
            </span>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`Bukti Insiden Resi ${resi}`}
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "w-full h-full transition-all duration-300 select-none",
            isZoomed ? "object-contain scale-125" : "object-contain",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Floating zoom control badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-white/20">
          {isZoomed ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isZoomed ? "Perkecil" : "Perbesar"}</span>
        </div>
      </div>

      {/* Action Buttons under image */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-mono text-[#64748B] truncate max-w-[240px]">
          ID: {publicId ?? "foto_bukti"}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F1F5F9] text-[12px] font-semibold transition-colors"
          >
            <Download size={13} />
            Unduh
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C91076] text-white hover:bg-[#A80060] text-[12px] font-semibold transition-colors shadow-sm"
          >
            <ExternalLink size={13} />
            Buka Resolusi Penuh
          </a>
        </div>
      </div>
    </div>
  );
}

export function EvidencePhotoModal({
  open,
  data,
  onClose,
}: EvidencePhotoModalProps) {
  const [copied, setCopied] = useState(false);

  if (!data?.imageUrl) return null;

  const handleCopyResi = () => {
    navigator.clipboard.writeText(data.resi).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(data.imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bukti-${data.resi}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(data.imageUrl, "_blank");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0F172A]/75 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Window */}
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100vw-1.5rem)] sm:w-[94vw] md:w-[86vw] max-w-4xl max-h-[92vh]",
            "bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)]",
            "flex flex-col overflow-hidden border border-[#E2E8F0] focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E2E8F0] bg-[#FFF8FB]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center flex-shrink-0 text-[#C91076]">
                <Camera size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[16px] sm:text-[18px] font-extrabold text-[#0F172A] leading-tight">
                    Foto Bukti Lapangan
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                    <ShieldCheck size={12} />
                    Terverifikasi
                  </span>
                </div>
                <p className="text-[12px] text-[#64748B] mt-0.5 truncate">
                  Bukti resmi kejadian insiden &amp; pengalihan tugas
                  operasional
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC] flex flex-col lg:flex-row gap-5">
            {/* Left: Image Viewer — keyed so state resets on each new image */}
            <EvidenceImageViewer
              key={data.imageUrl}
              imageUrl={data.imageUrl}
              resi={data.resi}
              publicId={data.publicId}
              onDownload={handleDownload}
            />

            {/* Right: Metadata Panel */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Resi & Layanan Card */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Informasi Paket
                  </span>
                  {data.serviceType && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FFF0F6] text-[#C91076] border border-[#F9A8D4] text-[11px] font-extrabold uppercase">
                      {data.serviceType}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">
                      Nomor Resi / AWB
                    </span>
                    <span className="font-mono text-[15px] font-black text-[#0F172A] tracking-tight">
                      {data.resi}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyResi}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all",
                      copied
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#F1F5F9]",
                    )}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
              </div>

              {/* Kendala & Deskripsi */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Kendala &amp; Bukti Visual
                </span>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
                  <AlertTriangle
                    size={16}
                    className="text-red-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[12px] font-extrabold block">
                      {data.category ?? "Kendala Lapangan"}
                    </span>
                    <span className="text-[11px] text-red-700">
                      {data.detail ?? data.title ?? "Tidak ada rincian"}
                    </span>
                  </div>
                </div>

                {data.caption && (
                  <div className="p-3 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                      Catatan / Keterangan Bukti:
                    </span>
                    <p className="text-[12px] text-[#334155] italic leading-relaxed">
                      &ldquo;{data.caption}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Kurir & Pengalihan (if available) */}
              {(data.fromCourier || data.toCourier) && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Status Pengalihan Kurir
                  </span>
                  <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
                    {data.fromCourier && (
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-[#64748B] block">
                          Kurir Asal
                        </span>
                        <span className="text-[12px] font-bold text-[#1E293B] block truncate">
                          {data.fromCourier}
                        </span>
                        {data.fromCourierCode && (
                          <span className="text-[10px] font-mono text-[#94A3B8]">
                            {data.fromCourierCode}
                          </span>
                        )}
                      </div>
                    )}

                    {data.toCourier && (
                      <>
                        <div className="w-6 h-6 rounded-full bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center flex-shrink-0">
                          <ArrowRight size={12} className="text-[#C91076]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-[#059669] block">
                            Kurir Pengganti
                          </span>
                          <span className="text-[12px] font-bold text-[#059669] block truncate">
                            {data.toCourier}
                          </span>
                          {data.toCourierCode && (
                            <span className="text-[10px] font-mono text-[#34D399]">
                              {data.toCourierCode}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp info */}
              {data.timestamp && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[#E2E8F0] text-[11px] text-[#64748B]">
                  <Clock size={13} className="text-[#94A3B8]" />
                  <span>Waktu Pencatatan:</span>
                  <span className="font-semibold text-[#1E293B]">
                    {data.timestamp}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-[#E2E8F0] bg-white">
            <span className="text-[11px] text-[#64748B]">
              Sumber: Database Cloudinary Evidence Storage
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-[13px] font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
