/**
 * GEO Score AI — Homepage KPI (인프라 축, 7 KPI, 가중치 합 100)
 *
 * 진단 대상: 회사·기관의 메인 홈페이지
 * 측정 결: 인프라 신호 (AI 봇 접근, sitemap, 색인, schema, CMS 자율성, CTA, E-E-A-T 페이지)
 *
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 *   score(kpi) = baseline + Σ(signal_count × weight)
 */

window.HOMEPAGE_KPIS = [
  {
    id: 'hp_botAccess',
    name: 'AI 봇 접근',
    nameEn: 'AI Bot Accessibility',
    icon: '🤖',
    color: '#1F6BFF',
    color2: '#0d4ed1',
    weight: 18,
    desc: 'GPTBot/ClaudeBot/PerplexityBot 등 7종 AI 봇이 robots.txt에서 허용되는지',
    description: 'ChatGPT·Claude·Perplexity·Gemini를 포함한 7종 AI 봇(GPTBot, ClaudeBot, PerplexityBot, Google-Extended, cohere-ai, anthropic-ai, CCBot)이 사이트를 크롤링할 수 있는지 측정합니다. robots.txt에서 차단되면 LLM 학습 자체가 불가능해 인용·추천에서 사라집니다. 5종 이상 차단 시 결정적 약점입니다.',
    insightHigh: 'GPTBot·ClaudeBot·PerplexityBot 등 주요 AI 봇이 자유롭게 크롤링 가능합니다.',
    insightMid: '일부 AI 봇만 허용되어 있어 robots.txt 보강이 필요합니다.',
    insightLow: 'AI 봇 차단으로 인해 ChatGPT·Perplexity가 사이트를 학습할 수 없습니다.'
  },
  {
    id: 'hp_sitemap',
    name: 'Sitemap 상태',
    nameEn: 'Sitemap Health',
    icon: '🗺️',
    color: '#06b6d4',
    color2: '#0891b2',
    weight: 12,
    desc: 'sitemap.xml 정상 동작 + URL 50개 이상 등록',
    description: 'sitemap.xml이 정상 작동하고 충분한 URL(50개 이상)이 등록되어 있는지 측정합니다. 검색·AI 봇이 사이트 구조를 파악하는 핵심 인프라이며, 손상되거나 외부 도메인을 가리키면 색인 효율이 급락합니다. lastmod 갱신이 함께 되어야 신선도 신호가 전달됩니다.',
    insightHigh: 'sitemap.xml이 정상 작동하며 URL 등록과 lastmod 갱신이 충분합니다.',
    insightMid: 'sitemap은 존재하나 URL 누락이 많거나 lastmod 갱신이 미흡합니다.',
    insightLow: 'sitemap.xml이 없거나 접근 불가 상태로 색인 효율이 매우 낮습니다.'
  },
  {
    id: 'hp_schema',
    name: '구조화 데이터',
    nameEn: 'Structured Data',
    icon: '📐',
    color: '#a855f7',
    color2: '#7c3aed',
    weight: 16,
    desc: 'JSON-LD/Schema.org/FAQPage/Organization/Article 마크업',
    description: 'Schema.org JSON-LD 마크업(Organization, FAQPage, Article, LocalBusiness 등)의 적용도를 측정합니다. AI는 구조화된 정보를 우선 인용하므로, FAQPage·Organization Schema가 적용된 사이트가 답변에 자주 발췌됩니다. 미적용 시 다른 KPI에도 -15% 페널티가 적용되는 결정적 영역입니다.',
    insightHigh: 'JSON-LD·FAQPage·Organization 마크업이 잘 적용되어 AI 인용에 유리합니다.',
    insightMid: '일부 구조화 데이터만 적용되어 있어 FAQPage·Organization 보강이 필요합니다.',
    insightLow: '구조화 데이터가 없어 AI가 콘텐츠를 정확히 이해하기 어렵습니다.'
  },
  {
    id: 'hp_indexExposure',
    name: '검색 색인',
    nameEn: 'Search Index Volume',
    icon: '🔎',
    color: '#0095ff',
    color2: '#0073cc',
    weight: 14,
    desc: '구글·네이버에 색인된 페이지 수',
    description: '구글·네이버에 색인된 페이지 수를 측정합니다. 색인 수가 많을수록 AI 검색 결과에서 발견될 가능성이 높아지며, 5건 미만일 경우 사실상 AI 인용이 어렵습니다. sitemap·내부 링크 다양성·콘텐츠 신선도가 색인 수의 핵심 결정 요인입니다.',
    insightHigh: '구글·네이버에 다수 페이지가 색인되어 검색 노출 기반이 탄탄합니다.',
    insightMid: '일부 페이지만 색인되어 있어 색인 누락 페이지 점검이 필요합니다.',
    insightLow: '색인된 페이지가 거의 없어 검색에서 발견되지 않습니다.'
  },
  {
    id: 'hp_cmsAutonomy',
    name: 'CMS 자율성',
    nameEn: 'CMS Autonomy',
    icon: '🛠️',
    color: '#10b981',
    color2: '#047857',
    weight: 12,
    desc: '운영자가 직접 글/페이지 추가·수정 가능 여부',
    description: '운영자가 외부 개발사 없이 직접 글·페이지·메뉴를 추가·수정할 수 있는지 측정합니다. 임대형 또는 폐쇄형 CMS는 콘텐츠 발행 속도가 느려 AI 학습 데이터 누적이 어렵습니다. WordPress·Webflow·자체 CMS 등 자율적 CMS가 이상적입니다.',
    insightHigh: '운영자가 자유롭게 글·페이지를 추가/수정할 수 있는 자율 CMS입니다.',
    insightMid: '제한적 수정만 가능하여 외부 의뢰 없이 처리 가능한 영역이 좁습니다.',
    insightLow: '임대/폐쇄형 시스템으로 콘텐츠 발행 자율성이 거의 없습니다.'
  },
  {
    id: 'hp_ctaDesign',
    name: 'CTA 설계',
    nameEn: 'CTA Design',
    icon: '🎯',
    color: '#f59e0b',
    color2: '#d97706',
    weight: 14,
    desc: '상담/예약/문의 CTA + 랜딩 페이지 완비도',
    description: '상담 신청·예약·문의 CTA가 페이지에 명확히 배치되고, 클릭 시 랜딩/폼으로 자연스럽게 연결되는지 측정합니다. AI가 사용자에게 추천할 때 "어떻게 행동해야 하는지" 명확한 사이트가 우선됩니다. 800자 블록당 CTA 1개 이상이 이상적입니다.',
    insightHigh: '상담/예약/문의 CTA가 충분히 배치되고 랜딩까지 연결됩니다.',
    insightMid: 'CTA가 일부 존재하나 랜딩 연결이나 위치 최적화가 미흡합니다.',
    insightLow: 'CTA가 거의 없어 방문자가 행동으로 전환되기 어렵습니다.'
  },
  {
    id: 'hp_eeatPage',
    name: 'E-E-A-T 페이지',
    nameEn: 'E-E-A-T Pages',
    icon: '🏆',
    color: '#00d68f',
    color2: '#00b87c',
    weight: 14,
    desc: '대표/자격/연혁/연락처/오시는 길 등 신뢰 페이지',
    description: '대표 인사말·자격증·운영 연혁·연락처·오시는 길 등 E-E-A-T(Experience·Expertise·Authority·Trust) 신뢰 신호 페이지의 완비도를 측정합니다. 의료·금융·법률 등 YMYL 분야에서 특히 중요하며, AI 신뢰 가중치를 직접 결정합니다.',
    insightHigh: '대표/자격/연혁/연락처 페이지가 완비되어 AI 신뢰 가중치가 높습니다.',
    insightMid: '일부 신뢰 신호 페이지만 노출되어 추가 보강이 필요합니다.',
    insightLow: 'E-E-A-T 신뢰 신호 페이지가 부재해 AI가 인용을 망설입니다.'
  }
];

