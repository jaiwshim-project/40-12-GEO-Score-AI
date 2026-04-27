/**
 * GEO Score AI - 영업용 단일 HTML 리포트 생성 API
 *
 * 기존 SaaS 다중 페이지 진단 결과를 AX Biz Group 브랜딩의
 * 단일 HTML 파일(외부 CSS/JS 의존 없음)로 패키징한다.
 *
 * 입력 (POST JSON):
 *  - result: analyze.js 응답 객체 (companyName, totalScore, scores, summary, meta)
 *  - recommendation: recommend.js 응답 객체 (priorityActions, packageTier, expectedOutcome)
 *  - brand: 브랜드명 (선택, 기본 result.companyName)
 *  - industry: 업종 (선택, 기본 result.industry)
 *
 * 응답: { success: true, html: "<!DOCTYPE html>..." }
 *
 * 사용처: generate-report.html 폼이 호출 → 받은 html을 미리보기/다운로드.
 * 클라이언트가 직접 만들 수도 있으나, 서버 측에서 검증/표준화된 템플릿 보장 목적.
 */

// 한글 인코딩 보정 (Vercel에서 latin1로 들어오는 경우 대응)
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

function todayKR() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function stars(score) {
  // 0~100 → 5점 만점 별
  const v = clamp(Math.round((score / 100) * 5), 0, 5);
  return '★'.repeat(v) + '☆'.repeat(5 - v);
}

/**
 * 10 KPI → 8개 영업용 항목으로 재구성
 * - 점수는 가중치 평균 또는 단일 매핑
 * - 설명은 일반인 의사결정자 어휘 (기술 용어 배제)
 */
function buildEightKpis(result) {
  const s = result?.scores || {};
  const v = (id) => Number(s[id]?.value) || 0;
  const infra = result?.meta?.infraSignals || {};
  const robotsScore = Number(infra.robotsScore) || 0;
  const sitemapScore = Number(infra.sitemapScore) || 0;

  const items = [
    {
      key: 'aibot',
      name: 'AI 봇 접근',
      desc: 'ChatGPT·Perplexity 같은 AI가 우리 사이트를 읽을 수 있는지',
      score: clamp(Math.round(v('visibility') * 0.5 + robotsScore * 10), 0, 100)
    },
    {
      key: 'sitemap',
      name: '사이트 지도 상태',
      desc: '검색·AI가 모든 페이지를 빠짐없이 발견할 수 있는 안내도',
      score: clamp(Math.round(sitemapScore * 20 + v('visibility') * 0.3), 0, 100)
    },
    {
      key: 'discovery',
      name: '검색 노출',
      desc: '구글·네이버에서 우리 브랜드가 얼마나 노출되는가',
      score: v('visibility')
    },
    {
      key: 'structure',
      name: '구조화 정보',
      desc: 'AI가 답변에 그대로 인용할 수 있는 형태로 정리된 정도',
      score: v('citation')
    },
    {
      key: 'pageinfo',
      name: '페이지 정보',
      desc: '페이지 제목·요약·태그 등 첫인상 정보의 완성도',
      score: clamp(Math.round((v('visibility') + v('brand')) / 2), 0, 100)
    },
    {
      key: 'depth',
      name: '콘텐츠 깊이',
      desc: '브랜드 메시지의 일관성과 콘텐츠 발행 누적량',
      score: clamp(Math.round((v('velocity') + v('brand')) / 2), 0, 100)
    },
    {
      key: 'mention',
      name: '외부 언급',
      desc: '리뷰·SNS·외부 채널에서 우리 브랜드가 회자되는 정도',
      score: clamp(Math.round((v('engagement') + v('competitive')) / 2), 0, 100)
    },
    {
      key: 'trust',
      name: '신뢰 신호',
      desc: '대표·전문가·실적 등 신뢰할 만한 근거가 노출된 정도',
      score: v('authority')
    }
  ];
  return items;
}

