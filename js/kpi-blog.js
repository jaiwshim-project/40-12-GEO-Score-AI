/**
 * GEO Score AI — Blog KPI (운영 축, 10 KPI, 가중치 합 100)
 *
 * 진단 대상: 회사 블로그 (브런치/티스토리/네이버블로그/자체 블로그)
 * 측정 결: 발행·콘텐츠 누적·구조·작성자·토픽 권위·참여·채널·가독성·Schema
 * 출처: 원본 contentDepth(분리) + Topical Authority (Google Semantic SEO) +
 *      Pillar-Cluster (Hubspot SEO) + 원본 eeat 블로그 적용
 *
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 */

window.BLOG_KPIS = [
  {
    id: 'bl_publishFreq', name: '발행 빈도·최신성', nameEn: 'Publish Frequency & Recency',
    icon: '📅', color: '#ff6b35', color2: '#ff4500', weight: 14,
    desc: '30일 주기 발행 + 최신 글이 1주 이내',
    description: '블로그 포스트 발행 빈도와 최신 글의 작성일을 측정합니다. AI 학습 데이터는 신선한 콘텐츠를 우선시하므로, 30일 주기 발행이 이상적이며 최신 글이 1주 이내인 경우 활성 운영 사이트로 인식됩니다.',
    insightHigh: '꾸준한 주기 발행 + 최신 글이 1주 이내로 활성 운영 중입니다.',
    insightMid: '간헐적 발행으로 30일 이상 갱신 공백이 있습니다.',
    insightLow: '6개월 이상 발행이 멈춰 콘텐츠 자산 누적이 정체된 상태입니다.'
  },
  {
    id: 'bl_contentVolume', name: '누적 글 양', nameEn: 'Content Volume',
    icon: '📚', color: '#06b6d4', color2: '#0891b2', weight: 8,
    desc: '블로그 누적 글 수 (AI 학습 데이터 양)',
    description: '블로그에 누적된 총 글 수를 측정합니다. AI 학습 데이터 양에 직접 비례하므로, 50건 이상이면 AI 인용 풀에 진입, 200건 이상이면 안정적 인용 가능, 1000건 이상이면 토픽 도미넌스 형성됩니다.',
    insightHigh: '누적 글 수가 충분해 AI 학습 풀에 안정적으로 등장합니다.',
    insightMid: '글 수가 일부 부족해 50건 이상 누적이 필요합니다.',
    insightLow: '누적 글 수가 매우 적어 AI 학습 자체가 어려운 수준입니다.'
  },
  {
    id: 'bl_categoryDepth', name: '카테고리 깊이', nameEn: 'Category Depth',
    icon: '📂', color: '#a855f7', color2: '#7c3aed', weight: 10,
    desc: '카테고리 5개 이상 × 카테고리당 글 10개 이상',
    description: '블로그 카테고리 다양성과 카테고리당 글 수를 측정합니다. 카테고리 5개 이상 × 카테고리당 글 10개 이상이면 주제 권위(topic authority)가 형성됩니다.',
    insightHigh: '카테고리 5+ × 카테고리당 글 10+로 주제 권위가 형성되어 있습니다.',
    insightMid: '카테고리 분포가 불균형하거나 일부 카테고리만 글이 충분합니다.',
    insightLow: '카테고리가 적거나 한쪽에 글이 쏠려 있어 주제 권위가 약합니다.'
  },
  {
    id: 'bl_internalLinks', name: '내부 링크망', nameEn: 'Internal Link Network',
    icon: '🕸️', color: '#0ea5e9', color2: '#0369a1', weight: 10,
    desc: '글당 내부 링크 3개 이상 + Pillar-Cluster 형성',
    description: '블로그 글에서 다른 글로 연결되는 내부 링크 수와 네트워크 밀도를 측정합니다. 글당 내부 링크 3개 이상이면 Pillar-Cluster(Hubspot SEO 모델)가 형성되어 AI가 콘텐츠 간 관계를 파악하기 쉽습니다.',
    insightHigh: '글당 평균 3개 이상 내부 링크로 토픽 클러스터가 잘 형성되어 있습니다.',
    insightMid: '내부 링크가 일부 글에만 집중되어 클러스터 효과가 제한적입니다.',
    insightLow: '내부 링크가 거의 없어 사이트 권위가 분산되고 색인 효율이 낮습니다.'
  },
  {
    id: 'bl_authorAuthority', name: '작성자 권위', nameEn: 'Author Authority',
    icon: '👤', color: '#22c55e', color2: '#15803d', weight: 11,
    desc: '글당 저자 프로필 + 자격 + about 페이지',
    description: '블로그 글의 작성자 프로필(이름·자격·경력·연락처)과 E-E-A-T 신호 노출도를 측정합니다. 익명 또는 "관리자" 명의 글은 AI 신뢰 가중치가 낮습니다. 글마다 작성자 박스 + 별도 about 페이지가 있어야 권위 신호가 누적됩니다.',
    insightHigh: '저자 프로필·자격·연락처가 글마다 노출되어 권위 신호가 누적됩니다.',
    insightMid: '일부 글에만 작성자 정보가 있어 권위 신호 일관성이 부족합니다.',
    insightLow: '익명/관리자 명의 글이 다수로 작성자 권위 신호가 거의 없습니다.'
  },
  {
    id: 'bl_topicAuthority', name: '토픽 권위', nameEn: 'Topic Authority',
    icon: '🏛️', color: '#f59e0b', color2: '#d97706', weight: 10,
    desc: '단일 주제 집중도 (Topical Authority)',
    description: 'Google Semantic SEO 기준 단일 주제 집중도를 측정합니다. 카테고리·태그·제목에 동일 키워드 군집이 반복되면 토픽 권위가 형성되어 AI가 "이 사이트는 X 분야 전문"으로 인식합니다. 산만한 주제 분포는 권위 약화의 원인입니다.',
    insightHigh: '단일 주제 집중도가 높아 AI가 전문 분야로 명확히 인식합니다.',
    insightMid: '주제가 다소 산만하여 핵심 토픽 집중도 보강이 필요합니다.',
    insightLow: '주제가 흩어져 있어 AI가 전문 분야를 파악하기 어렵습니다.'
  },
  {
    id: 'bl_engagement', name: '사용자 참여', nameEn: 'User Engagement',
    icon: '💬', color: '#ec4899', color2: '#be185d', weight: 9,
    desc: '댓글/좋아요/공유 신호',
    description: '블로그 글의 댓글, 좋아요, 공유 신호 노출도를 측정합니다. AI는 "사람의 반응이 있는 콘텐츠"를 신뢰성이 높다고 판단하므로, 댓글·소셜 공유 버튼·좋아요 카운터가 노출되면 인용 가중치가 상승합니다.',
    insightHigh: '댓글·좋아요·공유 신호가 풍부해 AI가 인기 콘텐츠로 인식합니다.',
    insightMid: '일부 참여 신호만 있어 댓글 활성화·공유 버튼 보강이 필요합니다.',
    insightLow: '참여 신호가 거의 없어 "읽히지 않는 글"로 평가될 수 있습니다.'
  },
  {
    id: 'bl_channelExpansion', name: '채널 확장', nameEn: 'Channel Expansion',
    icon: '📡', color: '#8b5cf6', color2: '#6d28d9', weight: 11,
    desc: '블로그 + 유튜브 + SNS 멀티채널 운영',
    description: '블로그 외 유튜브·인스타그램·페이스북·X 등 외부 채널 운영 + 블로그 콘텐츠의 채널 확산 정도를 측정합니다. 멀티채널일수록 외부 신호와 백링크가 누적되어 AI 인용 가중치가 상승합니다.',
    insightHigh: '블로그 + 유튜브 + SNS 다채널을 운영하며 콘텐츠 확산이 활발합니다.',
    insightMid: '블로그 외 1~2개 채널만 운영해 채널 확장이 제한적입니다.',
    insightLow: '블로그만 단독 운영해 외부 신호와 채널 확산이 거의 없습니다.'
  },
  {
    id: 'bl_readability', name: '가독성', nameEn: 'Readability',
    icon: '📖', color: '#14b8a6', color2: '#0f766e', weight: 7,
    desc: '글당 평균 길이 1500자 이상 + 단락 분리',
    description: '블로그 글의 평균 본문 길이와 단락 분리 품질을 측정합니다. 글당 1500자 이상 + 적절한 단락 분리 + 소제목(H2/H3) 구조가 있어야 AI가 본문을 의미 단위로 추출하기 쉽습니다.',
    insightHigh: '글이 충분히 깊고 단락·소제목 구조가 잘 정리되어 있습니다.',
    insightMid: '일부 글이 짧거나 단락 분리가 미흡해 가독성 보강이 필요합니다.',
    insightLow: '글이 짧고 단락 구조가 없어 AI가 본문을 추출하기 어렵습니다.'
  },
  {
    id: 'bl_blogSchema', name: '블로그 Schema', nameEn: 'Blog Schema',
    icon: '🏷️', color: '#3b82f6', color2: '#1d4ed8', weight: 10,
    desc: 'BlogPosting/Article Schema 적용',
    description: '블로그 글에 BlogPosting 또는 Article Schema(JSON-LD)가 적용되었는지 측정합니다. AI는 Schema로 마킹된 글을 우선 인용하므로, datePublished/author/headline 등 필수 필드가 채워진 BlogPosting Schema가 적용된 사이트가 답변에 자주 발췌됩니다.',
    insightHigh: 'BlogPosting/Article Schema가 적용되어 AI 인용에 유리합니다.',
    insightMid: '일부 글에만 Schema가 적용되어 전체 적용 보강이 필요합니다.',
    insightLow: 'Schema 미적용으로 AI가 글의 메타 정보를 정확히 파악하기 어렵습니다.'
  },
  {
    id: 'bl_aiCitability', name: 'AI 인용 가능성', nameEn: 'AI Citability',
    icon: '🤖', color: '#ec4899', color2: '#be185d', weight: 12,
    desc: 'Gemini 시뮬레이션 인용율 (실측)',
    description: '샘플 글 본문으로 6개 가상 사용자 질문을 만들고 AI가 답변에 브랜드를 인용하는지 측정합니다. Perplexity·SearchGPT·AI Overview에서 실제 인용될 가능성의 대리 지표입니다. 80%↑ 인용율이면 AI 검색 답변에 안정적으로 등장합니다.',
    insightHigh: 'AI가 다양한 사용자 질문에 이 글을 출처로 활용하고 있습니다.',
    insightMid: '일부 질문 유형에서만 인용되고 있어 표현·구조 보강이 필요합니다.',
    insightLow: 'AI가 거의 인용하지 않고 있어 콘텐츠 재구성이 시급합니다.'
  }
];

