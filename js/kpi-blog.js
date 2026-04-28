/**
 * GEO Score AI — Blog KPI (운영 축, 5 KPI, 가중치 합 100)
 *
 * 진단 대상: 회사 블로그 (브런치/티스토리/네이버블로그/자체 블로그)
 * 측정 결: 운영 신호 (발행 빈도, 카테고리 깊이, 내부 링크망, 작성자 권위, 채널 확장)
 *
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 */

window.BLOG_KPIS = [
  {
    id: 'bl_publishFreq',
    name: '발행 빈도·최신성',
    nameEn: 'Publish Frequency & Recency',
    icon: '📅',
    color: '#ff6b35',
    color2: '#ff4500',
    weight: 25,
    desc: '30일 주기 발행 + 최신 글이 1주 이내',
    description: '블로그 포스트 발행 빈도와 최신 글의 작성일을 측정합니다. AI 학습 데이터는 신선한 콘텐츠를 우선시하므로, 30일 주기 발행이 이상적이며 최신 글이 1주 이내인 경우 활성 운영 사이트로 인식됩니다. 6개월 이상 갱신이 없으면 콘텐츠 자산 누적이 정체됩니다.',
    insightHigh: '꾸준한 주기 발행 + 최신 글이 1주 이내로 활성 운영 중입니다.',
    insightMid: '간헐적 발행으로 30일 이상 갱신 공백이 있습니다.',
    insightLow: '6개월 이상 발행이 멈춰 콘텐츠 자산 누적이 정체된 상태입니다.'
  },
  {
    id: 'bl_categoryDepth',
    name: '카테고리 깊이',
    nameEn: 'Category Depth',
    icon: '📂',
    color: '#a855f7',
    color2: '#7c3aed',
    weight: 18,
    desc: '카테고리 5개 이상 × 카테고리당 글 10개 이상',
    description: '블로그 카테고리 다양성과 카테고리당 글 수를 측정합니다. 카테고리 5개 이상 × 카테고리당 글 10개 이상이면 주제 권위(topic authority)가 형성됩니다. 카테고리가 적거나 한쪽에 글이 쏠려 있으면 AI가 사이트의 전문 분야를 파악하기 어렵습니다.',
    insightHigh: '카테고리 5+ × 카테고리당 글 10+로 주제 권위가 형성되어 있습니다.',
    insightMid: '카테고리 분포가 불균형하거나 일부 카테고리만 글이 충분합니다.',
    insightLow: '카테고리가 적거나 한쪽에 글이 쏠려 있어 주제 권위가 약합니다.'
  },
  {
    id: 'bl_internalLinks',
    name: '내부 링크망',
    nameEn: 'Internal Link Network',
    icon: '🕸️',
    color: '#06b6d4',
    color2: '#0891b2',
    weight: 18,
    desc: '글당 내부 링크 3개 이상 + 클러스터 형성',
    description: '블로그 글에서 다른 글로 연결되는 내부 링크 수와 네트워크 밀도를 측정합니다. 글당 내부 링크 3개 이상이면 토픽 클러스터(pillar–cluster)가 형성되어 AI가 콘텐츠 간 관계를 파악하기 쉽습니다. 외부 링크만 있고 내부 링크가 없으면 사이트 권위가 분산됩니다.',
    insightHigh: '글당 평균 3개 이상 내부 링크로 토픽 클러스터가 잘 형성되어 있습니다.',
    insightMid: '내부 링크가 일부 글에만 집중되어 클러스터 효과가 제한적입니다.',
    insightLow: '내부 링크가 거의 없어 사이트 권위가 분산되고 색인 효율이 낮습니다.'
  },
  {
    id: 'bl_authorAuthority',
    name: '작성자 권위',
    nameEn: 'Author Authority',
    icon: '👤',
    color: '#00d68f',
    color2: '#00b87c',
    weight: 19,
    desc: '저자 프로필 + 자격 + E-E-A-T 신호',
    description: '블로그 글의 작성자 프로필(이름·자격·경력·연락처)과 E-E-A-T 신호 노출도를 측정합니다. 익명 또는 "관리자" 명의 글은 AI 신뢰 가중치가 낮습니다. 글마다 작성자 박스 + 별도 about 페이지가 있어야 권위 신호가 누적됩니다.',
    insightHigh: '저자 프로필·자격·연락처가 글마다 노출되어 권위 신호가 누적됩니다.',
    insightMid: '일부 글에만 작성자 정보가 있어 권위 신호 일관성이 부족합니다.',
    insightLow: '익명/관리자 명의 글이 다수로 작성자 권위 신호가 거의 없습니다.'
  },
  {
    id: 'bl_channelExpansion',
    name: '채널 확장',
    nameEn: 'Channel Expansion',
    icon: '📡',
    color: '#ec4899',
    color2: '#be185d',
    weight: 20,
    desc: '블로그 + 유튜브 + SNS 멀티채널 운영',
    description: '블로그 외 유튜브·인스타그램·페이스북·X 등 외부 채널 운영 + 블로그 콘텐츠의 채널 확산 정도를 측정합니다. 멀티채널일수록 외부 신호와 백링크가 누적되어 AI 인용 가중치가 상승합니다. 블로그만 단독 운영하면 외부 권위 신호가 부족합니다.',
    insightHigh: '블로그 + 유튜브 + SNS 다채널을 운영하며 콘텐츠 확산이 활발합니다.',
    insightMid: '블로그 외 1~2개 채널만 운영해 채널 확장이 제한적입니다.',
    insightLow: '블로그만 단독 운영해 외부 신호와 채널 확산이 거의 없습니다.'
  }
];

