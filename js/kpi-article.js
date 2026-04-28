/**
 * GEO Score AI — Article KPI (본문 축, 6 KPI, 가중치 합 100)
 *
 * 진단 대상: 단일 글/포스트/페이지 (본문 텍스트)
 * 측정 결: 본문 신호 (정의문 H2, 질문형 H2, 브랜드 반복, 외부 인용, CTA 도달률, FAQ)
 *
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 * ai_writing 4신호 + 정의문 H2(원칙 2) + FAQ(원칙 3) 통합.
 */

window.ARTICLE_KPIS = [
  {
    id: 'ar_definitionH2',
    name: '정의문 H2',
    nameEn: 'Definition H2',
    icon: '📐',
    color: '#a855f7',
    color2: '#7c3aed',
    weight: 17,
    desc: 'H2 첫 문장 "X는 ~이다" 패턴 ≥ 50%',
    description: '각 H2 섹션의 첫 문장이 "X는 ~이다/~을 의미한다/~의 약자이다" 같은 정의문으로 시작하는 비율을 측정합니다. AI는 정의문 형식을 우선 추출·인용하므로, 50% 이상 H2가 정의문이면 LLM 답변에 발췌될 가능성이 비약적으로 상승합니다 (ai_writing 원칙 2).',
    insightHigh: 'H2 절반 이상이 정의문으로 시작해 LLM 추출에 매우 유리합니다.',
    insightMid: '일부 H2만 정의문 형식이라 정의문 비율 보강이 필요합니다.',
    insightLow: '정의문 H2가 거의 없어 AI가 핵심 정의를 추출하기 어렵습니다.'
  },
  {
    id: 'ar_questionH2',
    name: '질문형 H2',
    nameEn: 'Question H2',
    icon: '❓',
    color: '#ffa800',
    color2: '#ff8800',
    weight: 18,
    desc: 'H2에 ?/어떻게/왜/언제/무엇 ≥ 50%',
    description: 'H2 헤딩 중 질문형(예: "?", "어떻게", "왜", "언제", "무엇")의 비율을 측정합니다. AI 검색 사용자는 질문 형태로 입력하므로, 질문형 H2 ≥ 50%인 글이 답변에 매칭될 확률이 높습니다 (ai_writing 원칙 4-1).',
    insightHigh: 'H2 절반 이상이 질문형으로 사용자 질의와 매칭이 잘 됩니다.',
    insightMid: '일부 H2만 질문형이라 추가 질문형 H2 도입이 필요합니다.',
    insightLow: '질문형 H2가 거의 없어 사용자 질의와 매칭이 어렵습니다.'
  },
  {
    id: 'ar_brandRepetition',
    name: '브랜드 반복',
    nameEn: 'Brand Repetition',
    icon: '🏷️',
    color: '#ec4899',
    color2: '#be185d',
    weight: 15,
    desc: 'H2 섹션 중 브랜드명 등장 비율 ≥ 50%',
    description: 'H2 섹션 본문에서 브랜드/회사/제품명이 등장하는 비율을 측정합니다. 50% 이상 섹션에 브랜드명이 등장하면 AI가 "이 글은 X 브랜드의 콘텐츠"로 인식하여 인용 시 브랜드를 함께 언급합니다 (ai_writing 원칙 4-2).',
    insightHigh: 'H2 섹션 절반 이상에 브랜드명이 등장해 AI 인용 시 브랜드 노출이 잘 됩니다.',
    insightMid: '일부 섹션에만 브랜드명이 등장해 브랜드 반복 비율 보강이 필요합니다.',
    insightLow: '브랜드명이 거의 등장하지 않아 AI 인용 시 브랜드가 누락될 수 있습니다.'
  },
  {
    id: 'ar_externalCitation',
    name: '외부 인용',
    nameEn: 'External Citation',
    icon: '🌐',
    color: '#0095ff',
    color2: '#0073cc',
    weight: 17,
    desc: '후기/언론/"에 따르면" ≥ 30%',
    description: '본문에 후기, 언론 보도 인용, "~에 따르면" 같은 외부 신호 등장 비율을 측정합니다. 30% 이상 단락에 외부 인용이 있으면 AI가 "제3자 검증된 콘텐츠"로 인식해 신뢰도 가중치가 상승합니다 (ai_writing 원칙 4-3).',
    insightHigh: '후기·언론·외부 출처가 본문에 적절히 인용되어 신뢰도가 높습니다.',
    insightMid: '일부 외부 인용이 있으나 빈도가 부족해 보강이 필요합니다.',
    insightLow: '외부 인용이 거의 없어 자체 주장에 그쳐 신뢰 가중치가 낮습니다.'
  },
  {
    id: 'ar_ctaReach',
    name: 'CTA 도달률',
    nameEn: 'CTA Reach',
    icon: '🎯',
    color: '#f59e0b',
    color2: '#d97706',
    weight: 17,
    desc: '800자 블록당 CTA 등장 비율 ≥ 50%',
    description: '본문을 800자 단위로 나눴을 때, CTA(상담/예약/문의/신청) 키워드가 등장하는 블록의 비율을 측정합니다. 50% 이상 블록에 CTA가 있으면 사용자가 어디서 글을 읽다 멈춰도 행동 유도가 가능합니다 (ai_writing 원칙 4-4).',
    insightHigh: '800자 블록당 CTA 도달률이 높아 어느 위치에서도 행동 유도가 가능합니다.',
    insightMid: 'CTA가 일부 위치에만 집중되어 도달률이 제한적입니다.',
    insightLow: 'CTA가 거의 없어 글을 끝까지 안 읽으면 행동 유도가 어렵습니다.'
  },
  {
    id: 'ar_faq',
    name: 'FAQ 구조',
    nameEn: 'FAQ Structure',
    icon: '❔',
    color: '#10b981',
    color2: '#047857',
    weight: 16,
    desc: 'FAQ 섹션 + Q&A 5개 이상 + Schema FAQPage',
    description: 'FAQ 섹션 존재 + Q&A 5개 이상 + Schema FAQPage 마크업 적용 여부를 측정합니다. AI는 FAQPage Schema가 적용된 Q&A를 답변에 직접 발췌하는 경향이 강합니다. FAQ가 없는 글은 직접 인용 가능성이 떨어집니다.',
    insightHigh: 'FAQ 섹션 + 5+ Q&A + Schema FAQPage 마크업이 적용되어 직접 인용에 유리합니다.',
    insightMid: 'FAQ는 있으나 Q&A 수 부족 또는 Schema 미적용 상태입니다.',
    insightLow: 'FAQ 섹션 자체가 부재해 Q&A 형태 인용이 어렵습니다.'
  }
];

