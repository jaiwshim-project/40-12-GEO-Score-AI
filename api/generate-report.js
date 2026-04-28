/**
 * GEO Score AI - 영업용 단일 HTML 리포트 생성 API
 *
 * AX Biz Group 영업 리포트 양식 (삼일자동차운전전문학원 사례) 을 베이스로
 * GEO Score AI 진단 결과를 단일 HTML 영업 리포트로 패키징한다.
 *
 * AX Biz Group 양식 보존 요소
 *  - CSS 변수: --bg #f5f1e8(아이보리), --ink-darkest #0a0e1a, --gold #b8945a, --critical #8b1f1f 등
 *  - 폰트: Pretendard / Noto Serif KR / Cormorant Garamond
 *  - 레이아웃: 1100px 컨테이너 + 다크 헤더(#0a0e1a → #14213d) + 골드 라인
 *  - 3탭: 진단 리포트 / 신규 개발 제안 / 대표 프로필 (wine·emerald·gold tones)
 *  - 컴포넌트: summary-box, score-grid, score-card.critical/warning/good, kpi-row, alert.danger,
 *              phase 카드, principal-grid, premium-footer
 *
 * GEO Score AI 자체 차별점
 *  - 새 10 KPI → 8 score-card 매핑 (별점 환산 규칙: 0~19★ / 20~39★★ / 40~59★★★ / 60~79★★★★ / 80~100★★★★★)
 *  - 자체 차별점 2섹션: AI 인용 5신호 (aiwSignals) + CEP 장면 점유 (cepScenes)
 *  - 권장 경로 자동 매트릭스 (점수 + infraSignals 기반):
 *      ≥ 75 → 콘텐츠 강화
 *      60~74 → 부분 개선
 *      45~59 → 비교 검토
 *      30~44 → 신규 개발 권장
 *      0~29 또는 봇 5+ 차단 / sitemap 손상 → 신규 개발 필수
 *  - 견적표(400만원/3주)는 신규 개발 권장 시 자동 펼침
 *
 * 입력 (POST JSON):
 *  - result: analyze.js 응답 객체 (companyName, totalScore, scores, summary, meta, websiteUrl)
 *  - recommendation: recommend.js 응답 (priorityActions 등) — 선택
 *  - brand: 브랜드명 (선택, 기본 result.companyName)
 *  - industry: 업종 (선택, 기본 result.industry)
 *
 * 응답: { success, brand, industry, totalScore, recommendation: <path key>, htmlLength, html }
 */

// ===== 한글 인코딩 보정 (Vercel latin1 → utf8) =====
function fixKorean(str) {
  if (!str || typeof str !== 'string') return str;
  if (/[^\x00-\x7F]/.test(str) && /[ -ÿ]/.test(str)) {
    try {
      return Buffer.from(str, 'latin1').toString('utf8');
    } catch (_e) {
      return str;
    }
  }
  return str;
}

function deepFixKorean(obj) {
  if (obj == null) return obj;
  if (typeof obj === 'string') return fixKorean(obj);
  if (Array.isArray(obj)) return obj.map(deepFixKorean);
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepFixKorean(obj[k]);
    return out;
  }
  return obj;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// 점수(0~100) → 별점(1~5)
function starsFor(score) {
  const v = Number(score) || 0;
  let n;
  if (v < 20) n = 1;
  else if (v < 40) n = 2;
  else if (v < 60) n = 3;
  else if (v < 80) n = 4;
  else n = 5;
  return { count: n, html: '★'.repeat(n) + `<span class="empty">${'★'.repeat(5 - n)}</span>` };
}

function statusFor(score) {
  const v = Number(score) || 0;
  if (v < 40) return 'critical';
  if (v < 60) return 'warning';
  return 'good';
}

// ===== 새 10 KPI → 8 score-card 매핑 =====
function buildEightCards(result) {
  const s = result?.scores || {};
  const v = (id) => Number(s[id]?.value) || 0;
  const infra = result?.meta?.infraSignals || {};
  const robotsScore5 = Number(infra.robotsScore) || 0;       // 0~5
  const sitemapScore5 = Number(infra.sitemapScore) || 0;     // 0~5
  const blockedBots = Number(infra.blockedBotsCount) || 0;
  const allowedBots = Number(infra.allowedBotsCount) || 7;
  const sitemapValid = !!infra.sitemapValid;
  const sitemapUrls = Number(infra.sitemapUrlCount) || 0;

  // visibility/citation/authority/velocity 등 기존 10 KPI를 8 카드에 재구성
  const aibot = clamp(Math.round(robotsScore5 * 20), 0, 100);
  const sitemap = clamp(Math.round(sitemapScore5 * 20), 0, 100);
  const indexExposure = v('visibility');
  const structuredData = v('citation');
  const pageInfo = clamp(Math.round((v('visibility') + v('brand')) / 2), 0, 100);
  const contentDepth = clamp(Math.round((v('velocity') + v('brand') + v('channel')) / 3), 0, 100);
  const externalAuthority = clamp(Math.round((v('engagement') + v('competitive')) / 2), 0, 100);
  const eeat = clamp(Math.round((v('authority') * 0.7 + v('aio') * 0.3)), 0, 100);

  return [
    {
      key: 'botAccess',
      title: 'AI 봇 접근',
      score: aibot,
      note: blockedBots === 0
        ? `7개 AI 봇 모두 접근 허용. ChatGPT·Claude·Perplexity가 사이트를 자유롭게 읽을 수 있습니다.`
        : `${blockedBots}개 AI 봇 차단됨 — ChatGPT·Perplexity 일부가 우리 정보를 읽지 못하는 상태`
    },
    {
      key: 'sitemapStatus',
      title: '사이트 지도 상태',
      score: sitemap,
      note: sitemapValid
        ? `사이트 지도 작동 중 (${sitemapUrls}개 페이지 안내). AI가 사이트 전체를 빠짐없이 발견할 수 있습니다.`
        : (sitemapScore5 === 0
            ? '사이트 지도가 발견되지 않습니다. 검색·AI가 페이지 일부만 인지하는 상태'
            : '사이트 지도가 손상되었거나 외부 도메인을 가리킵니다 — 정비 필요')
    },
    {
      key: 'indexExposure',
      title: '검색 색인 (구글·네이버)',
      score: indexExposure,
      note: indexExposure < 40
        ? '검색에서 거의 노출되지 않습니다. 28년 업력이라도 온라인에서 발견될 수 없습니다.'
        : indexExposure < 70
          ? '주요 키워드 일부에서만 노출됩니다 — 페이지 정보 보강이 필요합니다.'
          : '검색에서 안정적으로 발견되는 단계입니다.'
    },
    {
      key: 'structuredData',
      title: '구조화 정보',
      score: structuredData,
      note: structuredData < 40
        ? 'AI가 인용할 수 있는 형태로 정리된 정보가 거의 없습니다.'
        : structuredData < 70
          ? '구조화가 일부 적용되었으나 FAQ·요약 영역 보강이 필요합니다.'
          : 'AI가 답변에 그대로 인용하기 좋은 형태로 잘 정리되어 있습니다.'
    },
    {
      key: 'pageInfo',
      title: '페이지 정보 (제목·요약)',
      score: pageInfo,
      note: pageInfo < 40
        ? '페이지 제목·요약·태그 첫인상 정보가 부족합니다.'
        : '제목·설명·미리보기 정보의 완성도가 양호합니다.'
    },
    {
      key: 'contentDepth',
      title: '콘텐츠 깊이',
      score: contentDepth,
      note: contentDepth < 40
        ? '신규 콘텐츠 발행이 거의 없어 AI 학습 데이터가 부족합니다.'
        : contentDepth < 70
          ? '간헐적 발행 — 일관된 발행 루틴 확립 필요'
          : '꾸준한 콘텐츠 생산으로 AI 학습 자산이 풍부합니다.'
    },
    {
      key: 'externalAuthority',
      title: '외부 권위 (리뷰·언급)',
      score: externalAuthority,
      note: externalAuthority < 40
        ? '리뷰·블로그·커뮤니티에서 우리 브랜드 언급이 거의 없습니다.'
        : externalAuthority < 70
          ? '외부 언급이 일부 존재 — 후기·기고 시스템 강화 필요'
          : '외부 채널에서 활발히 회자되는 단계입니다.'
    },
    {
      key: 'eeat',
      title: 'E-E-A-T (전문성·신뢰)',
      score: eeat,
      note: eeat < 40
        ? '대표·전문가·실적 등 신뢰 근거 노출이 부족합니다.'
        : eeat < 70
          ? '신뢰 신호가 일부 존재 — 저자·경력 노출 강화 필요'
          : '전문성과 경험이 잘 드러나 AI가 신뢰하는 출처로 인식됩니다.'
    }
  ];
}

