import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Printer, Sparkles, X } from 'lucide-react';
import { Booth, FestivalSettings } from '../types';

interface PrintableBoothPosterProps {
  booth: Booth | null;
  settings: FestivalSettings;
  onClose: () => void;
}

export const PrintableBoothPoster: React.FC<PrintableBoothPosterProps> = ({
  booth,
  settings,
  onClose,
}) => {
  if (!booth) return null;

  // Standard official booth QR code format: BOOTH:<BOOTH_ID>:<RANDOM_HASH>
  const qrValue = `BOOTH:${booth.id}:${booth.qrSecret}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Controls Toolbar (hidden during print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold">부스 현장 비치용 A4 포스터 출력</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>포스터 인쇄</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Actual Printable Poster Content */}
        <div
          id="printable-poster"
          className="p-8 sm:p-10 bg-white text-center flex flex-col items-center justify-between min-h-[560px] border-8 border-indigo-900"
        >
          {/* Header */}
          <div className="w-full border-b-2 border-slate-200 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{settings.title}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="w-9 h-9 rounded-xl bg-indigo-900 text-white font-black text-base flex items-center justify-center">
                #{booth.order}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                {booth.category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              {booth.name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-slate-600 mt-2 font-medium">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{booth.location}</span>
            </div>
          </div>

          {/* Booth Description */}
          <p className="text-xs sm:text-sm text-slate-600 my-4 max-w-sm leading-relaxed">
            {booth.description}
          </p>

          {/* Big Crisp QR Code */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border-4 border-dashed border-indigo-600 shadow-md my-2">
            <QRCodeSVG
              value={qrValue}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-4 border-t-2 border-slate-200 w-full">
            <p className="text-sm sm:text-base font-extrabold text-indigo-950">
              스마트폰 카메라로 위 QR 코드를 스캔하세요!
            </p>
            <p className="text-xs text-slate-500 mt-1">
              모든 부스를 완주하시면 달콤한 리워드 [{settings.snackName}]을 드립니다.
            </p>
            <div className="mt-3 text-[10px] text-slate-400 font-mono">
              인증 코드: {qrValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