window.BLOG_WEIGHTS = window.BLOG_KPIS.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});

window.detectBlogSignals = function(blogIndexHtml, articleSamples, meta) {
  const html = blogIndexHtml || '';
  const samples = Array.isArray(articleSamples) ? articleSamples : [];

  // 1) 발행 빈도·최신성
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

  // 2) 누적 글 양 — 인덱스에 보이는 글 링크 추정 + 페이지네이션 패턴
  const articleLinks = (html.match(/<a[^>]+href=["'][^"']*\/(post|article|blog|read|view|\d{4})[^"']*["']/gi) || []).length;
  const pageMatches = html.match(/page=(\d+)|\/page\/(\d+)/gi) || [];
  const maxPage = pageMatches.length > 0 ? Math.max(...pageMatches.map(p => parseInt(p.match(/\d+/)?.[0] || '0', 10))) : 0;
  const estTotalArticles = Math.max(articleLinks, maxPage * 10);  // 페이지당 10글 가정

  // 3) 카테고리 깊이
  const catLinks = [...html.matchAll(/<a[^>]+href=["']([^"']*(?:category|cate|tag)[^"']*)["'][^>]*>([^<]+)<\/a>/gi)];
  const uniqueCats = new Set(catLinks.map(m => m[2].trim().toLowerCase()).filter(Boolean));
  const categoryCount = uniqueCats.size;

  // 4) 내부 링크
  const linkCounts = samples.map(s => ((s.html || '').match(/<a[^>]+href=["'][^"']+["']/gi) || []).length);
  const avgInternalLinks = linkCounts.length > 0 ? linkCounts.reduce((a, b) => a + b, 0) / linkCounts.length : 0;

  // 5) 작성자 권위
  const authorPattern = /(작성자|저자|글쓴이|by\s+[A-Z]|author|writer|written\s*by)/i;
  const samplesWithAuthor = samples.filter(s => authorPattern.test(s.html || '')).length;
  const authorRatio = samples.length > 0 ? samplesWithAuthor / samples.length : 0;
  const hasAboutPage = /<a[^>]+href=["'][^"']*(?:about|소개|profile|프로필)[^"']*["']/i.test(html);

  // 6) 토픽 권위 — 카테고리/태그 빈도 분포 (지니계수 역산)
  const catFreq = {};
  catLinks.forEach(m => { const k = m[2].trim().toLowerCase(); catFreq[k] = (catFreq[k] || 0) + 1; });
  const freqs = Object.values(catFreq);
  const topFreqRatio = freqs.length > 0 ? Math.max(...freqs) / freqs.reduce((a, b) => a + b, 1) : 0;
  // topFreqRatio가 높을수록 단일 주제 집중도 ↑ (0.4~0.7 이상이면 권위)

  // 7) 사용자 참여
  const engagementSignals = {
    comments: /(댓글|comment|댓글\s*\d+|comments?\s*\(\s*\d+)/i.test(html),
    likes: /(좋아요|like|♡|❤|likes?\s*\(\s*\d+)/i.test(html),
    shares: /(공유|share|kakao|카카오|twitter|facebook).*share/i.test(html),
    socialButtons: ((html.match(/<(a|button)[^>]*(?:share|sns|social)[^>]*>/gi) || []).length) > 0
  };
  const engagementCount = Object.values(engagementSignals).filter(Boolean).length;

  // 8) 채널 확장
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

  // 9) 가독성 — 샘플 글 평균 본문 길이 + 단락 분리
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
};

window.scoreBlog = function(signals) {
  const s = signals || {};
  const out = {};

  // 1) bl_publishFreq
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
  // 2) bl_contentVolume — 50건=60, 200건=85, 1000+=100
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
  // 3) bl_categoryDepth
  {
    const a = s.bl_categoryDepth || {};
    let v = 0;
    v += Math.min(60, (a.categoryCount || 0) * 12);
    v += Math.min(40, Math.round((a.articlesPerCategory || 0) * 4));
    out.bl_categoryDepth = { value: Math.min(100, v), reason: `카테고리 ${a.categoryCount || 0}개, 카테고리당 ${(a.articlesPerCategory || 0).toFixed(1)}개` };
  }
  // 4) bl_internalLinks
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
  // 5) bl_authorAuthority
  {
    const a = s.bl_authorAuthority || {};
    let v = Math.round((a.authorRatio || 0) * 70);
    if (a.hasAboutPage) v += 30;
    out.bl_authorAuthority = { value: Math.min(100, v), reason: `작성자 노출 ${Math.round((a.authorRatio || 0) * 100)}%, about ${a.hasAboutPage ? '✓' : '✗'}` };
  }
  // 6) bl_topicAuthority — top 카테고리 비율 0.4~0.7가 이상적 (집중도 ↑)
  {
    const r = s.bl_topicAuthority?.topFreqRatio || 0;
    const u = s.bl_topicAuthority?.uniqueCategories || 0;
    let v;
    if (u === 0) v = 0;
    else if (r >= 0.4 && r <= 0.7) v = 90;        // 균형 잡힌 집중
    else if (r > 0.7) v = 75;                      // 과집중 (다양성 부족)
    else if (r >= 0.25) v = 65;                    // 약한 집중
    else v = 40;                                   // 산만
    out.bl_topicAuthority = { value: v, reason: `최상위 카테고리 비율 ${Math.round(r * 100)}%, 카테고리 수 ${u}` };
  }
  // 7) bl_engagement (4신호 hit 비율)
  {
    const a = s.bl_engagement || {};
    out.bl_engagement = { value: Math.round((a.count || 0) / (a.max || 4) * 100), reason: `참여 ${a.count || 0}/4 신호` };
  }
  // 8) bl_channelExpansion
  {
    const n = s.bl_channelExpansion?.activeChannels || 0;
    const map = { 0: 0, 1: 20, 2: 40, 3: 60, 4: 75, 5: 90 };
    const v = n >= 6 ? 100 : (map[n] || 0);
    const names = Object.entries(s.bl_channelExpansion?.channels || {}).filter(([, on]) => on).map(([k]) => k).join(', ');
    out.bl_channelExpansion = { value: v, reason: `${n}개 채널: ${names || '없음'}` };
  }
  // 9) bl_readability — 본문 길이(60) + 단락 수(40)
  {
    const a = s.bl_readability || {};
    const len = a.avgLength || 0;
    const lenScore = Math.min(60, Math.round(len / 1500 * 60));
    const parScore = Math.min(40, Math.round((a.paragraphsPerSample || 0) * 4));
    out.bl_readability = { value: Math.min(100, lenScore + parScore), reason: `평균 ${Math.round(len)}자, 단락 ${(a.paragraphsPerSample || 0).toFixed(1)}개` };
  }
  // 10) bl_blogSchema
  {
    const a = s.bl_blogSchema || {};
    let v = 0;
    if (a.hasBlogSchema) v += 50;
    v += Math.round((a.sampleSchemaRatio || 0) * 50);
    out.bl_blogSchema = { value: Math.min(100, v), reason: `Schema ${a.hasBlogSchema ? '✓' : '✗'}, 샘플 적용 ${Math.round((a.sampleSchemaRatio || 0) * 100)}%` };
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
