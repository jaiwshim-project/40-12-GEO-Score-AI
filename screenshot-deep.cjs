// 심층 검증: 관리자 로그인 후 + dashboard에 데이터 주입 후 캡처
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SHOTS_DIR = path.join(__dirname, 'assets', 'screenshots');

function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  return candidates.find(p => fs.existsSync(p));
}

const MOCK_HISTORY = [
  {
    id: 'h1', companyName: '디지털스마일치과', websiteUrl: 'https://example-dental.com',
    industry: '치과', totalScore: 38, grade: { key: 'weak', label: 'Weak' },
    summary: { headline: 'AI 인용 가능성은 18%입니다' },
    scores: {
      visibility: { value: 32 }, velocity: { value: 28 }, authority: { value: 45 },
      citation: { value: 22 }, engagement: { value: 40 }, conversion: { value: 35 },
      channel: { value: 50 }, brand: { value: 55 }, competitive: { value: 30 }, aio: { value: 25 }
    },
    savedAt: Date.now() - 86400000
  },
  {
    id: 'h2', companyName: '서울미소치과', websiteUrl: 'https://example-smile.com',
    industry: '치과', totalScore: 72, grade: { key: 'strong', label: 'Strong' },
    summary: { headline: 'AI 인용 가능성은 68%입니다' },
    scores: {
      visibility: { value: 78 }, velocity: { value: 70 }, authority: { value: 75 },
      citation: { value: 68 }, engagement: { value: 72 }, conversion: { value: 70 },
      channel: { value: 75 }, brand: { value: 80 }, competitive: { value: 65 }, aio: { value: 67 }
    },
    savedAt: Date.now() - 3600000
  },
  {
    id: 'h3', companyName: 'AI클리닉', websiteUrl: 'https://ai-clinic.com',
    industry: '병원', totalScore: 58, grade: { key: 'growing', label: 'Growing' },
    summary: { headline: 'AI 인용 가능성은 45%입니다' },
    scores: {
      visibility: { value: 60 }, velocity: { value: 55 }, authority: { value: 62 },
      citation: { value: 50 }, engagement: { value: 58 }, conversion: { value: 55 },
      channel: { value: 60 }, brand: { value: 65 }, competitive: { value: 52 }, aio: { value: 58 }
    },
    savedAt: Date.now() - 600000
  }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    args: ['--no-sandbox']
  });

  const errors = [];

  // 1) 대시보드 - 데이터 주입 후
  {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push('[dashboard] ' + e.message));
    await page.evaluateOnNewDocument((mock) => {
      localStorage.setItem('geo_score_history', JSON.stringify(mock));
    }, MOCK_HISTORY);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8765/dashboard.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SHOTS_DIR, 'dashboard-with-data.png'), fullPage: true });
    console.log('✓ dashboard-with-data');
    await page.close();
  }

  // 2) 관리자 - 로그인 + 데이터 주입
  {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push('[admin] ' + e.message));
    await page.evaluateOnNewDocument((mock) => {
      localStorage.setItem('geo_score_history', JSON.stringify(mock));
      sessionStorage.setItem('geo_admin_session', String(Date.now()));
    }, MOCK_HISTORY);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8765/admin.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SHOTS_DIR, 'admin-loggedin.png'), fullPage: true });
    console.log('✓ admin-loggedin');
    await page.close();
  }

  // 3) 모바일 사이즈 - index
  {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push('[mobile-index] ' + e.message));
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://127.0.0.1:8765/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SHOTS_DIR, 'mobile-index.png'), fullPage: true });
    console.log('✓ mobile-index');
    await page.close();
  }

  // 4) results 탭 전환 - KPI 상세
  {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push('[results-kpi] ' + e.message));
    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('current_diagnosis', JSON.stringify({
        id: 'mock-test', companyName: '테스트치과',
        websiteUrl: 'https://example.com', industry: 'dental',
        domain: 'example.com', startedAt: Date.now()
      }));
    });
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:8765/results.html?id=mock-test', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 4500));
    // 솔루션 탭 클릭
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.tab')].find(b => b.dataset.tab === 'solution');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SHOTS_DIR, 'results-solution-tab.png'), fullPage: true });
    console.log('✓ results-solution-tab');
    await page.close();
  }

  await browser.close();
  if (errors.length) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(' -', e));
  } else {
    console.log('\n✓ No errors detected');
  }
})();
