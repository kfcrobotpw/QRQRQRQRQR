import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  Gift,
  Key,
  Lock,
  LogOut,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  ActivityLog,
  Booth,
  FestivalSettings,
  Participant,
} from '../types';
import { festivalStorage } from '../services/storage';
import { PrintableBoothPoster } from './PrintableBoothPoster';

interface AdminDashboardProps {
  booths: Booth[];
  participants: Participant[];
  settings: FestivalSettings;
  activities: ActivityLog[];
  onBackToVisitor: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  booths,
  participants,
  settings,
  activities,
  onBackToVisitor,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('kfc_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Active Admin Tab
  const [currentTab, setCurrentTab] = useState<'stats' | 'booths' | 'participants' | 'settings'>('stats');

  // Booth Modal state
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);
  const [posterBooth, setPosterBooth] = useState<Booth | null>(null);

  // Participant Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [participantFilter, setParticipantFilter] = useState<'all' | 'completed' | 'progress' | 'claimed' | 'unclaimed'>('all');

  // Staff Snack Scanner Modal
  const [isStaffScannerOpen, setIsStaffScannerOpen] = useState(false);
  const [staffScanInput, setStaffScanInput] = useState('');
  const [staffScanFeedback, setStaffScanFeedback] = useState<{ success: boolean; message: string; participant?: Participant } | null>(null);

