/**
 * GEO Score AI — 서버 측 3축 30 KPI 스코어링 (Node ESM)
 *
 * 클라이언트 측 js/kpi-{homepage,blog,article}.js의 점수 산출 로직을
 * 서버에서 사용 가능한 ESM 형태로 미러링.
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 *
 * v3.1 — 30 KPI (홈페이지 10 + 블로그 10 + 글 10), 각 축 가중치 합 100
 */

// ============================================================
// HOMEPAGE (인프라 축, 10 KPI)
// ============================================================
export const HOMEPAGE_KPI_LIST = [
  { id: 'hp_botAccess',         name: 'AI 봇 접근',     weight: 12 },
  { id: 'hp_sitemap',           name: 'Sitemap 상태',   weight: 9 },
  { id: 'hp_indexExposure',     name: '검색 색인',      weight: 11 },
  { id: 'hp_schema',            name: '구조화 데이터',  weight: 12 },
  { id: 'hp_pageInfo',          name: '페이지 정보',    weight: 8 },
  { id: 'hp_externalAuthority', name: '외부 권위',      weight: 9 },
  { id: 'hp_eeatPage',          name: 'E-E-A-T 페이지', weight: 9 },
  { id: 'hp_cmsAutonomy',       name: 'CMS 자율성',     weight: 8 },
  { id: 'hp_ctaDesign',         name: 'CTA 설계',       weight: 12 },
  { id: 'hp_mobilePerf',        name: '모바일 성능',    weight: 10 }
];

export const BLOG_KPI_LIST = [
  { id: 'bl_publishFreq',      name: '발행 빈도·최신성', weight: 14 },
  { id: 'bl_contentVolume',    name: '누적 글 양',       weight: 8 },
  { id: 'bl_categoryDepth',    name: '카테고리 깊이',    weight: 10 },
  { id: 'bl_internalLinks',    name: '내부 링크망',      weight: 10 },
  { id: 'bl_authorAuthority',  name: '작성자 권위',      weight: 11 },
  { id: 'bl_topicAuthority',   name: '토픽 권위',        weight: 10 },
  { id: 'bl_engagement',       name: '사용자 참여',      weight: 9 },
  { id: 'bl_channelExpansion', name: '채널 확장',        weight: 11 },
  { id: 'bl_readability',      name: '가독성',           weight: 7 },
  { id: 'bl_blogSchema',       name: '블로그 Schema',    weight: 10 }
];

export const ARTICLE_KPI_LIST = [
  { id: 'ar_definitionH2',     name: '정의문 H2',       weight: 12 },
  { id: 'ar_questionH2',       name: '질문형 H2',       weight: 12 },
  { id: 'ar_brandRepetition',  name: '브랜드 반복',     weight: 10 },
  { id: 'ar_externalCitation', name: '외부 인용',       weight: 11 },
  { id: 'ar_ctaReach',         name: 'CTA 도달률',      weight: 11 },
  { id: 'ar_authorBox',        name: '작성자 단락',     weight: 8 },
  { id: 'ar_listStructure',    name: '구조화',          weight: 10 },
  { id: 'ar_summary',          name: '핵심답+TL;DR',    weight: 8 },
  { id: 'ar_faq',              name: 'FAQ 구조',        weight: 10 },
  { id: 'ar_cepScene',         name: 'CEP 장면 매칭',   weight: 8 }
];

const TARGET_KPI_LIST_MAP = {
  homepage: HOMEPAGE_KPI_LIST,
  blog: BLOG_KPI_LIST,
  article: ARTICLE_KPI_LIST
};

export function getKpiList(target) {
  return TARGET_KPI_LIST_MAP[target] || HOMEPAGE_KPI_LIST;
}

export function getWeights(target) {
  const list = getKpiList(target);
  return list.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});
}

