import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MapPin,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Booth } from '../types';

interface BoothCardProps {
  booth: Booth;
  isCompleted: boolean;
  onScanBooth: (booth: Booth) => void;
}

export const BoothCard: React.FC<BoothCardProps> = ({
  booth,
  isCompleted,
  onScanBooth,
}) => {
  const [isHintOpen, setIsHintOpen] = useState(false);

  // Category styling
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case '로봇':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'AI/소프트웨어':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case '체험':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case '게임':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isCompleted
          ? 'bg-gradient-to-b from-emerald-50/40 via-white to-white border-emerald-300 shadow-xs'
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      {/* Top Banner Stripe for completed */}
      {isCompleted && (
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header: Category, Booth Order & Completed badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center border border-slate-200">
              {booth.order}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(
                booth.category
              )}`}
            >
              {booth.category}
            </span>
          </div>

          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              인증 완료
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400">
              미인증 부스
            </span>
          )}
        </div>

        {/* Title & Location */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
          {booth.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="font-medium text-slate-700">{booth.location}</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
          {booth.description}
        </p>

        {/* Collapsible QR Hint Panel */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={() => setIsHintOpen(!isHintOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200/70"
          >
            <span className="flex items-center gap-1.5 text-amber-700">
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>QR 위치 힌트</span>
            </span>
            {isHintOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {isHintOpen && (
            <div className="mt-1.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 leading-relaxed animate-in fade-in duration-200">
              <span className="font-semibold mr-1">💡 힌트:</span>
              {booth.hint}
            </div>
          )}
        </div>

        {/* Action / Stamp Seal Area */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
          {isCompleted ? (
            <div className="w-full flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">스탬프 획득 완료</span>
                <p className="text-[11px] text-slate-400 mt-0.5">체험 인증 도장이 날인되었습니다.</p>
              </div>

              {/* Authentic Visual Rubber Stamp Graphic */}
              <div className="shrink-0 animate-stamp-pop">
                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 border-dashed border-rose-600 bg-rose-50/40 p-1 flex flex-col items-center justify-center text-center text-rose-600 select-none shadow-xs">
                  <div className="w-full h-full rounded-full border border-rose-500/80 flex flex-col items-center justify-center p-1">
                    <Sparkles className="w-3 h-3 text-rose-500 mb-0.5" />
                    <span className="text-[10px] font-black tracking-tighter uppercase leading-none text-rose-700">
                      인증완료
                    </span>
                    <span className="text-[8px] font-bold tracking-widest uppercase mt-0.5 text-rose-600">
                      COMPLETE
                    </span>
                    <span className="text-[8px] font-medium text-rose-500/80 mt-0.5">
                      K.F.C.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onScanBooth(booth)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-indigo-300" />
              <span>QR 스캔하여 인증하기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