window.BLOG_WEIGHTS = window.BLOG_KPIS.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});

/**
 * Blog 신호 검출 (결정적)
 * @param {string} blogIndexHtml - 블로그 메인/인덱스 페이지 HTML
 * @param {Array} articleSamples - 샘플 글들의 [{ html, url, publishedAt, links: [...] }]
 * @param {object} meta - { title, description, ogTags, ... }
 * @returns {object} 신호 객체
 */
window.detectBlogSignals = function(blogIndexHtml, articleSamples, meta) {
  const html = blogIndexHtml || '';
  const samples = Array.isArray(articleSamples) ? articleSamples : [];

  // 1) 발행 빈도·최신성 — 게시물 날짜에서 추정
  const dateRegex = /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/g;
  const datesInIndex = [];
  let m;
  while ((m = dateRegex.exec(html)) !== null) {
    const d = new Date(`${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`);
    if (!isNaN(d) && d.getFullYear() >= 2015 && d <= new Date()) datesInIndex.push(d);
  }
  datesInIndex.sort((a, b) => b - a);
  const newest = datesInIndex[0] || null;
  const daysSinceNewest = newest ? Math.floor((Date.now() - newest.getTime()) / 86400000) : 9999;
  const postsLast30Days = datesInIndex.filter(d => (Date.now() - d.getTime()) <= 30 * 86400000).length;
  const postsLast90Days = datesInIndex.filter(d => (Date.now() - d.getTime()) <= 90 * 86400000).length;

  // 2) 카테고리 깊이 — <a class="category"> 또는 카테고리 링크 패턴
  const catLinks = [
    ...html.matchAll(/<a[^>]+(?:class=["'][^"']*(?:category|cate|tag)[^"']*["'][^>]+)?href=["']([^"']*(?:category|cate|tag)[^"']*)["'][^>]*>([^<]+)<\/a>/gi)
  ];
  const uniqueCats = new Set(catLinks.map(m => m[2].trim().toLowerCase()).filter(Boolean));
  const categoryCount = uniqueCats.size;

  // 3) 내부 링크망 — 샘플 글당 내부 링크 평균
  const sameDomainLinkCounts = samples.map(s => {
    const links = (s.html || '').match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
    return links.length;
  });
  const avgInternalLinks = sameDomainLinkCounts.length > 0
    ? sameDomainLinkCounts.reduce((a, b) => a + b, 0) / sameDomainLinkCounts.length
    : 0;

  // 4) 작성자 권위 — 작성자 박스 출현 비율
  const authorPatterns = /(작성자|저자|글쓴이|by\s+[A-Z]|author|writer|written\s*by)/gi;
  const samplesWithAuthor = samples.filter(s => authorPatterns.test(s.html || '')).length;
  const authorRatio = samples.length > 0 ? samplesWithAuthor / samples.length : 0;
  const hasAboutPage = /<a[^>]+href=["'][^"']*(?:about|소개|profile|프로필)[^"']*["']/i.test(html);

  // 5) 채널 확장 — 외부 채널 링크
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
    bl_publishFreq: { newest, daysSinceNewest, postsLast30Days, postsLast90Days, totalDates: datesInIndex.length },
    bl_categoryDepth: { categoryCount, articlesPerCategory: samples.length / Math.max(1, categoryCount) },
    bl_internalLinks: { avgInternalLinks, sampleCount: samples.length },
    bl_authorAuthority: { samplesWithAuthor, totalSamples: samples.length, authorRatio, hasAboutPage },
    bl_channelExpansion: { activeChannels, channels }
  };
};

/**
 * Blog 신호 → 점수 (결정적, 0~100)
 */
window.scoreBlog = function(signals) {
  const s = signals || {};
  const out = {};

  // bl_publishFreq: 최신성(50) + 30일 발행 수(30) + 90일 발행 수(20)
  {
    const a = s.bl_publishFreq || {};
    let v = 0;
    if (a.daysSinceNewest <= 7) v += 50;
    else if (a.daysSinceNewest <= 30) v += 35;
    else if (a.daysSinceNewest <= 90) v += 20;
    else if (a.daysSinceNewest <= 180) v += 10;
    v += Math.min(30, (a.postsLast30Days || 0) * 6);  // 5개 이상이면 30점
    v += Math.min(20, (a.postsLast90Days || 0) * 2);
    out.bl_publishFreq = { value: Math.min(100, v), reason: `최신 ${a.daysSinceNewest || 0}일전, 30일 ${a.postsLast30Days || 0}개, 90일 ${a.postsLast90Days || 0}개` };
  }

  // bl_categoryDepth: 카테고리 수(60) + 카테고리당 글 수(40)
  {
    const a = s.bl_categoryDepth || {};
    let v = 0;
    v += Math.min(60, (a.categoryCount || 0) * 12);  // 5개 이상이면 60점
    v += Math.min(40, Math.round((a.articlesPerCategory || 0) * 4));  // 10개/카테고리면 40점
    out.bl_categoryDepth = { value: Math.min(100, v), reason: `카테고리 ${a.categoryCount || 0}개, 카테고리당 ${(a.articlesPerCategory || 0).toFixed(1)}개` };
  }

  // bl_internalLinks: 글당 평균 내부 링크 수 (3개=70, 5개=85, 10+개=100)
  {
    const a = s.bl_internalLinks || {};
    const avg = a.avgInternalLinks || 0;
    let v;
    if (avg >= 10) v = 100;
    else if (avg >= 5) v = 85;
    else if (avg >= 3) v = 70;
    else if (avg >= 1) v = 40;
    else v = 0;
    out.bl_internalLinks = { value: v, reason: `샘플 ${a.sampleCount || 0}개 글당 평균 ${avg.toFixed(1)}개 링크` };
  }

  // bl_authorAuthority: 작성자 노출 비율(70) + about 페이지(30)
  {
    const a = s.bl_authorAuthority || {};
    let v = Math.round((a.authorRatio || 0) * 70);
    if (a.hasAboutPage) v += 30;
    out.bl_authorAuthority = { value: Math.min(100, v), reason: `작성자 노출 ${Math.round((a.authorRatio || 0) * 100)}%, about ${a.hasAboutPage ? '✓' : '✗'}` };
  }

  // bl_channelExpansion: 채널 수에 비례 (1=20, 2=40, 3=60, 4=75, 5+=100)
  {
    const n = s.bl_channelExpansion?.activeChannels || 0;
    const map = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 75, 5: 90 };
    const v = n >= 6 ? 100 : (map[n] || 0);
    const channelNames = Object.entries(s.bl_channelExpansion?.channels || {})
      .filter(([, on]) => on).map(([k]) => k).join(', ');
    out.bl_channelExpansion = { value: v, reason: `${n}개 채널: ${channelNames || '없음'}` };
  }

  return out;
};

window.computeBlogTotal = function(scores) {
  if (!scores) return 0;
  let sum = 0, total = 0;
  Object.entries(window.BLOG_WEIGHTS).forEach(([id, w]) => {
    const raw = scores[id];
    if (raw === undefined || raw === null) return;
    const v = (typeof raw === 'object') ? Number(raw.value) : Number(raw);
    if (!isFinite(v)) return;
    sum += v * w;
    total += w;
  });
  return total === 0 ? 0 : Math.round(sum / total);
};
