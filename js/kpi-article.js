/**
 * GEO Score AI — Article KPI (본문 축, 10 KPI, 가중치 합 100)
 *
 * 진단 대상: 단일 글/포스트/페이지 (본문 텍스트)
 * 측정 결: ai_writing 6원칙 + 4신호 + FAQ + CEP
 * 출처: ai_writing 6원칙 (90upgrade.md PART 1.4) + 원본 cepScene
 *
 * 결정적 함수: 같은 입력 → 항상 같은 점수.
 */

window.ARTICLE_KPIS = [
  {
    id: 'ar_definitionH2', name: '정의문 H2', nameEn: 'Definition H2',
    icon: '📐', color: '#a855f7', color2: '#7c3aed', weight: 12,
    desc: 'H2 첫 문장 "X는 ~이다" 패턴 ≥ 50%',
    description: '각 H2 섹션의 첫 문장이 "X는 ~이다/~을 의미한다/~의 약자이다" 같은 정의문으로 시작하는 비율을 측정합니다 (ai_writing 원칙 2). AI는 정의문 형식을 우선 추출·인용하므로, 50% 이상 H2가 정의문이면 LLM 답변에 발췌될 가능성이 비약적으로 상승합니다.',
    insightHigh: 'H2 절반 이상이 정의문으로 시작해 LLM 추출에 매우 유리합니다.',
    insightMid: '일부 H2만 정의문 형식이라 정의문 비율 보강이 필요합니다.',
    insightLow: '정의문 H2가 거의 없어 AI가 핵심 정의를 추출하기 어렵습니다.'
  },
  {
    id: 'ar_questionH2', name: '질문형 H2', nameEn: 'Question H2',
    icon: '❓', color: '#ffa800', color2: '#ff8800', weight: 12,
    desc: 'H2에 ?/어떻게/왜/언제/무엇 ≥ 50%',
    description: 'H2 헤딩 중 질문형(예: "?", "어떻게", "왜", "언제", "무엇")의 비율을 측정합니다 (ai_writing 4-1). AI 검색 사용자는 질문 형태로 입력하므로, 질문형 H2 ≥ 50%인 글이 답변에 매칭될 확률이 높습니다.',
    insightHigh: 'H2 절반 이상이 질문형으로 사용자 질의와 매칭이 잘 됩니다.',
    insightMid: '일부 H2만 질문형이라 추가 질문형 H2 도입이 필요합니다.',
    insightLow: '질문형 H2가 거의 없어 사용자 질의와 매칭이 어렵습니다.'
  },
  {
    id: 'ar_brandRepetition', name: '브랜드 반복', nameEn: 'Brand Repetition',
    icon: '🏷️', color: '#ec4899', color2: '#be185d', weight: 10,
    desc: 'H2 섹션 중 브랜드명 등장 비율 ≥ 50%',
    description: 'H2 섹션 본문에서 브랜드/회사/제품명이 등장하는 비율을 측정합니다 (ai_writing 4-2). 50% 이상 섹션에 브랜드명이 등장하면 AI가 "이 글은 X 브랜드의 콘텐츠"로 인식하여 인용 시 브랜드를 함께 언급합니다.',
    insightHigh: 'H2 섹션 절반 이상에 브랜드명이 등장해 AI 인용 시 브랜드 노출이 잘 됩니다.',
    insightMid: '일부 섹션에만 브랜드명이 등장해 브랜드 반복 비율 보강이 필요합니다.',
    insightLow: '브랜드명이 거의 등장하지 않아 AI 인용 시 브랜드가 누락될 수 있습니다.'
  },
  {
    id: 'ar_externalCitation', name: '외부 인용', nameEn: 'External Citation',
    icon: '🌐', color: '#0095ff', color2: '#0073cc', weight: 11,
    desc: '후기/언론/"에 따르면" ≥ 30%',
    description: '본문에 후기, 언론 보도 인용, "~에 따르면" 같은 외부 신호 등장 비율을 측정합니다 (ai_writing 4-3). 30% 이상 단락에 외부 인용이 있으면 AI가 "제3자 검증된 콘텐츠"로 인식해 신뢰도 가중치가 상승합니다.',
    insightHigh: '후기·언론·외부 출처가 본문에 적절히 인용되어 신뢰도가 높습니다.',
    insightMid: '일부 외부 인용이 있으나 빈도가 부족해 보강이 필요합니다.',
    insightLow: '외부 인용이 거의 없어 자체 주장에 그쳐 신뢰 가중치가 낮습니다.'
  },
  {
    id: 'ar_ctaReach', name: 'CTA 도달률', nameEn: 'CTA Reach',
    icon: '🎯', color: '#f59e0b', color2: '#d97706', weight: 11,
    desc: '800자 블록당 CTA 등장 비율 ≥ 50%',
    description: '본문을 800자 단위로 나눴을 때, CTA(상담/예약/문의/신청) 키워드가 등장하는 블록의 비율을 측정합니다 (ai_writing 4-4). 50% 이상 블록에 CTA가 있으면 사용자가 어디서 글을 읽다 멈춰도 행동 유도가 가능합니다.',
    insightHigh: '800자 블록당 CTA 도달률이 높아 어느 위치에서도 행동 유도가 가능합니다.',
    insightMid: 'CTA가 일부 위치에만 집중되어 도달률이 제한적입니다.',
    insightLow: 'CTA가 거의 없어 글을 끝까지 안 읽으면 행동 유도가 어렵습니다.'
  },
  {
    id: 'ar_authorBox', name: '작성자 단락', nameEn: 'Author Box',
    icon: '👤', color: '#22c55e', color2: '#15803d', weight: 8,
    desc: '도입+결론에 작성자 정보 별도 단락 (ai_writing 원칙 1)',
    description: '글의 도입부와 결론에 작성자 정보(이름·자격·경력·연락처) 별도 단락이 있는지 측정합니다 (ai_writing 원칙 1). E-E-A-T 13신호 중 핵심으로, 작성자 권위가 명시되면 AI가 인용 시 출처로 함께 언급할 가능성이 높아집니다.',
    insightHigh: '도입+결론에 작성자 정보가 명시되어 권위 신호가 명확합니다.',
    insightMid: '작성자 정보가 단편적으로만 언급되어 보강이 필요합니다.',
    insightLow: '작성자 정보가 부재해 AI가 인용 출처를 명확히 파악하기 어렵습니다.'
  },
  {
    id: 'ar_listStructure', name: '구조화 (리스트/표)', nameEn: 'List Structure',
    icon: '🔢', color: '#0ea5e9', color2: '#0369a1', weight: 10,
    desc: '번호 리스트·표·Q:A:·명시적 수치 (ai_writing 원칙 3)',
    description: '본문에 번호 리스트(1./2./•), 표(<table>), Q:A: 패턴, 명시적 수치(%·원·명·건) 등 구조화 요소가 충분한지 측정합니다 (ai_writing 원칙 3). AI는 구조화된 정보를 우선 추출하므로, 단순 산문보다 인용률이 2~3배 높습니다.',
    insightHigh: '번호 리스트·표·수치가 풍부해 AI가 정보를 추출하기 매우 유리합니다.',
    insightMid: '일부 구조화 요소만 있어 리스트·표 추가 보강이 필요합니다.',
    insightLow: '산문 위주로 구조화 요소가 부재해 AI 추출이 어렵습니다.'
  },
  {
    id: 'ar_summary', name: '핵심답+TL;DR', nameEn: 'Summary',
    icon: '📝', color: '#14b8a6', color2: '#0f766e', weight: 8,
    desc: '도입부 핵심 답 + 결론 TL;DR (ai_writing 원칙 5)',
    description: '글의 도입부에 "핵심 답"이 먼저 제시되고, 결론에 TL;DR(요약)이 별도 단락으로 있는지 측정합니다 (ai_writing 원칙 5). AI는 글의 처음과 끝에서 답을 추출하므로, 명시적 요약이 있으면 인용 정확도가 크게 상승합니다.',
    insightHigh: '도입부 핵심 답 + 결론 TL;DR로 AI 인용 정확도가 매우 높습니다.',
    insightMid: '핵심 답 또는 요약 중 한쪽만 있어 보강이 필요합니다.',
    insightLow: '핵심 답과 요약 모두 부재해 AI가 글의 결론을 추출하기 어렵습니다.'
  },
  {
    id: 'ar_faq', name: 'FAQ 구조', nameEn: 'FAQ Structure',
    icon: '❔', color: '#10b981', color2: '#047857', weight: 10,
    desc: 'FAQ 섹션 + Q&A 5개 이상 + Schema FAQPage',
    description: 'FAQ 섹션 존재 + Q&A 5개 이상 + Schema FAQPage 마크업 적용 여부를 측정합니다. AI는 FAQPage Schema가 적용된 Q&A를 답변에 직접 발췌하는 경향이 강합니다. FAQ가 없는 글은 직접 인용 가능성이 떨어집니다.',
    insightHigh: 'FAQ 섹션 + 5+ Q&A + Schema FAQPage 마크업이 적용되어 직접 인용에 유리합니다.',
    insightMid: 'FAQ는 있으나 Q&A 수 부족 또는 Schema 미적용 상태입니다.',
    insightLow: 'FAQ 섹션 자체가 부재해 Q&A 형태 인용이 어렵습니다.'
  },
  {
    id: 'ar_cepScene', name: 'CEP 장면 매칭', nameEn: 'CEP Scene Matching',
    icon: '🎬', color: '#f97316', color2: '#c2410c', weight: 8,
    desc: '"○○할 때" 장면형 단락 (Category Entry Point)',
    description: '본문에 "아침에 갑자기 ○○할 때", "○○하기 직전에" 같은 결정적 순간(Category Entry Point) 장면형 단락이 포함되어 있는지 측정합니다. CEP 장면이 풍부할수록 AI가 실사용자 질문에 매칭되어 인용될 가능성이 높아집니다 (자체 차별점).',
    insightHigh: '결정적 순간(CEP)을 정조준한 장면형 단락이 풍부합니다.',
    insightMid: '일부 CEP 장면을 다루고 있으나 장면 다양성 보강이 필요합니다.',
    insightLow: 'CEP 장면을 다룬 단락이 거의 없어 순간 점유 기회를 놓치고 있습니다.'
  }
];