window.HOMEPAGE_WEIGHTS = window.HOMEPAGE_KPIS.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});

/**
 * Homepage 신호 검출 (결정적)
 * @param {string} html - 메인 페이지 HTML
 * @param {object} meta - { title, description, ogTags, canonical, h1, h2 }
 * @param {object} urlInfo - { robotsTxt, sitemapXml, indexedCount, schemaTypes, ctaCount, hasContactPage, ... }
 * @returns {object} { hp_botAccess: {value, reason}, ... }
 */
window.detectHomepageSignals = function(html, meta, urlInfo) {
  const text = (html || '').toLowerCase();
  const robots = (urlInfo?.robotsTxt || '').toLowerCase();
  const sitemap = (urlInfo?.sitemapXml || '').toLowerCase();

  // 1) AI 봇 접근 — 7종 봇 차단 여부
  const aiBots = ['gptbot', 'claudebot', 'perplexitybot', 'google-extended', 'cohere-ai', 'anthropic-ai', 'ccbot'];
  const blockedBots = aiBots.filter(bot => {
    // robots.txt에 "User-agent: bot ... Disallow: /" 패턴
    const re = new RegExp(`user-agent:\\s*${bot}[^\\n]*\\n[^\\n]*disallow:\\s*/`, 'i');
    return re.test(robots);
  });
  const allBlocked = /user-agent:\s*\*[^\n]*\n[^\n]*disallow:\s*\/\s*$/im.test(robots);
  const allowedCount = aiBots.length - blockedBots.length - (allBlocked ? 7 : 0);

  // 2) Sitemap — 존재 + URL 수 + lastmod
  const sitemapPresent = !!urlInfo?.sitemapXml && urlInfo.sitemapXml.length > 100;
  const urlMatches = (sitemap.match(/<loc>/g) || []).length;
  const lastmodCount = (sitemap.match(/<lastmod>/g) || []).length;

  // 3) Schema — JSON-LD 발견 수 + 타입 다양성
  const jsonLdMatches = (html || '').match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || [];
  const schemaTypes = urlInfo?.schemaTypes || [];
  const hasFaqPage = schemaTypes.includes('FAQPage') || /"@type"\s*:\s*"FAQPage"/i.test(html || '');
  const hasOrg = schemaTypes.includes('Organization') || /"@type"\s*:\s*"Organization"/i.test(html || '');
  const hasArticle = schemaTypes.includes('Article') || /"@type"\s*:\s*"Article"/i.test(html || '');

  // 4) 색인 수
  const indexedCount = Number(urlInfo?.indexedCount || 0);

  // 5) CMS 자율성 (휴리스틱: WordPress/Webflow/Wix/Cafe24 등 키워드)
  const cmsKeywords = {
    autonomous: /wp-content|wp-includes|wordpress|webflow|squarespace|ghost|tistory|notion-static|next\.js|gatsby/i,
    limited: /wix|cafe24|imweb|godo|makeshop/i,
    rented: /modoo\.at|imartin|simplemall|smarteasy/i
  };
  let cmsLevel = 'unknown';
  if (cmsKeywords.autonomous.test(html || '')) cmsLevel = 'autonomous';
  else if (cmsKeywords.limited.test(html || '')) cmsLevel = 'limited';
  else if (cmsKeywords.rented.test(html || '')) cmsLevel = 'rented';

  // 6) CTA 설계
  const ctaPatterns = /(상담|예약|문의|신청|견적|체험|시작|연락|call|consult|book|inquiry)/gi;
  const ctaCount = (text.match(ctaPatterns) || []).length;
  const hasContactForm = /<form[^>]*>[\s\S]*?<input/i.test(html || '');
  const hasPhoneNumber = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(html || '');

  // 7) E-E-A-T 페이지
  const eeatPatterns = {
    representative: /(대표|원장|대표자|ceo|founder)/i,
    qualification: /(자격증|면허|학위|자격|certifi|licen|degree|박사|전문의|박사학위)/i,
    history: /(연혁|설립|since|established|개원|since\s*\d{4}|\d+\s*년\s*경력)/i,
    contact: /(연락처|오시는\s*길|찾아오시는|address|tel:|mailto:)/i
  };
  const eeatHits = Object.entries(eeatPatterns).filter(([_, re]) => re.test(html || '')).length;

  return {
    hp_botAccess: { allowedCount, blockedBots, allBlocked },
    hp_sitemap: { present: sitemapPresent, urlCount: urlMatches, lastmodCount },
    hp_schema: { jsonLdCount: jsonLdMatches.length, hasFaqPage, hasOrg, hasArticle, types: schemaTypes },
    hp_indexExposure: { indexedCount },
    hp_cmsAutonomy: { level: cmsLevel },
    hp_ctaDesign: { ctaCount, hasContactForm, hasPhoneNumber },
    hp_eeatPage: { hits: eeatHits, max: 4 }
  };
};

