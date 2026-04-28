/**
 * GEO Score AI - 새 10 KPI 정의 (옵션 B: AX Biz Group 영업 리포트 표준 8 + 자체 차별점 2)
 * AI 검색 시대 기업 존재력 측정 프레임워크 (가중치 합 100%)
 */

window.KPI_DEFINITIONS = [
  {
    id: 'botAccess',
    name: 'AI 봇 접근',
    nameEn: 'AI Bot Accessibility',
    icon: '🤖',
    color: '#1F6BFF',
    color2: '#0d4ed1',
    weight: 14,
    desc: 'ChatGPT/Claude/Perplexity 등 AI 봇이 사이트에 접근 가능한지 측정',
    insightHigh: 'GPTBot·ClaudeBot·PerplexityBot 등 주요 AI 봇이 자유롭게 크롤링 가능합니다.',
    insightMid: '일부 AI 봇만 허용되어 있어 robots.txt·헤더 설정 보강이 필요합니다.',
    insightLow: 'AI 봇 차단으로 인해 ChatGPT·Perplexity가 사이트를 학습할 수 없습니다.'
  },
  {
    id: 'sitemapStatus',
    name: 'Sitemap 상태',
    nameEn: 'Sitemap Health',
    icon: '🗺️',
    color: '#06b6d4',
    color2: '#0891b2',
    weight: 10,
    desc: '사이트 지도 정상 작동 + URL 등록 수',
    insightHigh: 'sitemap.xml이 정상 작동하며 충분한 URL이 등록되어 있습니다.',
    insightMid: 'sitemap은 존재하나 URL 누락이 많거나 lastmod 갱신이 미흡합니다.',
    insightLow: 'sitemap.xml이 없거나 접근 불가 상태로 색인 효율이 매우 낮습니다.'
  },
  {
    id: 'indexExposure',
    name: '검색 색인',
    nameEn: 'Search Index Volume',
    icon: '🔎',
    color: '#0095ff',
    color2: '#0073cc',
    weight: 13,
    desc: '구글·네이버에 색인된 페이지 수',
    insightHigh: '구글·네이버에 다수 페이지가 색인되어 검색 노출 기반이 탄탄합니다.',
    insightMid: '일부 페이지만 색인되어 있어 색인 누락 페이지 점검이 필요합니다.',
    insightLow: '색인된 페이지가 거의 없어 검색에서 발견되지 않습니다.'
  },
  {
    id: 'structuredData',
    name: '구조화 데이터',
    nameEn: 'Structured Data',
    icon: '📐',
    color: '#a855f7',
    color2: '#7c3aed',
    weight: 12,
    desc: 'Schema.org · FAQ · JSON-LD 마크업 적용도',
    insightHigh: 'Schema.org JSON-LD·FAQPage 마크업이 잘 적용되어 AI 인용에 유리합니다.',
    insightMid: '일부 구조화 데이터만 적용되어 있어 FAQPage·Organization 보강이 필요합니다.',
    insightLow: '구조화 데이터가 없어 AI가 콘텐츠를 정확히 이해하기 어렵습니다.'
  },
  {
    id: 'pageInfo',
    name: '페이지 정보',
    nameEn: 'Page Metadata',
    icon: '📄',
    color: '#00d68f',
    color2: '#00b87c',
    weight: 8,
    desc: '메타 태그·canonical·OG·H1/H2 완비도',
    insightHigh: '메타 태그·OG·canonical·H1/H2가 모두 갖춰져 있습니다.',
    insightMid: '일부 메타 정보가 누락되어 있어 OG 태그·canonical 보강이 필요합니다.',
    insightLow: '메타 태그·헤딩 구조가 부재해 페이지 정보가 AI에 전달되지 않습니다.'
  },
  {
    id: 'contentDepth',
    name: '콘텐츠 깊이',
    nameEn: 'Content Depth',
    icon: '📚',
    color: '#ff6b35',
    color2: '#ff4500',
    weight: 10,
    desc: '블로그 발행 빈도 · 본문 양 · 최신성',
    insightHigh: '꾸준한 발행과 충분한 본문 깊이로 AI 학습 데이터가 풍부합니다.',
    insightMid: '간헐적 발행 또는 본문 길이가 부족해 콘텐츠 자산 누적이 더딥니다.',
    insightLow: '신규 콘텐츠와 본문 깊이가 부족해 AI에 학습될 기회가 거의 없습니다.'
  },
  {
    id: 'externalAuthority',
    name: '외부 권위',
    nameEn: 'External Authority',
    icon: '🌐',
    color: '#ec4899',
    color2: '#be185d',
    weight: 9,
    desc: '백링크 · 언론 보도 · 외부 언급',
    insightHigh: '언론 보도와 외부 백링크가 누적되어 권위가 충분합니다.',
    insightMid: '일부 외부 언급이 있으나 보도자료·백링크 추가 확보가 필요합니다.',
    insightLow: '외부 언급·백링크가 거의 없어 AI 신뢰 가중치가 낮습니다.'
  },
  {
    id: 'eeat',
    name: 'E-E-A-T 신호',
    nameEn: 'E-E-A-T Signals',
    icon: '🏆',
    color: '#00d68f',
    color2: '#00b87c',
    weight: 8,
    desc: '작성자·자격·연혁·연락처 신뢰 신호',
    insightHigh: '저자·자격·연혁·연락처가 노출되어 AI 신뢰 가중치가 높습니다.',
    insightMid: '일부 신뢰 신호만 노출되어 저자 프로필·자격 강화가 필요합니다.',
    insightLow: 'E-E-A-T 신뢰 신호가 부재해 AI가 인용을 망설입니다.'
  },
  {
    id: 'aiCitation',
    name: 'AI 인용 5신호 ⭐',
    nameEn: 'AI Citation Signals',
    icon: '⭐',
    color: '#ffa800',
    color2: '#ff8800',
    weight: 10,
    desc: 'ai_writing 5신호 (질문형/정의문 H2·브랜드반복·외부신호·CTA) — 자체 차별점',
    insightHigh: '질문형·정의문 H2·브랜드 반복·외부신호·CTA 도달이 모두 충족되어 AI가 인용하기 좋습니다.',
    insightMid: '일부 신호만 충족되어 질문형 H2·정의문·브랜드 반복 보강이 필요합니다.',
    insightLow: 'AI 인용 5신호가 거의 부재해 LLM 답변에 등장할 가능성이 매우 낮습니다.'
  },
  {
    id: 'cepScene',
    name: 'CEP 장면 점유 ⭐',
    nameEn: 'CEP Scene Capture',
    icon: '🎯',
    color: '#f59e0b',
    color2: '#d97706',
    weight: 6,
    desc: '"순간(scene)" 콘텐츠 — 자체 차별점',
    insightHigh: '소비자의 결정적 순간(CEP)을 정조준한 장면형 콘텐츠가 풍부합니다.',
    insightMid: '일부 CEP 장면을 다루고 있으나 장면 다양성과 깊이 보강이 필요합니다.',
    insightLow: 'CEP 장면을 다룬 콘텐츠가 거의 없어 순간 점유 기회를 놓치고 있습니다.'
  }
];