window.ARTICLE_WEIGHTS = window.ARTICLE_KPIS.reduce((a, k) => { a[k.id] = k.weight; return a; }, {});

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
  for (let i = 0; i < text.length; i += 800) blocks.push(text.slice(i, i + 800));
  const ctaBlocks = blocks.filter(b => ctaPattern.test(b)).length;

  // 6) 작성자 단락 — 도입부(앞 30%) + 결론부(뒤 30%)에 작성자 정보 검출
  const introZone = text.slice(0, Math.round(text.length * 0.3));
  const outroZone = text.slice(Math.round(text.length * 0.7));
  const authorPattern = /(작성자|저자|글쓴이|by\s+[A-Z]|author|writer|written\s*by|박사|전문의|대표|원장|컨설턴트)/i;
  const introHasAuthor = authorPattern.test(introZone);
  const outroHasAuthor = authorPattern.test(outroZone);

  // 7) 구조화 (리스트/표/수치)
  const numberedList = (html.match(/(?:^|\n|<li[^>]*>)\s*\d+[\.\)]/g) || []).length;
  const bulletList = (html.match(/(?:^|\n|<li[^>]*>)\s*[•\-\*]/g) || []).length;
  const hasTable = /<table[^>]*>/i.test(html);
  const numericPattern = /\d+\s*(%|원|명|건|일|시간|주|개월|년)/g;
  const numericCount = (text.match(numericPattern) || []).length;
  const qaPattern = /(?:^|\n)\s*(?:Q[:.\s]|문[:.\s]|질문[:.\s])/g;
  const qaPatternCount = (html.match(qaPattern) || []).length;

  // 8) 핵심답+TL;DR — 도입 첫 단락이 결론적 문장 + 결론에 "요약/정리/TL;DR/핵심"
  const introFirstSentence = (introZone.split(/[.!?]\s/)[0] || '').trim();
  const introHasAnswer = introFirstSentence.length > 20 && introFirstSentence.length < 250;
  const outroSummaryPattern = /(요약|정리하면|결론|tl;?dr|핵심|마무리)/i;
  const outroHasSummary = outroSummaryPattern.test(outroZone);

  // 9) FAQ
  const hasFaqHeading = /(faq|자주\s*묻는|자주\s*하는\s*질문|q\s*&\s*a)/i.test(html);
  const qaCount = qaPatternCount;
  const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html);

  // 10) CEP 장면
  const cepPattern = /(아침에|저녁에|밤에|새벽에|갑자기|문득|.{1,10}직전에|.{1,10}하기\s*전에|.{1,10}\s*할\s*때|.{1,10}하다가|.{1,10}하던\s*중)/g;
  const cepMatches = (text.match(cepPattern) || []).length;

  return {
    ar_definitionH2: { count: defCount, total: sections.length, ratio: sections.length === 0 ? 0 : defCount / sections.length },
    ar_questionH2: { count: qCount, total: h2Items.length, ratio: h2Items.length === 0 ? 0 : qCount / h2Items.length },
    ar_brandRepetition: { brandSections, total: sections.length, ratio: brandRatio, brandName: brand },
    ar_externalCitation: { count: extCount, total: paragraphs.length, ratio: paragraphs.length === 0 ? 0 : extCount / paragraphs.length },
    ar_ctaReach: { ctaBlocks, totalBlocks: blocks.length, ratio: blocks.length === 0 ? 0 : ctaBlocks / blocks.length },
    ar_authorBox: { introHasAuthor, outroHasAuthor },
    ar_listStructure: { numberedList, bulletList, hasTable, numericCount, qaPatternCount },
    ar_summary: { introHasAnswer, outroHasSummary },
    ar_faq: { hasHeading: hasFaqHeading, qaCount, hasSchema: hasFaqSchema },
    ar_cepScene: { matches: cepMatches }
  };
};