window.ARTICLE_WEIGHTS = window.ARTICLE_KPIS.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});

/**
 * Article 신호 검출 (결정적, 정규식 기반)
 * @param {string} articleHtmlOrText - 단일 글 본문 (HTML 또는 텍스트)
 * @param {object} meta - { title, brandName, ... }
 * @param {string} brandName - 브랜드명 (없으면 meta.brandName 사용)
 * @returns {object} 신호 객체
 */
window.detectArticleSignals = function(articleHtmlOrText, meta, brandName) {
  const html = articleHtmlOrText || '';
  const isHtml = /<[a-z][^>]*>/i.test(html);
  const text = isHtml
    ? html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ').trim()
    : html;
  const brand = (brandName || meta?.brandName || '').trim();

  // H2 추출 (HTML이면 <h2>, 마크다운이면 ## )
  let h2Items = [];
  if (isHtml) {
    h2Items = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  } else {
    // 마크다운: ## 으로 시작하는 라인
    h2Items = (html.match(/^##\s+(.+)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
  }

  // H2 섹션별 본문 추출 (다음 H2까지)
  const sections = [];
  if (isHtml) {
    const regex = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const heading = m[1].replace(/<[^>]+>/g, '').trim();
      const body = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      sections.push({ heading, body });
    }
  } else {
    const parts = html.split(/^##\s+/m);
    parts.slice(1).forEach(p => {
      const lines = p.split('\n');
      sections.push({ heading: lines[0].trim(), body: lines.slice(1).join(' ').trim() });
    });
  }

  // 1) 정의문 H2 — 각 H2 섹션 첫 문장이 "X는/이/을 ~이다/~을 의미/약자" 패턴
  const definitionPatterns = /^[^.!?\n]+(?:은|는|이|가)\s+[^.!?\n]+(?:이다|입니다|을\s*의미|를\s*의미|의\s*약자|를\s*뜻|을\s*뜻)/;
  const definitionCount = sections.filter(s => {
    const firstSentence = (s.body || '').split(/[.!?]\s/)[0] || '';
    return definitionPatterns.test(firstSentence);
  }).length;
  const definitionRatio = sections.length > 0 ? definitionCount / sections.length : 0;

  // 2) 질문형 H2 — H2에 ? 또는 의문사 포함
  const questionWords = /(\?|어떻게|왜|언제|무엇|어떤|어디서|어디|얼마|몇)/;
  const questionCount = h2Items.filter(h => questionWords.test(h)).length;
  const questionRatio = h2Items.length > 0 ? questionCount / h2Items.length : 0;

  // 3) 브랜드 반복 — H2 섹션 본문에 브랜드명 등장 비율
  let brandRatio = 0, brandSections = 0;
  if (brand && sections.length > 0) {
    const brandRegex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    brandSections = sections.filter(s => brandRegex.test(s.body || '')).length;
    brandRatio = brandSections / sections.length;
  }

  // 4) 외부 인용 — 단락 단위로 외부 신호 검출 (단락 = \n\n 또는 <p>)
  const paragraphs = isHtml
    ? [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
    : html.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const externalPatterns = /(에\s*따르면|보도|언론|기사|뉴스|연구|논문|발표|인용|후기|리뷰|평가|평점|에\s*의하면|기준으로|출처)/;
  const externalCount = paragraphs.filter(p => externalPatterns.test(p)).length;
  const externalRatio = paragraphs.length > 0 ? externalCount / paragraphs.length : 0;

  // 5) CTA 도달률 — 800자 블록당 CTA 키워드 비율
  const ctaPatterns = /(상담|예약|문의|신청|견적|체험|시작|연락|call|consult|book|inquiry|contact)/;
  const blocks = [];
  for (let i = 0; i < text.length; i += 800) blocks.push(text.slice(i, i + 800));
  const ctaBlocks = blocks.filter(b => ctaPatterns.test(b)).length;
  const ctaReachRatio = blocks.length > 0 ? ctaBlocks / blocks.length : 0;

  // 6) FAQ — FAQ 섹션 + Q/A 패턴 + Schema FAQPage
  const hasFaqHeading = /(faq|자주\s*묻는|자주\s*하는\s*질문|q\s*&\s*a)/i.test(html);
  const qaCount = (html.match(/(?:^|\n|<)\s*(?:Q[:.\s]|문[:.\s]|질문[:.\s])/gi) || []).length;
  const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html);

  return {
    ar_definitionH2: { count: definitionCount, total: sections.length, ratio: definitionRatio },
    ar_questionH2: { count: questionCount, total: h2Items.length, ratio: questionRatio },
    ar_brandRepetition: { brandSections, total: sections.length, ratio: brandRatio, brandName: brand },
    ar_externalCitation: { count: externalCount, total: paragraphs.length, ratio: externalRatio },
    ar_ctaReach: { ctaBlocks, totalBlocks: blocks.length, ratio: ctaReachRatio },
    ar_faq: { hasHeading: hasFaqHeading, qaCount, hasSchema: hasFaqSchema }
  };
};

/**
 * Article 신호 → 점수 (결정적, 0~100)
 * 각 신호: 0% → 0점, 30% → 50점, 50% → 80점, 70%+ → 100점
 */
window.scoreArticle = function(signals) {
  const s = signals || {};
  const out = {};

  const ratioScore = (r) => {
    if (r >= 0.7) return 100;
    if (r >= 0.5) return 80;
    if (r >= 0.3) return 50;
    if (r >= 0.1) return 25;
    return Math.round((r || 0) * 100);
  };

  // 정의문 H2
  {
    const a = s.ar_definitionH2 || {};
    out.ar_definitionH2 = {
      value: a.total === 0 ? 0 : ratioScore(a.ratio),
      reason: `정의문 H2 ${a.count || 0}/${a.total || 0} (${Math.round((a.ratio || 0) * 100)}%)`
    };
  }

  // 질문형 H2
  {
    const a = s.ar_questionH2 || {};
    out.ar_questionH2 = {
      value: a.total === 0 ? 0 : ratioScore(a.ratio),
      reason: `질문형 H2 ${a.count || 0}/${a.total || 0} (${Math.round((a.ratio || 0) * 100)}%)`
    };
  }

  // 브랜드 반복
  {
    const a = s.ar_brandRepetition || {};
    if (!a.brandName) {
      out.ar_brandRepetition = { value: 30, reason: '브랜드명 미입력 — 측정 불가 (중립값)' };
    } else {
      out.ar_brandRepetition = {
        value: a.total === 0 ? 0 : ratioScore(a.ratio),
        reason: `${a.brandName} 등장 ${a.brandSections || 0}/${a.total || 0} 섹션 (${Math.round((a.ratio || 0) * 100)}%)`
      };
    }
  }

  // 외부 인용 — 30% 이상이면 80점, 50%+ = 100
  {
    const a = s.ar_externalCitation || {};
    let v;
    if (a.ratio >= 0.5) v = 100;
    else if (a.ratio >= 0.3) v = 80;
    else if (a.ratio >= 0.15) v = 50;
    else if (a.ratio >= 0.05) v = 25;
    else v = 0;
    out.ar_externalCitation = { value: v, reason: `외부 인용 ${a.count || 0}/${a.total || 0} 단락 (${Math.round((a.ratio || 0) * 100)}%)` };
  }

  // CTA 도달률 — 50%+ = 100, 30%+ = 70
  {
    const a = s.ar_ctaReach || {};
    let v;
    if (a.ratio >= 0.5) v = 100;
    else if (a.ratio >= 0.3) v = 70;
    else if (a.ratio >= 0.1) v = 40;
    else v = 0;
    out.ar_ctaReach = { value: v, reason: `CTA ${a.ctaBlocks || 0}/${a.totalBlocks || 0} 블록 (${Math.round((a.ratio || 0) * 100)}%)` };
  }

  // FAQ — 헤딩(30) + Q&A 수(40) + Schema(30)
  {
    const a = s.ar_faq || {};
    let v = 0;
    if (a.hasHeading) v += 30;
    v += Math.min(40, (a.qaCount || 0) * 8);  // 5개 이상이면 40점
    if (a.hasSchema) v += 30;
    out.ar_faq = { value: Math.min(100, v), reason: `FAQ ${a.hasHeading ? '✓' : '✗'}, Q&A ${a.qaCount || 0}, Schema ${a.hasSchema ? '✓' : '✗'}` };
  }

  return out;
};

window.computeArticleTotal = function(scores) {
  if (!scores) return 0;
  let sum = 0, total = 0;
  Object.entries(window.ARTICLE_WEIGHTS).forEach(([id, w]) => {
    const raw = scores[id];
    if (raw === undefined || raw === null) return;
    const v = (typeof raw === 'object') ? Number(raw.value) : Number(raw);
    if (!isFinite(v)) return;
    sum += v * w;
    total += w;
  });
  return total === 0 ? 0 : Math.round(sum / total);
};
