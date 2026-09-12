import {
  ActivityLog,
  Booth,
  Counters,
  DEFAULT_FESTIVAL_SETTINGS,
  FestivalSettings,
  INITIAL_BOOTHS,
  Participant,
  ScanResultStatus,
} from '../types';

const STORAGE_KEYS = {
  BOOTHS: 'kfc_festival_booths_v1',
  PARTICIPANTS: 'kfc_festival_participants_v1',
  SETTINGS: 'kfc_festival_settings_v1',
  COUNTERS: 'kfc_festival_counters_v1',
  ACTIVITIES: 'kfc_festival_activities_v1',
  LOCAL_PARTICIPANT_ID: 'kfc_participant_id',
  LOCAL_PARTICIPANT_ALLOCATED: 'kfc_participant_allocated',
};

// BroadcastChannel for instant cross-tab real-time sync
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('kfc_festival_realtime_sync')
    : null;

type Listener<T> = (data: T) => void;

class FestivalStorageService {
  private boothListeners: Set<Listener<Booth[]>> = new Set();
  private participantListeners: Set<Listener<Participant[]>> = new Set();
  private settingsListeners: Set<Listener<FestivalSettings>> = new Set();
  private activityListeners: Set<Listener<ActivityLog[]>> = new Set();
  private currentParticipantListeners: Set<Listener<Participant | null>> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDefaultData();

