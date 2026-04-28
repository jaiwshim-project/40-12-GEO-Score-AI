/**
 * GEO Score AI — 서버 측 3축 KPI 스코어링 (Node ESM)
 *
 * 클라이언트 측 js/kpi-{homepage,blog,article}.js의 점수 산출 로직을
 * 서버에서 사용 가능한 ESM 형태로 미러링.
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 */

// ============================================================
// HOMEPAGE (인프라 축, 7 KPI, 가중치 합 100)
// ============================================================
export const HOMEPAGE_KPI_LIST = [
  { id: 'hp_botAccess',      name: 'AI 봇 접근',       weight: 18 },
  { id: 'hp_sitemap',        name: 'Sitemap 상태',     weight: 12 },
  { id: 'hp_schema',         name: '구조화 데이터',     weight: 16 },
  { id: 'hp_indexExposure',  name: '검색 색인',        weight: 14 },
  { id: 'hp_cmsAutonomy',    name: 'CMS 자율성',       weight: 12 },
  { id: 'hp_ctaDesign',      name: 'CTA 설계',         weight: 14 },
  { id: 'hp_eeatPage',       name: 'E-E-A-T 페이지',   weight: 14 }
];

export const BLOG_KPI_LIST = [
  { id: 'bl_publishFreq',     name: '발행 빈도·최신성', weight: 25 },
  { id: 'bl_categoryDepth',   name: '카테고리 깊이',    weight: 18 },
  { id: 'bl_internalLinks',   name: '내부 링크망',      weight: 18 },
  { id: 'bl_authorAuthority', name: '작성자 권위',      weight: 19 },
  { id: 'bl_channelExpansion',name: '채널 확장',        weight: 20 }
];

