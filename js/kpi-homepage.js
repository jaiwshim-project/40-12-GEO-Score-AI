/**
 * GEO Score AI — Homepage KPI (인프라 축, 10 KPI, 가중치 합 100)
 *
 * 진단 대상: 회사·기관의 메인 홈페이지
 * 측정 결: 인프라 + 기술 + 신뢰 신호
 * 출처: 원본 단일 10 KPI (botAccess/sitemapStatus/indexExposure/structuredData/pageInfo/externalAuthority/eeat) +
 *      AXOS 페널티 매트릭스 (CMS 자율성) + Google Core Web Vitals
 *
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 *   score(kpi) = baseline + Σ(signal_count × weight)
 */

window.HOMEPAGE_KPIS = [
  {
    id: 'hp_botAccess', name: 'AI 봇 접근', nameEn: 'AI Bot Accessibility',
    icon: '🤖', color: '#1F6BFF', color2: '#0d4ed1', weight: 12,
    desc: 'GPTBot/ClaudeBot/PerplexityBot 등 7종 AI 봇이 robots.txt에서 허용되는지',
    description: 'ChatGPT·Claude·Perplexity·Gemini를 포함한 7종 AI 봇(GPTBot, ClaudeBot, PerplexityBot, Google-Extended, cohere-ai, anthropic-ai, CCBot)이 사이트를 크롤링할 수 있는지 측정합니다. robots.txt에서 차단되면 LLM 학습 자체가 불가능해 인용·추천에서 사라집니다.',
    insightHigh: 'GPTBot·ClaudeBot·PerplexityBot 등 주요 AI 봇이 자유롭게 크롤링 가능합니다.',
    insightMid: '일부 AI 봇만 허용되어 있어 robots.txt 보강이 필요합니다.',
    insightLow: 'AI 봇 차단으로 인해 ChatGPT·Perplexity가 사이트를 학습할 수 없습니다.'
  },
  {
    id: 'hp_sitemap', name: 'Sitemap 상태', nameEn: 'Sitemap Health',
    icon: '🗺️', color: '#06b6d4', color2: '#0891b2', weight: 9,
    desc: 'sitemap.xml 정상 동작 + URL 50개 이상 등록',
    description: 'sitemap.xml이 정상 작동하고 충분한 URL(50개 이상)이 등록되어 있는지 측정합니다. 검색·AI 봇이 사이트 구조를 파악하는 핵심 인프라이며, 손상되거나 외부 도메인을 가리키면 색인 효율이 급락합니다.',
    insightHigh: 'sitemap.xml이 정상 작동하며 URL 등록과 lastmod 갱신이 충분합니다.',
    insightMid: 'sitemap은 존재하나 URL 누락이 많거나 lastmod 갱신이 미흡합니다.',
    insightLow: 'sitemap.xml이 없거나 접근 불가 상태로 색인 효율이 매우 낮습니다.'
  },
  {
    id: 'hp_indexExposure', name: '검색 색인', nameEn: 'Search Index Volume',
    icon: '🔎', color: '#0095ff', color2: '#0073cc', weight: 11,
    desc: '구글·네이버에 색인된 페이지 수',
    description: '구글·네이버에 색인된 페이지 수를 측정합니다. 색인 수가 많을수록 AI 검색 결과에서 발견될 가능성이 높아지며, 5건 미만일 경우 사실상 AI 인용이 어렵습니다.',
    insightHigh: '구글·네이버에 다수 페이지가 색인되어 검색 노출 기반이 탄탄합니다.',
    insightMid: '일부 페이지만 색인되어 있어 색인 누락 페이지 점검이 필요합니다.',
    insightLow: '색인된 페이지가 거의 없어 검색에서 발견되지 않습니다.'
  },
  {
    id: 'hp_schema', name: '구조화 데이터', nameEn: 'Structured Data',
    icon: '📐', color: '#a855f7', color2: '#7c3aed', weight: 12,
    desc: 'JSON-LD/Schema.org/FAQPage/Organization/Article 마크업',
    description: 'Schema.org JSON-LD 마크업(Organization, FAQPage, Article, LocalBusiness 등)의 적용도를 측정합니다. AI는 구조화된 정보를 우선 인용하므로, FAQPage·Organization Schema가 적용된 사이트가 답변에 자주 발췌됩니다.',
    insightHigh: 'JSON-LD·FAQPage·Organization 마크업이 잘 적용되어 AI 인용에 유리합니다.',
    insightMid: '일부 구조화 데이터만 적용되어 있어 FAQPage·Organization 보강이 필요합니다.',
    insightLow: '구조화 데이터가 없어 AI가 콘텐츠를 정확히 이해하기 어렵습니다.'
  },
  {
    id: 'hp_pageInfo', name: '페이지 정보', nameEn: 'Page Metadata',
    icon: '📄', color: '#00d68f', color2: '#00b87c', weight: 8,
    desc: 'title/description/canonical/OG/H1·H2 메타 완비도',
    description: 'title·description·canonical·OG 태그·H1/H2 헤딩 구조의 완비도를 측정합니다. AI가 페이지의 주제와 위계를 정확히 파악하는 1차 정보원으로, 페이지마다 고유한 메타 정보가 있어야 검색·인용 정확도가 높아집니다.',
    insightHigh: 'title/description/canonical/OG/H1 등 메타 정보가 모두 완비되어 있습니다.',
    insightMid: '일부 메타 정보가 누락되어 OG 태그·canonical 보강이 필요합니다.',
    insightLow: '메타 태그·헤딩 구조가 부재해 페이지 정보가 AI에 전달되지 않습니다.'
  },
  {
    id: 'hp_externalAuthority', name: '외부 권위', nameEn: 'External Authority',
    icon: '🌐', color: '#ec4899', color2: '#be185d', weight: 9,
    desc: '백링크·언론 보도·외부 매체 언급',
    description: '백링크·언론 보도·외부 매체 언급 수를 측정합니다. AI는 제3자 신호가 풍부한 출처를 선호하므로, 보도자료 발신·블로거 협업·전문 매체 등재가 인용 가중치를 높입니다.',
    insightHigh: '언론 보도와 외부 백링크가 누적되어 권위가 충분합니다.',
    insightMid: '일부 외부 언급이 있으나 보도자료·백링크 추가 확보가 필요합니다.',
    insightLow: '외부 언급·백링크가 거의 없어 AI 신뢰 가중치가 낮습니다.'
  },
  {
    id: 'hp_eeatPage', name: 'E-E-A-T 페이지', nameEn: 'E-E-A-T Pages',
    icon: '🏆', color: '#22c55e', color2: '#15803d', weight: 9,
    desc: '대표/자격/연혁/연락처/오시는 길 등 신뢰 페이지',
    description: '대표 인사말·자격증·운영 연혁·연락처·오시는 길 등 E-E-A-T(Experience·Expertise·Authority·Trust) 신뢰 신호 페이지의 완비도를 측정합니다. 의료·금융·법률 등 YMYL 분야에서 특히 중요합니다.',
    insightHigh: '대표/자격/연혁/연락처 페이지가 완비되어 AI 신뢰 가중치가 높습니다.',
    insightMid: '일부 신뢰 신호 페이지만 노출되어 추가 보강이 필요합니다.',
    insightLow: 'E-E-A-T 신뢰 신호 페이지가 부재해 AI가 인용을 망설입니다.'
  },
  {
    id: 'hp_cmsAutonomy', name: 'CMS 자율성', nameEn: 'CMS Autonomy',
    icon: '🛠️', color: '#10b981', color2: '#047857', weight: 8,
    desc: '운영자가 직접 글/페이지 추가·수정 가능 여부',
    description: '운영자가 외부 개발사 없이 직접 글·페이지·메뉴를 추가·수정할 수 있는지 측정합니다. 임대형 또는 폐쇄형 CMS는 콘텐츠 발행 속도가 느려 AI 학습 데이터 누적이 어렵습니다.',
    insightHigh: '운영자가 자유롭게 글·페이지를 추가/수정할 수 있는 자율 CMS입니다.',
    insightMid: '제한적 수정만 가능하여 외부 의뢰 없이 처리 가능한 영역이 좁습니다.',
    insightLow: '임대/폐쇄형 시스템으로 콘텐츠 발행 자율성이 거의 없습니다.'
  },
  {
    id: 'hp_ctaDesign', name: 'CTA 설계', nameEn: 'CTA Design',
    icon: '🎯', color: '#f59e0b', color2: '#d97706', weight: 12,
    desc: '상담/예약/문의 CTA + 랜딩 페이지 완비도',
    description: '상담 신청·예약·문의 CTA가 페이지에 명확히 배치되고, 클릭 시 랜딩/폼으로 자연스럽게 연결되는지 측정합니다. AI가 사용자에게 추천할 때 "어떻게 행동해야 하는지" 명확한 사이트가 우선됩니다.',
    insightHigh: '상담/예약/문의 CTA가 충분히 배치되고 랜딩까지 연결됩니다.',
    insightMid: 'CTA가 일부 존재하나 랜딩 연결이나 위치 최적화가 미흡합니다.',
    insightLow: 'CTA가 거의 없어 방문자가 행동으로 전환되기 어렵습니다.'
  },
  {
    id: 'hp_mobilePerf', name: '모바일 성능', nameEn: 'Mobile Performance',
    icon: '📱', color: '#3b82f6', color2: '#1d4ed8', weight: 10,
    desc: '모바일 반응형 + Core Web Vitals',
    description: '모바일 반응형 디자인 적용도와 Core Web Vitals(LCP, FID, CLS) 신호를 측정합니다. Google이 모바일 우선 색인을 시행하므로, 모바일 성능이 떨어지면 색인·랭킹·AI 추천에서 모두 불리합니다. viewport 메타 + 반응형 CSS + 이미지 최적화가 핵심입니다.',
    insightHigh: '모바일 반응형 + viewport + 빠른 로딩이 모두 충족됩니다.',
    insightMid: '일부 모바일 신호만 충족되어 viewport·반응형 보강이 필요합니다.',
    insightLow: '모바일 미대응으로 검색·AI 추천에서 모두 불리합니다.'
  },
  {
    id: 'hp_aiCitability', name: 'AI 인용 가능성', nameEn: 'AI Citability',
    icon: '🤖', color: '#ec4899', color2: '#be185d', weight: 12,
    desc: 'Gemini 시뮬레이션 인용율 (실측)',
    description: '홈페이지 본문 텍스트로 6개 가상 사용자 질문을 만들고 AI가 답변에 브랜드를 인용하는지 측정합니다. Perplexity·SearchGPT·AI Overview에서 실제 인용될 가능성의 대리 지표입니다. 80%↑ 인용율이면 AI 검색 답변에 안정적으로 등장합니다.',
    insightHigh: 'AI가 다양한 사용자 질문에 이 사이트를 출처로 활용하고 있습니다.',
    insightMid: '일부 질문 유형에서만 인용되고 있어 표현·구조 보강이 필요합니다.',
    insightLow: 'AI가 거의 인용하지 않고 있어 콘텐츠 재구성이 시급합니다.'
  }
];

