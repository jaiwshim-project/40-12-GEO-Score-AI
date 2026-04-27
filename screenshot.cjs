// Puppeteer 스크린샷 검증
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SHOTS_DIR = path.join(__dirname, 'assets', 'screenshots');
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

// Edge / Chrome 자동 탐지
function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  return candidates.find(p => fs.existsSync(p));
}

(async () => {
  const exec = findBrowser();
  if (!exec) {
    console.error('Chrome/Edge not found');
    process.exit(1);
  }
  console.log('Using browser:', exec);

  const browser = await puppeteer.launch({
    executablePath: exec,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const pages = [
    { name: 'index', url: 'http://127.0.0.1:8765/', wait: 1000 },
    { name: 'results', url: 'http://127.0.0.1:8765/results.html', wait: 4000, setup: async (page) => {
      await page.evaluateOnNewDocument(() => {
        sessionStorage.setItem('current_diagnosis', JSON.stringify({
          id: 'mock-test',
          companyName: '테스트치과',
          websiteUrl: 'https://example.com',
          industry: 'dental',
          domain: 'example.com',
          startedAt: Date.now()
        }));
      });
    }, urlSuffix: '?id=mock-test' },
    { name: 'dashboard', url: 'http://127.0.0.1:8765/dashboard.html', wait: 800 },
    { name: 'manual', url: 'http://127.0.0.1:8765/manual.html', wait: 600 },
    { name: 'architecture', url: 'http://127.0.0.1:8765/architecture.html', wait: 600 },
    { name: 'chatbot', url: 'http://127.0.0.1:8765/chatbot.html', wait: 800 },
    { name: 'admin', url: 'http://127.0.0.1:8765/admin.html', wait: 600 }
  ];

  const results = [];
  for (const cfg of pages) {
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => {
        if (m.type() === 'error') errors.push('[console.error] ' + m.text());
      });
      await page.setViewport({ width: 1440, height: 900 });
      if (cfg.setup) await cfg.setup(page);
      const targetUrl = cfg.url + (cfg.urlSuffix || '');
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });
      await new Promise(r => setTimeout(r, cfg.wait));

      const shotPath = path.join(SHOTS_DIR, `${cfg.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      const size = fs.statSync(shotPath).size;
      results.push({
        name: cfg.name,
        url: targetUrl,
        ok: true,
        size,
        errors: errors.slice(0, 5)
      });
      console.log(`✓ ${cfg.name}: ${(size / 1024).toFixed(1)} KB ${errors.length ? '(errors: ' + errors.length + ')' : ''}`);
      if (errors.length) errors.slice(0, 3).forEach(e => console.log('  -', e.slice(0, 200)));
      await page.close();
    } catch (e) {
      results.push({ name: cfg.name, ok: false, error: e.message });
      console.error(`✗ ${cfg.name}: ${e.message}`);
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(SHOTS_DIR, 'report.json'), JSON.stringify(results, null, 2));
  console.log('\nReport saved:', path.join(SHOTS_DIR, 'report.json'));
})();
