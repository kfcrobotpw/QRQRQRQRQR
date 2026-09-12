import React from 'react';
import { Award, CheckCircle2, Gift, MapPin, Sparkles } from 'lucide-react';
import { FestivalSettings, Participant } from '../types';
import { festivalStorage } from '../services/storage';

interface ProgressBarProps {
  participant: Participant | null;
  totalActiveBooths: number;
  settings: FestivalSettings;
  onOpenScanner: () => void;
  onGoToVoucher: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  participant,
  totalActiveBooths,
  settings,
  onOpenScanner,
  onGoToVoucher,
}) => {
  const completedCount = participant?.completedBooths?.length || 0;
  const progress = participant?.progress || 0;
  const isCompleted = participant?.isCompleted || false;
  const isSnackClaimed = participant?.snackClaimed || false;
  const participantNumber = festivalStorage.getParticipantDisplayNumber(
    participant?.id
  );

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 transition-all">
      {!participant ? (
        // STATE 1: Before First Scan (Unregistered / Lazy Allocation)
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-600">
              <Gift className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  스탬프 투어 시작 전
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  총 {totalActiveBooths}개 부스 미션
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                부스를 방문하고 첫 QR을 스캔해보세요!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                완주 시 <span className="font-semibold text-indigo-600">{settings.snackName}</span>을 드립니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenScanner}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:from-indigo-700 hover:to-violet-700 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>첫 스탬프 찍기</span>
          </button>
        </div>
      ) : (
        // STATE 2: After Scan (Registered Participant)
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>참가자 #{participantNumber}</span>
              </div>

              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% 완주 성공!</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-600">
                  도전 진행 중
                </span>
              )}

              {isSnackClaimed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-200">
                  간식 수령 완료
                </span>
              )}
            </div>

            <div className="text-right flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-800">
              <span className="text-indigo-600 text-base font-extrabold">
                {completedCount}
              </span>
              <span className="text-slate-400">/</span>
              <span>{totalActiveBooths} 부스 완료</span>
              <span className="text-slate-400 font-normal ml-1">
                ({progress}%)
              </span>
            </div>
          </div>

          {/* Progress Track */}
          <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600'
              }`}
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>

          {/* Bottom helper or reward call to action */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {isCompleted
                  ? `본부석(${settings.snackBoothLocation})에서 간식을 수령하세요!`
                  : `남은 ${Math.max(0, totalActiveBooths - completedCount)}개 부스를 찾아 스캔하세요`}
              </span>
            </div>

            {isCompleted && (
              <button
                type="button"
                onClick={onGoToVoucher}
                className="shrink-0 inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>교환권 보기</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
