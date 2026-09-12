export interface Booth {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  hint: string;
  qrSecret: string;
  order: number;
  isActive: boolean;
  completedCount: number;
}

export interface Participant {
  id: string;
  createdAt: number;
  completedBooths: string[];
  progress: number;
  isCompleted: boolean;
  completedAt: number | null;
  snackClaimed: boolean;
  snackClaimedAt: number | null;
  lastActiveAt: number;
}

export interface FestivalSettings {
  title: string;
  welcomeMessage: string;
  snackName: string;
  snackBoothLocation: string;
  adminPassword: string;
}

export interface Counters {
  lastParticipantNumber: number;
}

export interface ActivityLog {
  id: string;
  participantId: string;
  boothId?: string;
  boothName?: string;
  type: 'stamp' | 'completed' | 'claim';
  timestamp: number;
  message: string;
}

export type ScanResultStatus =
  | { type: 'success'; booth: Booth; isFirstScan: boolean; isNowCompleted: boolean }
  | { type: 'already_completed'; booth: Booth }
  | { type: 'invalid_booth'; reason: string }
  | { type: 'voucher_scanned'; participantId: string }
  | { type: 'error'; message: string };

export const DEFAULT_FESTIVAL_SETTINGS: FestivalSettings = {
  title: '2026 K.F.C. 봄 축제 로봇 & AI 부스 체험 투어',
  welcomeMessage: '각 부스를 방문하여 미션을 수행하고 QR 스탬프를 모두 모아 맛있는 간식을 교환하세요!',
  snackName: '달콤 바삭 츄러스 & 음료 세트 🧇🥤',
  snackBoothLocation: '중앙 잔디광장 본부석 간식 배부처',
  adminPassword: 'admin1234',
};

export const INITIAL_BOOTHS: Booth[] = [
  {
    id: 'booth-1',
    name: '🤖 로봇 체험',
    category: '로봇',
    location: '공학관 1층 로봇실습실',
    description: '최신 휴머노이드 로봇 및 자율주행 로봇의 동작을 관찰하고 직접 컨트롤러로 조작해보세요.',
    hint: '로봇 매트 옆 안내판을 확인하세요',
    qrSecret: 'secret_rb_2026_x1',
    order: 1,
    isActive: true,
    completedCount: 0,
  },
  {
    id: 'booth-2',
    name: '🧠 AI 웹앱 체험',
    category: 'AI/소프트웨어',
    location: '멀티미디어관 203호',
    description: '생성형 AI 모델을 활용하여 실시간 예술 창작 및 대화형 인터랙션을 경험할 수 있습니다.',
    hint: '키오스크 화면 모니터 옆 QR을 찾으세요',
    qrSecret: 'secret_ai_2026_w2',
    order: 2,
    isActive: true,
    completedCount: 0,
  },
  {
    id: 'booth-3',
    name: '🚗 로봇 미션',
    category: '체험',
    location: '학생회관 1층 로비',
    description: '다양한 트랩과 장애물이 있는 코스를 로봇을 조종하여 제한 시간 내에 통과하는 챌린지입니다.',
    hint: '장애물 코스 완주 지점에 QR이 있습니다',
    qrSecret: 'secret_ms_2026_m3',
    order: 3,
    isActive: true,
    completedCount: 0,
  },
  {
    id: 'booth-4',
    name: '🎮 K.F.C. 게임',
    category: '게임',
    location: '중앙 야외 잔디광장 부스',
    description: '학생회와 동아리가 준비한 흥미진진한 레크리에이션 미니 게임에 참여하고 도장을 획득하세요.',
    hint: '게임 진행 요원 명찰의 QR을 스캔하세요',
    qrSecret: 'secret_gm_2026_k4',
    order: 4,
    isActive: true,
    completedCount: 0,
  },
];
