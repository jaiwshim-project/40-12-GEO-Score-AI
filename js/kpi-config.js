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
    description: 'ChatGPT·Claude·Perplexity 등 7종 AI 봇이 사이트를 크롤링할 수 있는지 측정합니다. robots.txt에서 AI 봇이 차단되어 있으면 LLM 학습 자체가 불가능해 인용·추천에서 사라집니다. 5종 이상 차단 시 신규 개발이 필수적인 결정적 약점이 됩니다.',
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
    description: 'sitemap.xml이 정상 작동하고 충분한 URL이 등록되어 있는지 측정합니다. 검색엔진과 AI 봇이 사이트 구조를 효율적으로 파악하는 핵심 인프라이며, 손상되거나 외부 도메인을 가리키면 색인 효율이 급격히 떨어집니다. 자기 도메인 + 50개 이상 URL이 이상적입니다.',
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
    description: '구글·네이버에 색인된 페이지 수를 측정합니다. 색인 수가 많을수록 AI 검색 결과에 발견될 가능성이 높아지며, 5건 미만일 경우 사실상 AI 인용 자체가 어려워집니다. sitemap·내부 링크 다양성·콘텐츠 신선도가 색인 수의 핵심 결정 요인입니다.',
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
    description: 'Schema.org JSON-LD·FAQPage 등 구조화 마크업 적용도를 측정합니다. AI는 구조화된 정보를 우선 인용하므로, FAQPage·Organization·Article Schema가 적용된 사이트가 답변에 자주 발췌됩니다. 미적용 시 다른 KPI에도 -15% 페널티가 적용되는 결정적 영역입니다.',
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
    description: 'title·description·canonical·og 태그·H1/H2 헤딩 구조의 완비도를 측정합니다. AI가 페이지의 주제와 위계를 정확히 파악하는 1차 정보원으로, 페이지마다 고유한 메타 정보가 있어야 검색·인용 정확도가 높아집니다. 단일 메타로 통일된 사이트는 점수가 낮습니다.',
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
    description: '블로그 발행 빈도·본문 양·최신성을 종합 측정합니다. AI 학습 데이터는 콘텐츠의 양과 다양성에 비례하므로, 30일 주기 발행 + 1500자 이상 본문이 이상적입니다. 단발성 페이지만 있는 사이트는 AI에 학습될 기회가 부족해 인용에서 누락됩니다.',
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
    description: '백링크·언론 보도·외부 매체 언급 수를 측정합니다. AI는 제3자 신호가 풍부한 출처를 선호하므로, 보도자료 발신·블로거 협업·전문 매체 등재가 인용 가중치를 높입니다. 자체 사이트 콘텐츠만 있고 외부 인용이 0건이면 AI 신뢰도가 매우 낮습니다.',
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
    description: '작성자·자격·연혁·연락처 등 신뢰 신호 4축을 측정합니다. 구글이 정의한 Experience·Expertise·Authority·Trust 프레임워크로, 의료·금융·법률 등 YMYL 분야에서 특히 중요합니다. 대표 프로필·자격증·운영 연혁·실명 후기를 노출해 AI 신뢰 가중치를 확보합니다.',
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
    description: '질문형 H2·정의문 H2·브랜드 반복·외부 신호·CTA 도달률 5가지 ai_writing 측정 신호를 측정합니다. 5신호 모두 50% 이상 충족 시 AI 답변에 인용될 가능성이 비약적으로 상승하며, /ai_writing 6원칙 기반 자체 차별점입니다. KPI 4의 직접 산출 지표입니다.',
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
    description: '사용자의 결정적 순간(Category Entry Point)을 표적으로 한 장면형 콘텐츠 보유 정도를 측정합니다. "아침에 갑자기 ○○할 때" 같은 구체적 상황을 다룬 콘텐츠가 풍부할수록 AI가 실사용자 질문에 매칭되어 인용될 가능성이 높아집니다. 자체 차별점입니다.',
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