// 가중치 맵 (합 100)
window.KPI_WEIGHTS = {
  botAccess: 14,
  sitemapStatus: 10,
  indexExposure: 13,
  structuredData: 12,
  pageInfo: 8,
  contentDepth: 10,
  externalAuthority: 9,
  eeat: 8,
  aiCitation: 10,
  cepScene: 6
};

// 6단계 등급 체계
window.GRADE_CONFIG = [
  { min: 90, max: 100, key: 'dominant', label: 'A+ Premium', desc: '최상위', emoji: '👑' },
  { min: 75, max: 89,  key: 'strong',   label: 'A 우수',     desc: '우수',   emoji: '💪' },
  { min: 60, max: 74,  key: 'growing',  label: 'B 보통',     desc: '보통',   emoji: '📈' },
  { min: 45, max: 59,  key: 'weak',     label: 'C 미흡',     desc: '미흡',   emoji: '⚠️' },
  { min: 30, max: 44,  key: 'poor',     label: 'D 부족',     desc: '부족',   emoji: '🚨' },
  { min: 0,  max: 29,  key: 'critical', label: 'F 잠금',     desc: '잠금',   emoji: '🔒' }
];

window.getGrade = function(score) {
  return window.GRADE_CONFIG.find(g => score >= g.min && score <= g.max) || window.GRADE_CONFIG[window.GRADE_CONFIG.length - 1];
};