// ===== 권장 경로 매트릭스 =====
function decideRecommendedPath(totalScore, infra) {
  const blocked = Number(infra?.blockedBotsCount) || 0;
  const sitemapScore = Number(infra?.sitemapScore) || 0;
  const sitemapValid = !!infra?.sitemapValid;

  // 인프라 손상 트리거: 5개 이상 봇 차단 OR sitemap 미발견·손상
  const infraBroken = blocked >= 5 || sitemapScore <= 1 || !sitemapValid;
  const t = Number(totalScore) || 0;

  if (t < 30 || (t < 45 && infraBroken)) {
    return {
      key: 'must-rebuild',
      title: '신규 개발 필수',
      shortLabel: 'Must Rebuild',
      tabSubtitle: '3 Weeks · 4 Million KRW',
      level: 'critical',
      summary: '현재 기반이 무너져 있어 부분 개선으로는 회복이 어렵습니다. 처음부터 새로 짓는 편이 시간·비용 모두 효율적입니다.',
      period: '3주 신규 개발 + 6개월 운영',
      cost: '400만원 (개발) + 월 50~150만원 (운영)',
      showQuote: true,
      reason: infraBroken
        ? `핵심 인프라 손상 (AI 봇 ${blocked}개 차단 / 사이트 지도 ${sitemapValid ? '약함' : '미발견'})`
        : '종합 점수가 회복 임계치 아래입니다.'
    };
  }
  if (t < 45) {
    return {
      key: 'rebuild-recommend',
      title: '신규 개발 권장',
      shortLabel: 'Rebuild Recommended',
      tabSubtitle: '3 Weeks · 4 Million KRW',
      level: 'critical',
      summary: '여러 약점이 동시에 누적되어 있어 부분 패치보다 신규 개발이 ROI 측면에서 유리합니다.',
      period: '3주 신규 개발 + 6개월 운영',
      cost: '400만원 (개발) + 월 50~150만원 (운영)',
      showQuote: true,
      reason: '여러 KPI에 약점이 분산되어 있어 부분 개선의 한계가 큽니다.'
    };
  }
  if (t < 60) {
    return {
      key: 'compare',
      title: '비교 검토 (개선 vs 신규 개발)',
      shortLabel: 'Compare Options',
      tabSubtitle: 'Selective vs Rebuild',
      level: 'warning',
      summary: '회복 가능한 자산도 있고 손봐야 할 부분도 있습니다. 부분 개선과 신규 개발 양쪽을 비교해 결정하세요.',
      period: '4~6개월 단계 진행',
      cost: '월 200~500만원 (부분 개선) 또는 400만원+운영 (신규 개발)',
      showQuote: true,
      reason: '점수가 회복 가능 구간에 있으나 인프라 일부에 손상이 있습니다.'
    };
  }
  if (t < 75) {
    return {
      key: 'selective',
      title: '부분 개선 (Selective Boost)',
      shortLabel: 'Selective Boost',
      tabSubtitle: '3~6 Months · Targeted',
      level: 'warning',
      summary: '핵심 자산은 살아 있어 약점 KPI만 집중 보강하면 충분합니다.',
      period: '3~6개월',
      cost: '월 200~500만원',
      showQuote: false,
      reason: '핵심 인프라가 작동 중이며 회복이 빠를 영역이 명확합니다.'
    };
  }
  return {
    key: 'reinforce',
    title: '콘텐츠 강화 (Reinforce)',
    shortLabel: 'Reinforce',
    tabSubtitle: 'Sustain & Scale',
    level: 'good',
    summary: '상위권 수준입니다. 미세 조정과 콘텐츠 누적 발행으로 우위를 굳히면 됩니다.',
    period: '월간 운영',
    cost: '월 50~150만원',
    showQuote: false,
    reason: '인프라·콘텐츠 모두 양호해 신규 개발이 불필요합니다.'
  };
}

// ===== AI 인용 5신호 (자체 차별점 9번) =====
function buildAIWritingSignals(result) {
  const aiw = result?.meta?.aiwSignals || {};
  const items = [
    {
      key: 'questionHeadings',
      title: '질문형 H2',
      desc: '본문에 “어떻게/왜/무엇을” 형태의 질문 헤딩이 얼마나 들어 있는가',
      score3: Number(aiw.questionHeadings) || 0
    },
    {
      key: 'definitionH2',
      title: '정의문 H2',
      desc: '“X는 Y이다” 형태의 정의 문장이 섹션 첫 줄에 얼마나 등장하는가',
      score3: Number(aiw.definitionH2) || 0
    },
    {
      key: 'brandRepetition',
      title: '브랜드 반복',
      desc: '주요 섹션에서 브랜드명이 일관되게 반복 노출되는가',
      score3: Number(aiw.brandRepetition) || 0
    },
    {
      key: 'externalSignal',
      title: '외부 신호',
      desc: '리뷰·언론·외부 매체가 본문에 인용되는가',
      score3: Number(aiw.externalSignal) || 0
    },
    {
      key: 'ctaReach',
      title: 'CTA 도달성',
      desc: '본문 곳곳에서 상담·예약 등 행동 유도가 자연스럽게 노출되는가',
      score3: Number(aiw.ctaReach) || 0
    }
  ];
  const total = items.reduce((sum, it) => sum + it.score3, 0); // 0~15
  const total100 = clamp(Math.round((total / 15) * 100), 0, 100);
  return { items, total, total100 };
}

// ===== CEP 장면 점유 (자체 차별점 10번) =====
function buildCEPScenes(result, brand, industry) {
  // result.cepScenes가 있으면 사용 (외부 주입 가능), 없으면 산업 기반 생성
  const provided = Array.isArray(result?.cepScenes) ? result.cepScenes : null;
  if (provided && provided.length > 0) return provided.slice(0, 5);

  return [
    { scene: `“${industry} 어떻게 시작해야 할지 모르겠다” — 첫 문의 직전 30분`, content: `${brand} 첫 상담 가이드 — 5분 안에 결정 가능 체크리스트` },
    { scene: `“가격이 너무 차이나서 불안하다” — 견적 비교 직후`, content: `${brand} 가격 투명 공개 — 3가지 등급별 포함 항목 한눈에` },
    { scene: `“실제 후기를 보고 싶다” — 결정 직전 의심 단계`, content: `${brand} 실제 사례 12건 — 상황·해결·결과 구조 케이스 스터디` },
    { scene: `“우리 같은 케이스도 가능한가” — 적합성 판단 단계`, content: `${brand} 적합성 자가 진단 — 7문항 체크 + 즉시 추천` },
    { scene: `“이 사람을 믿어도 될까” — 대표 신뢰 검증 단계`, content: `${brand} 대표 인터뷰 — 28년 업력의 결정적 순간 5가지` }
  ];
}