/**
 * Homepage 신호 → 점수 (결정적, 0~100)
 */
window.scoreHomepage = function(signals) {
  const s = signals || {};
  const out = {};

  // hp_botAccess: 7종 중 허용 수에 비례 (0~100). 전부 차단 시 0.
  {
    const a = s.hp_botAccess || {};
    if (a.allBlocked) out.hp_botAccess = { value: 0, reason: 'robots.txt 전체 차단' };
    else {
      const v = Math.round((Math.max(0, Math.min(7, a.allowedCount || 0)) / 7) * 100);
      out.hp_botAccess = { value: v, reason: `AI 봇 ${a.allowedCount || 0}/7종 허용` };
    }
  }

  // hp_sitemap: 존재(40) + URL 수(URL/50 비례, 최대 40) + lastmod(20)
  {
    const a = s.hp_sitemap || {};
    let v = 0;
    if (a.present) v += 40;
    v += Math.min(40, Math.round((a.urlCount || 0) / 50 * 40));
    if (a.lastmodCount > 0) v += 20;
    out.hp_sitemap = { value: Math.min(100, v), reason: `URL ${a.urlCount || 0}개, lastmod ${a.lastmodCount || 0}개` };
  }

  // hp_schema: JSON-LD 1개 +30, FAQPage +25, Organization +25, Article +20
  {
    const a = s.hp_schema || {};
    let v = 0;
    if (a.jsonLdCount > 0) v += 30;
    if (a.hasFaqPage) v += 25;
    if (a.hasOrg) v += 25;
    if (a.hasArticle) v += 20;
    out.hp_schema = { value: Math.min(100, v), reason: `JSON-LD ${a.jsonLdCount || 0}, FAQ ${a.hasFaqPage ? '✓' : '✗'}, Org ${a.hasOrg ? '✓' : '✗'}` };
  }

  // hp_indexExposure: 색인 수 로그 스케일 (5건=20, 50건=60, 500건=90, 5000+=100)
  {
    const n = (s.hp_indexExposure?.indexedCount) || 0;
    let v = 0;
    if (n >= 5000) v = 100;
    else if (n >= 500) v = 90;
    else if (n >= 100) v = 75;
    else if (n >= 50) v = 60;
    else if (n >= 10) v = 35;
    else if (n >= 5) v = 20;
    else v = Math.round(n * 4);
    out.hp_indexExposure = { value: v, reason: `${n}건 색인` };
  }

  // hp_cmsAutonomy: autonomous=90, limited=55, rented=20, unknown=50
  {
    const lvl = s.hp_cmsAutonomy?.level || 'unknown';
    const map = { autonomous: 90, limited: 55, rented: 20, unknown: 50 };
    out.hp_cmsAutonomy = { value: map[lvl], reason: `CMS 유형: ${lvl}` };
  }

  // hp_ctaDesign: CTA 패턴 수(최대 50) + 폼(25) + 전화(25)
  {
    const a = s.hp_ctaDesign || {};
    let v = 0;
    v += Math.min(50, (a.ctaCount || 0) * 5);
    if (a.hasContactForm) v += 25;
    if (a.hasPhoneNumber) v += 25;
    out.hp_ctaDesign = { value: Math.min(100, v), reason: `CTA ${a.ctaCount || 0}개, 폼 ${a.hasContactForm ? '✓' : '✗'}, 전화 ${a.hasPhoneNumber ? '✓' : '✗'}` };
  }

  // hp_eeatPage: 4신호 중 hit 수 비례
  {
    const a = s.hp_eeatPage || {};
    const v = Math.round((a.hits || 0) / (a.max || 4) * 100);
    out.hp_eeatPage = { value: v, reason: `E-E-A-T ${a.hits || 0}/4 신호 발견` };
  }

  return out;
};

/**
 * Homepage 가중 평균 (0~100)
 */
window.computeHomepageTotal = function(scores) {
  return _weightedAverage(scores, window.HOMEPAGE_WEIGHTS);
};

// 내부 유틸: scores 객체에서 가중평균 계산 (kpi-config.js와 공유 가능)
function _weightedAverage(scores, weights) {
  if (!scores || !weights) return 0;
  let sum = 0, total = 0;
  Object.entries(weights).forEach(([id, w]) => {
    const raw = scores[id];
    if (raw === undefined || raw === null) return;
    const v = (typeof raw === 'object') ? Number(raw.value) : Number(raw);
    if (!isFinite(v)) return;
    sum += v * w;
    total += w;
  });
  return total === 0 ? 0 : Math.round(sum / total);
}