      // Listen for updates from other tabs
      if (broadcastChannel) {
        broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC') {
            this.notifyAll();
          }
        };
      }

      // Also listen to storage events
      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
          this.notifyAll();
        }
      });
    }
  }

  private initDefaultData() {
    if (!localStorage.getItem(STORAGE_KEYS.BOOTHS)) {
      localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(INITIAL_BOOTHS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(DEFAULT_FESTIVAL_SETTINGS)
      );
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUNTERS)) {
      const counters: Counters = { lastParticipantNumber: 0 };
      localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARTICIPANTS)) {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    }
  }

  private emitSync() {
    this.notifyAll();
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'SYNC', timestamp: Date.now() });
      } catch (e) {
        console.warn('Broadcast sync error:', e);
      }
    }
  }

  private notifyAll() {
    const booths = this.getBooths();
    this.boothListeners.forEach((fn) => fn(booths));

    const participants = this.getParticipants();
    this.participantListeners.forEach((fn) => fn(participants));

    const settings = this.getSettings();
    this.settingsListeners.forEach((fn) => fn(settings));

    const activities = this.getActivities();
    this.activityListeners.forEach((fn) => fn(activities));

    const currentParticipant = this.getCurrentParticipant();
    this.currentParticipantListeners.forEach((fn) => fn(currentParticipant));
  }

  // --- Getters ---

  public getBooths(): Booth[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOTHS);
      return raw ? JSON.parse(raw) : INITIAL_BOOTHS;
    } catch {
      return INITIAL_BOOTHS;
    }
  }

  public getParticipants(): Participant[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getSettings(): FestivalSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_FESTIVAL_SETTINGS, ...JSON.parse(raw) } : DEFAULT_FESTIVAL_SETTINGS;
    } catch {
      return DEFAULT_FESTIVAL_SETTINGS;
    }
  }

  public getCounters(): Counters {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COUNTERS);
      return raw ? JSON.parse(raw) : { lastParticipantNumber: 0 };
    } catch {
      return { lastParticipantNumber: 0 };
    }
  }

  public getActivities(): ActivityLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getCurrentParticipantId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
  }

  public getCurrentParticipant(): Participant | null {
    const id = this.getCurrentParticipantId();
    if (!id) return null;
    const participants = this.getParticipants();
    return participants.find((p) => p.id === id) || null;
  }

  // --- Subscriptions (Firestore onSnapshot style) ---

  public subscribeBooths(listener: Listener<Booth[]>): () => void {
    this.boothListeners.add(listener);
    listener(this.getBooths());
    return () => this.boothListeners.delete(listener);
  }

  public subscribeParticipants(listener: Listener<Participant[]>): () => void {
    this.participantListeners.add(listener);
    listener(this.getParticipants());
    return () => this.participantListeners.delete(listener);
  }

  public subscribeSettings(listener: Listener<FestivalSettings>): () => void {
    this.settingsListeners.add(listener);
    listener(this.getSettings());
    return () => this.settingsListeners.delete(listener);
  }

  public subscribeActivities(listener: Listener<ActivityLog[]>): () => void {
    this.activityListeners.add(listener);
    listener(this.getActivities());
    return () => this.activityListeners.delete(listener);
  }

  public subscribeCurrentParticipant(
    listener: Listener<Participant | null>
  ): () => void {
    this.currentParticipantListeners.add(listener);
    listener(this.getCurrentParticipant());
    return () => this.currentParticipantListeners.delete(listener);
  }

  // --- QR Code Parser Helper ---

  public parseQrPayload(rawCode: string): { type: 'booth' | 'voucher' | 'unknown'; id?: string; secret?: string } {
    let cleanCode = rawCode.trim();

    // Check if it's formatted inside a URL (e.g. https://domain.com/#scan=BOOTH:booth-1:abc or ?code=...)
    try {
      if (cleanCode.includes('://') || cleanCode.startsWith('//')) {
        const url = new URL(cleanCode, window.location.origin);
        const hashMatch = url.hash.match(/scan=([^&]+)/);
        if (hashMatch) {
          cleanCode = decodeURIComponent(hashMatch[1]);
        } else if (url.searchParams.get('code')) {
          cleanCode = url.searchParams.get('code') || cleanCode;
        } else if (url.searchParams.get('scan')) {
          cleanCode = url.searchParams.get('scan') || cleanCode;
        }
      }
    } catch {
      // Not a valid URL, use cleanCode as-is
    }

    // Format 1: BOOTH:<BOOTH_ID>:<RANDOM_HASH>
    if (cleanCode.startsWith('BOOTH:')) {
      const parts = cleanCode.split(':');
      if (parts.length >= 2) {
        return {
          type: 'booth',
          id: parts[1],
          secret: parts[2] || '',
        };
      }
    }

    // Format 2: Direct booth ID (e.g. booth-1, booth-2)
    const booths = this.getBooths();
    const matchedBooth = booths.find(
      (b) => b.id.toLowerCase() === cleanCode.toLowerCase()
    );
    if (matchedBooth) {
      return {
        type: 'booth',
        id: matchedBooth.id,
        secret: matchedBooth.qrSecret,
      };
    }

    // Format 3: KFC-SNACK:<PARTICIPANT_ID>
    if (cleanCode.startsWith('KFC-SNACK:')) {
      const parts = cleanCode.split(':');
      if (parts.length >= 2) {
        return {
          type: 'voucher',
          id: parts[1],
        };
      }
    }

    // Format 4: Direct participant ID (e.g. participant_1)
    if (cleanCode.startsWith('participant_') || cleanCode.startsWith('#')) {
      const id = cleanCode.replace('#', 'participant_');
      return {
        type: 'voucher',
        id: id,
      };
    }

    return { type: 'unknown' };
  }

  // --- Core Business Logic: Register Booth Scan (Atomic Lazy Allocation) ---

  public registerBoothScan(rawCode: string): ScanResultStatus {
    const parsed = this.parseQrPayload(rawCode);

    if (parsed.type === 'voucher' && parsed.id) {
      return {
        type: 'voucher_scanned',
        participantId: parsed.id,
      };
    }

    if (parsed.type !== 'booth' || !parsed.id) {
      return {
        type: 'invalid_booth',
        reason: '유효한 축제 부스 QR 코드가 아닙니다. (형식: BOOTH:<부스ID>:<보안키>)',
      };
    }

    const booths = this.getBooths();
    const targetBooth = booths.find(
      (b) => b.id.toLowerCase() === parsed.id!.toLowerCase()
    );

    if (!targetBooth) {
      return {
        type: 'invalid_booth',
        reason: `등록되지 않은 부스입니다 (부스 ID: ${parsed.id})`,
      };
    }

    if (!targetBooth.isActive) {
      return {
        type: 'invalid_booth',
        reason: `현재 운영 중이지 않은 부스입니다 (${targetBooth.name})`,
      };
    }

    // Security check: if secret is provided in the QR format, verify it matches
    if (parsed.secret && targetBooth.qrSecret && parsed.secret !== targetBooth.qrSecret) {
      return {
        type: 'invalid_booth',
        reason: '부스 보안 인증키가 일치하지 않습니다. 최신 공식 부스 QR을 스캔해주세요.',
      };
    }

    const participants = this.getParticipants();
    let currentId = this.getCurrentParticipantId();
    let participant = currentId ? participants.find((p) => p.id === currentId) : null;
    let isFirstScan = false;

    // RULE 1: Lazy Allocation
    // If not allocated yet, perform atomic counter increment now
    if (!participant) {
      const counters = this.getCounters();
      const nextNum = (counters.lastParticipantNumber || 0) + 1;
      counters.lastParticipantNumber = nextNum;
      localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));

      currentId = `participant_${nextNum}`;
      localStorage.setItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID, currentId);
      localStorage.setItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED, 'true');

      participant = {
        id: currentId,
        createdAt: Date.now(),
        completedBooths: [],
        progress: 0,
        isCompleted: false,
        completedAt: null,
        snackClaimed: false,
        snackClaimedAt: null,
        lastActiveAt: Date.now(),
      };
      participants.push(participant);
      isFirstScan = true;
    }

    // Check if already completed this booth
    if (participant.completedBooths.includes(targetBooth.id)) {
      return {
        type: 'already_completed',
        booth: targetBooth,
      };
    }

    // Add booth to completedBooths
    participant.completedBooths.push(targetBooth.id);
    participant.lastActiveAt = Date.now();

    // Calculate progress based on active booths
    const activeBooths = booths.filter((b) => b.isActive);
    const activeTotal = activeBooths.length;
    const completedActiveCount = activeBooths.filter((b) =>
      participant!.completedBooths.includes(b.id)
    ).length;

    const progress =
      activeTotal > 0
        ? Math.min(100, Math.round((completedActiveCount / activeTotal) * 100))
        : 100;

    participant.progress = progress;
    const isNowCompleted = progress >= 100;
    if (isNowCompleted && !participant.isCompleted) {
      participant.isCompleted = true;
      participant.completedAt = Date.now();
    }

    // Update booth completed count
    targetBooth.completedCount = (targetBooth.completedCount || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(booths));

    // Save participants
    const index = participants.findIndex((p) => p.id === participant!.id);
    if (index >= 0) {
      participants[index] = participant;
    } else {
      participants.push(participant);
    }
    localStorage.setItem(
      STORAGE_KEYS.PARTICIPANTS,
      JSON.stringify(participants)
    );

    // Record activity log
    this.addActivityLog({
      participantId: participant.id,
      boothId: targetBooth.id,
      boothName: targetBooth.name,
      type: isNowCompleted ? 'completed' : 'stamp',
      timestamp: Date.now(),
      message: isNowCompleted
        ? `참가자 #${this.getParticipantDisplayNumber(participant.id)}님이 모든 부스를 완주하였습니다! 🎉`
        : `참가자 #${this.getParticipantDisplayNumber(participant.id)}님이 [${targetBooth.name}] 부스 체험을 완료했습니다.`,
    });

    this.emitSync();

    return {
      type: 'success',
      booth: targetBooth,
      isFirstScan,
      isNowCompleted,
    };
  }

  // --- Staff Snack Claim Logic ---

  public claimSnack(participantId: string): { success: boolean; message: string; participant?: Participant } {
    const participants = this.getParticipants();
    const participant = participants.find(
      (p) => p.id.toLowerCase() === participantId.toLowerCase()
    );

    if (!participant) {
      return {
        success: false,
        message: `참가자 정보를 찾을 수 없습니다. (ID: ${participantId})`,
      };
    }

    if (!participant.isCompleted) {
      const activeBooths = this.getBooths().filter((b) => b.isActive);
      const remaining = activeBooths.length - participant.completedBooths.length;
      return {
        success: false,
        message: `아직 모든 부스를 완료하지 않았습니다. (${participant.completedBooths.length}/${activeBooths.length} 완료, 남은 부스: ${Math.max(0, remaining)}개)`,
        participant,
      };
    }

    if (participant.snackClaimed) {
      const claimedDate = participant.snackClaimedAt
        ? new Date(participant.snackClaimedAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : '';
      return {
        success: false,
        message: `이미 간식을 수령한 참가자입니다. (지급 시간: ${claimedDate})`,
        participant,
      };
    }

    participant.snackClaimed = true;
    participant.snackClaimedAt = Date.now();
    participant.lastActiveAt = Date.now();

    localStorage.setItem(
      STORAGE_KEYS.PARTICIPANTS,
      JSON.stringify(participants)
    );

    const settings = this.getSettings();
    this.addActivityLog({
      participantId: participant.id,
      type: 'claim',
      timestamp: Date.now(),
      message: `참가자 #${this.getParticipantDisplayNumber(participant.id)}님에게 [${settings.snackName}] 지급이 완료되었습니다! 🎁`,
    });

    this.emitSync();

    return {
      success: true,
      message: `간식 수령이 정상적으로 승인되었습니다!`,
      participant,
    };
  }

  // --- Activity Log Helper ---

  private addActivityLog(log: Omit<ActivityLog, 'id'>) {
    const activities = this.getActivities();
    const newLog: ActivityLog = {
      ...log,
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    // Keep last 100 logs
    const updated = [newLog, ...activities].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
  }

  // --- Booth Management (Admin) ---

  public saveBooth(booth: Booth): void {
    const booths = this.getBooths();
    const idx = booths.findIndex((b) => b.id === booth.id);
    if (idx >= 0) {
      booths[idx] = booth;
    } else {
      booths.push(booth);
    }
    localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(booths));
    this.emitSync();
  }

  public deleteBooth(boothId: string): void {
    const booths = this.getBooths().filter((b) => b.id !== boothId);
    localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(booths));
    this.emitSync();
  }

  // --- Festival Settings ---

  public saveSettings(settings: FestivalSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.emitSync();
  }

  // --- Reset Functions ---

  public resetCurrentVisitor(): void {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);
    this.emitSync();
  }

  public resetAllParticipants(): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify([]));
    localStorage.setItem(
      STORAGE_KEYS.COUNTERS,
      JSON.stringify({ lastParticipantNumber: 0 })
    );
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);

    // Reset completed count on booths
    const booths = this.getBooths().map((b) => ({ ...b, completedCount: 0 }));
    localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(booths));

    // Clear activities
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));

    this.emitSync();
  }

  public resetToDefault(): void {
    localStorage.clear();
    this.initDefaultData();
    this.emitSync();
  }

  // Utility to extract clean number from ID
  public getParticipantDisplayNumber(participantId?: string | null): string {
    if (!participantId) return '-';
    const match = participantId.match(/\d+/);
    return match ? match[0] : participantId;
  }
}

export const festivalStorage = new FestivalStorageService();