// ===== 핵심 결함 / 강점 (사람 어휘) =====
function getCriticalIssues(eightCards) {
  return eightCards
    .filter(c => c.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
}

function getStrengthCards(eightCards) {
  return eightCards
    .filter(c => c.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

// ===== HTML 빌더 =====
function buildHTML(result, recommendation, brand, industry) {
  const totalScore = Number(result?.totalScore) || 0;
  const grade = result?.grade?.label || '-';
  const websiteUrl = result?.websiteUrl || '';
  const headline = result?.summary?.headline || `${brand}의 GEO 점수는 ${totalScore}점입니다.`;
  const diagnosis = result?.summary?.diagnosis || '';
  const analyzedAt = result?.analyzedAt ? new Date(result.analyzedAt) : new Date();
  const dateStr = `${analyzedAt.getFullYear()}년 ${analyzedAt.getMonth() + 1}월 ${analyzedAt.getDate()}일`;

  const eightCards = buildEightCards(result);
  const criticals = getCriticalIssues(eightCards);
  const strengths = getStrengthCards(eightCards);
  const aiw = buildAIWritingSignals(result);
  const cepScenes = buildCEPScenes(result, brand, industry);
  const path = decideRecommendedPath(totalScore, result?.meta?.infraSignals);
  const reportCode = `GEO-${String(Date.now()).slice(-8)}`;

  const e = escapeHtml;

  // KPI 미리보기 3개 (kpi-row)
  const kpiPreviewHTML = `
    <div class="kpi"><div class="kpi-value">${totalScore}</div><div class="kpi-label">종합 GEO Score</div></div>
    <div class="kpi"><div class="kpi-value">${aiw.total}/15</div><div class="kpi-label">AI 인용 5신호 합계</div></div>
    <div class="kpi"><div class="kpi-value">${cepScenes.length}</div><div class="kpi-label">발굴된 CEP 장면</div></div>`;

  // 8 score-card
  const scoreGridHTML = eightCards.map(c => {
    const st = starsFor(c.score);
    const cls = statusFor(c.score);
    return `
      <div class="score-card ${cls}">
        <div class="item-title">${e(c.title)}</div>
        <div class="stars" aria-label="${st.count}점/5점">${st.html}</div>
        <div class="note">${e(c.note)}</div>
      </div>`;
  }).join('');

  // AI 인용 5신호 (자체 차별점)
  const aiwHTML = aiw.items.map(it => `
    <tr>
      <td>${e(it.title)}</td>
      <td>${e(it.desc)}</td>
      <td style="text-align:center;font-weight:700;color:var(--gold-deep);">${it.score3}/3</td>
      <td style="text-align:right;">
        <span class="aiw-bar"><span class="aiw-bar-fill" style="width:${(it.score3 / 3) * 100}%"></span></span>
      </td>
    </tr>`).join('');

  // CEP 장면 (자체 차별점)
  const cepHTML = cepScenes.map((c, i) => `
    <div class="cep-card">
      <div class="cep-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="cep-body">
        <div class="cep-scene">${e(c.scene)}</div>
        <div class="cep-content"><strong>표적 콘텐츠</strong> · ${e(c.content)}</div>
      </div>
    </div>`).join('');

  // 결함 / 강점
  const criticalsHTML = criticals.length ? criticals.map(c => `
    <div class="alert danger">
      <strong>${e(c.title)} — ${c.score}점</strong>
      ${e(c.note)}
    </div>`).join('') : '<p>현재 발견된 핵심 결함이 없습니다.</p>';

  const strengthsHTML = strengths.length ? `
    <div class="alert success">
      <strong>이미 가지고 계신 강점</strong>
      <ul style="margin-top:8px;">
        ${strengths.map(s => `<li><strong>${e(s.title)} (${s.score}점)</strong> — ${e(s.note)}</li>`).join('')}
      </ul>
    </div>` : '<p>아직 두드러진 강점 KPI가 형성되어 있지 않습니다.</p>';

  // 진단 종합 박스
  const summaryBoxHTML = `
    <div class="summary-box">
      <h3>Executive Summary</h3>
      <p>${e(brand)}의 AI 검색 시대 존재력을 10가지 신호로 진단한 결과, <strong>현재 상태는 ${e(grade)} (${totalScore}/100)</strong> 수준입니다. ${e(headline)}</p>
      <div class="big-number">${totalScore} <span class="em">/ 100</span></div>
      <p>${e(diagnosis || '인프라·구조·콘텐츠·외부 권위 4축을 종합 분석했습니다.')}</p>
      <p style="margin-top:10px;">권장 경로: <strong>${e(path.title)}</strong> — ${e(path.summary)}</p>
    </div>`;

  // 4 phase
  const phasesHTML = `
    <div class="timeline">
      <div class="phase urgent">
        <span class="phase-tag">Week 1 — 기반 정비</span>
        <h3>1주차: AI 봇 접근 · 사이트 지도 · 페이지 정보 표준화</h3>
        <ul>
          <li><strong>1~2일차</strong>: AI 봇 접근 설정 정비 — ChatGPT·Claude·Perplexity 등 7개 AI가 사이트를 자유롭게 읽도록 허용</li>
          <li><strong>3~4일차</strong>: 사이트 지도 자동 생성·최신화 — 모든 페이지가 빠짐없이 검색·AI에 노출</li>
          <li><strong>5~7일차</strong>: 페이지 제목·요약·태그 표준화, 대표·전문가 신뢰 페이지 신설</li>
        </ul>
      </div>
      <div class="phase short">
        <span class="phase-tag">Week 2 — 구조화 + 콘텐츠</span>
        <h3>2주차: AI가 인용하기 좋은 형태로 정보 재조립</h3>
        <ul>
          <li><strong>8~10일차</strong>: FAQ 30개 + 사례 콘텐츠 12건 적재, 질문형·정의형 헤딩으로 재구성</li>
          <li><strong>11~12일차</strong>: 리뷰·후기 시스템 활성화, 외부 매체 인용 링크 정비</li>
          <li><strong>13~14일차</strong>: 본문 곳곳에 자연스러운 상담·예약 유도 동선 삽입</li>
        </ul>
      </div>
      <div class="phase mid">
        <span class="phase-tag">Week 3 — 채널 확장 + 오픈</span>
        <h3>3주차: CEP 장면별 표적 콘텐츠 6편 + 정식 오픈</h3>
        <ul>
          <li><strong>15~17일차</strong>: 발굴된 CEP 장면 5개 각각의 표적 콘텐츠 6편 작성·게시</li>
          <li><strong>18~19일차</strong>: 페이지 속도 최적화 (3초 이내), 모든 브라우저·모바일 점검</li>
          <li><strong>20~21일차</strong>: 도메인 이관 + 보안 인증서 + 검색·지도 등록 + 정식 오픈</li>
        </ul>
      </div>
      <div class="phase long">
        <span class="phase-tag">오픈 이후 — 무상 안정화 2주</span>
        <h3>오픈 후 사후 지원 (포함)</h3>
        <ul>
          <li><strong>오픈 후 14일</strong>: 발견되는 오류·미세 조정 무상 대응</li>
          <li><strong>운영자 매뉴얼 PDF + 1회 운영 교육</strong> (화상 60분)</li>
          <li><strong>30일차 검색 노출 점검 리포트</strong> 1회 제공</li>
        </ul>
      </div>
    </div>`;

  // 견적표 (AX Biz Group 양식 그대로 — 400만원/3주)
  const quoteHTML = path.showQuote ? `
    <h2>견적 (총 400만원 / VAT 별도)</h2>
    <table>
      <tr>
        <th>항목</th>
        <th>내용</th>
        <th width="130" style="text-align:right;">금액</th>
      </tr>
      <tr>
        <td>기획 · 정보 구조 설계</td>
        <td>메뉴 구성, 핵심 키워드 정리, 기존 정보 재구성</td>
        <td style="text-align:right;">600,000원</td>
      </tr>
      <tr>
        <td>디자인 (PC + 모바일)</td>
        <td>${e(brand)} 톤에 맞춘 디자인 시안 — 메인 + 서브 페이지 12종</td>
        <td style="text-align:right;">800,000원</td>
      </tr>
      <tr>
        <td>홈페이지 화면 개발</td>
        <td>전체 18페이지 화면 구현 + 모바일 반응형</td>
        <td style="text-align:right;">1,200,000원</td>
      </tr>
      <tr>
        <td>AI 검색·일반 검색 최적화</td>
        <td>AI 봇 접근 · 사이트 지도 · 구조화 정보 일괄 작업</td>
        <td style="text-align:right;">700,000원</td>
      </tr>
      <tr>
        <td>블로그 시스템 구축</td>
        <td>운영자가 직접 글을 올릴 수 있는 글쓰기 화면 제작</td>
        <td style="text-align:right;">400,000원</td>
      </tr>
      <tr>
        <td>초기 콘텐츠 작성</td>
        <td>CEP 장면 기반 표적 콘텐츠 6편 직접 작성</td>
        <td style="text-align:right;">300,000원</td>
      </tr>
      <tr style="background:var(--surface-warm);">
        <td colspan="2"><strong>합계 (VAT 별도)</strong></td>
        <td style="text-align:right;font-size:16px;color:var(--gold-deep);"><strong>4,000,000원</strong></td>
      </tr>
    </table>
    <div class="alert info" style="margin-top:14px;">
      <strong>지급 방식</strong>
      계약 시 50%(200만원) · 정식 오픈 시 50%(200만원) — 이체 또는 세금계산서 발행 가능
    </div>` : `
    <h2>운영 견적 (월간)</h2>
    <table>
      <tr><th>항목</th><th>내용</th><th width="130" style="text-align:right;">금액</th></tr>
      <tr><td>월간 콘텐츠 발행</td><td>주 5회 자동 발행 (CEP 장면 기반)</td><td style="text-align:right;">월 1,500,000원</td></tr>
      <tr><td>AI 인용 모니터링</td><td>월 리포트 + 약점 KPI 재진단</td><td style="text-align:right;">월 500,000원</td></tr>
      <tr><td>분기 전략 컨설팅</td><td>경영진 미팅 (분기 1회)</td><td style="text-align:right;">회당 1,000,000원</td></tr>
    </table>`;

  // 권장 경로 카드
  const pathCardHTML = `
    <div class="alert ${path.level === 'critical' ? 'danger' : path.level === 'warning' ? 'warning' : 'success'}">
      <strong>권장 경로 — ${e(path.title)}</strong>
      <p style="margin-top:6px;">${e(path.summary)}</p>
      <ul style="margin-top:10px;">
        <li><strong>판정 근거</strong> — ${e(path.reason)}</li>
        <li><strong>예상 기간</strong> — ${e(path.period)}</li>
        <li><strong>예상 비용</strong> — ${e(path.cost)}</li>
      </ul>
    </div>`;

  // 우선순위 액션 (recommend.js)
  const priorityActions = Array.isArray(recommendation?.priorityActions) ? recommendation.priorityActions : [];
  const priorityHTML = priorityActions.length ? `
    <h3>우선순위 액션 Top ${Math.min(3, priorityActions.length)}</h3>
    <ol>
      ${priorityActions.slice(0, 3).map(p => `
        <li><strong>${e(p.action || '-')}</strong> — ${e(p.detail || '')}
        ${p.impact ? ` <span style="color:var(--gold-deep);font-size:12px;">(${e(p.impact)})</span>` : ''}</li>
      `).join('')}
    </ol>` : '';

  // 푸터의 견적/일정 라인 (권장 경로에 따라 동적)
  const footerCost = path.showQuote ? '400만원 (VAT 별도)' : path.cost;
  const footerPeriod = path.showQuote ? '3주 개발' : path.period;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${e(brand)} — AI 검색 시대 GEO 진단 리포트</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${e(brand)} GEO 진단 리포트 - AX Biz Group" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700;900&family=Pretendard:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #f5f1e8;
    --bg-tint: #ebe4d3;
    --surface: #ffffff;
    --surface-warm: #fdfbf6;
    --ink-darkest: #0a0e1a;
    --ink-dark: #14213d;
    --ink-mid: #1e3a5f;
    --ink-soft: #4a5568;
    --ink-light: #718096;
    --line: #e6dec8;
    --line-dark: #cbb98e;
    --gold: #b8945a;
    --gold-bright: #d4b078;
    --gold-deep: #8b6f3f;
    --gold-dark: #6b5430;
    --critical: #8b1f1f;
    --warning: #a05d1c;
    --success: #2f5d3f;
    --info: #1e3a5f;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.75;
    color: var(--ink-dark);
    background: var(--bg);
    background-image:
      radial-gradient(circle at 10% 0%, rgba(184,148,90,.06) 0%, transparent 40%),
      radial-gradient(circle at 90% 100%, rgba(20,33,61,.04) 0%, transparent 40%);
    background-attachment: fixed;
    padding: 56px 20px;
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .container {
    max-width: 1100px;
    margin: 0 auto;
    background: var(--surface);
    padding: 0;
    box-shadow:
      0 1px 0 rgba(184,148,90,.15),
      0 2px 4px rgba(20,33,61,.04),
      0 24px 60px rgba(20,33,61,.10),
      0 0 0 1px rgba(184,148,90,.08);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }
  .container::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, var(--gold-deep) 0%, var(--gold-bright) 50%, var(--gold-deep) 100%);
  }
  /* HEADER */
  header {
    background: linear-gradient(135deg, var(--ink-darkest) 0%, var(--ink-dark) 60%, var(--ink-mid) 100%);
    color: #fff;
    padding: 70px 80px 60px;
    position: relative;
    overflow: hidden;
  }
  header::after {
    content: "";
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold-bright) 50%, var(--gold) 70%, transparent);
  }
  header::before {
    content: "";
    position: absolute;
    top: -100px; right: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(184,148,90,.12) 0%, transparent 70%);
  }
  .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; position: relative; z-index: 1; }
  .crest { display: inline-flex; align-items: center; gap: 12px; }
  .crest-line { width: 40px; height: 1px; background: var(--gold-bright); }
  .label {
    color: var(--gold-bright);
    font-size: 11px;
    letter-spacing: 4px;
    font-weight: 600;
    text-transform: uppercase;
    font-family: 'Cormorant Garamond', 'Noto Serif KR', serif;
  }
  .header-ax-mark {
    display: flex; align-items: center; gap: 12px;
    padding: 4px 14px 4px 4px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(184,148,90,.25);
    border-radius: 4px;
  }
  .header-ax-mark .ax-mini-img {
    width: 36px; height: 36px; background: #fff; border-radius: 3px; padding: 3px;
    display: flex; align-items: center; justify-content: center;
  }
  .header-ax-mark .ax-mini-img img { width: 100%; height: 100%; object-fit: contain; }
  .header-ax-mark .ax-mini-text { display: flex; flex-direction: column; line-height: 1.2; }
  .header-ax-mark .ax-mini-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 12px; letter-spacing: 0.25em; color: var(--gold-bright); font-weight: 600;
  }
  .header-ax-mark .ax-mini-by {
    font-family: 'Cormorant Garamond', serif;
    font-size: 9.5px; letter-spacing: 0.32em; color: rgba(255,255,255,.5);
    text-transform: uppercase; margin-top: 2px; font-style: italic;
  }
  h1 {
    font-family: 'Noto Serif KR', 'Cormorant Garamond', serif;
    font-size: 38px; font-weight: 700; color: #fff;
    margin-bottom: 18px; line-height: 1.35; letter-spacing: -0.02em;
    position: relative;
  }
  h1 .accent {
    color: var(--gold-bright);
    font-weight: 400; font-style: italic;
    font-family: 'Cormorant Garamond', serif;
  }
  .subtitle {
    color: rgba(255,255,255,.78);
    font-size: 15px; line-height: 1.7;
    max-width: 720px; font-weight: 300; letter-spacing: 0.01em;
  }
  .meta {
    display: flex; gap: 0; margin-top: 36px; padding-top: 28px;
    font-size: 13px; color: rgba(255,255,255,.6); flex-wrap: wrap;
    border-top: 1px solid rgba(184,148,90,.25);
  }
  .meta span {
    padding: 4px 28px 4px 0;
    margin-right: 28px;
    border-right: 1px solid rgba(184,148,90,.2);
    letter-spacing: 0.02em;
  }
  .meta span:last-child { border-right: none; }
  .meta span strong {
    display: block; color: var(--gold-bright);
    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    font-weight: 500; margin-bottom: 4px;
    font-family: 'Cormorant Garamond', serif;
  }
  .meta span em { color: #fff; font-style: normal; font-weight: 500; font-size: 14px; }

  /* CONTENT */
  .content { padding: 60px 80px; }
  h2 {
    font-family: 'Noto Serif KR', serif;
    font-size: 26px; font-weight: 700; color: var(--ink-darkest);
    margin: 64px 0 24px; padding-bottom: 16px;
    position: relative; letter-spacing: -0.01em;
    border-bottom: 1px solid var(--line);
  }
  h2::before {
    content: ""; position: absolute; bottom: -1px; left: 0;
    width: 60px; height: 2px; background: var(--gold);
  }
  h2:first-child { margin-top: 0; }
  h3 {
    font-family: 'Noto Serif KR', serif;
    font-size: 19px; font-weight: 600; color: var(--ink-dark);
    margin: 32px 0 14px; letter-spacing: -0.01em;
  }
  p { margin-bottom: 14px; color: var(--ink-soft); font-size: 15px; line-height: 1.8; }
  strong { color: var(--ink-darkest); font-weight: 600; }

  /* SCORE GRID — AX Biz Group 양식 그대로 */
  .score-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin: 28px 0;
  }
  .score-card {
    padding: 22px 24px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-left: 3px solid var(--ink-light);
    transition: all .2s;
  }
  .score-card:hover { box-shadow: 0 4px 16px rgba(20,33,61,.06); transform: translateY(-1px); }
  .score-card.critical { border-left-color: var(--critical); background: linear-gradient(to right, rgba(139,31,31,.025), var(--surface) 30%); }
  .score-card.warning { border-left-color: var(--warning); background: linear-gradient(to right, rgba(160,93,28,.025), var(--surface) 30%); }
  .score-card.good { border-left-color: var(--success); background: linear-gradient(to right, rgba(47,93,63,.025), var(--surface) 30%); }
  .score-card .item-title { font-weight: 600; font-size: 15px; margin-bottom: 8px; color: var(--ink-darkest); letter-spacing: -0.01em; }
  .score-card .stars { font-size: 16px; color: var(--gold); margin-bottom: 8px; letter-spacing: 2px; }
  .score-card .stars .empty { color: var(--line-dark); }
  .score-card .note { font-size: 13px; color: var(--ink-soft); line-height: 1.6; }

  /* TABLES */
  table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; background: var(--surface); border: 1px solid var(--line); }
  th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid var(--line); line-height: 1.6; }
  th {
    background: var(--surface-warm); color: var(--ink-darkest);
    font-weight: 600; font-size: 13px; letter-spacing: 0.04em;
    text-transform: uppercase; border-bottom: 2px solid var(--gold);
  }
  td { color: var(--ink-soft); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface-warm); }
  table tr td:first-child { font-weight: 500; color: var(--ink-dark); }

  /* ALERTS */
  .alert { padding: 20px 24px; border-radius: 4px; margin: 18px 0; border-left: 3px solid; background: var(--surface-warm); position: relative; }
  .alert.danger { background: linear-gradient(to right, rgba(139,31,31,.04), var(--surface-warm)); border-color: var(--critical); color: #5c1818; }
  .alert.warning { background: linear-gradient(to right, rgba(160,93,28,.04), var(--surface-warm)); border-color: var(--warning); color: #6e3e10; }
  .alert.info { background: linear-gradient(to right, rgba(30,58,95,.04), var(--surface-warm)); border-color: var(--info); color: #1a2540; }
  .alert.success { background: linear-gradient(to right, rgba(47,93,63,.04), var(--surface-warm)); border-color: var(--success); color: #1d3d29; }
  .alert strong { display: block; margin-bottom: 8px; font-size: 14px; letter-spacing: 0.03em; text-transform: uppercase; font-weight: 700; }
  ul, ol { margin: 10px 0 18px 22px; }
  li { margin-bottom: 8px; color: var(--ink-soft); font-size: 14.5px; line-height: 1.75; }
  li strong { color: var(--ink-darkest); }

  /* PHASE TIMELINE */
  .timeline { margin: 28px 0; }
  .phase {
    padding: 24px 28px; margin-bottom: 18px;
    background: var(--surface); border: 1px solid var(--line);
    border-left: 3px solid var(--gold); border-radius: 4px;
    position: relative; transition: all .2s;
  }
  .phase:hover { box-shadow: 0 6px 20px rgba(20,33,61,.06); transform: translateX(2px); }
  .phase.urgent { border-left-color: var(--critical); }
  .phase.short { border-left-color: var(--warning); }
  .phase.mid { border-left-color: var(--success); }
  .phase.long { border-left-color: var(--info); }
  .phase-tag {
    display: inline-block; padding: 6px 14px; border-radius: 2px;
    font-size: 11px; font-weight: 700; margin-bottom: 14px;
    letter-spacing: 0.1em; text-transform: uppercase;
    font-family: 'Cormorant Garamond', 'Noto Serif KR', serif;
  }
  .phase.urgent .phase-tag { background: var(--critical); color: #fff; }
  .phase.short .phase-tag { background: var(--warning); color: #fff; }
  .phase.mid .phase-tag { background: var(--success); color: #fff; }
  .phase.long .phase-tag { background: var(--info); color: #fff; }
  .phase h3 { margin-top: 0; color: var(--ink-darkest); font-size: 18px; }

  /* SUMMARY HERO BOX */
  .summary-box {
    background: linear-gradient(135deg, var(--ink-darkest) 0%, var(--ink-dark) 100%);
    color: #fff; padding: 44px 50px;
    border-radius: 4px; margin: 40px 0;
    position: relative; overflow: hidden;
    box-shadow: 0 12px 32px rgba(20,33,61,.15);
  }
  .summary-box::before {
    content: ""; position: absolute;
    top: 0; left: 0; width: 4px; height: 100%;
    background: linear-gradient(180deg, var(--gold-bright), var(--gold-deep));
  }
  .summary-box::after {
    content: "❖"; position: absolute;
    top: 30px; right: 36px;
    color: var(--gold); font-size: 28px; opacity: .3;
  }
  .summary-box h3 {
    font-family: 'Cormorant Garamond', 'Noto Serif KR', serif;
    color: var(--gold-bright); margin-top: 0; margin-bottom: 18px;
    font-size: 14px; font-weight: 600;
    letter-spacing: 0.4em; text-transform: uppercase;
  }
  .summary-box p { color: rgba(255,255,255,.85); font-size: 15px; line-height: 1.85; }
  .summary-box strong { color: var(--gold-bright); font-weight: 600; }
  .summary-box .big-number {
    font-family: 'Cormorant Garamond', 'Noto Serif KR', serif;
    font-size: 56px; font-weight: 600;
    margin: 18px 0; color: #fff;
    letter-spacing: -0.02em; line-height: 1.1;
  }
  .summary-box .big-number .em { color: var(--gold-bright); font-style: italic; }

  /* KPI ROW */
  .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
  .kpi { background: var(--surface); border: 1px solid var(--line); padding: 24px 20px; border-radius: 4px; text-align: center; position: relative; }
  .kpi::before { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 30px; height: 2px; background: var(--gold); }
  .kpi-value { font-family: 'Noto Serif KR', serif; font-size: 32px; font-weight: 700; color: var(--ink-darkest); letter-spacing: -0.02em; }
  .kpi-label { font-size: 12px; color: var(--ink-light); margin-top: 6px; letter-spacing: 0.06em; text-transform: uppercase; }

  /* AI 인용 5신호 (자체 차별점) */
  .aiw-bar { display: inline-block; width: 80px; height: 6px; background: var(--bg-tint); border-radius: 3px; overflow: hidden; vertical-align: middle; }
  .aiw-bar-fill { display: block; height: 100%; background: linear-gradient(90deg, var(--gold-deep), var(--gold-bright)); border-radius: 3px; }

  /* CEP 장면 카드 */
  .cep-card {
    display: flex; gap: 18px;
    padding: 18px 22px; margin-bottom: 12px;
    background: var(--surface); border: 1px solid var(--line);
    border-left: 3px solid var(--gold); border-radius: 4px;
  }
  .cep-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px; font-weight: 600;
    color: var(--gold-deep); line-height: 1;
    min-width: 48px;
  }
  .cep-body { flex: 1; }
  .cep-scene { font-weight: 600; color: var(--ink-darkest); font-size: 15.5px; margin-bottom: 6px; line-height: 1.55; }
  .cep-content { font-size: 13.5px; color: var(--ink-soft); line-height: 1.65; }
  .cep-content strong { color: var(--gold-deep); font-weight: 600; }

  /* 미니 그래프 (AXOS 온톨로지) */
  .mini-graph {
    margin: 24px 0;
    padding: 20px; background: var(--surface);
    border: 1px solid var(--line); border-left: 3px solid var(--gold);
    border-radius: 4px;
  }
  .mini-graph svg { width: 100%; max-width: 920px; height: auto; display: block; margin: 0 auto; }

  /* TABS */
  .tabs {
    display: flex; gap: 6px;
    margin: 48px 0 0; padding: 6px;
    background: var(--ink-darkest);
    border-radius: 4px;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 8px 24px rgba(20,33,61,.22);
    border: 1px solid var(--gold-dark);
  }
  .tab-btn {
    flex: 1; padding: 18px 22px;
    border: 1px solid transparent; border-radius: 2px;
    font-size: 15px; font-weight: 600; color: #fff;
    cursor: pointer; font-family: inherit;
    transition: all 0.28s ease;
    text-align: center; line-height: 1.4;
    letter-spacing: 0.02em;
    position: relative; overflow: hidden;
  }
  .tab-btn .tab-sub {
    display: block; font-size: 11px; font-weight: 400;
    color: rgba(255,255,255,.7); margin-top: 6px;
    letter-spacing: 0.1em; text-transform: uppercase;
    font-family: 'Cormorant Garamond', serif;
  }
  /* WINE / GARNET */
  .tab-btn[data-tab="audit"] { background: linear-gradient(135deg, #3a0f15 0%, #5e1820 100%); color: #f5d4d4; }
  .tab-btn[data-tab="audit"] .tab-sub { color: rgba(245,212,212,.55); }
  .tab-btn[data-tab="audit"]:hover { background: linear-gradient(135deg, #5e1820 0%, #8b1f2c 100%); color: #fff; transform: translateY(-1px); }
  .tab-btn[data-tab="audit"].active {
    background: linear-gradient(135deg, #6b1d24 0%, #a02233 50%, #c92a3a 100%);
    color: #fff;
    box-shadow: 0 0 0 1px #d44b59, 0 6px 20px rgba(185,28,40,.45), inset 0 1px 0 rgba(255,255,255,.18);
    text-shadow: 0 1px 2px rgba(0,0,0,.25);
  }
  .tab-btn[data-tab="audit"].active .tab-sub { color: rgba(255,255,255,.85); }
  /* EMERALD / FOREST */
  .tab-btn[data-tab="solution"] { background: linear-gradient(135deg, #0d2017 0%, #1a3d29 100%); color: #c8e6d2; }
  .tab-btn[data-tab="solution"] .tab-sub { color: rgba(200,230,210,.55); }
  .tab-btn[data-tab="solution"]:hover { background: linear-gradient(135deg, #1a3d29 0%, #2d6644 100%); color: #fff; transform: translateY(-1px); }
  .tab-btn[data-tab="solution"].active {
    background: linear-gradient(135deg, #1f4d2e 0%, #2d7a4a 50%, #3aa364 100%);
    color: #fff;
    box-shadow: 0 0 0 1px #4ec07c, 0 6px 20px rgba(58,163,100,.4), inset 0 1px 0 rgba(255,255,255,.2);
    text-shadow: 0 1px 2px rgba(0,0,0,.25);
  }
  .tab-btn[data-tab="solution"].active .tab-sub { color: rgba(255,255,255,.88); }
  /* ROYAL GOLD */
  .tab-btn[data-tab="profile"] { background: linear-gradient(135deg, #2a1d0a 0%, #4d3818 100%); color: #f0dfb8; }
  .tab-btn[data-tab="profile"] .tab-sub { color: rgba(240,223,184,.55); }
  .tab-btn[data-tab="profile"]:hover { background: linear-gradient(135deg, #4d3818 0%, #7a5d2c 100%); color: #fff; transform: translateY(-1px); }
  .tab-btn[data-tab="profile"].active {
    background: linear-gradient(135deg, var(--gold-deep) 0%, var(--gold) 55%, var(--gold-bright) 100%);
    color: #fff;
    box-shadow: 0 0 0 1px var(--gold-bright), 0 6px 20px rgba(184,148,90,.45), inset 0 1px 0 rgba(255,255,255,.25);
    text-shadow: 0 1px 2px rgba(0,0,0,.18);
  }
  .tab-btn[data-tab="profile"].active .tab-sub { color: rgba(255,255,255,.92); }

  .tab-panel { display: none; padding-top: 36px; animation: fadeIn 0.4s ease; }
  .tab-panel.active { display: block; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* PRINCIPAL */
  .principal-grid { display: grid; grid-template-columns: 280px 1fr; gap: 56px; align-items: start; margin-top: 28px; }
  .principal-photo-col { position: sticky; top: 120px; }
  .principal-photo { width: 280px; height: 320px; position: relative; margin-bottom: 4px; }
  .principal-photo::before { content: ""; position: absolute; inset: -10px; border: 1px solid var(--gold); border-radius: 2px; pointer-events: none; }
  .principal-photo::after { content: ""; position: absolute; bottom: -22px; right: -22px; width: 50px; height: 50px; border-right: 2px solid var(--gold); border-bottom: 2px solid var(--gold); pointer-events: none; }
  .principal-photo img { width: 100%; height: 100%; object-fit: cover; border-radius: 2px; display: block; filter: contrast(1.04); box-shadow: 0 18px 44px rgba(20,33,61,.18); }
  .principal-photo-fallback {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, var(--ink-darkest) 0%, var(--ink-dark) 100%);
    border-radius: 2px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 64px; color: var(--gold-bright);
    font-weight: 600; letter-spacing: 0.04em;
    box-shadow: 0 18px 44px rgba(20,33,61,.18);
  }
  .principal-name-card {
    text-align: center; padding: 20px 0 18px;
    border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
    background: var(--surface-warm); margin-top: 36px;
  }
  .principal-name-card .ko-name { display: block; font-family: 'Noto Serif KR', serif; font-size: 26px; font-weight: 700; color: var(--ink-darkest); letter-spacing: -0.01em; line-height: 1.2; }
  .principal-name-card .role-tag { display: block; font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--gold-deep); margin-top: 8px; font-style: italic; font-weight: 600; }
  .principal-quote { font-family: 'Noto Serif KR', serif; font-size: 21px; font-style: italic; font-weight: 500; color: var(--ink-darkest); padding: 6px 0 16px 22px; border-left: 3px solid var(--gold); margin: 0 0 18px; line-height: 1.55; letter-spacing: -0.01em; }
  .principal-summary { font-size: 15px; color: var(--ink-soft); line-height: 1.85; margin-bottom: 32px; }
  .principal-stats { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 36px; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; background: linear-gradient(180deg, var(--surface) 0%, var(--surface-warm) 100%); }
  .principal-stats .stat { padding: 22px 8px 20px; text-align: center; border-right: 1px solid var(--line); position: relative; }
  .principal-stats .stat::before { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 26px; height: 2px; background: var(--gold); }
  .principal-stats .stat:last-child { border-right: none; }
  .principal-stats .num { display: block; font-family: 'Noto Serif KR', serif; font-size: 32px; font-weight: 700; color: var(--gold-deep); letter-spacing: -0.02em; line-height: 1; }
  .principal-stats .label { display: block; font-family: 'Cormorant Garamond', serif; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-light); margin-top: 8px; font-weight: 500; }
  .principal-h3 { font-family: 'Cormorant Garamond', 'Noto Serif KR', serif; font-size: 12px; letter-spacing: 0.34em; text-transform: uppercase; color: var(--gold-deep); margin: 28px 0 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line); font-weight: 600; }
  .principal-list { list-style: none; margin: 0 0 18px; padding: 0; }
  .principal-list li { position: relative; padding-left: 20px; font-size: 14.5px; margin-bottom: 9px; color: var(--ink-soft); line-height: 1.65; }
  .principal-list li::before { content: "❖"; position: absolute; left: 0; top: 1px; color: var(--gold); font-size: 10px; }
  .principal-text { font-size: 14.5px; color: var(--ink-soft); line-height: 1.9; margin-bottom: 18px; }
  .principal-contact-card {
    margin-top: 36px; padding: 22px 28px;
    background: linear-gradient(135deg, var(--ink-darkest) 0%, var(--ink-dark) 100%);
    border-radius: 4px; position: relative; overflow: hidden;
  }
  .principal-contact-card::before {
    content: ""; position: absolute; top: 0; left: 0;
    width: 4px; height: 100%;
    background: linear-gradient(180deg, var(--gold-bright), var(--gold-deep));
  }
  .contact-row { display: flex; align-items: baseline; gap: 16px; padding: 8px 0; border-bottom: 1px solid rgba(184,148,90,.18); }
  .contact-row:last-child { border-bottom: none; }
  .contact-label { font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 0.34em; text-transform: uppercase; color: var(--gold-bright); width: 80px; font-weight: 600; }
  .contact-val { color: #fff; font-size: 15px; letter-spacing: 0.02em; }

  /* FOOTER */
  footer.premium-footer {
    margin-top: 0; padding: 0;
    background: linear-gradient(180deg, var(--ink-darkest) 0%, #050810 100%);
    color: rgba(255,255,255,.7);
    font-size: 13px; text-align: left;
    position: relative; overflow: hidden;
  }
  footer.premium-footer::before {
    content: ""; position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold-bright) 50%, var(--gold) 70%, transparent);
  }
  .footer-inner { display: grid; grid-template-columns: 1.3fr 2fr; gap: 60px; padding: 60px 80px 40px; position: relative; z-index: 1; }
  .footer-brand .ax-logo-row { display: flex; align-items: center; gap: 18px; margin-bottom: 22px; }
  .ax-logo-img {
    width: 76px; height: 76px; flex-shrink: 0;
    background: linear-gradient(145deg, #ffffff 0%, #faf6ec 100%);
    border-radius: 6px; padding: 8px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 1px rgba(184,148,90,.45), 0 6px 20px rgba(184,148,90,.25), inset 0 1px 0 rgba(255,255,255,.6);
  }
  .ax-logo-img img { width: 100%; height: 100%; object-fit: contain; }
  .ax-wordmark { display: flex; flex-direction: column; }
  .ax-name { font-family: 'Cormorant Garamond', 'Noto Serif KR', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.22em; color: #fff; line-height: 1; }
  .ax-tagline { font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 0.32em; color: var(--gold-bright); margin-top: 6px; font-style: italic; text-transform: uppercase; font-weight: 500; }
  .brand-desc { color: rgba(255,255,255,.55); font-size: 13px; line-height: 1.75; font-weight: 300; max-width: 320px; margin: 0; }
  .brand-desc strong { color: rgba(255,255,255,.85); font-weight: 500; }
  .footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .footer-col h5 { font-family: 'Cormorant Garamond', serif; font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--gold-bright); margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(184,148,90,.22); font-weight: 600; }
  .footer-col ul { list-style: none; margin: 0; padding: 0; }
  .footer-col li { color: rgba(255,255,255,.6); font-size: 13px; margin-bottom: 9px; line-height: 1.65; padding-left: 0; letter-spacing: 0.01em; }
  .footer-col li strong { color: rgba(255,255,255,.88); font-weight: 500; }
  .footer-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(184,148,90,.25) 20%, rgba(184,148,90,.25) 80%, transparent); margin: 0 80px; }
  .footer-bottom { padding: 24px 80px 32px; text-align: center; font-size: 12px; color: rgba(255,255,255,.45); letter-spacing: 0.04em; position: relative; z-index: 1; }
  .footer-bottom strong { color: var(--gold-bright); font-weight: 600; letter-spacing: 0.1em; }
  .footer-mark { display: inline-block; color: var(--gold); margin: 0 8px; font-size: 14px; }

  /* PRINT */
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; padding: 0; border: none; }
    .container::before { display: none; }
    header { padding: 30px 30px 20px; }
    .content { padding: 30px; }
    .tabs { display: none; }
    .tab-panel { display: block !important; page-break-before: always; }
    .tab-panel:first-of-type { page-break-before: auto; }
    .summary-box, header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    footer.premium-footer { background: #fff !important; color: #333; }
    footer.premium-footer * { color: #333 !important; }
  }

  /* RESPONSIVE */
  @media (max-width: 720px) {
    body { padding: 20px 12px; }
    header { padding: 40px 28px 32px; }
    .content { padding: 36px 28px; }
    h1 { font-size: 26px; }
    .summary-box { padding: 28px; }
    .summary-box .big-number { font-size: 36px; }
    .score-grid, .kpi-row { grid-template-columns: 1fr; }
    .meta span { padding-right: 16px; margin-right: 16px; }
    .footer-inner { grid-template-columns: 1fr; gap: 40px; padding: 40px 28px 24px; }
    .footer-cols { grid-template-columns: 1fr; gap: 28px; }
    .footer-divider { margin: 0 28px; }
    .footer-bottom { padding: 20px 28px 28px; }
    .tabs { flex-direction: column; }
    .principal-grid { grid-template-columns: 1fr; gap: 36px; }
    .principal-photo-col { position: static; }
    .principal-photo { width: 220px; height: 260px; margin: 0 auto; }
    .principal-stats { grid-template-columns: repeat(2, 1fr); }
    .principal-stats .stat:nth-child(2) { border-right: none; }
    .header-top { flex-direction: column; gap: 16px; align-items: flex-start; }
  }
</style>
</head>
<body>
<div class="container">

<header>
  <div class="header-top">
    <div class="crest">
      <span class="crest-line"></span>
      <span class="label">${e(brand)} · GEO Diagnostic Report</span>
    </div>
    <div class="header-ax-mark" title="Presented by AX Biz Group">
      <div class="ax-mini-img">
        <img src="https://jaiwshim-project.github.io/01-2-AXBizGroup/%EB%A1%9C%EA%B3%A0-AX%EB%B9%84%EC%A6%88%EA%B7%B8%EB%A3%B9.jpg" alt="AX Biz Group" onerror="this.style.display='none'">
      </div>
      <div class="ax-mini-text">
        <span class="ax-mini-by">Presented by</span>
        <span class="ax-mini-name">AX BIZ GROUP</span>
      </div>
    </div>
  </div>
  <h1>AI 검색 시대를 위한<br><span class="accent">${e(brand)}</span> 존재력 진단</h1>
  <p class="subtitle">${e(industry)} — ChatGPT · Claude · Perplexity · Gemini가 우리 브랜드를 어떻게 인식하는지 10가지 신호로 측정하고, 신규 개발/부분 개선 중 어느 쪽이 효율적인지 자동으로 판단합니다.</p>
  <div class="meta">
    <span><strong>대상</strong><em>${e(websiteUrl || brand)}</em></span>
    <span><strong>발행일</strong><em>${e(dateStr)}</em></span>
    <span><strong>리포트 코드</strong><em>${e(reportCode)}</em></span>
    <span><strong>권장 경로</strong><em>${e(path.shortLabel)}</em></span>
  </div>
</header>

<div class="content">

${summaryBoxHTML}

<div class="kpi-row">${kpiPreviewHTML}</div>

<div class="tabs" role="tablist">
  <button class="tab-btn active" role="tab" aria-controls="panel-audit" aria-selected="true" data-tab="audit">
    진단 리포트
    <span class="tab-sub">Current State Analysis</span>
  </button>
  <button class="tab-btn" role="tab" aria-controls="panel-solution" aria-selected="false" data-tab="solution">
    ${e(path.showQuote ? '신규 개발 제안' : '개선 로드맵')}
    <span class="tab-sub">${e(path.tabSubtitle)}</span>
  </button>
  <button class="tab-btn" role="tab" aria-controls="panel-profile" aria-selected="false" data-tab="profile">
    대표 프로필
    <span class="tab-sub">Principal Consultant</span>
  </button>
</div>

<!-- ========== TAB 1: 진단 ========== -->
<section class="tab-panel active" id="panel-audit" role="tabpanel">

<h2>1. 8대 항목 점수표</h2>
<p>새 10가지 KPI를 의사결정자가 한눈에 보는 8가지 항목으로 재구성했습니다. 별점은 0~19점 ★ / 20~39점 ★★ / 40~59점 ★★★ / 60~79점 ★★★★ / 80~100점 ★★★★★ 기준입니다.</p>
<div class="score-grid">${scoreGridHTML}</div>

<h2>2. 핵심 결함</h2>
${criticalsHTML}

<h2>3. 강점 자산</h2>
${strengthsHTML}

<h2>4. AI 인용 5신호 (자체 차별점)</h2>
<p>일반 GEO 진단이 “구조화 정보가 있다/없다”로 끝나는 데 비해, GEO Score AI는 본문을 직접 분석해 <strong>AI가 발췌하기 좋은 5가지 신호</strong>를 0~3점으로 측정합니다.</p>
<table>
  <tr><th width="160">신호</th><th>설명</th><th width="80" style="text-align:center;">점수</th><th width="100" style="text-align:right;">시각화</th></tr>
  ${aiwHTML}
  <tr style="background:var(--surface-warm);">
    <td colspan="2"><strong>합계</strong></td>
    <td style="text-align:center;font-weight:700;color:var(--gold-deep);"><strong>${aiw.total} / 15</strong></td>
    <td style="text-align:right;font-weight:700;color:var(--gold-deep);"><strong>${aiw.total100}점 환산</strong></td>
  </tr>
</table>

<h2>5. CEP 장면 점유 (자체 차별점)</h2>
<p>의사결정자가 <strong>실제로 검색하기 직전 30분</strong>의 장면을 좌표로 발굴하고, 각 장면에 맞는 표적 콘텐츠를 미리 설계합니다. AI가 “이 질문이면 이 브랜드”로 학습하는 핵심 자산입니다.</p>
${cepHTML}

<h2>6. AXOS 약점 사슬 (요약)</h2>
<div class="mini-graph">
  <svg viewBox="0 0 920 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="약점 KPI 사슬">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b6f3f"/>
      </marker>
    </defs>
    <rect x="20" y="80" width="180" height="60" rx="6" fill="#fff" stroke="#8b1f1f" stroke-width="2"/>
    <text x="110" y="105" text-anchor="middle" font-family="Noto Serif KR, serif" font-size="14" fill="#0a0e1a" font-weight="700">Issue (약점)</text>
    <text x="110" y="125" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="12" fill="#4a5568">${e(criticals[0]?.title || '핵심 약점')}</text>

    <rect x="240" y="80" width="180" height="60" rx="6" fill="#fff" stroke="#a05d1c" stroke-width="2"/>
    <text x="330" y="105" text-anchor="middle" font-family="Noto Serif KR, serif" font-size="14" fill="#0a0e1a" font-weight="700">Root Cause</text>
    <text x="330" y="125" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="12" fill="#4a5568">인프라·구조 부재</text>

    <rect x="460" y="80" width="180" height="60" rx="6" fill="#fff" stroke="#1e3a5f" stroke-width="2"/>
    <text x="550" y="105" text-anchor="middle" font-family="Noto Serif KR, serif" font-size="14" fill="#0a0e1a" font-weight="700">Solution</text>
    <text x="550" y="125" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="12" fill="#4a5568">${e(path.shortLabel)}</text>

    <rect x="680" y="80" width="220" height="60" rx="6" fill="#fff" stroke="#2f5d3f" stroke-width="2"/>
    <text x="790" y="105" text-anchor="middle" font-family="Noto Serif KR, serif" font-size="14" fill="#0a0e1a" font-weight="700">Outcome</text>
    <text x="790" y="125" text-anchor="middle" font-family="Pretendard, sans-serif" font-size="12" fill="#4a5568">AI 추천 답변 등장 + 자연 유입</text>

    <line x1="200" y1="110" x2="240" y2="110" stroke="#8b6f3f" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="420" y1="110" x2="460" y2="110" stroke="#8b6f3f" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="640" y1="110" x2="680" y2="110" stroke="#8b6f3f" stroke-width="2" marker-end="url(#arrow)"/>

    <text x="460" y="40" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="13" fill="#8b6f3f" letter-spacing="3">AXOS · ROOT-CAUSE CHAIN</text>
    <line x1="280" y1="50" x2="640" y2="50" stroke="#b8945a" stroke-width="1"/>
  </svg>
</div>

</section>

<!-- ========== TAB 2: 개선/신규 개발 ========== -->
<section class="tab-panel" id="panel-solution" role="tabpanel">

<h2>7. 권장 경로 자동 판정</h2>
${pathCardHTML}

<h2>8. 권장 경로 매트릭스</h2>
<table>
  <tr><th>점수 / 인프라 조건</th><th>권장 경로</th><th>예상 기간 / 비용</th></tr>
  <tr><td>75점 이상</td><td>콘텐츠 강화 (Reinforce)</td><td>월간 운영 / 월 50~150만원</td></tr>
  <tr><td>60~74점</td><td>부분 개선 (Selective Boost)</td><td>3~6개월 / 월 200~500만원</td></tr>
  <tr><td>45~59점</td><td>비교 검토 (Selective vs Rebuild)</td><td>4~6개월 / 옵션별 상이</td></tr>
  <tr><td>30~44점</td><td>신규 개발 권장 (Rebuild Recommended)</td><td>3주 / 400만원 + 운영</td></tr>
  <tr><td>0~29점 또는 봇 5+ 차단 / 사이트 지도 손상</td><td><strong style="color:var(--critical);">신규 개발 필수 (Must Rebuild)</strong></td><td>3주 / 400만원 + 운영</td></tr>
</table>

<h2>9. 3주 실행 플랜</h2>
${phasesHTML}

${priorityHTML}

${quoteHTML}

<h2>예상 성과 (오픈 후)</h2>
<table>
  <tr><th>지표</th><th>현재</th><th>1개월</th><th>3개월</th><th>6개월</th></tr>
  <tr><td>구글 검색 노출 페이지</td><td>${totalScore < 40 ? '소수' : '중간'}</td><td>15~25개</td><td>40~60개</td><td>80~120개</td></tr>
  <tr><td>월간 검색 노출 횟수</td><td>측정 불가</td><td>1,500회+</td><td>5,000회+</td><td>20,000회+</td></tr>
  <tr><td>AI 답변 등장률</td><td>${totalScore < 40 ? '0%' : '낮음'}</td><td>등장 시작</td><td>20~30%</td><td>50%+</td></tr>
  <tr><td>외부 매체 추천 건수</td><td>${totalScore < 40 ? '0건' : '소수'}</td><td>2~5건</td><td>5~10건</td><td>20건+</td></tr>
</table>

<div class="alert info" style="margin-top:24px;">
  <strong>지속 가능한 디지털 자산화</strong>
  <p style="margin-top:10px;color:inherit;">이 수치들은 일회성 마케팅 효과가 아니라 시간이 갈수록 더 강해지는 <strong>디지털 무형자산의 축적</strong>입니다. 한 번 검색에 자리 잡은 콘텐츠와 추천 신호는 누적 효과를 발휘하여, 6개월 후에는 ${e(industry)} 분야에서 디지털 권위를 확보한 브랜드로 자리매김합니다.</p>
</div>

</section>

<!-- ========== TAB 3: 대표 프로필 ========== -->
<section class="tab-panel" id="panel-profile" role="tabpanel">

<h2>대표 컨설턴트 소개</h2>
<div class="principal-grid">
  <div class="principal-photo-col">
    <div class="principal-photo">
      <img src="https://aitutorhub.com/ceo-profile.png" alt="심재우 대표"
           onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','&lt;div class=&quot;principal-photo-fallback&quot;&gt;&#27784;&lt;/div&gt;');">
    </div>
    <div class="principal-name-card">
      <span class="ko-name">심재우</span>
      <span class="role-tag">Principal Consultant</span>
    </div>
  </div>

  <div class="principal-body">
    <p class="principal-quote">AI 검색 시대 기업 존재력 설계 · 디지털 무형자산 전환 전략</p>
    <p class="principal-summary">디지털트윈 시뮬레이션 전문가에서 글로벌 B2B 세일즈 마스터로, 다시 AI 시대의 비즈니스 가시성 설계자로 — <strong>현대자동차 5년 · GE USA 8년의 글로벌 산업 경력</strong>과 <strong>특허 10건·저작권 50건·저서 50권</strong>의 지식재산을 바탕으로, 오프라인 자산을 AI 시대 온라인 권위로 전환하는 전략을 직접 설계합니다.</p>

    <div class="principal-stats">
      <div class="stat"><span class="num">10</span><span class="label">Patents · 특허</span></div>
      <div class="stat"><span class="num">50</span><span class="label">Copyrights · 저작권</span></div>
      <div class="stat"><span class="num">20</span><span class="label">Trademarks · 상표권</span></div>
      <div class="stat"><span class="num">50</span><span class="label">Books · 저서</span></div>
    </div>

    <h3 class="principal-h3">Career · 주요 경력</h3>
    <ul class="principal-list">
      <li><strong>기계공학 석사</strong> — 구조해석 및 시뮬레이션 전공</li>
      <li><strong>현대자동차 기술연구소</strong> — 5년</li>
      <li><strong>General Electric (USA) Plastics</strong> — 8년</li>
      <li><strong>허스웨이트 스핀셀링</strong> 국제공인 마스터트레이너</li>
    </ul>

    <h3 class="principal-h3">Expertise · 전문 분야</h3>
    <p class="principal-text">AI 검색 최적화 (GEO) · 콘텐츠 자동 생산 시스템 · 의료/세일즈/교육 AI 플랫폼 · 온톨로지 기반 플랫폼 설계 · 특허·저작권 전략 · 디지털트윈 · 글로벌 B2B 세일즈</p>

    <h3 class="principal-h3">Featured Works · 주요 활동</h3>
    <ul class="principal-list">
      <li>『점의 반란』 공동 저술</li>
      <li><strong>AI노벨문해력5©</strong> 개발</li>
      <li><strong>3색줄독서법</strong> 개발 및 특허 등록</li>
      <li><strong>15창의질문</strong> 개발 및 저작권 등록</li>
      <li>기업 교육 프로그램 <strong>90건</strong> 개발</li>
      <li>주요 저서 <strong>50권</strong> 출판</li>
    </ul>

    <h3 class="principal-h3">Recognition · 등재</h3>
    <p class="principal-text"><strong>마르퀴즈 후즈후 (Marquis Who's Who) 세계인명사전</strong> — 2016년 &amp; 2020년 등재</p>

    <div class="principal-contact-card">
      <div class="contact-row">
        <span class="contact-label">Email</span>
        <span class="contact-val">jaiwshim@gmail.com</span>
      </div>
      <div class="contact-row">
        <span class="contact-label">Mobile</span>
        <span class="contact-val">010-2397-5734</span>
      </div>
      <div class="contact-row">
        <span class="contact-label">Group</span>
        <span class="contact-val">AX Biz Group</span>
      </div>
    </div>
  </div>
</div>

</section>

</div>

<footer class="premium-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="ax-logo-row">
        <div class="ax-logo-img">
          <img src="https://jaiwshim-project.github.io/01-2-AXBizGroup/%EB%A1%9C%EA%B3%A0-AX%EB%B9%84%EC%A6%88%EA%B7%B8%EB%A3%B9.jpg" alt="AX Biz Group" onerror="this.style.display='none'">
        </div>
        <div class="ax-wordmark">
          <span class="ax-name">AX BIZ GROUP</span>
          <span class="ax-tagline">AI · Excellence · Strategy</span>
        </div>
      </div>
      <p class="brand-desc">
        <strong>AX Biz Group</strong>은 AI 검색 시대의 비즈니스 가시성을 설계하는 프리미엄 AI 내재화 컨설팅 그룹입니다. 오프라인 자산을 ChatGPT · Claude · Perplexity · Gemini 시대의 온라인 권위로 전환하는 전략을 제공합니다.
      </p>
    </div>

    <div class="footer-cols">
      <div class="footer-col">
        <h5>Services</h5>
        <ul>
          <li>GEO Score AI 자동 진단</li>
          <li>프리미엄 신규 홈페이지 개발</li>
          <li>지속적 콘텐츠 운영 대행</li>
          <li>지역 비즈니스 GEO 전략</li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>This Report</h5>
        <ul>
          <li><strong>대상</strong> ${e(brand)}</li>
          <li><strong>일정</strong> ${e(footerPeriod)}</li>
          <li><strong>비용</strong> ${e(footerCost)}</li>
          <li><strong>발행</strong> ${e(dateStr)}</li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Contact</h5>
        <ul>
          <li>jaiwshim@gmail.com</li>
          <li>010-2397-5734</li>
          <li>화상 미팅 가능</li>
          <li>방문 미팅 가능 (수도권)</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-divider"></div>

  <div class="footer-bottom">
    본 리포트는 ${e(dateStr)} 기준 GEO Score AI 자동 진단 결과를 영업·제안용으로 정리한 문서입니다
    <span class="footer-mark">❖</span>
    © ${new Date().getFullYear()} <strong>AX BIZ GROUP</strong> · All Rights Reserved
  </div>
</footer>

</div>

<script>
(function() {
  var tabs = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.dataset.tab;
      tabs.forEach(function(b) {
        var isActive = b.dataset.tab === target;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive);
      });
      panels.forEach(function(p) {
        p.classList.toggle('active', p.id === 'panel-' + target);
      });
      var tabsTop = document.querySelector('.tabs');
      if (tabsTop) window.scrollTo({ top: tabsTop.offsetTop - 20, behavior: 'smooth' });
    });
  });
  if (location.hash === '#solution') {
    var b = document.querySelector('[data-tab="solution"]');
    if (b) b.click();
  }
})();
</script>

</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 메서드만 허용됩니다' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_e) { body = {}; }
    }
    body = body || {};

    // Vercel latin1 → utf8 보정
    body = deepFixKorean(body);

    const result = body.result;
    const recommendation = body.recommendation || {};
    const brand = body.brand || result?.companyName || '브랜드';
    const industry = body.industry || result?.industry || '산업';

    if (!result || typeof result.totalScore === 'undefined' || !result.scores) {
      return res.status(400).json({
        error: 'result(totalScore, scores) 데이터가 필요합니다',
        hint: 'POST { result: <analyze.js 응답>, recommendation: <recommend.js 응답>, brand?, industry? }'
      });
    }

    const path = decideRecommendedPath(result.totalScore, result?.meta?.infraSignals);
    const html = buildHTML(result, recommendation, brand, industry);

    return res.status(200).json({
      success: true,
      brand,
      industry,
      totalScore: result.totalScore,
      recommendation: path.key,
      recommendationLabel: path.title,
      htmlLength: html.length,
      html
    });
  } catch (e) {
    console.error('[generate-report] 오류', e);
    return res.status(500).json({
      error: '리포트 생성 중 오류가 발생했습니다',
      detail: e.message
    });
  }
}
