import React from 'react';
import { Award, QrCode, Shield, Sparkles } from 'lucide-react';
import { FestivalSettings, Participant } from '../types';

interface HeaderProps {
  settings: FestivalSettings;
  participant: Participant | null;
  currentView: 'tour' | 'voucher' | 'admin';
  onChangeView: (view: 'tour' | 'voucher' | 'admin') => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  participant,
  currentView,
  onChangeView,
  onOpenScanner,
}) => {
  const isCompleted = participant?.isCompleted ?? false;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Left: Logo & Festival Title */}
        <div
          onClick={() => onChangeView('tour')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight line-clamp-1">
                {settings.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">부스 체험 & 스탬프 투어</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Scanner button (small on mobile header) */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60"
            title="QR 코드 스캔하기"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR 스캔</span>
          </button>

          {/* Tab Navigation for Visitor */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeView('tour')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'tour'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              스탬프북
            </button>
            <button
              type="button"
              onClick={() => onChangeView('voucher')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                currentView === 'voucher'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>간식 교환</span>
              {isCompleted && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>

          {/* Admin Toggle */}
          <button
            type="button"
            onClick={() => onChangeView('admin')}
            className={`p-2 rounded-xl border transition-all ${
              currentView === 'admin'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title="관리자 / 운영진 대시보드"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
