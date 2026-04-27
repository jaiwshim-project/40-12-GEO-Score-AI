// 결과 6개 탭을 독립 HTML 페이지로 생성
const fs = require('fs');
const path = require('path');

const TABS = [
  {
    file: 'result-overview.html',
    key: 'overview',
    title: '종합 분석',
    icon: '📊',
    needsCSS2: true, // dashboard.css
    extraJS: ['js/chart.js'],
    pageJS: 'js/result-overview.js',
    content: `
      <!-- 종합 분석 컨텐츠 -->
      <div class="radar-container">
        <h3 style="margin-bottom: 24px; text-align: center;">10대 KPI 레이더 차트</h3>
        <div class="radar-wrapper" id="radarChart"></div>
      </div>

      <div class="kpi-detail-grid">
        <div class="kpi-detail-card">
          <div class="kpi-detail-header">
            <div class="kpi-detail-name"><span class="kpi-icon-mini">💪</span>강점 영역</div>
          </div>
          <div id="strengthsList" style="font-size: 0.95rem; color: var(--text-secondary);"></div>
        </div>
        <div class="kpi-detail-card">
          <div class="kpi-detail-header">
            <div class="kpi-detail-name"><span class="kpi-icon-mini">⚠️</span>약점 영역</div>
          </div>
          <div id="weaknessesList" style="font-size: 0.95rem; color: var(--text-secondary);"></div>
        </div>
        <div class="kpi-detail-card">
          <div class="kpi-detail-header">
            <div class="kpi-detail-name"><span class="kpi-icon-mini">💡</span>즉시 개선 가능</div>
          </div>
          <div id="quickWinsList" style="font-size: 0.95rem; color: var(--text-secondary);"></div>
        </div>
      </div>`
  },
  {
    file: 'result-kpi.html',
    key: 'kpi',
    title: '10대 KPI',
    icon: '🔢',
    needsCSS2: true,
    extraJS: [],
    pageJS: 'js/result-kpi.js',
    content: `
      <!-- KPI 상세 -->
      <div class="kpi-detail-grid" id="kpiDetailGrid"></div>`
  },
  {
    file: 'result-problems.html',
    key: 'problems',
    title: '문제 영역',
    icon: '⚠️',
    needsCSS2: true,
    extraJS: [],
    pageJS: 'js/result-problems.js',
    content: `
      <!-- 문제 영역 -->
      <div class="section-header">
        <h2>치명적 문제 영역</h2>
        <p class="section-subtitle">방치 시 경쟁사에 시장을 빼앗길 수 있는 위험 요소들</p>
      </div>
      <div class="problem-grid" id="problemGrid"></div>

      <div class="section-header" style="margin-top: 64px;">
        <h2>기회 영역</h2>
        <p class="section-subtitle">즉시 실행 시 큰 효과를 볼 수 있는 영역</p>
      </div>
      <div class="problem-grid" id="opportunityGrid"></div>`
  },
  {
    file: 'result-comparison.html',
    key: 'comparison',
    title: '경쟁사 비교',
    icon: '📈',
    needsCSS2: true,
    extraJS: ['js/chart.js'],
    pageJS: 'js/result-comparison.js',
    content: `
      <!-- 경쟁사 비교 -->
      <div class="section-header">
        <h2>경쟁사 대비 위치</h2>
        <p class="section-subtitle">동종업계 평균과 상위 10% 기업 대비 귀사의 현재 위치</p>
      </div>
      <div class="radar-container">
        <div id="comparisonChart"></div>
      </div>
      <div class="cta-section" style="margin-top: 32px;">
        <h3 style="margin-bottom: 16px;" id="competitiveMessage">경쟁사가 이미 AI에 등장하고 있습니다</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">
          지금 바꾸지 않으면 AI 인용&amp;추천 시장을 잃습니다
        </p>
      </div>`
  },
  {
    file: 'result-solution.html',
    key: 'solution',
    title: '솔루션 제안',
    icon: '🚀',
    needsCSS2: true,
    extraJS: [],
    pageJS: 'js/result-solution.js',
    content: `
      <!-- 솔루션 -->
      <div id="solutionContent"></div>

      <!-- 빠른 액션: 90점 글 자동 생성 CTA -->
      <div style="margin-top: 64px; padding: 32px; background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(0, 214, 143, 0.06)); border: 1px solid rgba(255, 107, 53, 0.25); border-radius: 20px; text-align: center;">
        <div style="font-size: 2rem; margin-bottom: 8px;">✨</div>
        <h3 style="font-size: 1.4rem; margin-bottom: 8px;">이 글을 <span style="background: linear-gradient(135deg, #ff6b35, #ffa800); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">90점</span>으로 자동 재작성</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
          AI가 부족한 신호를 모두 보강한 글을 즉시 생성합니다.
        </p>
        <a href="result-rewrite.html" class="btn btn-primary btn-large" data-href="result-rewrite.html" id="solutionRewriteBtn">
          ✨ 90점 글 만들기 →
        </a>
      </div>`
  },
  {
    file: 'result-ontology.html',
    key: 'ontology',
    title: '온톨로지 분석',
    icon: '🕸️',
    needsCSS2: true,
    extraJS: [],
    pageJS: 'js/result-ontology.js',
    content: `
      <!-- 온톨로지 분석 -->
      <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.95rem;">
        📊 KPI 인과 그래프 + 액션 영향 매트릭스를 AXOS 8노드 + 9관계 표준 스키마로 시각화합니다.
        Issue 노드(빨강)를 클릭하면 근본 원인과 해결책 3가지가 표시됩니다.
      </div>
      <iframe id="ontologyFrame" src="ontology.html"
        style="width: 100%; height: 800px; border: 1px solid var(--border-primary); border-radius: 16px; background: #f8fafb;"
        title="GEO Score AI 3D 온톨로지 분석"></iframe>`
  },
  {
    file: 'result-cep.html',
    key: 'cep',
    title: 'CEP 좌표',
    icon: '🎯',
    needsCSS2: true,
    extraJS: [],
    pageJS: 'js/result-cep.js',
    content: `
      <!-- CEP 좌표 -->
      <div id="cepContent"></div>`
  },
  {
    file: 'result-rewrite.html',
    key: 'rewrite',
    title: '90점 글 생성',
    icon: '✨',
    needsCSS2: true,
    extraJS: [],
    pageJS: 'js/result-rewrite.js',
    content: `
      <!-- 90점 글 생성 -->
      <div id="rewriteTabContent"></div>`
  }
];