export const ARTICLE_KPI_LIST = [
  { id: 'ar_definitionH2',    name: '정의문 H2',     weight: 17 },
  { id: 'ar_questionH2',      name: '질문형 H2',     weight: 18 },
  { id: 'ar_brandRepetition', name: '브랜드 반복',   weight: 15 },
  { id: 'ar_externalCitation',name: '외부 인용',     weight: 17 },
  { id: 'ar_ctaReach',        name: 'CTA 도달률',    weight: 17 },
  { id: 'ar_faq',             name: 'FAQ 구조',      weight: 16 }
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
// HOMEPAGE 스코어링 — 기존 analyze.js 결과(legacy 10 KPI scores +
// infraSignals)에서 hp_* 스코어를 파생
// ============================================================
export function deriveHomepageScores(legacyScores, infraSignals, fetchResult) {
  const v = (id) => Number(legacyScores?.[id]?.value || 0);
  const out = {};

  // hp_botAccess: 기존 botAccess 그대로
  out.hp_botAccess = {
    value: v('botAccess'),
    reason: legacyScores?.botAccess?.reason || `AI 봇 ${infraSignals?.allowedBotsCount ?? '?'}/7종 허용`
  };

  // hp_sitemap: 기존 sitemapStatus
  out.hp_sitemap = {
    value: v('sitemapStatus'),
    reason: legacyScores?.sitemapStatus?.reason || `URL ${infraSignals?.sitemapUrlCount ?? 0}개`
  };

  // hp_schema: 기존 structuredData
  out.hp_schema = {
    value: v('structuredData'),
    reason: legacyScores?.structuredData?.reason || '구조화 데이터 측정값'
  };

  // hp_indexExposure: 기존 indexExposure
  out.hp_indexExposure = {
    value: v('indexExposure'),
    reason: legacyScores?.indexExposure?.reason || `${infraSignals?.indexExposureCount ?? 0}건 색인`
  };

  // hp_cmsAutonomy: HTML에서 CMS 휴리스틱 검출
  const html = fetchResult?.rawHtml || '';
  let cmsLevel = 'unknown';
  if (/wp-content|wp-includes|wordpress|webflow|squarespace|ghost|tistory|notion-static|next\.js|gatsby/i.test(html)) cmsLevel = 'autonomous';
  else if (/wix|cafe24|imweb|godo|makeshop/i.test(html)) cmsLevel = 'limited';
  else if (/modoo\.at|imartin|simplemall|smarteasy/i.test(html)) cmsLevel = 'rented';
  const cmsMap = { autonomous: 90, limited: 55, rented: 20, unknown: 50 };
  out.hp_cmsAutonomy = { value: cmsMap[cmsLevel], reason: `CMS 유형: ${cmsLevel}` };

  // hp_ctaDesign: 기존 conversion or 휴리스틱
  const ctaPatterns = /(상담|예약|문의|신청|견적|체험|시작|연락|consult|book|inquiry|contact)/gi;
  const ctaCount = (html.toLowerCase().match(ctaPatterns) || []).length;
  const hasContactForm = /<form[^>]*>[\s\S]*?<input/i.test(html);
  const hasPhoneNumber = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/.test(html);
  let ctaScore = Math.min(50, ctaCount * 5);
  if (hasContactForm) ctaScore += 25;
  if (hasPhoneNumber) ctaScore += 25;
  out.hp_ctaDesign = {
    value: Math.min(100, ctaScore),
    reason: `CTA ${ctaCount}개, 폼 ${hasContactForm ? '✓' : '✗'}, 전화 ${hasPhoneNumber ? '✓' : '✗'}`
  };

  // hp_eeatPage: 기존 eeat
  out.hp_eeatPage = {
    value: v('eeat'),
    reason: legacyScores?.eeat?.reason || 'E-E-A-T 페이지 측정값'
  };

  return out;
}

// ============================================================
// ARTICLE 스코어링 (본문 신호, 결정적)
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

  // H2 추출
  let h2Items = [];
  if (isHtml) {
    h2Items = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  } else {
    h2Items = (html.match(/^##\s+(.+)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
  }

  // 섹션 (다음 H2까지)
  const sections = [];
  if (isHtml) {
    const re = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      sections.push({
        heading: m[1].replace(/<[^>]+>/g, '').trim(),
        body: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      });
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

  // 6) FAQ
  const hasFaqHeading = /(faq|자주\s*묻는|자주\s*하는\s*질문|q\s*&\s*a)/i.test(html);
  const qaCount = (html.match(/(?:^|\n|<)\s*(?:Q[:.\s]|문[:.\s]|질문[:.\s])/gi) || []).length;
  const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html);

  return {
    ar_definitionH2: { count: defCount, total: sections.length, ratio: sections.length === 0 ? 0 : defCount / sections.length },
    ar_questionH2: { count: qCount, total: h2Items.length, ratio: h2Items.length === 0 ? 0 : qCount / h2Items.length },
    ar_brandRepetition: { brandSections, total: sections.length, ratio: brandRatio, brandName: brand },
    ar_externalCitation: { count: extCount, total: paragraphs.length, ratio: paragraphs.length === 0 ? 0 : extCount / paragraphs.length },
    ar_ctaReach: { ctaBlocks, totalBlocks: blocks.length, ratio: blocks.length === 0 ? 0 : ctaBlocks / blocks.length },
    ar_faq: { hasHeading: hasFaqHeading, qaCount, hasSchema: hasFaqSchema }
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
    if (r >= 0.5) v = 100;
    else if (r >= 0.3) v = 80;
    else if (r >= 0.15) v = 50;
    else if (r >= 0.05) v = 25;
    else v = 0;
    out.ar_externalCitation = { value: v, reason: `외부 인용 ${s.ar_externalCitation?.count || 0}/${s.ar_externalCitation?.total || 0} (${Math.round(r * 100)}%)` };
  }
  {
    const r = s.ar_ctaReach?.ratio || 0;
    let v;
    if (r >= 0.5) v = 100;
    else if (r >= 0.3) v = 70;
    else if (r >= 0.1) v = 40;
    else v = 0;
    out.ar_ctaReach = { value: v, reason: `CTA ${s.ar_ctaReach?.ctaBlocks || 0}/${s.ar_ctaReach?.totalBlocks || 0} 블록 (${Math.round(r * 100)}%)` };
  }
  {
    const a = s.ar_faq || {};
    let v = 0;
    if (a.hasHeading) v += 30;
    v += Math.min(40, (a.qaCount || 0) * 8);
    if (a.hasSchema) v += 30;
    out.ar_faq = { value: Math.min(100, v), reason: `FAQ ${a.hasHeading ? '✓' : '✗'}, Q&A ${a.qaCount || 0}, Schema ${a.hasSchema ? '✓' : '✗'}` };
  }

  return out;
}

// ============================================================
// BLOG 스코어링 (블로그 인덱스 + 샘플 글)
// ============================================================
export function detectBlogSignals(blogIndexHtml, articleSamples) {
  const html = blogIndexHtml || '';
  const samples = Array.isArray(articleSamples) ? articleSamples : [];

  // 1) 발행 빈도·최신성 — 인덱스 페이지에 있는 날짜
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

  // 2) 카테고리 깊이
  const catLinks = [...html.matchAll(/<a[^>]+href=["']([^"']*(?:category|cate|tag)[^"']*)["'][^>]*>([^<]+)<\/a>/gi)];
  const uniqueCats = new Set(catLinks.map(m => m[2].trim().toLowerCase()).filter(Boolean));
  const categoryCount = uniqueCats.size;

  // 3) 내부 링크 (샘플당 평균)
  const linkCounts = samples.map(s => ((s.html || '').match(/<a[^>]+href=["']([^"']+)["']/gi) || []).length);
  const avgInternalLinks = linkCounts.length > 0 ? linkCounts.reduce((a, b) => a + b, 0) / linkCounts.length : 0;

  // 4) 작성자 권위
  const authorPattern = /(작성자|저자|글쓴이|by\s+[A-Z]|author|writer|written\s*by)/i;
  const samplesWithAuthor = samples.filter(s => authorPattern.test(s.html || '')).length;
  const authorRatio = samples.length > 0 ? samplesWithAuthor / samples.length : 0;
  const hasAboutPage = /<a[^>]+href=["'][^"']*(?:about|소개|profile|프로필)[^"']*["']/i.test(html);

  // 5) 채널 확장
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

  return {
    bl_publishFreq: { newest, daysSinceNewest, postsLast30Days, postsLast90Days, totalDates: dates.length },
    bl_categoryDepth: { categoryCount, articlesPerCategory: samples.length / Math.max(1, categoryCount) },
    bl_internalLinks: { avgInternalLinks, sampleCount: samples.length },
    bl_authorAuthority: { samplesWithAuthor, totalSamples: samples.length, authorRatio, hasAboutPage },
    bl_channelExpansion: { activeChannels, channels }
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
    const n = s.bl_channelExpansion?.activeChannels || 0;
    const map = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 75, 5: 90 };
    const v = n >= 6 ? 100 : (map[n] || 0);
    const names = Object.entries(s.bl_channelExpansion?.channels || {}).filter(([, on]) => on).map(([k]) => k).join(', ');
    out.bl_channelExpansion = { value: v, reason: `${n}개 채널: ${names || '없음'}` };
  }

  return out;
}

// ============================================================
// 등급 산정 (3축 공통, 새 임계값 95/85/70/55/40)
// ============================================================
export function getGrade(totalScore) {
  if (totalScore >= 95) return { key: 'dominant', label: 'A+ Premium', desc: '최상위' };
  if (totalScore >= 85) return { key: 'strong',   label: 'A 우수',     desc: '우수' };
  if (totalScore >= 70) return { key: 'growing',  label: 'B 보통',     desc: '보통' };
  if (totalScore >= 55) return { key: 'weak',     label: 'C 미흡',     desc: '구조 정비 필요' };
  if (totalScore >= 40) return { key: 'poor',     label: 'D 부족',     desc: '상당한 개선 필요' };
  return { key: 'critical', label: 'F 위급', desc: '신규 개발 필수' };
}