window.HOMEPAGE_WEIGHTS = window.HOMEPAGE_KPIS.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});

window.detectHomepageSignals = function(html, meta, urlInfo) {
  const text = (html || '').toLowerCase();
  const robots = (urlInfo?.robotsTxt || '').toLowerCase();
  const sitemap = (urlInfo?.sitemapXml || '').toLowerCase();

  // 1) AI 봇
  const aiBots = ['gptbot', 'claudebot', 'perplexitybot', 'google-extended', 'cohere-ai', 'anthropic-ai', 'ccbot'];
  const blockedBots = aiBots.filter(bot => new RegExp(`user-agent:\\s*${bot}[^\\n]*\\n[^\\n]*disallow:\\s*/`, 'i').test(robots));
  const allBlocked = /user-agent:\s*\*[^\n]*\n[^\n]*disallow:\s*\/\s*$/im.test(robots);
  const allowedCount = aiBots.length - blockedBots.length - (allBlocked ? 7 : 0);

  // 2) Sitemap
  const sitemapPresent = !!urlInfo?.sitemapXml && urlInfo.sitemapXml.length > 100;
  const urlMatches = (sitemap.match(/<loc>/g) || []).length;
  const lastmodCount = (sitemap.match(/<lastmod>/g) || []).length;

  // 3) Schema
  const jsonLdMatches = (html || '').match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || [];
  const schemaTypes = urlInfo?.schemaTypes || [];
  const hasFaqPage = schemaTypes.includes('FAQPage') || /"@type"\s*:\s*"FAQPage"/i.test(html || '');
  const hasOrg = schemaTypes.includes('Organization') || /"@type"\s*:\s*"Organization"/i.test(html || '');
  const hasArticle = schemaTypes.includes('Article') || /"@type"\s*:\s*"Article"/i.test(html || '');

  // 4) 색인 수
  const indexedCount = Number(urlInfo?.indexedCount || 0);

  // 5) 페이지 정보 (메타)
  const m = meta || {};
  const hasTitle = !!m.title;
  const hasDesc = !!m.description;
  const hasCanonical = !!m.canonical;
  const hasOgTitle = !!m.ogTitle || /og:title/i.test(html || '');
  const hasOgImage = !!m.ogImage || /og:image/i.test(html || '');
  const hasH1 = (m.h1 && m.h1.length > 0) || /<h1[^>]*>/i.test(html || '');
  const hasH2 = (m.h2 && m.h2.length > 0) || /<h2[^>]*>/i.test(html || '');

  // 6) 외부 권위
  const externalLinks = ((html || '').match(/<a[^>]+href=["']https?:\/\//gi) || []).length;
  const pressKeywords = ((html || '').match(/(보도자료|언론|매체|기사|뉴스|YTN|MBC|KBS|SBS|조선일보|중앙일보|동아일보|한겨레)/g) || []).length;
  const backlinkScore = Math.min(100, externalLinks * 2 + pressKeywords * 5);

  // 7) E-E-A-T 페이지
  const eeatPatterns = {
    representative: /(대표|원장|대표자|ceo|founder)/i,
    qualification: /(자격증|면허|학위|자격|certifi|licen|degree|박사|전문의|박사학위)/i,
    history: /(연혁|설립|since|established|개원|since\s*\d{4}|\d+\s*년\s*경력)/i,
    contact: /(연락처|오시는\s*길|찾아오시는|address|tel:|mailto:)/i
  };
  const eeatHits = Object.entries(eeatPatterns).filter(([_, re]) => re.test(html || '')).length;

  // 8) CMS
  let cmsLevel = 'unknown';
  if (/wp-content|wp-includes|wordpress|webflow|squarespace|ghost|tistory|notion-static|next\.js|gatsby/i.test(html || '')) cmsLevel = 'autonomous';
  else if (/wix|cafe24|imweb|godo|makeshop/i.test(html || '')) cmsLevel = 'limited';
  else if (/modoo\.at|imartin|simplemall|smarteasy/i.test(html || '')) cmsLevel = 'rented';

  // 9) CTA
  const ctaPatterns = /(상담|예약|문의|신청|견적|체험|시작|연락|call|consult|book|inquiry)/gi;
  const ctaCount = (text.match(ctaPatterns) || []).length;
  const hasContactForm = /<form[^>]*>[\s\S]*?<input/i.test(html || '');
  const hasPhoneNumber = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(html || '');

  // 10) 모바일 성능
  const hasViewport = /<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*width=device-width/i.test(html || '');
  const hasResponsiveCSS = /@media[^{]*max-width|@media[^{]*min-width/i.test(html || '');
  const hasLazyImg = /loading=["']lazy["']/i.test(html || '');
  const hasModernImg = /(<picture|srcset=|webp|avif)/i.test(html || '');

  return {
    hp_botAccess: { allowedCount, blockedBots, allBlocked },
    hp_sitemap: { present: sitemapPresent, urlCount: urlMatches, lastmodCount },
    hp_schema: { jsonLdCount: jsonLdMatches.length, hasFaqPage, hasOrg, hasArticle, types: schemaTypes },
    hp_indexExposure: { indexedCount },
    hp_pageInfo: { hasTitle, hasDesc, hasCanonical, hasOgTitle, hasOgImage, hasH1, hasH2 },
    hp_externalAuthority: { externalLinks, pressKeywords, backlinkScore },
    hp_eeatPage: { hits: eeatHits, max: 4 },
    hp_cmsAutonomy: { level: cmsLevel },
    hp_ctaDesign: { ctaCount, hasContactForm, hasPhoneNumber },
    hp_mobilePerf: { hasViewport, hasResponsiveCSS, hasLazyImg, hasModernImg }
  };
};

window.scoreHomepage = function(signals) {
  const s = signals || {};
  const out = {};

  // 1) hp_botAccess
  {
    const a = s.hp_botAccess || {};
    if (a.allBlocked) out.hp_botAccess = { value: 0, reason: 'robots.txt 전체 차단' };
    else {
      const v = Math.round((Math.max(0, Math.min(7, a.allowedCount || 0)) / 7) * 100);
      out.hp_botAccess = { value: v, reason: `AI 봇 ${a.allowedCount || 0}/7종 허용` };
    }
  }
  // 2) hp_sitemap
  {
    const a = s.hp_sitemap || {};
    let v = 0;
    if (a.present) v += 40;
    v += Math.min(40, Math.round((a.urlCount || 0) / 50 * 40));
    if (a.lastmodCount > 0) v += 20;
    out.hp_sitemap = { value: Math.min(100, v), reason: `URL ${a.urlCount || 0}개, lastmod ${a.lastmodCount || 0}개` };
  }
  // 3) hp_indexExposure
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
  // 4) hp_schema
  {
    const a = s.hp_schema || {};
    let v = 0;
    if (a.jsonLdCount > 0) v += 30;
    if (a.hasFaqPage) v += 25;
    if (a.hasOrg) v += 25;
    if (a.hasArticle) v += 20;
    out.hp_schema = { value: Math.min(100, v), reason: `JSON-LD ${a.jsonLdCount || 0}, FAQ ${a.hasFaqPage ? '✓' : '✗'}, Org ${a.hasOrg ? '✓' : '✗'}` };
  }
  // 5) hp_pageInfo (7신호 hit 비율)
  {
    const a = s.hp_pageInfo || {};
    const hits = ['hasTitle','hasDesc','hasCanonical','hasOgTitle','hasOgImage','hasH1','hasH2'].filter(k => a[k]).length;
    out.hp_pageInfo = { value: Math.round(hits / 7 * 100), reason: `메타 ${hits}/7 신호 충족` };
  }
  // 6) hp_externalAuthority (백링크 score)
  {
    const a = s.hp_externalAuthority || {};
    out.hp_externalAuthority = { value: Math.min(100, a.backlinkScore || 0), reason: `외부링크 ${a.externalLinks || 0}, 언론 키워드 ${a.pressKeywords || 0}` };
  }
  // 7) hp_eeatPage
  {
    const a = s.hp_eeatPage || {};
    const v = Math.round((a.hits || 0) / (a.max || 4) * 100);
    out.hp_eeatPage = { value: v, reason: `E-E-A-T ${a.hits || 0}/4 신호 발견` };
  }
  // 8) hp_cmsAutonomy
  {
    const lvl = s.hp_cmsAutonomy?.level || 'unknown';
    const map = { autonomous: 90, limited: 55, rented: 20, unknown: 50 };
    out.hp_cmsAutonomy = { value: map[lvl], reason: `CMS 유형: ${lvl}` };
  }
  // 9) hp_ctaDesign
  {
    const a = s.hp_ctaDesign || {};
    let v = 0;
    v += Math.min(50, (a.ctaCount || 0) * 5);
    if (a.hasContactForm) v += 25;
    if (a.hasPhoneNumber) v += 25;
    out.hp_ctaDesign = { value: Math.min(100, v), reason: `CTA ${a.ctaCount || 0}개, 폼 ${a.hasContactForm ? '✓' : '✗'}, 전화 ${a.hasPhoneNumber ? '✓' : '✗'}` };
  }
  // 10) hp_mobilePerf (4신호 hit 비율)
  {
    const a = s.hp_mobilePerf || {};
    const hits = ['hasViewport','hasResponsiveCSS','hasLazyImg','hasModernImg'].filter(k => a[k]).length;
    out.hp_mobilePerf = { value: Math.round(hits / 4 * 100), reason: `모바일 ${hits}/4 신호 (viewport/반응형/lazy/현대 이미지)` };
  }

  return out;
};

window.computeHomepageTotal = function(scores) {
  return _hpWeightedAverage(scores, window.HOMEPAGE_WEIGHTS);
};

function _hpWeightedAverage(scores, weights) {
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