function getCriticalIssues(result) {
  // 점수 낮은 KPI 3개 추출 (사람이 읽는 문장으로)
  const labels = {
    visibility: '검색에 거의 노출되지 않습니다',
    velocity: '신규 콘텐츠 발행이 거의 없습니다',
    authority: '대표/전문가 신뢰 근거가 부족합니다',
    citation: 'AI가 인용할 수 있는 구조화가 없습니다',
    engagement: '리뷰·후기 등 참여 흔적이 부족합니다',
    conversion: '상담·예약 등 전환 유도가 약합니다',
    channel: '채널이 한쪽에 치우쳐 있습니다',
    brand: '브랜드 메시지가 흩어져 있습니다',
    competitive: '경쟁사 대비 시장 점유가 약합니다',
    aio: 'AI 시대 인프라가 부재합니다'
  };
  const arr = Object.entries(result?.scores || {})
    .map(([id, s]) => ({ id, value: Number(s?.value) || 0 }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);
  return arr.map(x => ({ id: x.id, score: x.value, msg: labels[x.id] || '개선이 필요합니다' }));
}

function getStrengths(result) {
  const labels = {
    visibility: '검색 노출 기반이 형성되어 있음',
    velocity: '꾸준한 콘텐츠 생산 흐름이 있음',
    authority: '전문성·신뢰 근거가 노출되어 있음',
    citation: 'AI 인용 가능한 구조가 일부 존재',
    engagement: '고객 참여 채널이 작동 중',
    conversion: '전환 동선이 설계되어 있음',
    channel: '다채널 노출 기반이 있음',
    brand: '브랜드 톤이 일관됨',
    competitive: '경쟁사 대비 우위 영역이 있음',
    aio: 'AI 최적화 일부 적용됨'
  };
  const arr = Object.entries(result?.scores || {})
    .map(([id, s]) => ({ id, value: Number(s?.value) || 0 }))
    .filter(x => x.value >= 50)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  if (arr.length === 0) return [];
  return arr.map(x => ({ id: x.id, score: x.value, msg: labels[x.id] || '비교적 양호한 영역' }));
}

function buildContentIdeas(result, brand) {
  // 6~10개의 콘텐츠 아이디어 (KPI 약점 기반 일반화)
  const industry = result?.industry || '귀사';
  return [
    `${brand} 대표가 직접 말하는 ${industry} 핵심 가치 — 인터뷰 영상`,
    `${industry} 의사결정자가 가장 자주 묻는 7가지 질문 — FAQ 콘텐츠`,
    `${brand} 실제 사례 3건 — 상황·해결·결과 구조의 케이스 스터디`,
    `${industry} 시장에서 흔한 오해 5가지와 진실 — 해명형 콘텐츠`,
    `${brand}의 일하는 방식 — 비하인드 스토리·현장 사진 시리즈`,
    `${industry} 용어 30개 — 일반인도 이해하는 한 줄 사전`,
    `${brand}이(가) 거절하는 일 — 우리는 왜 이건 하지 않는가`,
    `${industry} 선택 체크리스트 — 좋은 곳 vs 피해야 할 곳`
  ];
}

function buildHTML(result, recommendation, brand, industry) {
  const totalScore = Number(result?.totalScore) || 0;
  const grade = result?.grade?.label || '-';
  const gradeKey = result?.grade?.key || '';
  const headline = result?.summary?.headline || `현재 점수는 ${totalScore}점입니다`;
  const diagnosis = result?.summary?.diagnosis || '';
  const websiteUrl = result?.websiteUrl || '';
  const analyzedAt = result?.analyzedAt ? new Date(result.analyzedAt) : new Date();
  const dateStr = `${analyzedAt.getFullYear()}.${String(analyzedAt.getMonth()+1).padStart(2,'0')}.${String(analyzedAt.getDate()).padStart(2,'0')}`;

  const eightKpis = buildEightKpis(result);
  const criticals = getCriticalIssues(result);
  const strengths = getStrengths(result);
  const contentIdeas = buildContentIdeas(result, brand);

  const pkg = recommendation?.packageTier || {};
  const priorityActions = recommendation?.priorityActions || [];
  const expected = recommendation?.expectedOutcome || {};

  // 권장 경로 결정 (점수 기반)
  const isFullBuild = totalScore < 40;
  const recommendedPath = isFullBuild
    ? { title: '신규 개발 (Full Rebuild)', why: '현재 기반이 약해 부분 개선보다 새로 짓는 편이 효율적입니다.', period: '6~12개월' }
    : { title: '부분 개선 (Selective Boost)', why: '핵심 자산은 살아있어 약점 KPI만 집중 보강하면 충분합니다.', period: '3~6개월' };

  const e = escapeHtml;

  // KPI 그리드 HTML
  const kpiGridHTML = eightKpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-name">${e(k.name)}</div>
      <div class="kpi-desc">${e(k.desc)}</div>
      <div class="kpi-score-row">
        <span class="kpi-score">${k.score}<span class="kpi-score-max">/100</span></span>
        <span class="kpi-stars">${stars(k.score)}</span>
      </div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${k.score}%"></div></div>
    </div>`).join('');

  const criticalsHTML = criticals.length ? criticals.map((c, i) => `
    <div class="issue-item">
      <span class="issue-num">${i + 1}</span>
      <div class="issue-body">
        <div class="issue-msg">${e(c.msg)}</div>
        <div class="issue-score">현재 점수 ${c.score}점</div>
      </div>
    </div>`).join('') : '<div class="empty">분석된 결함이 없습니다.</div>';

  const strengthsHTML = strengths.length ? strengths.map(s => `
    <div class="strength-item">
      <span class="strength-dot">●</span>
      <span>${e(s.msg)} <span class="muted">(${s.score}점)</span></span>
    </div>`).join('') : '<div class="empty">아직 두드러진 강점이 형성되어 있지 않습니다.</div>';

  // 4 Phase 액션
  const phasesHTML = `
    <div class="phase-row">
      <div class="phase-card">
        <div class="phase-num">Phase 1</div>
        <div class="phase-title">기반 정비 (1개월)</div>
        <ul>
          <li>AI 봇 접근 설정 정비</li>
          <li>사이트 지도·페이지 정보 표준화</li>
          <li>대표·전문가 신뢰 페이지 신설</li>
        </ul>
      </div>
      <div class="phase-card">
        <div class="phase-num">Phase 2</div>
        <div class="phase-title">콘텐츠 생산 (2~3개월)</div>
        <ul>
          <li>주 5회 콘텐츠 자동 발행 체계</li>
          <li>FAQ 50개 + 사례 콘텐츠 적재</li>
          <li>리뷰·후기 시스템 활성화</li>
        </ul>
      </div>
      <div class="phase-card">
        <div class="phase-num">Phase 3</div>
        <div class="phase-title">채널 확장 (4~5개월)</div>
        <ul>
          <li>블로그+SNS+영상 동시 배포</li>
          <li>외부 매체 기고·언론 노출</li>
          <li>경쟁사 갭 키워드 점유</li>
        </ul>
      </div>
      <div class="phase-card">
        <div class="phase-num">Phase 4</div>
        <div class="phase-title">최적화 (6개월~)</div>
        <ul>
          <li>AI 인용률 모니터링 리포트</li>
          <li>전환 동선 미세 튜닝</li>
          <li>분기별 KPI 재평가</li>
        </ul>
      </div>
    </div>`;

  const ideasHTML = contentIdeas.map((idea, i) => `
    <div class="idea-card">
      <span class="idea-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="idea-text">${e(idea)}</span>
    </div>`).join('');

  // 견적표
  const quoteRows = [
    ['초기 진단·설계', '300만원~', '1회', '-'],
    ['콘텐츠 자동 발행 시스템', '월 200만원', '월간', '주 5회 자동 게시'],
    [pkg.name || '맞춤 패키지', e(pkg.price || '협의'), e(pkg.duration || '6개월'), '풀스택 운영'],
    ['AI 인용 모니터링', '월 50만원', '월간', '월 리포트 발행'],
    ['전략 컨설팅', '회당 100만원', '분기', '경영진 미팅']
  ];
  const quoteHTML = quoteRows.map(r => `
    <tr>
      <td>${e(r[0])}</td>
      <td class="num">${e(r[1])}</td>
      <td>${e(r[2])}</td>
      <td class="muted">${e(r[3])}</td>
    </tr>`).join('');

  // 예상 성과 표
  const newScore = expected.newScoreEstimate || Math.min(95, totalScore + 30);
  const outcomeRows = [
    ['종합 점수', `${totalScore}점`, `${newScore}점`, `+${newScore - totalScore}`],
    ['검색 노출', '기준', expected.improvement || '+200%', '↑'],
    ['AI 인용률', '낮음', '상위권', '↑'],
    ['상담 문의량', '기준', '월 +3~5배', '↑']
  ];
  const outcomeHTML = outcomeRows.map(r => `
    <tr>
      <td>${e(r[0])}</td>
      <td class="num muted">${e(r[1])}</td>
      <td class="num strong">${e(r[2])}</td>
      <td class="delta">${e(r[3])}</td>
    </tr>`).join('');

  // 우선순위 액션
  const priorityHTML = priorityActions.length ? priorityActions.map(p => `
    <div class="priority-item">
      <span class="priority-rank">#${p.rank}</span>
      <div class="priority-body">
        <div class="priority-action">${e(p.action || '-')}</div>
        <div class="priority-detail">${e(p.detail || '')}</div>
        <div class="priority-meta">
          <span class="tag tag-impact">${e(p.impact || '-')}</span>
          <span class="tag tag-cost">${e(p.cost || '-')}</span>
        </div>
      </div>
    </div>`).join('') : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${e(brand)} GEO 진단 영업 리포트 - AX Biz Group" />
<title>${e(brand)} GEO 진단 리포트 | AX Biz Group</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet" />
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
<style>
:root {
  --gold: #d4af37;
  --gold-light: #e8c97c;
  --gold-accent: #b8941f;
  --ink-darkest: #0a0e1a;
  --ink-dark: #1a1f2e;
  --ink-mid: #3a4258;
  --ink-soft: #6b7280;
  --ivory: #f5f1e8;
  --ivory-warm: #faf6ed;
  --ivory-deep: #ede5d0;
  --wine: #722f37;
  --wine-light: #8d3d46;
  --emerald: #1a4d3e;
  --emerald-light: #2a6b56;
  --line: rgba(10, 14, 26, 0.12);
  --shadow: 0 6px 24px rgba(10, 14, 26, 0.08);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--ivory-warm);
  color: var(--ink-darkest);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 {
  font-family: 'Noto Serif KR', serif;
  letter-spacing: -0.01em;
  color: var(--ink-darkest);
  margin: 0;
}
.accent-en {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  color: var(--gold-accent);
}
.container { max-width: 1080px; margin: 0 auto; padding: 0 32px; }

/* ===== 상단 헤더 ===== */
.report-header {
  background: linear-gradient(135deg, var(--ink-darkest) 0%, var(--ink-dark) 100%);
  color: var(--ivory);
  padding: 48px 0 56px;
  border-bottom: 4px solid var(--gold);
  position: relative;
}
.report-header::after {
  content: '';
  position: absolute; left: 0; right: 0; bottom: -4px; height: 4px;
  background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 50%, var(--gold) 100%);
}
.brand-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 32px; }
.brand-block { display: flex; align-items: center; gap: 16px; }
.brand-logo { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; background: var(--ivory); padding: 4px; }
.brand-name { font-family: 'Noto Serif KR', serif; font-size: 1.15rem; font-weight: 700; color: var(--gold-light); letter-spacing: 0.02em; }
.brand-tag { font-size: 0.78rem; color: rgba(245, 241, 232, 0.6); margin-top: 2px; }
.report-meta { text-align: right; font-size: 0.82rem; color: rgba(245, 241, 232, 0.7); }
.report-meta .accent-en { color: var(--gold-light); font-size: 0.95rem; }
.report-title-row h1 { color: var(--ivory); font-size: 2.4rem; font-weight: 700; margin-bottom: 8px; }
.report-title-row .subject { font-size: 1.05rem; color: var(--gold-light); }
.report-title-row .url { font-size: 0.85rem; color: rgba(245, 241, 232, 0.55); margin-top: 4px; word-break: break-all; }

/* ===== 탭 네비게이션 ===== */
.tabs-nav {
  background: var(--ink-darkest);
  border-bottom: 1px solid rgba(212, 175, 55, 0.25);
  position: sticky; top: 0; z-index: 100;
}
.tabs-row { display: flex; gap: 0; }
.tab-btn {
  flex: 1; padding: 20px 16px; background: transparent; color: var(--ivory);
  border: none; cursor: pointer; font-family: 'Pretendard', sans-serif;
  font-size: 0.95rem; font-weight: 600; letter-spacing: 0.02em;
  border-bottom: 3px solid transparent; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.tab-btn:hover { background: rgba(212, 175, 55, 0.08); }
.tab-btn.active.t1 { border-bottom-color: var(--wine-light); background: rgba(114, 47, 55, 0.18); color: var(--gold-light); }
.tab-btn.active.t2 { border-bottom-color: var(--emerald-light); background: rgba(26, 77, 62, 0.18); color: var(--gold-light); }
.tab-btn.active.t3 { border-bottom-color: var(--gold); background: rgba(212, 175, 55, 0.12); color: var(--gold-light); }
.tab-num { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.1rem; color: var(--gold); }

/* ===== 탭 패널 ===== */
.tab-panel { display: none; padding: 48px 0 64px; }
.tab-panel.active { display: block; }
.panel-1 { background: linear-gradient(180deg, var(--ivory-warm) 0%, var(--ivory) 100%); }
.panel-2 { background: linear-gradient(180deg, var(--ivory) 0%, var(--ivory-warm) 100%); }
.panel-3 { background: linear-gradient(180deg, var(--ivory-warm) 0%, var(--ivory-deep) 100%); }

.panel-header { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid var(--line); }
.panel-1 .panel-header { border-bottom-color: rgba(114, 47, 55, 0.3); }
.panel-2 .panel-header { border-bottom-color: rgba(26, 77, 62, 0.3); }
.panel-3 .panel-header { border-bottom-color: rgba(212, 175, 55, 0.45); }
.panel-header .label-en { display: block; font-size: 0.85rem; margin-bottom: 6px; }
.panel-header h2 { font-size: 1.85rem; font-weight: 700; }
.panel-1 .panel-header h2 { color: var(--wine); }
.panel-2 .panel-header h2 { color: var(--emerald); }
.panel-3 .panel-header h2 { color: var(--gold-accent); }

/* ===== 탭1: 진단 ===== */
.score-hero {
  background: linear-gradient(135deg, var(--ink-darkest) 0%, var(--wine) 100%);
  color: var(--ivory); border-radius: 20px; padding: 48px 40px;
  text-align: center; margin-bottom: 40px; box-shadow: var(--shadow);
  position: relative; overflow: hidden;
}
.score-hero::before {
  content: ''; position: absolute; top: -50%; right: -20%; width: 60%; height: 200%;
  background: radial-gradient(ellipse, rgba(212, 175, 55, 0.18), transparent 70%);
  pointer-events: none;
}
.score-hero .meta-line { font-size: 0.85rem; color: var(--gold-light); margin-bottom: 16px; letter-spacing: 0.05em; }
.score-big { font-size: 6.5rem; font-weight: 900; line-height: 1; font-family: 'Cormorant Garamond', serif; color: var(--gold); }
.score-big-suffix { font-size: 1.4rem; color: var(--ivory); margin-left: 4px; }
.score-grade-line { margin-top: 12px; font-size: 1.2rem; color: var(--gold-light); font-weight: 600; }
.score-headline { margin-top: 24px; font-size: 1.15rem; color: var(--ivory); max-width: 720px; margin-left: auto; margin-right: auto; }
.score-diag { margin-top: 12px; font-size: 0.9rem; color: rgba(245, 241, 232, 0.75); max-width: 720px; margin-left: auto; margin-right: auto; }

.section-title { font-size: 1.25rem; margin: 40px 0 20px; padding-left: 14px; border-left: 4px solid var(--wine); font-weight: 700; }
.panel-2 .section-title { border-left-color: var(--emerald); }
.panel-3 .section-title { border-left-color: var(--gold); }

.kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.kpi-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 22px; box-shadow: var(--shadow); transition: transform 0.2s; }
.kpi-card:hover { transform: translateY(-2px); }
.kpi-name { font-size: 1.05rem; font-weight: 700; color: var(--ink-darkest); margin-bottom: 4px; }
.kpi-desc { font-size: 0.82rem; color: var(--ink-soft); margin-bottom: 14px; line-height: 1.55; }
.kpi-score-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.kpi-score { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 700; color: var(--wine); }
.kpi-score-max { font-size: 0.9rem; color: var(--ink-soft); margin-left: 2px; }
.kpi-stars { color: var(--gold); letter-spacing: 2px; font-size: 0.95rem; }
.kpi-bar { height: 6px; background: var(--ivory-deep); border-radius: 999px; overflow: hidden; }
.kpi-bar-fill { height: 100%; background: linear-gradient(90deg, var(--wine), var(--gold-accent)); border-radius: 999px; }

.issue-grid { display: grid; gap: 14px; }
.issue-item { display: flex; gap: 18px; background: #fff; border-left: 4px solid var(--wine); padding: 18px 22px; border-radius: 10px; box-shadow: var(--shadow); }
.issue-num { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 700; color: var(--wine); line-height: 1; }
.issue-body { flex: 1; }
.issue-msg { font-weight: 600; color: var(--ink-darkest); font-size: 1.02rem; }
.issue-score { font-size: 0.82rem; color: var(--ink-soft); margin-top: 4px; }

.strength-list { background: #fff; border-radius: 12px; padding: 22px 26px; border: 1px solid var(--line); box-shadow: var(--shadow); }
.strength-item { display: flex; gap: 12px; padding: 8px 0; align-items: center; }
.strength-item + .strength-item { border-top: 1px dashed var(--line); }
.strength-dot { color: var(--emerald); font-size: 0.7rem; }
.muted { color: var(--ink-soft); font-size: 0.85rem; }
.empty { color: var(--ink-soft); font-style: italic; padding: 12px 0; }

/* ===== 탭2: 개선 ===== */
.path-card {
  background: linear-gradient(135deg, var(--emerald) 0%, var(--ink-darkest) 100%);
  color: var(--ivory); padding: 36px 40px; border-radius: 16px;
  margin-bottom: 36px; box-shadow: var(--shadow); position: relative; overflow: hidden;
}
.path-card::before {
  content: ''; position: absolute; right: -30%; top: -30%; width: 70%; height: 160%;
  background: radial-gradient(ellipse, rgba(212, 175, 55, 0.15), transparent 70%);
}
.path-label { font-size: 0.85rem; color: var(--gold-light); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
.path-title { font-family: 'Noto Serif KR', serif; font-size: 1.8rem; font-weight: 700; color: var(--gold); margin-bottom: 14px; }
.path-why { font-size: 1rem; color: var(--ivory); max-width: 640px; line-height: 1.7; }
.path-period { display: inline-block; margin-top: 16px; padding: 6px 16px; background: rgba(212, 175, 55, 0.2); border: 1px solid var(--gold-light); border-radius: 999px; font-size: 0.85rem; color: var(--gold-light); }

.phase-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.phase-card { background: #fff; border-top: 4px solid var(--emerald); border-radius: 10px; padding: 22px 20px; box-shadow: var(--shadow); }
.phase-num { font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--emerald); font-weight: 600; font-size: 0.95rem; }
.phase-title { font-family: 'Noto Serif KR', serif; font-weight: 700; font-size: 1.08rem; margin: 6px 0 14px; color: var(--ink-darkest); }
.phase-card ul { padding-left: 18px; margin: 0; }
.phase-card li { font-size: 0.88rem; color: var(--ink-mid); margin-bottom: 6px; line-height: 1.6; }

.idea-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.idea-card { background: #fff; padding: 16px 20px; border-radius: 10px; border: 1px solid var(--line); display: flex; gap: 14px; align-items: flex-start; transition: border-color 0.2s; }
.idea-card:hover { border-color: var(--emerald-light); }
.idea-num { font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--emerald); font-weight: 700; font-size: 1.15rem; min-width: 32px; }
.idea-text { font-size: 0.92rem; color: var(--ink-darkest); line-height: 1.55; }

.priority-grid { display: grid; gap: 12px; margin-top: 16px; }
.priority-item { display: flex; gap: 18px; background: #fff; border-radius: 10px; padding: 18px 22px; border-left: 4px solid var(--emerald); box-shadow: var(--shadow); }
.priority-rank { font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 700; color: var(--emerald); font-size: 1.6rem; min-width: 44px; }
.priority-body { flex: 1; }
.priority-action { font-weight: 700; color: var(--ink-darkest); font-size: 1.02rem; margin-bottom: 4px; }
.priority-detail { font-size: 0.88rem; color: var(--ink-mid); margin-bottom: 10px; line-height: 1.6; }
.priority-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.tag { font-size: 0.78rem; padding: 4px 10px; border-radius: 999px; font-weight: 600; }
.tag-impact { background: rgba(26, 77, 62, 0.12); color: var(--emerald); }
.tag-cost { background: rgba(212, 175, 55, 0.18); color: var(--gold-accent); }

table.report-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: var(--shadow); }
table.report-table th { background: var(--ink-darkest); color: var(--gold-light); font-family: 'Noto Serif KR', serif; font-weight: 600; padding: 14px 18px; text-align: left; font-size: 0.92rem; letter-spacing: 0.02em; }
table.report-table td { padding: 14px 18px; border-bottom: 1px solid var(--line); font-size: 0.93rem; }
table.report-table tbody tr:last-child td { border-bottom: none; }
table.report-table tbody tr:nth-child(even) { background: var(--ivory-warm); }
table.report-table .num { font-family: 'Cormorant Garamond', serif; font-weight: 600; color: var(--ink-darkest); }
table.report-table .num.strong { color: var(--emerald); font-size: 1.05rem; }
table.report-table .delta { color: var(--gold-accent); font-weight: 700; }

/* ===== 탭3: 대표 ===== */
.ceo-hero {
  display: grid; grid-template-columns: 280px 1fr; gap: 40px;
  background: linear-gradient(135deg, #fff 0%, var(--ivory-warm) 100%);
  border: 1px solid var(--gold-light); border-radius: 20px; padding: 40px;
  box-shadow: var(--shadow); margin-bottom: 36px;
}
.ceo-photo {
  width: 240px; height: 240px; border-radius: 50%; object-fit: cover;
  border: 6px solid var(--gold); box-shadow: 0 8px 32px rgba(212, 175, 55, 0.3);
  margin: 0 auto;
}
.ceo-info .ceo-tag { font-size: 0.85rem; color: var(--gold-accent); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
.ceo-info h3 { font-size: 2.2rem; color: var(--ink-darkest); margin-bottom: 4px; }
.ceo-info .ceo-position { font-size: 1.05rem; color: var(--ink-mid); margin-bottom: 20px; }
.ceo-bio { font-size: 0.95rem; color: var(--ink-mid); line-height: 1.8; }

.ceo-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 24px 0 36px; }
.ceo-kpi {
  background: linear-gradient(180deg, var(--ink-darkest) 0%, var(--ink-dark) 100%);
  color: var(--ivory); border-radius: 12px; padding: 24px 18px; text-align: center;
  border: 1px solid var(--gold); box-shadow: var(--shadow);
}
.ceo-kpi-num { font-family: 'Cormorant Garamond', serif; font-size: 3rem; font-weight: 700; color: var(--gold); line-height: 1; }
.ceo-kpi-num-suffix { font-size: 1rem; color: var(--gold-light); margin-left: 2px; }
.ceo-kpi-label { font-size: 0.88rem; color: var(--ivory); margin-top: 8px; font-weight: 600; }
.ceo-kpi-sub { font-size: 0.75rem; color: rgba(245, 241, 232, 0.6); margin-top: 4px; }

.ceo-expertise { background: #fff; border-radius: 12px; padding: 28px; box-shadow: var(--shadow); margin-bottom: 24px; border: 1px solid var(--line); }
.ceo-expertise h4 { font-size: 1.15rem; margin-bottom: 14px; color: var(--ink-darkest); }
.expertise-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.expertise-tag { padding: 7px 14px; background: var(--ivory-deep); color: var(--ink-darkest); border-radius: 999px; font-size: 0.85rem; font-weight: 600; border: 1px solid var(--gold-light); }

.contact-card {
  background: linear-gradient(135deg, var(--gold-accent) 0%, var(--gold) 100%);
  color: var(--ink-darkest); border-radius: 14px; padding: 32px 36px; box-shadow: var(--shadow);
  display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center;
}
.contact-card .label-en { font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: var(--ink-darkest); opacity: 0.7; }
.contact-card h4 { font-size: 1.5rem; margin: 4px 0 16px; color: var(--ink-darkest); }
.contact-row { display: flex; flex-direction: column; gap: 8px; font-size: 0.95rem; }
.contact-row span { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.contact-cta { background: var(--ink-darkest); color: var(--gold); padding: 16px 28px; border-radius: 10px; text-align: center; font-weight: 700; font-size: 1rem; text-decoration: none; white-space: nowrap; transition: transform 0.15s; }
.contact-cta:hover { transform: scale(1.04); }

/* ===== 푸터 ===== */
.report-footer { background: var(--ink-darkest); color: rgba(245, 241, 232, 0.7); padding: 36px 0; border-top: 4px solid var(--gold); margin-top: 0; }
.footer-row { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; align-items: center; }
.footer-brand { display: flex; align-items: center; gap: 12px; }
.footer-brand img { width: 40px; height: 40px; border-radius: 6px; background: var(--ivory); padding: 3px; }
.footer-brand-text { font-family: 'Noto Serif KR', serif; font-weight: 700; color: var(--gold-light); font-size: 1rem; }
.footer-meta { font-size: 0.82rem; line-height: 1.7; }

/* ===== 인쇄 ===== */
@media print {
  .tabs-nav { display: none; }
  .tab-panel { display: block !important; page-break-after: always; padding: 24px 0; }
  body { background: #fff; }
  .report-header, .report-footer { background: var(--ink-darkest) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .score-hero, .path-card, .ceo-kpi, .contact-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

/* ===== 반응형 ===== */
@media (max-width: 720px) {
  .container { padding: 0 20px; }
  .kpi-grid, .idea-grid { grid-template-columns: 1fr; }
  .phase-row, .ceo-kpi-row { grid-template-columns: repeat(2, 1fr); }
  .ceo-hero { grid-template-columns: 1fr; }
  .ceo-photo { width: 200px; height: 200px; }
  .contact-card { grid-template-columns: 1fr; text-align: center; }
  .score-big { font-size: 4.8rem; }
  .report-title-row h1 { font-size: 1.8rem; }
  .tab-btn { padding: 14px 8px; font-size: 0.82rem; }
}
</style>
</head>
<body>

<header class="report-header">
  <div class="container">
    <div class="brand-row">
      <div class="brand-block">
        <img class="brand-logo" src="https://jaiwshim-project.github.io/01-2-AXBizGroup/%EB%A1%9C%EA%B3%A0-AX%EB%B9%84%EC%A6%88%EA%B7%B8%EB%A3%B9.jpg" alt="AX Biz Group" onerror="this.style.display='none'" />
        <div>
          <div class="brand-name">AX Biz Group</div>
          <div class="brand-tag accent-en">AI Transformation Partners</div>
        </div>
      </div>
      <div class="report-meta">
        <div class="accent-en">GEO Diagnostic Report</div>
        <div>발행일: ${e(dateStr)}</div>
        <div>리포트 코드: GEO-${e(String(Date.now()).slice(-8))}</div>
      </div>
    </div>
    <div class="report-title-row">
      <h1>${e(brand)} <span class="accent-en">Diagnosis</span></h1>
      <div class="subject">${e(industry)} · AI 검색 시대 존재력 진단 결과</div>
      ${websiteUrl ? `<div class="url">${e(websiteUrl)}</div>` : ''}
    </div>
  </div>
</header>

<nav class="tabs-nav">
  <div class="container">
    <div class="tabs-row">
      <button class="tab-btn t1 active" data-tab="1"><span class="tab-num">I.</span> 진단</button>
      <button class="tab-btn t2" data-tab="2"><span class="tab-num">II.</span> 개선</button>
      <button class="tab-btn t3" data-tab="3"><span class="tab-num">III.</span> 대표</button>
    </div>
  </div>
</nav>

<!-- ========== 탭 1: 진단 ========== -->
<section class="tab-panel panel-1 active" data-panel="1">
  <div class="container">
    <div class="panel-header">
      <span class="accent-en label-en">Section I — Where you stand</span>
      <h2>현재 위치 진단</h2>
    </div>

    <div class="score-hero">
      <div class="meta-line accent-en">Total GEO Score</div>
      <div>
        <span class="score-big">${totalScore}</span><span class="score-big-suffix">/ 100</span>
      </div>
      <div class="score-grade-line">${e(grade)} ${gradeKey ? `· ${e(gradeKey)}` : ''}</div>
      <div class="score-headline">${e(headline)}</div>
      ${diagnosis ? `<div class="score-diag">${e(diagnosis)}</div>` : ''}
    </div>

    <h3 class="section-title">8대 항목 점수표</h3>
    <div class="kpi-grid">${kpiGridHTML}</div>

    <h3 class="section-title">핵심 결함 3가지</h3>
    <div class="issue-grid">${criticalsHTML}</div>

    <h3 class="section-title">강점 자산</h3>
    <div class="strength-list">${strengthsHTML}</div>
  </div>
</section>

<!-- ========== 탭 2: 개선 ========== -->
<section class="tab-panel panel-2" data-panel="2">
  <div class="container">
    <div class="panel-header">
      <span class="accent-en label-en">Section II — How we get there</span>
      <h2>개선 로드맵</h2>
    </div>

    <div class="path-card">
      <div class="path-label accent-en">Recommended Path</div>
      <div class="path-title">${e(recommendedPath.title)}</div>
      <div class="path-why">${e(recommendedPath.why)}</div>
      <span class="path-period">예상 기간: ${e(recommendedPath.period)}</span>
    </div>

    <h3 class="section-title">4단계 실행 플랜</h3>
    ${phasesHTML}

    ${priorityActions.length ? `
      <h3 class="section-title">우선순위 액션 Top 3</h3>
      <div class="priority-grid">${priorityHTML}</div>
    ` : ''}

    <h3 class="section-title">콘텐츠 아이디어 ${contentIdeas.length}선</h3>
    <div class="idea-grid">${ideasHTML}</div>

    <h3 class="section-title">예상 성과 (3~6개월)</h3>
    <table class="report-table">
      <thead>
        <tr><th>항목</th><th>현재</th><th>목표</th><th>변화</th></tr>
      </thead>
      <tbody>${outcomeHTML}</tbody>
    </table>

    <h3 class="section-title">투자 견적</h3>
    <table class="report-table">
      <thead>
        <tr><th>항목</th><th>금액</th><th>주기</th><th>비고</th></tr>
      </thead>
      <tbody>${quoteHTML}</tbody>
    </table>
  </div>
</section>

<!-- ========== 탭 3: 대표 ========== -->
<section class="tab-panel panel-3" data-panel="3">
  <div class="container">
    <div class="panel-header">
      <span class="accent-en label-en">Section III — Who delivers it</span>
      <h2>대표 프로필</h2>
    </div>

    <div class="ceo-hero">
      <div>
        <img class="ceo-photo" src="https://aitutorhub.com/ceo-profile.png" alt="심재우 대표" onerror="this.style.background='linear-gradient(135deg,#0a0e1a,#722f37)'; this.alt='';" />
      </div>
      <div class="ceo-info">
        <div class="ceo-tag accent-en">Founder &amp; CEO</div>
        <h3>심재우</h3>
        <div class="ceo-position">AX Biz Group 대표 · AI Transformation Strategist</div>
        <div class="ceo-bio">
          AI 검색 시대 기업의 존재력을 설계하는 전략가. 특허·저작권·상표권·저서 등
          무형 자산 130여 건을 보유한 다작 발명가이자 저자로, 의료·교육·세일즈·컨설팅
          영역에서 AI 트랜스포메이션 플랫폼을 자체 IP로 구축해 왔습니다.
          AX Biz Group은 GEO Score AI를 비롯한 AI 진단·운영 시스템을 통해
          중소기업이 AI 시대에도 발견되고 선택되는 브랜드로 성장하도록 돕습니다.
        </div>
      </div>
    </div>

    <h3 class="section-title">지식재산 보유 현황</h3>
    <div class="ceo-kpi-row">
      <div class="ceo-kpi">
        <div><span class="ceo-kpi-num">10</span><span class="ceo-kpi-num-suffix">건</span></div>
        <div class="ceo-kpi-label">특허</div>
        <div class="ceo-kpi-sub accent-en">Patents</div>
      </div>
      <div class="ceo-kpi">
        <div><span class="ceo-kpi-num">50</span><span class="ceo-kpi-num-suffix">건</span></div>
        <div class="ceo-kpi-label">저작권</div>
        <div class="ceo-kpi-sub accent-en">Copyrights</div>
      </div>
      <div class="ceo-kpi">
        <div><span class="ceo-kpi-num">20</span><span class="ceo-kpi-num-suffix">건</span></div>
        <div class="ceo-kpi-label">상표권</div>
        <div class="ceo-kpi-sub accent-en">Trademarks</div>
      </div>
      <div class="ceo-kpi">
        <div><span class="ceo-kpi-num">50</span><span class="ceo-kpi-num-suffix">권</span></div>
        <div class="ceo-kpi-label">저서</div>
        <div class="ceo-kpi-sub accent-en">Books</div>
      </div>
    </div>

    <div class="ceo-expertise">
      <h4>전문 분야</h4>
      <div class="expertise-tags">
        <span class="expertise-tag">AI 검색 최적화 (GEO)</span>
        <span class="expertise-tag">콘텐츠 자동 생산 시스템</span>
        <span class="expertise-tag">의료 AI 상담 플랫폼</span>
        <span class="expertise-tag">SPIN/인사이트 셀링</span>
        <span class="expertise-tag">교육 AI 코칭</span>
        <span class="expertise-tag">온톨로지 기반 플랫폼 설계</span>
        <span class="expertise-tag">특허·저작권 전략</span>
      </div>
    </div>

    <div class="contact-card">
      <div>
        <div class="label-en">Direct Contact</div>
        <h4>지금 바로 상담을 시작하세요</h4>
        <div class="contact-row">
          <span>📧 jaiwshim@gmail.com</span>
          <span>📱 010-2397-5734</span>
          <span>🏢 AX Biz Group</span>
        </div>
      </div>
      <a class="contact-cta" href="mailto:jaiwshim@gmail.com?subject=${encodeURIComponent('[GEO 리포트 상담] ' + brand)}">상담 신청 →</a>
    </div>
  </div>
</section>

<footer class="report-footer">
  <div class="container">
    <div class="footer-row">
      <div class="footer-brand">
        <img src="https://jaiwshim-project.github.io/01-2-AXBizGroup/%EB%A1%9C%EA%B3%A0-AX%EB%B9%84%EC%A6%88%EA%B7%B8%EB%A3%B9.jpg" alt="AX Biz Group" onerror="this.style.display='none'" />
        <div>
          <div class="footer-brand-text">AX Biz Group</div>
          <div class="footer-meta accent-en">AI Transformation · GEO · Content Engine</div>
        </div>
      </div>
      <div class="footer-meta">
        대표 심재우 · jaiwshim@gmail.com · 010-2397-5734<br />
        본 리포트는 GEO Score AI 자동 진단 결과를 영업·제안용으로 정리한 문서입니다.<br />
        © ${new Date().getFullYear()} AX Biz Group. All rights reserved.
      </div>
    </div>
  </div>
</footer>

<script>
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      var t = b.getAttribute('data-tab');
      btns.forEach(function(x){ x.classList.remove('active'); });
      panels.forEach(function(p){ p.classList.remove('active'); });
      b.classList.add('active');
      var panel = document.querySelector('.tab-panel[data-panel="'+t+'"]');
      if (panel) panel.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
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

    const html = buildHTML(result, recommendation, brand, industry);

    return res.status(200).json({
      success: true,
      brand,
      industry,
      totalScore: result.totalScore,
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
