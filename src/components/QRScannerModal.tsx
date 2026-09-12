import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  AlertCircle,
  Camera,
  Keyboard,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { Booth } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  activeBooths: Booth[];
  initialBoothTarget?: Booth | null;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  activeBooths,
  initialBoothTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Critical lock to prevent camera frame loop re-triggering
  const scanLockedRef = useRef(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'festival-html5-qr-reader';

  // Handle camera start/stop
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopScanner();
      return;
    }

    scanLockedRef.current = false;
    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, activeTab, facingMode]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      setIsStartingCamera(true);

      // Clean up previous instance if any
      await stopScanner();

      // Short delay to ensure container DOM element is rendered
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = document.getElementById(scannerContainerId);
      if (!element) {
        setIsStartingCamera(false);
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      const qrBoxSize = Math.min(
        260,
        Math.floor(window.innerWidth * 0.72)
      );

      await html5QrCode.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // CRITICAL: Immediate Lock to prevent race condition
          if (scanLockedRef.current) return;
          scanLockedRef.current = true;

          // Stop scanner immediately
          stopScanner();

          // Dispatch scan success
          onScanSuccess(decodedText);
        },
        () => {
          // Frame scan error - ignore per normal html5-qrcode operation
        }
      );

      // Check torch capability
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorchSupport(true);
        }
      } catch {
        setHasTorchSupport(false);
      }

      setIsStartingCamera(false);
    } catch (err: unknown) {
      console.error('Camera start failed:', err);
      setIsStartingCamera(false);
      const errMessage =
        err instanceof Error ? err.message : '카메라에 접근할 수 없습니다.';
      setCameraError(
        errMessage.includes('NotAllowedError') || errMessage.includes('Permission')
          ? '카메라 접근 권한이 차단되었습니다. 브라우저 설정에서 카메라 권한을 허용해주시거나, [수동 입력] 탭을 이용해주세요.'
          : '카메라를 시작할 수 없습니다. 다른 앱이 카메라를 사용 중인지 확인하거나 [수동 입력] 탭을 이용해주세요.'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorchSupport) return;
    try {
      const nextState = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }] as any,
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Flashlight toggle failed:', err);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    scanLockedRef.current = true;
    onScanSuccess(manualCode.trim());
  };

  const handleSelectQuickTest = (booth: Booth) => {
    // Generates official formatted code: BOOTH:<BOOTH_ID>:<RANDOM_HASH>
    const code = `BOOTH:${booth.id}:${booth.qrSecret}`;
    scanLockedRef.current = true;
    onScanSuccess(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              <span>부스 QR 코드 인증</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {initialBoothTarget
                ? `[${initialBoothTarget.name}] 부스 QR을 스캔하세요`
                : '체험 부스 현장에 비치된 QR 코드를 비춰주세요'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Camera vs Manual Input */}
        <div className="px-4 pt-3 bg-white">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'camera'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>카메라 스캐너</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>직접 코드 입력</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'camera' ? (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="p-4 my-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm space-y-2 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="font-bold">카메라를 실행할 수 없습니다</p>
                  <p className="text-xs text-rose-700 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs shadow-xs hover:bg-rose-700 transition-colors"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>코드 직접 입력하기</span>
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  {/* html5-qrcode video container */}
                  <div
                    id={scannerContainerId}
                    className="w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
                  />

                  {/* Laser Line & Reticle Overlay */}
                  {!isStartingCamera && (
                    <div className="absolute inset-0 pointer-events-none p-6 flex items-center justify-center">
                      <div className="relative w-full h-full border-2 border-indigo-400/70 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        {/* Target reticle corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-indigo-400" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-indigo-400" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-indigo-400" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-indigo-400" />

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500 animate-scan-laser shadow-[0_0_10px_#ef4444]" />
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white text-xs gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      <span>카메라 연결 중...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Controls Bar */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{facingMode === 'environment' ? '전면 카메라' : '후면 카메라'}</span>
                </button>

                {hasTorchSupport && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isTorchOn
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isTorchOn ? '플래시 끄기' : '플래시 켜기'}</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 text-center mt-2.5">
                사각 프레임 중앙에 부스 QR 코드를 맞춰주시면 자동으로 인식됩니다.
              </p>
            </div>
          ) : (
            // Manual Code Input Tab
            <div className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    인증 코드 직접 입력
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="예: BOOTH:booth-1:secret 또는 booth-1"
                      className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!manualCode.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      확인
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    부스 포스터 하단에 기재된 부스 코드 또는 인증키를 입력하세요.
                  </p>
                </div>
              </form>

              {/* Quick test simulation pills for active booths */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>현장 부스 즉시 시뮬레이션 선택</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeBooths.map((booth) => (
                    <button
                      key={booth.id}
                      type="button"
                      onClick={() => handleSelectQuickTest(booth)}
                      className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs flex flex-col gap-0.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 group-hover:text-indigo-700">
                          {booth.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          #{booth.order}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate">
                        {booth.location}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
