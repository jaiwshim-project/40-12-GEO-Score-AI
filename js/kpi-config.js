/**
 * GEO Score AI - 10대 KPI 정의
 * AI 검색 시대 기업 존재력 측정 프레임워크
 */

window.KPI_DEFINITIONS = [
  {
    id: 'visibility',
    name: '검색 가시성 지수',
    nameEn: 'Search Visibility Index',
    icon: '🔎',
    color: '#0095ff',
    color2: '#0073cc',
    desc: '구글·네이버 노출 수준, 키워드 점유율, AI Overview 노출 가능성을 종합 평가합니다.',
    insightHigh: '검색 결과에서 안정적으로 발견되는 단계입니다.',
    insightMid: '주요 키워드 일부에서만 노출되고 있어 보강이 필요합니다.',
    insightLow: '검색 결과에서 거의 보이지 않습니다. AI도 발견하지 못합니다.'
  },
  {
    id: 'velocity',
    name: '콘텐츠 생산력 지수',
    nameEn: 'Content Velocity Index',
    icon: '⚡',
    color: '#ff6b35',
    color2: '#ff4500',
    desc: '블로그·웹 콘텐츠 발행 빈도, 최신성, 업데이트 주기를 측정합니다.',
    insightHigh: '꾸준한 콘텐츠 생산으로 AI 학습 데이터가 풍부합니다.',
    insightMid: '간헐적 발행 패턴. 일관된 발행 루틴 확립이 필요합니다.',
    insightLow: '신규 콘텐츠가 거의 없어 AI에 학습될 기회가 없습니다.'
  },
  {
    id: 'authority',
    name: 'E-E-A-T 신뢰도 지수',
    nameEn: 'Authority Index',
    icon: '🏆',
    color: '#00d68f',
    color2: '#00b87c',
    desc: '전문성, 경험 기반 콘텐츠, 저자 신뢰도를 평가합니다.',
    insightHigh: '전문성과 경험이 잘 드러나 AI가 신뢰하는 출처로 인식됩니다.',
    insightMid: '신뢰 신호가 일부 존재하지만 저자·경력 노출 강화가 필요합니다.',
    insightLow: '신뢰 근거가 거의 없어 AI가 인용을 망설입니다.'
  },
  {
    id: 'citation',
    name: 'AI 인용 가능성 지수',
    nameEn: 'AI Citation Index',
    icon: '🤖',
    color: '#a855f7',
    color2: '#7c3aed',
    desc: '구조화된 콘텐츠, FAQ·Q&A 구조, LLM 친화적 형식을 평가합니다.',
    insightHigh: '구조화 수준이 높아 AI가 답변에 인용하기 쉽습니다.',
    insightMid: '일부 구조화는 있으나 FAQ·요약 영역 보강이 필요합니다.',
    insightLow: '구조화가 거의 없어 AI 답변에 등장할 가능성이 매우 낮습니다.'
  },
  {
    id: 'engagement',
    name: '고객 참여도 지수',
    nameEn: 'Engagement Index',
    icon: '💬',
    color: '#ec4899',
    color2: '#be185d',
    desc: '댓글, 리뷰, SNS 반응, 체류 시간을 종합 측정합니다.',
    insightHigh: '활발한 참여로 콘텐츠 신뢰도가 강화됩니다.',
    insightMid: '참여가 일부 존재하지만 인터랙션 유도 장치 보강이 필요합니다.',
    insightLow: '참여 흔적이 거의 없어 콘텐츠가 정적 상태로 머물러 있습니다.'
  },
  {
    id: 'conversion',
    name: '전환 설계 지수',
    nameEn: 'Conversion Architecture Index',
    icon: '🎯',
    color: '#ffa800',
    color2: '#ff8800',
    desc: 'CTA 존재 여부, 상담 유도 구조, 랜딩 페이지 완성도를 측정합니다.',
    insightHigh: '방문자가 자연스럽게 전환 액션으로 유도됩니다.',
    insightMid: 'CTA가 존재하지만 명확성·반복 노출이 부족합니다.',
    insightLow: '전환 설계가 부재해 트래픽이 와도 매출로 이어지지 않습니다.'
  },
  {
    id: 'channel',
    name: '채널 확장 지수',
    nameEn: 'Channel Diversification Index',
    icon: '📡',
    color: '#06b6d4',
    color2: '#0891b2',
    desc: '블로그, 유튜브, SNS 등 멀티채널 활용도를 평가합니다.',
    insightHigh: '여러 채널에 일관된 메시지가 분산되어 AI 발견 확률이 높습니다.',
    insightMid: '일부 채널에 의존하고 있어 확장이 필요합니다.',
    insightLow: '단일 채널 의존도가 높아 AI 탐색 경로가 제한됩니다.'
  },
  {
    id: 'brand',
    name: '브랜드 일관성 지수',
    nameEn: 'Brand Consistency Index',
    icon: '🎨',
    color: '#f59e0b',
    color2: '#d97706',
    desc: '메시지 통일성, 디자인·톤앤매너의 일관성을 측정합니다.',
    insightHigh: '브랜드 정체성이 강해 AI도 일관된 인식을 형성합니다.',
    insightMid: '톤·메시지가 채널마다 다르게 흩어져 있습니다.',
    insightLow: '일관성이 부족해 AI가 브랜드를 명확하게 학습하지 못합니다.'
  },
  {
    id: 'competitive',
    name: '경쟁 대비 점유율 지수',
    nameEn: 'Competitive Position Index',
    icon: '⚔️',
    color: '#ef4444',
    color2: '#b91c1c',
    desc: '경쟁사 대비 콘텐츠량, 키워드 경쟁력을 분석합니다.',
    insightHigh: '경쟁사 대비 우위에 있어 AI가 우선 추천합니다.',
    insightMid: '비등한 경쟁 상태. 차별화 포인트 강화가 필요합니다.',
    insightLow: '경쟁사가 시장을 장악한 상태로 AI는 경쟁사를 우선 추천합니다.'
  },
  {
    id: 'aio',
    name: 'AI 최적화 준비도',
    nameEn: 'AIO Readiness Index',
    icon: '🚀',
    color: '#8b5cf6',
    color2: '#6d28d9',
    desc: 'GEO 구조, AI 검색 대응 구조, 콘텐츠 구조화 수준을 종합합니다.',
    insightHigh: 'AI 시대 요구 수준에 맞는 인프라가 갖춰져 있습니다.',
    insightMid: '일부 AIO 요소가 적용되었으나 풀스택 적용은 미흡합니다.',
    insightLow: 'AI 시대 인프라가 부재해 즉각적인 AIO 도입이 시급합니다.'
  }
];

window.GRADE_CONFIG = [
  { min: 90, max: 100, key: 'dominant', label: 'AI Dominant', desc: '시장 지배 수준', emoji: '👑' },
  { min: 70, max: 89, key: 'strong', label: 'Strong', desc: '상위권', emoji: '💪' },
  { min: 50, max: 69, key: 'growing', label: 'Growing', desc: '성장 가능', emoji: '📈' },
  { min: 30, max: 49, key: 'weak', label: 'Weak', desc: '위험 단계', emoji: '⚠️' },
  { min: 0, max: 29, key: 'critical', label: 'Critical', desc: '거의 없음', emoji: '🚨' }
];

window.getGrade = function(score) {
  return window.GRADE_CONFIG.find(g => score >= g.min && score <= g.max) || window.GRADE_CONFIG[4];
};

window.getKpiInsight = function(kpi, score) {
  if (score >= 70) return kpi.insightHigh;
  if (score >= 40) return kpi.insightMid;
  return kpi.insightLow;
};

window.getScoreClass = function(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
};