window.scoreArticle = function(signals) {
  const s = signals || {};
  const out = {};
  const ratioScore = r => {
    if (r >= 0.7) return 100;
    if (r >= 0.5) return 80;
    if (r >= 0.3) return 50;
    if (r >= 0.1) return 25;
    return Math.round((r || 0) * 100);
  };

  // 1) ar_definitionH2
  out.ar_definitionH2 = {
    value: s.ar_definitionH2?.total === 0 ? 0 : ratioScore(s.ar_definitionH2?.ratio || 0),
    reason: `정의문 H2 ${s.ar_definitionH2?.count || 0}/${s.ar_definitionH2?.total || 0} (${Math.round((s.ar_definitionH2?.ratio || 0) * 100)}%)`
  };
  // 2) ar_questionH2
  out.ar_questionH2 = {
    value: s.ar_questionH2?.total === 0 ? 0 : ratioScore(s.ar_questionH2?.ratio || 0),
    reason: `질문형 H2 ${s.ar_questionH2?.count || 0}/${s.ar_questionH2?.total || 0} (${Math.round((s.ar_questionH2?.ratio || 0) * 100)}%)`
  };
  // 3) ar_brandRepetition
  if (!s.ar_brandRepetition?.brandName) {
    out.ar_brandRepetition = { value: 30, reason: '브랜드명 미입력 — 측정 불가 (중립값)' };
  } else {
    out.ar_brandRepetition = {
      value: s.ar_brandRepetition.total === 0 ? 0 : ratioScore(s.ar_brandRepetition.ratio),
      reason: `${s.ar_brandRepetition.brandName} 등장 ${s.ar_brandRepetition.brandSections}/${s.ar_brandRepetition.total} 섹션 (${Math.round(s.ar_brandRepetition.ratio * 100)}%)`
    };
  }
  // 4) ar_externalCitation
  {
    const r = s.ar_externalCitation?.ratio || 0;
    let v;
    if (r >= 0.5) v = 100; else if (r >= 0.3) v = 80; else if (r >= 0.15) v = 50; else if (r >= 0.05) v = 25; else v = 0;
    out.ar_externalCitation = { value: v, reason: `외부 인용 ${s.ar_externalCitation?.count || 0}/${s.ar_externalCitation?.total || 0} (${Math.round(r * 100)}%)` };
  }
  // 5) ar_ctaReach
  {
    const r = s.ar_ctaReach?.ratio || 0;
    let v;
    if (r >= 0.5) v = 100; else if (r >= 0.3) v = 70; else if (r >= 0.1) v = 40; else v = 0;
    out.ar_ctaReach = { value: v, reason: `CTA ${s.ar_ctaReach?.ctaBlocks || 0}/${s.ar_ctaReach?.totalBlocks || 0} 블록 (${Math.round(r * 100)}%)` };
  }
  // 6) ar_authorBox (도입 50 + 결론 50)
  {
    const a = s.ar_authorBox || {};
    let v = 0;
    if (a.introHasAuthor) v += 50;
    if (a.outroHasAuthor) v += 50;
    out.ar_authorBox = { value: v, reason: `도입 ${a.introHasAuthor ? '✓' : '✗'}, 결론 ${a.outroHasAuthor ? '✓' : '✗'}` };
  }
  // 7) ar_listStructure (번호 리스트 25 + 글머리 15 + 표 25 + 수치 20 + Q&A 15)
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
  // 8) ar_summary
  {
    const a = s.ar_summary || {};
    let v = 0;
    if (a.introHasAnswer) v += 50;
    if (a.outroHasSummary) v += 50;
    out.ar_summary = { value: v, reason: `도입 핵심답 ${a.introHasAnswer ? '✓' : '✗'}, 결론 요약 ${a.outroHasSummary ? '✓' : '✗'}` };
  }
  // 9) ar_faq
  {
    const a = s.ar_faq || {};
    let v = 0;
    if (a.hasHeading) v += 30;
    v += Math.min(40, (a.qaCount || 0) * 8);
    if (a.hasSchema) v += 30;
    out.ar_faq = { value: Math.min(100, v), reason: `FAQ ${a.hasHeading ? '✓' : '✗'}, Q&A ${a.qaCount || 0}, Schema ${a.hasSchema ? '✓' : '✗'}` };
  }
  // 10) ar_cepScene (3+=100, 2=70, 1=40)
  {
    const n = s.ar_cepScene?.matches || 0;
    const v = n >= 5 ? 100 : (n >= 3 ? 80 : (n >= 2 ? 60 : (n >= 1 ? 35 : 0)));
    out.ar_cepScene = { value: v, reason: `CEP 장면 ${n}회 검출` };
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
