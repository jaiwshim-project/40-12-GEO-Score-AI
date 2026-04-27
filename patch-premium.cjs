// 모든 페이지의 nav-logo + footer-brand SVG를 원본 PNG로 교체
const fs = require('fs');
const path = require('path');

const FILES = ['index.html','dashboard.html','results.html','chatbot.html','manual.html','architecture.html','admin.html'];

const NAV_LOGO_IMG  = `<img src="assets/logo.png" alt="GEO Score AI" class="brand-logo brand-logo-nav" />`;
const FOOTER_LOGO_IMG = `<img src="assets/logo.png" alt="GEO Score AI" class="brand-logo brand-logo-footer" />`;

let total = 0;
for (const f of FILES) {
  const filePath = path.join(__dirname, f);
  let html = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // 1) nav-logo 안의 SVG 블록 → <img>
  // 패턴: <a class="nav-logo">...<svg ...>...</svg></a>
  html = html.replace(
    /(<a[^>]*class="nav-logo"[^>]*>)\s*<svg[\s\S]*?<\/svg>\s*(<\/a>)/g,
    (_m, open, close) => { changes++; return `${open}${NAV_LOGO_IMG}${close}`; }
  );

  // 2) premium-footer-brand 안의 SVG 블록 → <img>
  html = html.replace(
    /(<div class="premium-footer-brand">)\s*<svg[\s\S]*?<\/svg>/g,
    (_m, open) => { changes++; return `${open}\n          ${FOOTER_LOGO_IMG}`; }
  );

  fs.writeFileSync(filePath, html, 'utf8');
  total += changes;
  console.log(`✅ ${f.padEnd(20)} ${changes} 변경`);
}

console.log(`\n총 ${total} SVG → PNG 교체`);
