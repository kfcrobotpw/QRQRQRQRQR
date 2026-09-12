import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Gift,
  Lock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { FestivalSettings, Participant } from '../types';
import { festivalStorage } from '../services/storage';

interface VoucherCardProps {
  participant: Participant | null;
  settings: FestivalSettings;
  totalActiveBooths: number;
  onBackToTour: () => void;
  onRefresh: () => void;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
  participant,
  settings,
  totalActiveBooths,
  onBackToTour,
  onRefresh,
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const isCompleted = participant?.isCompleted || false;
  const isClaimed = participant?.snackClaimed || false;
  const participantNumber = festivalStorage.getParticipantDisplayNumber(
    participant?.id
  );
  const completedCount = participant?.completedBooths?.length || 0;

  // Voucher QR Payload format: KFC-SNACK:<PARTICIPANT_ID>
  const voucherQrValue = participant ? `KFC-SNACK:${participant.id}` : '';

  useEffect(() => {
    if (isCompleted && !isClaimed) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.55 },
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [isCompleted, isClaimed]);

  const handleStaffClaim = () => {
    if (!participant) return;
    const result = festivalStorage.claimSnack(participant.id);
    setClaimMessage(result.message);
    setIsConfirmModalOpen(false);
    onRefresh();
  };

  const claimedDateString = participant?.snackClaimedAt
    ? new Date(participant.snackClaimedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div className="max-w-md mx-auto w-full space-y-4">
      {/* Top back navigation */}
      <button
        type="button"
        onClick={onBackToTour}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>스탬프 투어로 돌아가기</span>
      </button>

      {/* Case 1: NOT Completed yet */}
      {!isCompleted ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              교환권 잠김 상태
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              아직 미션이 완료되지 않았습니다
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              활성화된 모든 부스({completedCount}/{totalActiveBooths})를 방문하여 도장을 받아야 간식 교환권이 활성화됩니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>진행 현황</span>
              <span className="text-indigo-600">
                {participant?.progress || 0}% 완료
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${participant?.progress || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              남은 부스: {Math.max(0, totalActiveBooths - completedCount)}개
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToTour}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            부스 스탬프 찍으러 가기
          </button>
        </div>
      ) : (
        // Case 2: 100% Completed!
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Voucher Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-10">
              <Gift className="w-32 h-32" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>공식 모바일 리워드 교환권</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {settings.title}
            </h2>
            <p className="text-xs text-indigo-100 mt-1">
              부스 완주를 축하드립니다! 간식 배부처에 본 화면을 제시하세요.
            </p>

            {/* Big Participant Number Badge */}
            <div className="mt-4 inline-block bg-white text-indigo-900 px-4 py-1.5 rounded-2xl shadow-md border-2 border-indigo-200">
              <span className="text-xs font-bold text-slate-500 mr-1.5">인증 번호:</span>
              <span className="text-lg font-black tracking-tight text-indigo-700">
                참가자 #{participantNumber}
              </span>
            </div>
          </div>

          {/* Voucher Body: QR Code & Snack Info */}
          <div className="p-6 text-center space-y-6">
            {/* QR Code Container */}
            <div className="relative mx-auto w-56 h-56 p-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-xs flex flex-col items-center justify-center">
              <QRCodeSVG
                value={voucherQrValue}
                size={180}
                level="H"
                includeMargin={false}
              />

              {/* Stamped Watermark when Claimed */}
              {isClaimed && (
                <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-3 animate-stamp-pop">
                  <div className="border-4 border-dashed border-emerald-600 rounded-2xl p-3 text-emerald-700 rotate-[-12deg] bg-emerald-50/80 shadow-md">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
                    <span className="text-base font-black tracking-tighter uppercase block">
                      수령 완료
                    </span>
                    <span className="text-[10px] font-bold block tracking-widest uppercase">
                      CLAIMED
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* QR Caption */}
            <p className="text-xs text-slate-500">
              운영 본부 요원이 위 QR 코드를 스캔하거나 참가자 번호를 확인합니다.
            </p>

            {/* Snack Info Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/60 border border-amber-200/80 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Gift className="w-4 h-4 text-amber-600" />
                <span>지급 리워드 품목</span>
              </div>
              <p className="text-base font-black text-slate-900">
                {settings.snackName}
              </p>
              <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1 border-t border-amber-200/50">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800 font-semibold">배부처:</strong>{' '}
                  {settings.snackBoothLocation}
                </span>
              </div>
            </div>

            {/* Claim Status or Staff Confirm Button */}
            <div className="pt-2 border-t border-slate-100">
              {isClaimed ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>간식 지급이 완료되었습니다</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    지급 일시: {claimedDateString}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * 중복 수령은 불가능합니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>[운영요원 전용] 간식 지급 확인</span>
                  </button>
                  <p className="text-[11px] text-slate-400">
                    * 방문자는 누르지 마시고 현장 운영요원에게 화면을 보여주세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Staff Direct Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                간식 지급 승인
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                참가자 #{participantNumber}님에게 [{settings.snackName}]을 지급하시겠습니까?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 text-left">
              ⚠️ 승인 후에는 취소할 수 없으며, 중복 수령이 영구적으로 차단됩니다.
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleStaffClaim}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
              >
                지급 완료 승인
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