const NAV_LOGO_IMG = `<img src="assets/logo.png" alt="GEO Score AI" class="brand-logo brand-logo-nav" />`;
const FOOTER_LOGO_IMG = `<img src="assets/logo.png" alt="GEO Score AI" class="brand-logo brand-logo-footer" />`;

const NAVBAR = `<nav class="navbar">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">${NAV_LOGO_IMG}</a>
      <div class="nav-links">
        <a href="index.html#kpi" class="nav-link">10대 KPI</a>
        <a href="index.html#process" class="nav-link">진단 프로세스</a>
        <a href="manual.html" class="nav-link">매뉴얼</a>
        <a href="architecture.html" class="nav-link">아키텍처</a>
        <a href="dashboard.html" class="nav-link">대시보드</a>
        <a href="result-overview.html" class="nav-link">진단 결과</a>
        <a href="chatbot.html" class="nav-link">AI 상담</a>
        <a href="index.html#diag" class="nav-link nav-cta">무료 진단 시작</a>
      </div>
    </div>
  </nav>`;

const FOOTER = `<footer class="premium-footer">
    <div class="premium-footer-glow"></div>
    <div class="container">
      <div class="premium-footer-grid">
        <div class="premium-footer-brand">
          ${FOOTER_LOGO_IMG}
          <p class="premium-footer-tagline">AI 검색 시대 기업의 존재 가능성을 점수로 진단하고,<br/><strong>존재하게 만드는</strong> 플랫폼.</p>
          <div class="premium-footer-badges">
            <span class="pf-badge">🤖 Gemini AI</span>
            <span class="pf-badge">🔒 Vercel Edge</span>
            <span class="pf-badge">⚡ 30초 진단</span>
          </div>
        </div>
        <div class="premium-footer-col">
          <h5>플랫폼</h5>
          <ul>
            <li><a href="index.html#diag">🎯 무료 진단</a></li>
            <li><a href="dashboard.html">📋 대시보드</a></li>
            <li><a href="result-overview.html">📈 결과 분석</a></li>
            <li><a href="chatbot.html">💬 AI 상담</a></li>
            <li><a href="admin.html">🔐 관리자</a></li>
          </ul>
        </div>
        <div class="premium-footer-col">
          <h5>리소스</h5>
          <ul>
            <li><a href="manual.html">📖 사용 매뉴얼</a></li>
            <li><a href="architecture.html">🗺️ 시스템 아키텍처</a></li>
            <li><a href="ontology.html">🕸️ 3D 온톨로지</a></li>
            <li><a href="index.html#kpi">🔢 10대 KPI</a></li>
            <li><a href="index.html#process">⚙️ 진단 프로세스</a></li>
          </ul>
        </div>
        <div class="premium-footer-col">
          <h5>연결</h5>
          <ul>
            <li><a href="https://geo-aio.vercel.app" target="_blank" rel="noopener">🚀 GEO-AIO 솔루션</a></li>
            <li><a href="mailto:jaiwshim@gmail.com">✉️ 이메일 문의</a></li>
            <li><a href="chatbot.html">💬 실시간 상담</a></li>
          </ul>
          <div class="premium-footer-cta">
            <a href="index.html#diag" class="pf-cta-btn">무료 진단 시작 →</a>
          </div>
        </div>
      </div>
      <div class="premium-footer-bottom">
        <div class="pf-bottom-left">
          <span>© 2026 <strong>GEO Score AI</strong></span>
          <span class="pf-divider">·</span>
          <span>심재우</span>
          <span class="pf-divider">·</span>
          <a href="mailto:jaiwshim@gmail.com">jaiwshim@gmail.com</a>
        </div>
        <div class="pf-bottom-right">
          <em>"문제를 보여주고, 해결을 유일하게 만들고, 계약으로 연결한다"</em>
        </div>
      </div>
    </div>
  </footer>`;