window.getKpiInsight = function(kpi, score) {
  if (score >= 75) return kpi.insightHigh;
  if (score >= 45) return kpi.insightMid;
  return kpi.insightLow;
};

window.getScoreClass = function(score) {
  if (score >= 75) return 'high';
  if (score >= 45) return 'mid';
  return 'low';
};

// 옛 10 KPI → 새 10 KPI 매핑 (legacy 호환)
window.LEGACY_KPI_MAP = {
  visibility: 'indexExposure',
  velocity: 'contentDepth',
  authority: 'eeat',
  citation: 'aiCitation',
  engagement: 'externalAuthority',
  conversion: 'aiCitation',
  channel: 'contentDepth',
  brand: 'aiCitation',
  competitive: 'externalAuthority',
  aio: 'structuredData'
};

/**
 * 옛 진단 데이터(visibility/velocity/...)를 새 KPI 점수로 변환.
 * 이미 새 KPI 키(botAccess 등)가 들어있으면 그대로 반환.
 * 입력은 { kpiId: { value, reason, ... } } 또는 { kpiId: number } 둘 다 허용.
 */
window.migrateLegacyScores = function(scores) {
  if (!scores || typeof scores !== 'object') return scores;

  const newKeys = Object.keys(window.KPI_WEIGHTS);
  const inputKeys = Object.keys(scores);

  // 새 KPI 데이터로 판단되면 그대로 반환
  const hasNewKey = inputKeys.some(k => newKeys.includes(k));
  const hasLegacyKey = inputKeys.some(k => Object.prototype.hasOwnProperty.call(window.LEGACY_KPI_MAP, k));
  if (hasNewKey && !hasLegacyKey) return scores;

  // 매핑 누적용 버킷 (다대일 매핑이 있으므로 평균 처리)
  const buckets = {};
  newKeys.forEach(k => { buckets[k] = { sum: 0, count: 0, reasons: [], legacyFrom: [] }; });

  inputKeys.forEach(legacyKey => {
    const target = window.LEGACY_KPI_MAP[legacyKey];
    if (!target) return;
    const raw = scores[legacyKey];
    const value = (raw && typeof raw === 'object') ? Number(raw.value) : Number(raw);
    if (!isFinite(value)) return;
    const reason = (raw && typeof raw === 'object' && raw.reason) ? raw.reason : null;
    buckets[target].sum += value;
    buckets[target].count += 1;
    buckets[target].legacyFrom.push(legacyKey);
    if (reason) buckets[target].reasons.push(reason);
  });

  // 매핑되지 않은 새 KPI는 50(중립)으로 채움
  const migrated = {};
  newKeys.forEach(k => {
    const b = buckets[k];
    if (b.count > 0) {
      migrated[k] = {
        value: Math.round(b.sum / b.count),
        reason: b.reasons[0] || `legacy 매핑 (${b.legacyFrom.join(', ')})`,
        legacyFrom: b.legacyFrom
      };
    } else {
      migrated[k] = { value: 50, reason: '레거시 데이터 없음 — 중립값 적용', legacyFrom: [] };
    }
  });

  return migrated;
};

/**
 * 새 KPI 가중치 평균. scores는 { kpiId: { value } } 또는 { kpiId: number }.
 * 누락된 KPI는 가중치에서 제외(분모 보정).
 */
window.computeWeightedTotal = function(scores) {
  if (!scores || typeof scores !== 'object') return 0;
  let weightedSum = 0;
  let weightTotal = 0;
  Object.entries(window.KPI_WEIGHTS).forEach(([id, weight]) => {
    const raw = scores[id];
    if (raw === undefined || raw === null) return;
    const value = (typeof raw === 'object') ? Number(raw.value) : Number(raw);
    if (!isFinite(value)) return;
    weightedSum += value * weight;
    weightTotal += weight;
  });
  if (weightTotal === 0) return 0;
  return Math.round(weightedSum / weightTotal);
};