export function computeTargetTotal(target, scores) {
  const weights = getWeights(target);
  let sum = 0, total = 0;
  Object.entries(weights).forEach(([id, w]) => {
    const raw = scores?.[id];
    if (raw === undefined || raw === null) return;
    const v = (typeof raw === 'object') ? Number(raw.value) : Number(raw);
    if (!isFinite(v)) return;
    sum += v * w;
    total += w;
  });
  return total === 0 ? 0 : Math.round(sum / total);
}

// ============================================================
// HOMEPAGE — analyze.js 결과(legacy 10 KPI scores) + infraSignals + fetchResult에서 hp_* 10개 파생
// ============================================================
export function deriveHomepageScores(legacyScores, infraSignals, fetchResult) {
  const v = (id) => Number(legacyScores?.[id]?.value || 0);
  const html = fetchResult?.rawHtml || '';
  const meta = fetchResult?.meta || {};
  const out = {};

  // 1) hp_botAccess
  out.hp_botAccess = {
    value: v('botAccess'),
    reason: legacyScores?.botAccess?.reason || `AI 봇 ${infraSignals?.allowedBotsCount ?? '?'}/7종 허용`
  };
  // 2) hp_sitemap
  out.hp_sitemap = {
    value: v('sitemapStatus'),
    reason: legacyScores?.sitemapStatus?.reason || `URL ${infraSignals?.sitemapUrlCount ?? 0}개`
  };
  // 3) hp_indexExposure
  out.hp_indexExposure = {
    value: v('indexExposure'),
    reason: legacyScores?.indexExposure?.reason || `${infraSignals?.indexExposureCount ?? 0}건 색인`
  };
  // 4) hp_schema
  out.hp_schema = {
    value: v('structuredData'),
    reason: legacyScores?.structuredData?.reason || '구조화 데이터 측정값'
  };
  // 5) hp_pageInfo (메타 7신호 hit)
  {
    const hits = [
      !!meta.title, !!meta.description, !!meta.canonical,
      /og:title/i.test(html), /og:image/i.test(html),
      (meta.h1 && meta.h1.length > 0) || /<h1[^>]*>/i.test(html),
      (meta.h2 && meta.h2.length > 0) || /<h2[^>]*>/i.test(html)
    ].filter(Boolean).length;
    out.hp_pageInfo = { value: Math.round(hits / 7 * 100), reason: `메타 ${hits}/7 신호 충족` };
  }
  // 6) hp_externalAuthority (백링크 score from infraSignals or html 휴리스틱)
  {
    const externalLinks = (html.match(/<a[^>]+href=["']https?:\/\//gi) || []).length;
    const pressKeywords = (html.match(/(보도자료|언론|매체|기사|뉴스|YTN|MBC|KBS|SBS|조선일보|중앙일보|동아일보|한겨레)/g) || []).length;
    const score = Math.min(100, externalLinks * 2 + pressKeywords * 5);
    out.hp_externalAuthority = {
      value: legacyScores?.externalAuthority?.value || score,
      reason: legacyScores?.externalAuthority?.reason || `외부링크 ${externalLinks}, 언론 키워드 ${pressKeywords}`
    };
  }
  // 7) hp_eeatPage
  out.hp_eeatPage = {
    value: v('eeat'),
    reason: legacyScores?.eeat?.reason || 'E-E-A-T 페이지 측정값'
  };
  // 8) hp_cmsAutonomy
  {
    let cmsLevel = 'unknown';
    if (/wp-content|wp-includes|wordpress|webflow|squarespace|ghost|tistory|notion-static|next\.js|gatsby/i.test(html)) cmsLevel = 'autonomous';
    else if (/wix|cafe24|imweb|godo|makeshop/i.test(html)) cmsLevel = 'limited';
    else if (/modoo\.at|imartin|simplemall|smarteasy/i.test(html)) cmsLevel = 'rented';
    const map = { autonomous: 90, limited: 55, rented: 20, unknown: 50 };
    out.hp_cmsAutonomy = { value: map[cmsLevel], reason: `CMS 유형: ${cmsLevel}` };
  }
  // 9) hp_ctaDesign
  {
    const ctaPatterns = /(상담|예약|문의|신청|견적|체험|시작|연락|consult|book|inquiry|contact)/gi;
    const ctaCount = (html.toLowerCase().match(ctaPatterns) || []).length;
    const hasContactForm = /<form[^>]*>[\s\S]*?<input/i.test(html);
    const hasPhoneNumber = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(html);
    let s = Math.min(50, ctaCount * 5);
    if (hasContactForm) s += 25;
    if (hasPhoneNumber) s += 25;
    out.hp_ctaDesign = { value: Math.min(100, s), reason: `CTA ${ctaCount}, 폼 ${hasContactForm ? '✓' : '✗'}, 전화 ${hasPhoneNumber ? '✓' : '✗'}` };
  }
  // 10) hp_mobilePerf (4신호 hit 비율)
  {
    const hasViewport = /<meta[^>]+name=["']viewport["'][^>]+content=["'][^"']*width=device-width/i.test(html);
    const hasResponsiveCSS = /@media[^{]*max-width|@media[^{]*min-width/i.test(html);
    const hasLazyImg = /loading=["']lazy["']/i.test(html);
    const hasModernImg = /(<picture|srcset=|webp|avif)/i.test(html);
    const hits = [hasViewport, hasResponsiveCSS, hasLazyImg, hasModernImg].filter(Boolean).length;
    out.hp_mobilePerf = { value: Math.round(hits / 4 * 100), reason: `모바일 ${hits}/4 신호` };
  }

  return out;
}

// ============================================================
// ARTICLE 신호 검출 + 점수 산출 (10 KPI)
// ============================================================
export function detectArticleSignals(text, brandName) {
  const html = text || '';
  const isHtml = /<[a-z][^>]*>/i.test(html);
  const plain = isHtml
    ? html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ').trim()
    : html;
  const brand = (brandName || '').trim();

  let h2Items = [];
  if (isHtml) {
    h2Items = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  } else {
    h2Items = (html.match(/^##\s+(.+)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
  }

  const sections = [];
  if (isHtml) {
    const re = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      sections.push({ heading: m[1].replace(/<[^>]+>/g, '').trim(), body: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
    }
  } else {
    html.split(/^##\s+/m).slice(1).forEach(p => {
      const lines = p.split('\n');
      sections.push({ heading: lines[0].trim(), body: lines.slice(1).join(' ').trim() });
    });
  }

  // 1) 정의문 H2
  const defPattern = /^[^.!?\n]+(?:은|는|이|가)\s+[^.!?\n]+(?:이다|입니다|을\s*의미|를\s*의미|의\s*약자|를\s*뜻|을\s*뜻)/;
  const defCount = sections.filter(s => defPattern.test((s.body || '').split(/[.!?]\s/)[0] || '')).length;

  // 2) 질문형 H2
  const qWords = /(\?|어떻게|왜|언제|무엇|어떤|어디서|어디|얼마|몇)/;
  const qCount = h2Items.filter(h => qWords.test(h)).length;

  // 3) 브랜드 반복
  let brandSections = 0, brandRatio = 0;
  if (brand && sections.length > 0) {
    const brandRe = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    brandSections = sections.filter(s => brandRe.test(s.body || '')).length;
    brandRatio = brandSections / sections.length;
  }

  // 4) 외부 인용
  const paragraphs = isHtml
    ? [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
    : html.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const extPattern = /(에\s*따르면|보도|언론|기사|뉴스|연구|논문|발표|인용|후기|리뷰|평가|평점|에\s*의하면|기준으로|출처)/;
  const extCount = paragraphs.filter(p => extPattern.test(p)).length;

  // 5) CTA 도달률
  const ctaPattern = /(상담|예약|문의|신청|견적|체험|시작|연락|consult|book|inquiry|contact)/;
  const blocks = [];
  for (let i = 0; i < plain.length; i += 800) blocks.push(plain.slice(i, i + 800));
  const ctaBlocks = blocks.filter(b => ctaPattern.test(b)).length;

  // 6) 작성자 단락 (도입/결론)
  const introZone = plain.slice(0, Math.round(plain.length * 0.3));
  const outroZone = plain.slice(Math.round(plain.length * 0.7));
  const authorPattern = /(작성자|저자|글쓴이|by\s+[A-Z]|author|writer|written\s*by|박사|전문의|대표|원장|컨설턴트)/i;
  const introHasAuthor = authorPattern.test(introZone);
  const outroHasAuthor = authorPattern.test(outroZone);

  // 7) 구조화 (리스트/표/수치)
  const numberedList = (html.match(/(?:^|\n|<li[^>]*>)\s*\d+[\.\)]/g) || []).length;
  const bulletList = (html.match(/(?:^|\n|<li[^>]*>)\s*[•\-\*]/g) || []).length;
  const hasTable = /<table[^>]*>/i.test(html);
  const numericPattern = /\d+\s*(%|원|명|건|일|시간|주|개월|년)/g;
  const numericCount = (plain.match(numericPattern) || []).length;
  const qaPatternCount = (html.match(/(?:^|\n)\s*(?:Q[:.\s]|문[:.\s]|질문[:.\s])/g) || []).length;

  // 8) 핵심답+TL;DR
  const introFirstSentence = (introZone.split(/[.!?]\s/)[0] || '').trim();
  const introHasAnswer = introFirstSentence.length > 20 && introFirstSentence.length < 250;
  const outroHasSummary = /(요약|정리하면|결론|tl;?dr|핵심|마무리)/i.test(outroZone);

  // 9) FAQ
  const hasFaqHeading = /(faq|자주\s*묻는|자주\s*하는\s*질문|q\s*&\s*a)/i.test(html);
  const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html);

  // 10) CEP 장면
  const cepPattern = /(아침에|저녁에|밤에|새벽에|갑자기|문득|.{1,10}직전에|.{1,10}하기\s*전에|.{1,10}\s*할\s*때|.{1,10}하다가|.{1,10}하던\s*중)/g;
  const cepMatches = (plain.match(cepPattern) || []).length;

  return {
    ar_definitionH2: { count: defCount, total: sections.length, ratio: sections.length === 0 ? 0 : defCount / sections.length },
    ar_questionH2: { count: qCount, total: h2Items.length, ratio: h2Items.length === 0 ? 0 : qCount / h2Items.length },
    ar_brandRepetition: { brandSections, total: sections.length, ratio: brandRatio, brandName: brand },
    ar_externalCitation: { count: extCount, total: paragraphs.length, ratio: paragraphs.length === 0 ? 0 : extCount / paragraphs.length },
    ar_ctaReach: { ctaBlocks, totalBlocks: blocks.length, ratio: blocks.length === 0 ? 0 : ctaBlocks / blocks.length },
    ar_authorBox: { introHasAuthor, outroHasAuthor },
    ar_listStructure: { numberedList, bulletList, hasTable, numericCount, qaPatternCount },
    ar_summary: { introHasAnswer, outroHasSummary },
    ar_faq: { hasHeading: hasFaqHeading, qaCount: qaPatternCount, hasSchema: hasFaqSchema },
    ar_cepScene: { matches: cepMatches }
  };
}

export function scoreArticle(signals) {
  const s = signals || {};
  const out = {};
  const ratioScore = r => {
    if (r >= 0.7) return 100;
    if (r >= 0.5) return 80;
    if (r >= 0.3) return 50;
    if (r >= 0.1) return 25;
    return Math.round((r || 0) * 100);
  };

  out.ar_definitionH2 = {
    value: s.ar_definitionH2?.total === 0 ? 0 : ratioScore(s.ar_definitionH2?.ratio || 0),
    reason: `정의문 H2 ${s.ar_definitionH2?.count || 0}/${s.ar_definitionH2?.total || 0} (${Math.round((s.ar_definitionH2?.ratio || 0) * 100)}%)`
  };
  out.ar_questionH2 = {
    value: s.ar_questionH2?.total === 0 ? 0 : ratioScore(s.ar_questionH2?.ratio || 0),
    reason: `질문형 H2 ${s.ar_questionH2?.count || 0}/${s.ar_questionH2?.total || 0} (${Math.round((s.ar_questionH2?.ratio || 0) * 100)}%)`
  };
  if (!s.ar_brandRepetition?.brandName) {
    out.ar_brandRepetition = { value: 30, reason: '브랜드명 미입력 — 측정 불가 (중립값)' };
  } else {
    out.ar_brandRepetition = {
      value: s.ar_brandRepetition.total === 0 ? 0 : ratioScore(s.ar_brandRepetition.ratio),
      reason: `${s.ar_brandRepetition.brandName} 등장 ${s.ar_brandRepetition.brandSections}/${s.ar_brandRepetition.total} 섹션 (${Math.round(s.ar_brandRepetition.ratio * 100)}%)`
    };
  }
  {
    const r = s.ar_externalCitation?.ratio || 0;
    let v;
    if (r >= 0.5) v = 100; else if (r >= 0.3) v = 80; else if (r >= 0.15) v = 50; else if (r >= 0.05) v = 25; else v = 0;
    out.ar_externalCitation = { value: v, reason: `외부 인용 ${s.ar_externalCitation?.count || 0}/${s.ar_externalCitation?.total || 0} (${Math.round(r * 100)}%)` };
  }
  {
    const r = s.ar_ctaReach?.ratio || 0;
    let v;
    if (r >= 0.5) v = 100; else if (r >= 0.3) v = 70; else if (r >= 0.1) v = 40; else v = 0;
    out.ar_ctaReach = { value: v, reason: `CTA ${s.ar_ctaReach?.ctaBlocks || 0}/${s.ar_ctaReach?.totalBlocks || 0} 블록 (${Math.round(r * 100)}%)` };
  }
  {
    const a = s.ar_authorBox || {};
    let v = 0;
    if (a.introHasAuthor) v += 50;
    if (a.outroHasAuthor) v += 50;
    out.ar_authorBox = { value: v, reason: `도입 ${a.introHasAuthor ? '✓' : '✗'}, 결론 ${a.outroHasAuthor ? '✓' : '✗'}` };
  }
  {
    const a = s.ar_listStructure || {};
    let v = 0;
    if ((a.numberedList || 0) >= 3) v += 25; else if ((a.numberedList || 0) >= 1) v += 15;
    if ((a.bulletList || 0) >= 3) v += 15; else if ((a.bulletList || 0) >= 1) v += 8;
    if (a.hasTable) v += 25;
    v += Math.min(20, (a.numericCount || 0) * 2);
    if ((a.qaPatternCount || 0) >= 3) v += 15;
    out.ar_listStructure = { value: Math.min(100, v), reason: `번호 ${a.numberedList || 0}, 표 ${a.hasTable ? '✓' : '✗'}, 수치 ${a.numericCount || 0}` };
  }
  {
    const a = s.ar_summary || {};
    let v = 0;
    if (a.introHasAnswer) v += 50;
    if (a.outroHasSummary) v += 50;
    out.ar_summary = { value: v, reason: `도입 핵심답 ${a.introHasAnswer ? '✓' : '✗'}, 결론 요약 ${a.outroHasSummary ? '✓' : '✗'}` };
  }
  {
    const a = s.ar_faq || {};
    let v = 0;
    if (a.hasHeading) v += 30;
    v += Math.min(40, (a.qaCount || 0) * 8);
    if (a.hasSchema) v += 30;
    out.ar_faq = { value: Math.min(100, v), reason: `FAQ ${a.hasHeading ? '✓' : '✗'}, Q&A ${a.qaCount || 0}, Schema ${a.hasSchema ? '✓' : '✗'}` };
  }
  {
    const n = s.ar_cepScene?.matches || 0;
    const v = n >= 5 ? 100 : (n >= 3 ? 80 : (n >= 2 ? 60 : (n >= 1 ? 35 : 0)));
    out.ar_cepScene = { value: v, reason: `CEP 장면 ${n}회 검출` };
  }

  return out;
}

// ============================================================
// BLOG 신호 검출 + 점수 산출 (10 KPI)
// ============================================================
export function detectBlogSignals(blogIndexHtml, articleSamples) {
  const html = blogIndexHtml || '';
  const samples = Array.isArray(articleSamples) ? articleSamples : [];

  // 1) 발행 빈도
  const dateRegex = /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/g;
  const dates = [];
  let m;
  while ((m = dateRegex.exec(html)) !== null) {
    const d = new Date(`${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`);
    if (!isNaN(d) && d.getFullYear() >= 2015 && d <= new Date()) dates.push(d);
  }
  dates.sort((a, b) => b - a);
  const newest = dates[0] || null;
  const daysSinceNewest = newest ? Math.floor((Date.now() - newest.getTime()) / 86400000) : 9999;
  const postsLast30Days = dates.filter(d => (Date.now() - d.getTime()) <= 30 * 86400000).length;
  const postsLast90Days = dates.filter(d => (Date.now() - d.getTime()) <= 90 * 86400000).length;

  // 2) 누적 글 양
  const articleLinks = (html.match(/<a[^>]+href=["'][^"']*\/(post|article|blog|read|view|\d{4})[^"']*["']/gi) || []).length;
  const pageMatches = html.match(/page=(\d+)|\/page\/(\d+)/gi) || [];
  const maxPage = pageMatches.length > 0 ? Math.max(...pageMatches.map(p => parseInt(p.match(/\d+/)?.[0] || '0', 10))) : 0;
  const estTotalArticles = Math.max(articleLinks, maxPage * 10);

  // 3) 카테고리
  const catLinks = [...html.matchAll(/<a[^>]+href=["']([^"']*(?:category|cate|tag)[^"']*)["'][^>]*>([^<]+)<\/a>/gi)];
  const uniqueCats = new Set(catLinks.map(m => m[2].trim().toLowerCase()).filter(Boolean));
  const categoryCount = uniqueCats.size;

  // 4) 내부 링크
  const linkCounts = samples.map(s => ((s.html || '').match(/<a[^>]+href=["'][^"']+["']/gi) || []).length);
  const avgInternalLinks = linkCounts.length > 0 ? linkCounts.reduce((a, b) => a + b, 0) / linkCounts.length : 0;

  // 5) 작성자
  const authorPattern = /(작성자|저자|글쓴이|by\s+[A-Z]|author|writer|written\s*by)/i;
  const samplesWithAuthor = samples.filter(s => authorPattern.test(s.html || '')).length;
  const authorRatio = samples.length > 0 ? samplesWithAuthor / samples.length : 0;
  const hasAboutPage = /<a[^>]+href=["'][^"']*(?:about|소개|profile|프로필)[^"']*["']/i.test(html);

  // 6) 토픽 권위
  const catFreq = {};
  catLinks.forEach(m => { const k = m[2].trim().toLowerCase(); catFreq[k] = (catFreq[k] || 0) + 1; });
  const freqs = Object.values(catFreq);
  const topFreqRatio = freqs.length > 0 ? Math.max(...freqs) / freqs.reduce((a, b) => a + b, 1) : 0;

  // 7) 사용자 참여
  const engagementSignals = {
    comments: /(댓글|comment|댓글\s*\d+|comments?\s*\(\s*\d+)/i.test(html),
    likes: /(좋아요|like|♡|❤|likes?\s*\(\s*\d+)/i.test(html),
    shares: /(공유|share|kakao|카카오|twitter|facebook).*share/i.test(html),
    socialButtons: ((html.match(/<(a|button)[^>]*(?:share|sns|social)[^>]*>/gi) || []).length) > 0
  };
  const engagementCount = Object.values(engagementSignals).filter(Boolean).length;

  // 8) 채널
  const channels = {
    youtube: /youtube\.com|youtu\.be/i.test(html),
    instagram: /instagram\.com/i.test(html),
    facebook: /facebook\.com/i.test(html),
    twitter: /twitter\.com|x\.com\//i.test(html),
    linkedin: /linkedin\.com/i.test(html),
    naver_blog: /blog\.naver\.com/i.test(html),
    tistory: /tistory\.com/i.test(html),
    brunch: /brunch\.co\.kr/i.test(html)
  };
  const activeChannels = Object.values(channels).filter(Boolean).length;

  // 9) 가독성
  const sampleTexts = samples.map(s => (s.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  const avgLength = sampleTexts.length > 0 ? sampleTexts.reduce((a, t) => a + t.length, 0) / sampleTexts.length : 0;
  const paragraphsPerSample = samples.length > 0
    ? samples.reduce((a, s) => a + ((s.html || '').match(/<p[^>]*>/gi) || []).length, 0) / samples.length
    : 0;

  // 10) 블로그 Schema
  const hasBlogSchema = /"@type"\s*:\s*"BlogPosting"|"@type"\s*:\s*"Article"/i.test(html);
  const sampleSchemaRatio = samples.length > 0
    ? samples.filter(s => /"@type"\s*:\s*"BlogPosting"|"@type"\s*:\s*"Article"/i.test(s.html || '')).length / samples.length
    : (hasBlogSchema ? 1 : 0);

  return {
    bl_publishFreq: { newest, daysSinceNewest, postsLast30Days, postsLast90Days, totalDates: dates.length },
    bl_contentVolume: { articleLinks, maxPage, estTotalArticles },
    bl_categoryDepth: { categoryCount, articlesPerCategory: samples.length / Math.max(1, categoryCount) },
    bl_internalLinks: { avgInternalLinks, sampleCount: samples.length },
    bl_authorAuthority: { samplesWithAuthor, totalSamples: samples.length, authorRatio, hasAboutPage },
    bl_topicAuthority: { topFreqRatio, uniqueCategories: freqs.length },
    bl_engagement: { signals: engagementSignals, count: engagementCount, max: 4 },
    bl_channelExpansion: { activeChannels, channels },
    bl_readability: { avgLength, paragraphsPerSample, sampleCount: samples.length },
    bl_blogSchema: { hasBlogSchema, sampleSchemaRatio }
  };
}

export function scoreBlog(signals) {
  const s = signals || {};
  const out = {};

  {
    const a = s.bl_publishFreq || {};
    let v = 0;
    if (a.daysSinceNewest <= 7) v += 50;
    else if (a.daysSinceNewest <= 30) v += 35;
    else if (a.daysSinceNewest <= 90) v += 20;
    else if (a.daysSinceNewest <= 180) v += 10;
    v += Math.min(30, (a.postsLast30Days || 0) * 6);
    v += Math.min(20, (a.postsLast90Days || 0) * 2);
    out.bl_publishFreq = { value: Math.min(100, v), reason: `최신 ${a.daysSinceNewest || '∞'}일전, 30일 ${a.postsLast30Days || 0}개, 90일 ${a.postsLast90Days || 0}개` };
  }
  {
    const n = s.bl_contentVolume?.estTotalArticles || 0;
    let v;
    if (n >= 1000) v = 100;
    else if (n >= 500) v = 92;
    else if (n >= 200) v = 85;
    else if (n >= 100) v = 72;
    else if (n >= 50) v = 60;
    else if (n >= 20) v = 35;
    else v = Math.round(n * 1.5);
    out.bl_contentVolume = { value: v, reason: `누적 추정 ${n}건` };
  }
  {
    const a = s.bl_categoryDepth || {};
    let v = 0;
    v += Math.min(60, (a.categoryCount || 0) * 12);
    v += Math.min(40, Math.round((a.articlesPerCategory || 0) * 4));
    out.bl_categoryDepth = { value: Math.min(100, v), reason: `카테고리 ${a.categoryCount || 0}개, 카테고리당 ${(a.articlesPerCategory || 0).toFixed(1)}개` };
  }
  {
    const avg = s.bl_internalLinks?.avgInternalLinks || 0;
    let v;
    if (avg >= 10) v = 100;
    else if (avg >= 5) v = 85;
    else if (avg >= 3) v = 70;
    else if (avg >= 1) v = 40;
    else v = 0;
    out.bl_internalLinks = { value: v, reason: `샘플 ${s.bl_internalLinks?.sampleCount || 0}개 글당 평균 ${avg.toFixed(1)}개 링크` };
  }
  {
    const a = s.bl_authorAuthority || {};
    let v = Math.round((a.authorRatio || 0) * 70);
    if (a.hasAboutPage) v += 30;
    out.bl_authorAuthority = { value: Math.min(100, v), reason: `작성자 노출 ${Math.round((a.authorRatio || 0) * 100)}%, about ${a.hasAboutPage ? '✓' : '✗'}` };
  }
  {
    const r = s.bl_topicAuthority?.topFreqRatio || 0;
    const u = s.bl_topicAuthority?.uniqueCategories || 0;
    let v;
    if (u === 0) v = 0;
    else if (r >= 0.4 && r <= 0.7) v = 90;
    else if (r > 0.7) v = 75;
    else if (r >= 0.25) v = 65;
    else v = 40;
    out.bl_topicAuthority = { value: v, reason: `최상위 카테고리 비율 ${Math.round(r * 100)}%, 카테고리 수 ${u}` };
  }
  {
    const a = s.bl_engagement || {};
    out.bl_engagement = { value: Math.round((a.count || 0) / (a.max || 4) * 100), reason: `참여 ${a.count || 0}/4 신호` };
  }
  {
    const n = s.bl_channelExpansion?.activeChannels || 0;
    const map = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 75, 5: 90 };
    const v = n >= 6 ? 100 : (map[n] || 0);
    const names = Object.entries(s.bl_channelExpansion?.channels || {}).filter(([, on]) => on).map(([k]) => k).join(', ');
    out.bl_channelExpansion = { value: v, reason: `${n}개 채널: ${names || '없음'}` };
  }
  {
    const a = s.bl_readability || {};
    const len = a.avgLength || 0;
    const lenScore = Math.min(60, Math.round(len / 1500 * 60));
    const parScore = Math.min(40, Math.round((a.paragraphsPerSample || 0) * 4));
    out.bl_readability = { value: Math.min(100, lenScore + parScore), reason: `평균 ${Math.round(len)}자, 단락 ${(a.paragraphsPerSample || 0).toFixed(1)}개` };
  }
  {
    const a = s.bl_blogSchema || {};
    let v = 0;
    if (a.hasBlogSchema) v += 50;
    v += Math.round((a.sampleSchemaRatio || 0) * 50);
    out.bl_blogSchema = { value: Math.min(100, v), reason: `Schema ${a.hasBlogSchema ? '✓' : '✗'}, 샘플 적용 ${Math.round((a.sampleSchemaRatio || 0) * 100)}%` };
  }

  return out;
}

// ============================================================
// 등급 산정 (3축 공통)
// ============================================================
export function getGrade(totalScore) {
  if (totalScore >= 95) return { key: 'dominant', label: 'A+ Premium', desc: '최상위' };
  if (totalScore >= 85) return { key: 'strong',   label: 'A 우수',     desc: '우수' };
  if (totalScore >= 70) return { key: 'growing',  label: 'B 보통',     desc: '보통' };
  if (totalScore >= 55) return { key: 'weak',     label: 'C 미흡',     desc: '구조 정비 필요' };
  if (totalScore >= 40) return { key: 'poor',     label: 'D 부족',     desc: '상당한 개선 필요' };
  return { key: 'critical', label: 'F 위급', desc: '신규 개발 필수' };
}
