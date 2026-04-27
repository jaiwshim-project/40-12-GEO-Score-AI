// 로컬 정적 서버 (개발용)
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8765;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let pathname = decodeURIComponent(url.parse(req.url).pathname);
  if (pathname === '/') pathname = '/index.html';

  // /api/* 는 mock 응답
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (pathname === '/api/health') {
      res.end(JSON.stringify({
        status: 'ok',
        service: 'GEO Score AI',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        env: { hasGeminiKey: false, hasAdminPass: false, hasGeoAioUrl: false, node: process.version }
      }));
      return;
    }
    if (pathname === '/api/analyze') {
      // mock 진단 응답
      res.end(JSON.stringify({
        success: true,
        id: 'mock-' + Date.now(),
        companyName: '테스트 기업',
        websiteUrl: 'https://example.com',
        industry: 'dental',
        analyzedAt: new Date().toISOString(),
        totalScore: 42,
        grade: { key: 'weak', label: 'Weak' },
        scores: {
          visibility: { value: 35, reason: '메타 태그 일부 적용' },
          velocity: { value: 28, reason: '블로그 부재' },
          authority: { value: 50, reason: '저자 정보 일부 존재' },
          citation: { value: 22, reason: 'FAQ 부재' },
          engagement: { value: 45, reason: '리뷰 일부 존재' },
          conversion: { value: 38, reason: 'CTA 약함' },
          channel: { value: 55, reason: 'SNS 연동 일부' },
          brand: { value: 60, reason: '톤 일관성 양호' },
          competitive: { value: 32, reason: '경쟁사 대비 약세' },
          aio: { value: 25, reason: 'Schema.org 미적용' }
        },
        summary: {
          headline: '현재 귀사의 AI 인용 가능성은 22%입니다',
          diagnosis: '구조화 데이터와 FAQ가 부재해 AI가 답변에 인용하기 어려운 상태입니다. CTA 설계도 약해 트래픽이 와도 전환이 일어나지 않습니다.',
          topProblems: ['FAQ/Q&A 구조 부재', 'Schema.org 미적용', 'CTA 설계 약함'],
          opportunities: ['FAQ 50개 추가 시 AI 인용률 +80% 가능', '3개월 GEO-AIO 적용 시 노출 300% 증가'],
          recommendation: 'AI Growth 패키지 6개월 도입 시 70점 진입 가능합니다.',
          industryDetected: '치과'
        },
        competitors: [
          { label: '업계 평균', value: 45 },
          { label: '상위 10% 기업', value: 78 }
        ],
        meta: { usedGemini: false, siteFetchOk: true, contentLength: 2400 }
      }));
      return;
    }
    if (pathname === '/api/recommend') {
      res.end(JSON.stringify({
        success: true,
        priorityActions: [
          { rank: 1, kpiId: 'citation', score: 22, action: 'FAQ + Schema.org 적용', detail: 'FAQPage Schema, JSON-LD 마크업', impact: 'AI 인용률 +80%', cost: 'Quick Win' },
          { rank: 2, kpiId: 'aio', score: 25, action: 'AI 최적화 풀스택 구축', detail: 'GEO-AIO 인프라 도입', impact: 'AIO 100% 달성', cost: 'AI Dominance' },
          { rank: 3, kpiId: 'velocity', score: 28, action: '주 5회 콘텐츠 자동 발행', detail: '월 150건 자동 생성', impact: '+500%', cost: '월 구독' }
        ],
        packageTier: {
          name: 'AI Growth Package',
          price: '월 500만원 (초기 150만원)',
          duration: '6개월',
          reason: '위험 단계 - 핵심 KPI 우선 보강 필요',
          includes: ['월 80개 콘텐츠', 'FAQ + Schema 적용', '블로그+인스타 자동 배포']
        },
        expectedOutcome: { timeframe: '3개월', improvement: '+200% 노출', newScoreEstimate: 67 },
        cta: { primary: '🚀 GEO-AIO 시작', primaryUrl: 'https://geo-aio.vercel.app' }
      }));
      return;
    }
    if (pathname === '/api/chat') {
      res.end(JSON.stringify({
        success: true,
        reply: '[로컬 모드] Gemini 키가 없어 모의 응답을 드립니다. GEO-AIO 솔루션은 AI 시대 기업 마케팅의 표준 인프라입니다. 더 자세한 상담은 jaiwshim@gmail.com 으로 문의주세요.',
        usedGemini: false
      }));
      return;
    }
    if (pathname === '/api/derive-30') {
      // 간단 mock — 실제 파생 생성은 standalone-shim 또는 Vercel(Gemini 키 필요)
      const mockDerivatives = Array.from({ length: 30 }, (_, i) => ({
        rank: i + 1,
        category: ['비용/가격','절차/방법','비교/차이','장단점/주의사항','추천/선택','사후관리/보증'][i % 6],
        title: `[로컬 모드] 샘플 질문 ${i + 1}은 어떻게 답변되나요?`,
        body: `[로컬 모드] 이 답변은 dev-server에서 생성된 mock입니다. 실제 30개 파생은 GEMINI_API_KEY 설정 후 Vercel 또는 file:// 모드에서 생성됩니다.\n\n## 핵심\n- 샘플 항목 ${i + 1}\n- 카테고리: ${['비용/가격','절차/방법','비교/차이','장단점/주의사항','추천/선택','사후관리/보증'][i % 6]}\n\n지금 무료 상담 신청하기.`
      }));
      res.end(JSON.stringify({ success: true, brand: '[로컬 모드]', count: 30, derivatives: mockDerivatives, mock: true }));
      return;
    }
    if (pathname === '/api/rewrite-content') {
      res.end(JSON.stringify({
        success: true,
        rewritten: '[로컬 모드] 90점 글 mock — 실제 재작성은 GEMINI_API_KEY 설정 후 사용 가능합니다.\n\n## 디지털스마일치과는 무엇인가요?\n디지털스마일치과는 12년 경력의 보철과 전문의가 진행하는 검증된 임플란트 전문 치과입니다.\n\n## FAQ\n**Q. 비용?** A. 평균 80~150만원\n\n지금 카카오톡 @digitalsmile_dental 또는 02-1234-5678로 무료 상담 받으세요.',
        iterations: 1,
        finalScore: 90
      }));
      return;
    }
    if (pathname === '/api/citation-test') {
      res.end(JSON.stringify({
        success: true,
        brand: '[로컬 모드]',
        total: 10, citedCount: 7, citationRate: 0.7,
        generalRate: 0.6, brandedRate: 0.8,
        grade: { key: 'strong', label: 'Strong' },
        answers: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          type: i < 5 ? 'general' : 'branded',
          question: `[로컬 모드] 샘플 질문 ${i + 1}`,
          answer: `[로컬 모드] 답변 mock ${i + 1}`,
          cited: i % 3 !== 0,
          answerLength: 50
        }))
      }));
      return;
    }
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let filePath = path.join(ROOT, pathname);
  // path traversal 방지
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + pathname);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
