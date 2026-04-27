// 모든 HTML을 단일 파일(self-contained)로 빌드
// 사용: node inline-build.cjs
// 출력: standalone/ 폴더

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'standalone');
fs.mkdirSync(OUT, { recursive: true });

const HTML_FILES = [
  'index.html',
  'analyzing.html',
  'dashboard.html',
  'results.html',
  'result-overview.html',
  'result-kpi.html',
  'result-problems.html',
  'result-comparison.html',
  'result-solution.html',
  'result-ontology.html',
  'result-cep.html',
  'result-rewrite.html',
  'cep.html',
  'rewrite.html',
  'chatbot.html',
  'manual.html',
  'architecture.html',
  'admin.html',
];

// </script> 토큰이 인라인 JS 안에 있으면 파서가 깨짐. 안전하게 분리.
const escapeForInlineScript = (js) => js.replace(/<\/script>/gi, '<\\/script>');

// CSS 안에 </style> 토큰 보호 (희귀하지만 안전 차원)
const escapeForInlineStyle = (css) => css.replace(/<\/style>/gi, '<\\/style>');

const readAsset = (relPath) => {
  const full = path.join(ROOT, relPath);
  return fs.readFileSync(full, 'utf8');
};

let totalLines = 0;

for (const file of HTML_FILES) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  let cssCount = 0;
  let jsCount = 0;

  // <link rel="stylesheet" href="css/X.css" />  →  <style>...</style>
  html = html.replace(
    /<link\s+rel=["']stylesheet["']\s+href=["'](css\/[^"']+\.css)["']\s*\/?>/gi,
    (_m, p) => {
      const css = escapeForInlineStyle(readAsset(p));
      cssCount++;
      return `<style data-inlined-from="${p}">\n${css}\n</style>`;
    }
  );

  // 순서가 바뀐 경우(href 먼저)도 처리
  html = html.replace(
    /<link\s+href=["'](css\/[^"']+\.css)["']\s+rel=["']stylesheet["']\s*\/?>/gi,
    (_m, p) => {
      const css = escapeForInlineStyle(readAsset(p));
      cssCount++;
      return `<style data-inlined-from="${p}">\n${css}\n</style>`;
    }
  );

  // <script src="js/X.js"></script>  →  <script>...</script>
  // standalone-shim.js는 root HTML에 이미 wired 되어 있어서 그대로 인라인됨 (중복 주입 안 함)
  html = html.replace(
    /<script\s+src=["'](js\/[^"']+\.js)["']\s*><\/script>/gi,
    (_m, p) => {
      const js = escapeForInlineScript(readAsset(p));
      jsCount++;
      return `<script data-inlined-from="${p}">\n${js}\n</script>`;
    }
  );

  fs.writeFileSync(path.join(OUT, file), html, 'utf8');
  const lines = html.split('\n').length;
  totalLines += lines;
  console.log(`✅ ${file.padEnd(20)} CSS:${cssCount} JS:${jsCount} → ${lines} lines, ${(html.length/1024).toFixed(1)}KB`);
}

// ontology.html은 그대로 standalone/에 복사 (외부 라이브러리 CDN 사용, file:// 호환)
const ontologySource = path.join(ROOT, 'ontology.html');
if (fs.existsSync(ontologySource)) {
  fs.copyFileSync(ontologySource, path.join(OUT, 'ontology.html'));
  const sz = fs.statSync(ontologySource).size;
  console.log(`✅ ontology.html        copied (${(sz/1024).toFixed(1)}KB)`);
}

// assets/ 폴더 복사 (logo.png 등)
const assetsSource = path.join(ROOT, 'assets');
const assetsOut = path.join(OUT, 'assets');
if (fs.existsSync(assetsSource)) {
  fs.mkdirSync(assetsOut, { recursive: true });
  for (const file of fs.readdirSync(assetsSource)) {
    const src = path.join(assetsSource, file);
    const dst = path.join(assetsOut, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dst);
      console.log(`✅ assets/${file.padEnd(14)} copied (${(fs.statSync(src).size/1024).toFixed(1)}KB)`);
    }
  }
}

console.log(`\n총 ${HTML_FILES.length}개 파일 → standalone/ 출력 (${totalLines.toLocaleString()} lines)`);
