/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Gift,
  HelpCircle,
  MapPin,
  QrCode,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  ActivityLog,
  Booth,
  FestivalSettings,
  Participant,
  ScanResultStatus,
} from './types';
import { festivalStorage } from './services/storage';
import { Header } from './components/Header';
import { ProgressBar } from './components/ProgressBar';
import { BoothCard } from './components/BoothCard';
import { QRScannerModal } from './components/QRScannerModal';
import { StampSuccessModal } from './components/StampSuccessModal';
import { VoucherCard } from './components/VoucherCard';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<FestivalSettings>(
    festivalStorage.getSettings()
  );
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);

  // Views & Modals
  const [currentView, setCurrentView] = useState<'tour' | 'voucher' | 'admin'>(
    'tour'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [targetBoothForScan, setTargetBoothForScan] = useState<Booth | null>(
    null
  );
  const [scanResult, setScanResult] = useState<ScanResultStatus | null>(null);

  // Subscribe to real-time events (Firestore style)
  useEffect(() => {
    const unsubBooths = festivalStorage.subscribeBooths(setBooths);
    const unsubParticipants =
      festivalStorage.subscribeParticipants(setParticipants);
    const unsubSettings = festivalStorage.subscribeSettings(setSettings);
    const unsubActivities = festivalStorage.subscribeActivities(setActivities);
    const unsubParticipant =
      festivalStorage.subscribeCurrentParticipant(setCurrentParticipant);

    return () => {
      unsubBooths();
      unsubParticipants();
      unsubSettings();
      unsubActivities();
      unsubParticipant();
    };
  }, []);

  // Filtered active booths for display
  const activeBooths = booths
    .filter((b) => b.isActive)
    .sort((a, b) => a.order - b.order);

  const categories = [
    '전체',
    ...Array.from(new Set(activeBooths.map((b) => b.category))),
  ];

  const displayedBooths = activeBooths.filter((b) =>
    selectedCategory === '전체' ? true : b.category === selectedCategory
  );

  // Handle QR Scan Success
  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    setTargetBoothForScan(null);

    const result = festivalStorage.registerBoothScan(decodedText);
    setScanResult(result);
  };

  const handleOpenScannerForBooth = (booth?: Booth) => {
    setTargetBoothForScan(booth || null);
    setIsScannerOpen(true);
  };

  const handleResetCurrentVisitor = () => {
    if (confirm('현재 기기의 스탬프 기록 및 참가자 등록을 초기화하시겠습니까?')) {
      festivalStorage.resetCurrentVisitor();
    }
  };

  const completedBoothsList = currentParticipant?.completedBooths || [];
  const participantNumber = festivalStorage.getParticipantDisplayNumber(
    currentParticipant?.id
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-24 sm:pb-16">
      {/* Top Sticky Header */}
      <Header
        settings={settings}
        participant={currentParticipant}
        currentView={currentView}
        onChangeView={(view) => setCurrentView(view)}
        onOpenScanner={() => handleOpenScannerForBooth()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-6 space-y-6">
        {currentView === 'tour' && (
          <>
            {/* Top Participant Status Bar */}
            <ProgressBar
              participant={currentParticipant}
              totalActiveBooths={activeBooths.length}
              settings={settings}
              onOpenScanner={() => handleOpenScannerForBooth()}
              onGoToVoucher={() => setCurrentView('voucher')}
            />

            {/* Category Filter Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Reset Visitor test action */}
              {currentParticipant && (
                <button
                  type="button"
                  onClick={handleResetCurrentVisitor}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
                  title="기기 스탬프 초기화 (테스트용)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>내 스탬프 초기화</span>
                </button>
              )}
            </div>

            {/* Booth Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedBooths.map((booth) => {
                const isCompleted = completedBoothsList.includes(booth.id);
                return (
                  <BoothCard
                    key={booth.id}
                    booth={booth}
                    isCompleted={isCompleted}
                    onScanBooth={(b) => handleOpenScannerForBooth(b)}
                  />
                );
              })}
            </div>

            {/* Tour Guide & Reward Info Footer Box */}
            <div className="rounded-2xl bg-indigo-900/5 border border-indigo-100 p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Gift className="w-4 h-4 text-indigo-600" />
                <span>스탬프 투어 및 간식 교환 안내</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed list-disc list-inside">
                <li>
                  각 부스를 방문하여 준비된 프로그램 체험을 완료하고, 부스에 비치된{' '}
                  <strong className="text-indigo-900">QR 코드를 스캔</strong>하세요.
                </li>
                <li>
                  총 {activeBooths.length}개의 부스 도장을 모두 획득하면{' '}
                  <strong className="text-indigo-900">100% 완주 간식 교환권</strong>이 자동 발급됩니다.
                </li>
                <li>
                  간식 수령처: <span className="font-semibold text-slate-800">{settings.snackBoothLocation}</span> ({settings.snackName})
                </li>
              </ul>
            </div>
          </>
        )}

        {currentView === 'voucher' && (
          <VoucherCard
            participant={currentParticipant}
            settings={settings}
            totalActiveBooths={activeBooths.length}
            onBackToTour={() => setCurrentView('tour')}
            onRefresh={() => {
              const p = festivalStorage.getCurrentParticipant();
              setCurrentParticipant(p);
            }}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            booths={booths}
            participants={participants}
            settings={settings}
            activities={activities}
            onBackToVisitor={() => setCurrentView('tour')}
          />
        )}
      </main>

      {/* Mobile Floating Action Button (Only on Tour View) */}
      {currentView === 'tour' && (
        <div className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-40">
          <button
            type="button"
            onClick={() => handleOpenScannerForBooth()}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-indigo-400/40"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span>부스 QR 스캔하기</span>
          </button>
        </div>
      )}

      {/* QR Scanner Modal with Camera / Manual Tab */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setTargetBoothForScan(null);
        }}
        onScanSuccess={handleScanSuccess}
        activeBooths={activeBooths}
        initialBoothTarget={targetBoothForScan}
      />

      {/* Stamp Acquisition / Celebration Modal */}
      <StampSuccessModal
        result={scanResult}
        onClose={() => setScanResult(null)}
        onScanNext={() => {
          setScanResult(null);
          setIsScannerOpen(true);
        }}
        onGoToVoucher={() => {
          setScanResult(null);
          setCurrentView('voucher');
        }}
        participantNumber={participantNumber}
      />
    </div>
  );
}
