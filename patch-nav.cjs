// 모든 페이지의 navbar를 통일 + index.html에 dashboard.css 추가
const fs = require('fs');
const path = require('path');

const FILES = ['index.html','dashboard.html','results.html','chatbot.html','manual.html','architecture.html','admin.html','analyzing.html','cep.html','rewrite.html'];

const UNIFIED_NAVBAR = `<nav class="navbar">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo"><img src="assets/logo.png" alt="GEO Score AI" class="brand-logo brand-logo-nav" /></a>
      <div class="nav-links">
        <a href="index.html#kpi" class="nav-link">10대 KPI</a>
        <a href="index.html#process" class="nav-link">진단 프로세스</a>
        <a href="manual.html" class="nav-link">매뉴얼</a>
        <a href="architecture.html" class="nav-link">아키텍처</a>
        <a href="dashboard.html" class="nav-link">대시보드</a>
        <a href="result-overview.html" class="nav-link">진단 결과</a>
        <a href="cep.html" class="nav-link">🎯 CEP 발굴</a>
        <a href="rewrite.html" class="nav-link">✨ 90점 글</a>
        <a href="chatbot.html" class="nav-link">AI 상담</a>
        <a href="index.html#diag" class="nav-link nav-cta">무료 진단 시작</a>
      </div>
    </div>
  </nav>`;

let total = 0;
for (const f of FILES) {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) { console.log(`⏭  ${f} (없음)`); continue; }
  let html = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // 1) <nav class="navbar">...</nav> 통째 교체
  html = html.replace(
    /<nav class="navbar">[\s\S]*?<\/nav>/,
    () => { changes++; return UNIFIED_NAVBAR; }
  );

  // 2) index.html에 dashboard.css 추가 (stat-card 스타일 적용)
  if (f === 'index.html' && !html.includes('href="css/dashboard.css"')) {
    html = html.replace(
      /(<link rel="stylesheet" href="css\/main\.css"\s*\/?>)/,
      `$1\n  <link rel="stylesheet" href="css/dashboard.css" />`
    );
    changes++;
  }

  fs.writeFileSync(filePath, html, 'utf8');
  total += changes;
  console.log(`✅ ${f.padEnd(20)} ${changes} 변경`);
}

console.log(`\n총 ${total} 변경`);