// 6단계 등급 체계 (각 등급에 50단어 분량 설명 포함)
window.GRADE_CONFIG = [
  // [옵션 4] 임계값 상향 — 60점대 사각지대 제거 (영업 동기 발생 구간 확장)
  {
    min: 95, max: 100, key: 'dominant', label: 'A+ Premium', desc: '최상위', emoji: '👑',
    description: 'ChatGPT·Claude·Perplexity 등 모든 AI 검색에서 우선 인용·추천되는 시장 지배 수준입니다. 외부 인프라(AI 봇 접근·사이트 지도·검색 색인)·구조화 데이터·콘텐츠 깊이·외부 권위가 모두 충족되어 경쟁사가 따라잡기 어렵습니다. 추가 개선보다 모니터링과 미세 조정을 통한 우위 유지에 집중하면 됩니다.',
    action: '운영 유지 (월 50~150만원)'
  },
  {
    min: 85, max: 94, key: 'strong', label: 'A 우수', desc: '우수', emoji: '💪',
    description: 'AI 검색 결과에서 안정적으로 발견되며, 인용·추천 빈도가 상위권에 속합니다. 핵심 기술 신호(AI 봇 접근·구조화 데이터·E-E-A-T)는 모두 갖춰진 상태로, 약점 KPI 한두 개만 추가 강화하면 1위권 도달이 가능한 수준입니다. 콘텐츠 발행 가속과 외부 백링크 확보가 다음 단계 핵심입니다.',
    action: '콘텐츠 강화 (월 50~150만원)'
  },
  {
    min: 70, max: 84, key: 'growing', label: 'B 보통', desc: '보통', emoji: '📈',
    description: '검색 노출 기반은 형성되어 있으나, AI 인용·추천 최적화 측면에서는 미흡합니다. 일반 검색에서는 발견되지만 ChatGPT·Perplexity 답변에 등장할 가능성은 낮습니다. 약점 KPI 2~3개에 집중 투자하면 상위권 진입이 가능합니다. 구조화 데이터와 콘텐츠 깊이 보강이 우선 과제입니다.',
    action: '부분 개선 (200~500만원, 2~4주)'
  },
  {
    min: 55, max: 69, key: 'weak', label: 'C 미흡', desc: '구조 정비 필요', emoji: '⚠️',
    description: 'AI 검색 시대 핵심 신호가 부족해 구조 정비가 시급한 단계입니다. 외부 인프라(사이트 지도·검색 색인)·구조화 데이터·콘텐츠 깊이 중 다수가 임계점 미만이며, 부분 개선만으로 한계가 있을 수 있어 종합적 재설계 검토가 필요합니다. 현재 시스템 수정 가능성을 먼저 확인하세요.',
    action: '전면 개선 또는 신규 개발 비교 (200~400만원)'
  },
  {
    min: 40, max: 54, key: 'poor', label: 'D 부족', desc: '상당한 개선 필요', emoji: '🚨',
    description: 'AI 검색에서 인용·추천이 거의 어려운 상태입니다. 약점 KPI가 다수로 부분 개선보다 신규 개발이 효율적이며, 임대형 시스템이라면 운영자가 자유롭게 콘텐츠를 추가·수정할 수 있는 자체 도메인 구조로 전환하는 것이 우선입니다. 도메인은 유지, 시스템만 교체합니다.',
    action: '신규 개발 권장 (400만원, 3주)'
  },
  {
    min: 0, max: 39, key: 'critical', label: 'F 위급', desc: '신규 개발 필수', emoji: '🚨',
    description: 'AI 검색에서 사실상 발견되지 않는 위급 상태입니다. AI 봇 차단·사이트 지도 부재·색인 누락 등 구조적 결함이 누적되어 기존 구조로는 회복이 어렵습니다. 신규 개발이 필수이며, 도메인은 유지하되 시스템 전체를 AI 친화적으로 교체해야 경쟁 진입이 가능합니다.',
    action: '신규 개발 필수 (400만원, 3주, 즉시)'
  }
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

// ============================================================
// 3축 KPI 레지스트리 (홈페이지 / 블로그 / 글)
// kpi-homepage.js / kpi-blog.js / kpi-article.js를 사전 로드해야 함.
// 각 모듈은 window.HOMEPAGE_KPIS / BLOG_KPIS / ARTICLE_KPIS 와 *_WEIGHTS,
// detectXxxSignals / scoreXxx / computeXxxTotal 함수를 노출.
// ============================================================

window.TARGET_LABELS = {
  homepage: { ko: '홈페이지', en: 'Homepage', icon: '🏠', desc: '회사·기관의 메인 사이트 (인프라 축)' },
  blog:     { ko: '블로그',   en: 'Blog',     icon: '📝', desc: '블로그/콘텐츠 허브 (운영 축)' },
  article:  { ko: '글',       en: 'Article',  icon: '📄', desc: '단일 포스트/페이지 (본문 축)' }
};

window.KPI_REGISTRY = {
  homepage: {
    definitions: () => window.HOMEPAGE_KPIS || [],
    weights:     () => window.HOMEPAGE_WEIGHTS || {},
    detect:      (...args) => (window.detectHomepageSignals ? window.detectHomepageSignals(...args) : {}),
    score:       (signals) => (window.scoreHomepage ? window.scoreHomepage(signals) : {}),
    total:       (scores) => (window.computeHomepageTotal ? window.computeHomepageTotal(scores) : 0)
  },
  blog: {
    definitions: () => window.BLOG_KPIS || [],
    weights:     () => window.BLOG_WEIGHTS || {},
    detect:      (...args) => (window.detectBlogSignals ? window.detectBlogSignals(...args) : {}),
    score:       (signals) => (window.scoreBlog ? window.scoreBlog(signals) : {}),
    total:       (scores) => (window.computeBlogTotal ? window.computeBlogTotal(scores) : 0)
  },
  article: {
    definitions: () => window.ARTICLE_KPIS || [],
    weights:     () => window.ARTICLE_WEIGHTS || {},
    detect:      (...args) => (window.detectArticleSignals ? window.detectArticleSignals(...args) : {}),
    score:       (signals) => (window.scoreArticle ? window.scoreArticle(signals) : {}),
    total:       (scores) => (window.computeArticleTotal ? window.computeArticleTotal(scores) : 0)
  }
};

window.getKPIDefinitions = function(target) {
  if (target && window.KPI_REGISTRY[target]) return window.KPI_REGISTRY[target].definitions();
  return window.KPI_DEFINITIONS;  // 후방호환: 단일 10 KPI
};

window.getKPIWeights = function(target) {
  if (target && window.KPI_REGISTRY[target]) return window.KPI_REGISTRY[target].weights();
  return window.KPI_WEIGHTS;
};

window.computeTargetTotal = function(target, scores) {
  if (target && window.KPI_REGISTRY[target]) return window.KPI_REGISTRY[target].total(scores);
  return window.computeWeightedTotal(scores);
};

/**
 * 3축 점수를 종합하여 단일 종합 점수 산출 (단순 평균; 각 축이 동등 가중).
 * 일부 축만 있어도 산출됨 (분모 보정).
 */
window.compute3AxisOverall = function(targetScores) {
  const ts = targetScores || {};
  const totals = [];
  ['homepage', 'blog', 'article'].forEach(t => {
    if (ts[t] && Object.keys(ts[t]).length > 0) {
      totals.push(window.computeTargetTotal(t, ts[t]));
    }
  });
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
};