  // Festival Settings Form State
  const [settingsForm, setSettingsForm] = useState<FestivalSettings>(settings);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Password Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.adminPassword) {
      sessionStorage.setItem('kfc_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('kfc_admin_auth');
    setIsAuthenticated(false);
    onBackToVisitor();
  };

  // KPI Calculations
  const activeBooths = booths.filter((b) => b.isActive);
  const totalParticipants = participants.length;
  const completedParticipants = participants.filter((p) => p.isCompleted).length;
  const completionRate =
    totalParticipants > 0
      ? Math.round((completedParticipants / totalParticipants) * 100)
      : 0;
  const snackClaimedCount = participants.filter((p) => p.snackClaimed).length;

  // Filtered Participants
  const filteredParticipants = participants
    .filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const displayNum = festivalStorage.getParticipantDisplayNumber(p.id);
        if (!p.id.toLowerCase().includes(query) && !displayNum.includes(query)) {
          return false;
        }
      }
      if (participantFilter === 'completed') return p.isCompleted;
      if (participantFilter === 'progress') return !p.isCompleted;
      if (participantFilter === 'claimed') return p.snackClaimed;
      if (participantFilter === 'unclaimed') return p.isCompleted && !p.snackClaimed;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // Booth Save / Edit
  const handleSaveBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooth) return;
    festivalStorage.saveBooth(editingBooth);
    setIsBoothModalOpen(false);
    setEditingBooth(null);
  };

  const handleToggleBoothActive = (booth: Booth) => {
    festivalStorage.saveBooth({ ...booth, isActive: !booth.isActive });
  };

  const handleDeleteBooth = (boothId: string) => {
    if (confirm('정말로 이 부스를 삭제하시겠습니까?')) {
      festivalStorage.deleteBooth(boothId);
    }
  };

  const handleOpenAddBooth = () => {
    const nextOrder = booths.length + 1;
    const newId = `booth-${Date.now().toString().slice(-4)}`;
    setEditingBooth({
      id: newId,
      name: '새로운 체험 부스',
      category: '체험',
      location: '부스 장소',
      description: '부스 설명 문구를 입력하세요.',
      hint: 'QR 위치 힌트 문구',
      qrSecret: `secret_${Math.random().toString(36).slice(2, 8)}`,
      order: nextOrder,
      isActive: true,
      completedCount: 0,
    });
    setIsBoothModalOpen(true);
  };

  // Staff Claim direct action
  const handleStaffClaimAction = (participantId: string) => {
    const res = festivalStorage.claimSnack(participantId);
    setStaffScanFeedback(res);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    festivalStorage.saveSettings(settingsForm);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const handleResetAllParticipants = () => {
    if (
      confirm(
        '⚠️ 경고: 모든 참가자 기록 및 카운터(0번으로 초기화)를 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      festivalStorage.resetAllParticipants();
      alert('참가자 데이터가 초기화되었습니다.');
    }
  };

  // If not authenticated, render login gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              운영진 / 관리자 로그인
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              부스 및 참가자 현황 관리를 위한 비밀번호를 입력하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(false);
                }}
                placeholder="비밀번호 입력 (기본: admin1234)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-center"
              />
              {authError && (
                <p className="text-xs text-rose-600 mt-1.5 font-medium">
                  비밀번호가 올바르지 않습니다.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              대시보드 접속
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToVisitor}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>스탬프 투어로 돌아가기</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-12">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 text-[11px] font-bold border border-indigo-400/30">
              ADMIN DASHBOARD
            </span>
            <span className="text-xs text-slate-400">실시간 운영 본부</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
            {settings.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsStaffScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>간식 지급 스캐너</span>
          </button>

          <button
            type="button"
            onClick={onBackToVisitor}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>방문자 화면</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 text-xs transition-colors border border-slate-700"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentTab('stats')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            currentTab === 'stats'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>실시간 통계 현황</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('booths')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            currentTab === 'booths'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>부스 & QR 포스터</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('participants')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            currentTab === 'participants'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>참가자 & 간식 지급</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
            {totalParticipants}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            currentTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>축제 설정</span>
        </button>
      </div>

      {/* TAB 1: Live Stats & Activity Feed */}
      {currentTab === 'stats' && (
        <div className="space-y-6">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>총 실참가자</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {totalParticipants}
                <span className="text-xs font-medium text-slate-400 ml-1">명</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">1회 이상 스캔한 인원</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>완주자 수</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                {completedParticipants}
                <span className="text-xs font-medium text-slate-400 ml-1">명</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">전 부스 도장 완료</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>완주율</span>
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
                {completionRate}
                <span className="text-xs font-medium text-slate-400 ml-1">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">참가자 대비 완주 비율</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>간식 지급 수량</span>
                <Gift className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
                {snackClaimedCount}
                <span className="text-xs font-medium text-slate-400 ml-1">개</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                남은 미수령 완주자: {Math.max(0, completedParticipants - snackClaimedCount)}명
              </p>
            </div>
          </div>

          {/* Middle: Booth Completion Ranking + Live Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booth Ranking Bars */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>부스별 방문 완료 현황</span>
                </h3>
                <span className="text-xs text-slate-400">
                  활성 {activeBooths.length}개 부스
                </span>
              </div>

              <div className="space-y-3.5">
                {booths.map((booth) => {
                  const maxCount = Math.max(1, ...booths.map((b) => b.completedCount || 0));
                  const percent = Math.round(((booth.completedCount || 0) / maxCount) * 100);

                  return (
                    <div key={booth.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                            {booth.order}
                          </span>
                          <span>{booth.name}</span>
                          {!booth.isActive && (
                            <span className="text-[10px] text-slate-400">(비활성)</span>
                          )}
                        </div>
                        <span className="font-extrabold text-indigo-600">
                          {booth.completedCount || 0}명 완료
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(4, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Activity Feed Stream */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>실시간 현장 활동 피드</span>
                </h3>
                <span className="text-xs text-slate-400">자동 실시간 갱신</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2.5 pr-1">
                {activities.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    아직 기록된 활동이 없습니다. 부스 QR을 스캔하면 실시간으로 표시됩니다.
                  </div>
                ) : (
                  activities.slice(0, 30).map((act) => {
                    const timeStr = new Date(act.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-start gap-2.5"
                      >
                        <div className="mt-0.5 shrink-0">
                          {act.type === 'claim' ? (
                            <Gift className="w-4 h-4 text-purple-600" />
                          ) : act.type === 'completed' ? (
                            <Award className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 leading-snug">
                            {act.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Booths & QR Posters */}
      {currentTab === 'booths' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                부스 목록 및 A4 포스터 출력
              </h3>
              <p className="text-xs text-slate-500">
                행사 부스를 추가하거나 각 부스에 부착할 QR 코드 안내 포스터를 인쇄할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddBooth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>새 부스 추가</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booths.map((booth) => (
              <div
                key={booth.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                      #{booth.order}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {booth.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleBoothActive(booth)}
                      className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                        booth.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {booth.isActive ? '운영 중' : '비활성'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingBooth(booth);
                        setIsBoothModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      title="부스 정보 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBooth(booth.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="부스 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    {booth.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    📍 {booth.location}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {booth.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    인증 완료: <strong className="text-slate-900">{booth.completedCount || 0}명</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setPosterBooth(booth)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>A4 포스터 출력</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Participant Management */}
      {currentTab === 'participants' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="참가자 번호 또는 ID 검색..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setParticipantFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  participantFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 ({participants.length})
              </button>
              <button
                type="button"
                onClick={() => setParticipantFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  participantFilter === 'completed'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                완주자 ({completedParticipants})
              </button>
              <button
                type="button"
                onClick={() => setParticipantFilter('unclaimed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  participantFilter === 'unclaimed'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                간식 미수령 ({Math.max(0, completedParticipants - snackClaimedCount)})
              </button>
              <button
                type="button"
                onClick={() => setParticipantFilter('claimed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  participantFilter === 'claimed'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                수령 완료 ({snackClaimedCount})
              </button>
            </div>
          </div>

          {/* Participant Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">참가자 ID</th>
                    <th className="p-3.5">등록 일시</th>
                    <th className="p-3.5">부스 진행률</th>
                    <th className="p-3.5">완주 여부</th>
                    <th className="p-3.5">간식 지급 상태</th>
                    <th className="p-3.5 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        해당 조건에 맞는 참가자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => {
                      const number = festivalStorage.getParticipantDisplayNumber(p.id);
                      const createdStr = new Date(p.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">
                            참가자 #{number}
                            <span className="block text-[10px] font-normal text-slate-400">
                              {p.id}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{createdStr}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">
                                {p.completedBooths.length}/{activeBooths.length}
                              </span>
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full"
                                  style={{ width: `${p.progress}%` }}
                                />
                              </div>
                              <span className="text-slate-400 font-medium">
                                ({p.progress}%)
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            {p.isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                완주 성공
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                진행 중
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {p.snackClaimed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                                수령 완료
                              </span>
                            ) : p.isCompleted ? (
                              <button
                                type="button"
                                onClick={() => handleStaffClaimAction(p.id)}
                                className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors shadow-2xs"
                              >
                                간식 지급 승인
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                미완주 (지급 불가)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`참가자 #${number}의 간식 지급 상태를 승인하시겠습니까?`)) {
                                  handleStaffClaimAction(p.id);
                                }
                              }}
                              disabled={p.snackClaimed || !p.isCompleted}
                              className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-30 font-semibold"
                            >
                              간식 토글
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Festival Settings */}
      {currentTab === 'settings' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              축제 및 간식 기본 정보 설정
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  행사 / 축제 타이틀
                </label>
                <input
                  type="text"
                  value={settingsForm.title}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, title: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  환영 및 안내 문구
                </label>
                <input
                  type="text"
                  value={settingsForm.welcomeMessage}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      welcomeMessage: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  지급 간식 / 리워드 명칭
                </label>
                <input
                  type="text"
                  value={settingsForm.snackName}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      snackName: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  간식 배부처 장소
                </label>
                <input
                  type="text"
                  value={settingsForm.snackBoothLocation}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      snackBoothLocation: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  관리자 접근 비밀번호
                </label>
                <input
                  type="text"
                  value={settingsForm.adminPassword}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      adminPassword: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
              >
                설정 저장하기
              </button>
              {settingsSavedToast && (
                <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                  ✓ 설정이 성공적으로 저장되었습니다!
                </span>
              )}
            </div>
          </form>

          {/* Danger Zone: Reset Participants */}
          <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>데이터 초기화 (테스트용)</span>
            </div>
            <p className="text-xs text-rose-700">
              축제 전 테스트로 등록된 모든 참가자 데이터, 스탬프 기록 및 카운터를 0으로 완전히 초기화합니다.
            </p>
            <button
              type="button"
              onClick={handleResetAllParticipants}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              전체 참가자 데이터 초기화
            </button>
          </div>
        </div>
      )}

      {/* Staff Snack Scanner Modal */}
      {isStaffScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setIsStaffScannerOpen(false);
                setStaffScanFeedback(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center mb-2">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                운영요원 간식 지급 승인 스캐너
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                완주자의 모바일 교환권 QR 코드 또는 참가자 번호를 입력하세요.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!staffScanInput.trim()) return;
                const parsed = festivalStorage.parseQrPayload(staffScanInput.trim());
                const participantId = parsed.id || staffScanInput.trim();
                handleStaffClaimAction(participantId);
              }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={staffScanInput}
                  onChange={(e) => setStaffScanInput(e.target.value)}
                  placeholder="예: KFC-SNACK:participant_1 또는 1"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  조회 및 승인
                </button>
              </div>
            </form>

            {/* Feedback message */}
            {staffScanFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs ${
                  staffScanFeedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {staffScanFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{staffScanFeedback.success ? '지급 승인 성공' : '승인 거부 / 오류'}</span>
                </div>
                <p>{staffScanFeedback.message}</p>
              </div>
            )}

            {/* Quick test pick from completed participants */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                최근 완주 참가자 빠른 선택:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {participants
                  .filter((p) => p.isCompleted)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setStaffScanInput(`KFC-SNACK:${p.id}`);
                        handleStaffClaimAction(p.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        p.snackClaimed
                          ? 'bg-slate-100 text-slate-400 border-slate-200'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      참가자 #{festivalStorage.getParticipantDisplayNumber(p.id)}{' '}
                      {p.snackClaimed ? '(수령됨)' : '(미수령)'}
                    </button>
                  ))}
                {participants.filter((p) => p.isCompleted).length === 0 && (
                  <span className="text-xs text-slate-400">
                    아직 완주한 참가자가 없습니다.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Booth Modal */}
      {isBoothModalOpen && editingBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                부스 정보 등록 및 수정
              </h3>
              <button
                type="button"
                onClick={() => setIsBoothModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBooth} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  부스 명칭
                </label>
                <input
                  type="text"
                  value={editingBooth.name}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={editingBooth.category}
                    onChange={(e) =>
                      setEditingBooth({
                        ...editingBooth,
                        category: e.target.value,
                      })
                    }
                    placeholder="예: 로봇, 게임 등"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    순서 번호
                  </label>
                  <input
                    type="number"
                    value={editingBooth.order}
                    onChange={(e) =>
                      setEditingBooth({
                        ...editingBooth,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  부스 위치
                </label>
                <input
                  type="text"
                  value={editingBooth.location}
                  onChange={(e) =>
                    setEditingBooth({
                      ...editingBooth,
                      location: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  부스 설명
                </label>
                <textarea
                  value={editingBooth.description}
                  onChange={(e) =>
                    setEditingBooth({
                      ...editingBooth,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  QR 위치 힌트
                </label>
                <input
                  type="text"
                  value={editingBooth.hint}
                  onChange={(e) =>
                    setEditingBooth({ ...editingBooth, hint: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBoothModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 Poster Modal */}
      {posterBooth && (
        <PrintableBoothPoster
          booth={posterBooth}
          settings={settings}
          onClose={() => setPosterBooth(null)}
        />
      )}
    </div>
  );
};