function tabsNav(activeKey) {
  return `<div class="tabs" style="margin-top: 48px;">
        ${TABS.map(t => `<a class="tab${t.key === activeKey ? ' active' : ''}" data-href="${t.file}" href="${t.file}">${t.icon} ${t.title}</a>`).join('\n        ')}
      </div>`;
}

function buildPage(tab) {
  const css2 = tab.needsCSS2 ? `\n  <link rel="stylesheet" href="css/dashboard.css" />` : '';
  const extraJS = tab.extraJS.map(j => `  <script src="${j}"></script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tab.title} - GEO Score AI</title>
  <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
  <link rel="stylesheet" href="css/main.css" />${css2}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E${encodeURIComponent(tab.icon)}%3C/text%3E%3C/svg%3E" />
</head>
<body>

  ${NAVBAR}

  <!-- 결과 화면 -->
  <section id="resultSection" class="section">
    <div class="container">

      <!-- 종합 점수 (모든 탭 공통) -->
      <div class="score-hero">
        <div class="hero-badge">
          <span class="pulse"></span>
          <span id="resultMeta">진단 완료</span>
        </div>

        <h1 style="margin-bottom: 16px;" id="companyTitle">-</h1>
        <p style="color: var(--text-secondary); margin-bottom: 40px;" id="urlSubtitle">-</p>

        <div class="score-circle">
          <svg viewBox="0 0 280 280">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ff6b35" />
                <stop offset="50%" stop-color="#ffa800" />
                <stop offset="100%" stop-color="#00d68f" />
              </linearGradient>
            </defs>
            <circle class="score-circle-bg" cx="140" cy="140" r="120" />
            <circle class="score-circle-fg" id="scoreFg" cx="140" cy="140" r="120"
                    stroke-dasharray="753.98" stroke-dashoffset="753.98"
                    transform="rotate(-90 140 140)" />
          </svg>
          <div class="score-content">
            <div class="score-value" id="scoreValue">0</div>
            <div class="score-total">/ 100</div>
          </div>
        </div>

        <div class="score-grade" id="scoreGrade">-</div>

        <div class="shock-message" id="shockMessage">분석 결과를 준비 중입니다</div>

        <p style="color: var(--text-secondary); max-width: 720px; margin: 0 auto;" id="diagnosisText">-</p>
      </div>

      <!-- 탭 네비게이션 -->
      ${tabsNav(tab.key)}

      <!-- 탭별 컨텐츠 -->
      <div class="tab-panel active">${tab.content}
      </div>

      <!-- 최종 CTA -->
      <div class="cta-section" style="margin-top: 64px;">
        <h2 class="cta-title">
          지금 시작하지 않으면<br />
          <span style="color: var(--color-accent);">경쟁사에게 AI 인용&amp;추천 시장을 뺏깁니다</span>
        </h2>
        <p class="cta-subtitle">GEO-AIO 솔루션으로 3개월 내 AI 추천 기업으로 전환하세요.</p>
        <div class="cta-buttons">
          <a href="#" id="ctaPrimary" class="btn btn-primary btn-large" style="width: auto;">🚀 GEO-AIO 솔루션 시작</a>
          <a href="chatbot.html" class="btn btn-ghost btn-large" style="width: auto;">💬 전문가 상담 예약</a>
          <button id="saveReport" class="btn btn-secondary btn-large" style="width: auto;">📥 리포트 저장</button>
        </div>
      </div>

    </div>
  </section>

  <!-- 에러 화면 -->
  <section id="errorSection" class="section hidden">
    <div class="container">
      <div style="text-align: center; padding: 80px 24px; max-width: 560px; margin: 0 auto;">
        <div style="font-size: 4rem; margin-bottom: 24px;">😕</div>
        <h2 style="margin-bottom: 16px;">진단 중 오류가 발생했습니다</h2>
        <p id="errorMessage" style="color: var(--text-secondary); margin-bottom: 32px;">-</p>
        <a href="index.html" class="btn btn-primary">처음으로 돌아가기</a>
      </div>
    </div>
  </section>

  ${FOOTER}

  <script src="js/kpi-config.js"></script>
  <script src="js/common.js"></script>
  <script src="js/standalone-shim.js"></script>
${extraJS}
  <script src="js/result-shared.js"></script>
  <script src="${tab.pageJS}"></script>
</body>
</html>
`;
}

let count = 0;
for (const tab of TABS) {
  const out = path.join(__dirname, tab.file);
  fs.writeFileSync(out, buildPage(tab), 'utf8');
  console.log(`✅ ${tab.file.padEnd(28)} (${tab.title})`);
  count++;
}
console.log(`\n총 ${count}개 페이지 생성`);
