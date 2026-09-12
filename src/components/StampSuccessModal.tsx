import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  MapPin,
  PartyPopper,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react';
import { Booth, ScanResultStatus } from '../types';

interface StampSuccessModalProps {
  result: ScanResultStatus | null;
  onClose: () => void;
  onScanNext: () => void;
  onGoToVoucher: () => void;
  participantNumber: string;
}

export const StampSuccessModal: React.FC<StampSuccessModalProps> = ({
  result,
  onClose,
  onScanNext,
  onGoToVoucher,
  participantNumber,
}) => {
  useEffect(() => {
    if (result?.type === 'success') {
      try {
        if (result.isNowCompleted) {
          // Extra lavish confetti for 100% completion
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } else {
          // Crisp single burst for stamp
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.65 },
          });
        }
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [result]);

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 text-center animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {result.type === 'success' ? (
          <div className="space-y-4">
            {/* Visual Icon */}
            <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-500/10">
              <PartyPopper className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              {result.isFirstScan && (
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
                  🎉 참가자 #{participantNumber} 등록 완료!
                </span>
              )}
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                스탬프 획득 성공!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                부스 체험 인증 도장이 정상적으로 날인되었습니다.
              </p>
            </div>

            {/* Booth Info Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700">
                  #{result.booth.order} {result.booth.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  인증됨
                </span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{result.booth.name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>{result.booth.location}</span>
              </div>
            </div>

            {/* 100% Completion Notification */}
            {result.isNowCompleted ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-amber-950 text-xs space-y-2">
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-amber-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>축하합니다! 모든 부스 100% 완주!</span>
                </div>
                <p className="text-amber-800/90 leading-relaxed">
                  스탬프 투어를 모두 마쳤습니다. 지금 간식 교환권을 열어 달콤한 리워드를 수령하세요!
                </p>
                <button
                  type="button"
                  onClick={onGoToVoucher}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>간식 교환권 확인하러 가기</span>
                </button>
              </div>
            ) : null}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onScanNext}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <QrCode className="w-4 h-4" />
                <span>다음 부스 스캔</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                스탬프북 보기
              </button>
            </div>
          </div>
        ) : result.type === 'already_completed' ? (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                이미 완료한 체험입니다
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                [{result.booth.name}] 부스의 도장이 이미 스탬프북에 날인되어 있습니다.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              다른 미완료 부스를 방문하여 스탬프를 획득해보세요!
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onScanNext}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>다른 부스 스캔</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                인증 실패
              </h3>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                {result.type === 'invalid_booth'
                  ? result.reason
                  : result.type === 'error'
                  ? result.message
                  : '유효한 QR 코드가 아닙니다.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onScanNext}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>다시 스캔하기</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
