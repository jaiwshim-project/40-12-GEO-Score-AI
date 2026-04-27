/**
 * GEO Score AI - ai_writing 5신호 측정 단위 테스트
 *
 * 실행: node test/test-aiw-signals.cjs
 */

// detectSignals의 5신호 검출 로직 (실제 코드와 동일하게 유지)
function detect5Signals(content, companyName) {
  const aiwSrc = content || '';
  const cnShort = (companyName || '').slice(0, 5);

  const h2Md = (aiwSrc.match(/^##\s+(.+?)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
  const h2Html = [...aiwSrc.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h2List = [...h2Md, ...h2Html].filter(Boolean);
  const h2Count = h2List.length;

  // 1. 질문형 H2
  const qPattern = /\?|어떻게|왜|언제|무엇|어디|누가|어느|얼마|어떤|뭐가|할까|있나|좋을까/i;
  const questionH2Count = h2List.filter(h => qPattern.test(h)).length;
  const questionH2Rate = h2Count > 0 ? questionH2Count / h2Count : 0;

  // 2. 정의문 H2 (원칙 2) — "주어(3자+)는/은 ~ 이다/입니다" 패턴
  // 형용사 어미 (좋은, 큰 등) 오탐을 막기 위해 주어 길이 ≥ 3자 강제
  const isDefSent = (s) => {
    if (!s) return false;
    const t = s.trim();
    if (t.length < 10 || t.length > 250) return false;
    return /^([\w가-힣·]{3,30})(은|는|이란|란)\s+[\s\S]{5,}?(이다|입니다|니다|이며|이라\s*한다|이라고\s*한다)[\.\!\?]?\s*$/.test(t);
  };
  const aiwLines = aiwSrc.split('\n');
  const sectionFirstSents = [];
  for (let i = 0; i < aiwLines.length; i++) {
    if (/^##\s+/.test(aiwLines[i])) {
      for (let j = i + 1; j < aiwLines.length; j++) {
        const t = aiwLines[j].trim();
        if (!t) continue;
        if (/^[#>\-\*\d]/.test(t)) break;
        sectionFirstSents.push(t.split(/(?<=[\.\!\?])\s/)[0]);
        break;
      }
    }
  }
  const definitionH2Count = sectionFirstSents.filter(isDefSent).length;
  const definitionH2Rate = h2Count > 0 ? definitionH2Count / h2Count : 0;

  // 3. 브랜드 반복
  let brandSectionHits = 0;
  let totalBrandMentions = 0;
  if (cnShort && aiwSrc) {
    aiwSrc.split(/^##\s+/m).forEach(sec => { if (sec.includes(cnShort)) brandSectionHits++; });
    totalBrandMentions = (aiwSrc.match(new RegExp(cnShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  }
  const brandRepetitionRate = h2Count > 0
    ? brandSectionHits / Math.max(h2Count, 1)
    : (totalBrandMentions >= 3 ? 0.5 : 0);

  // 4. 외부 신호
  const extPatterns = [
    /에\s*따르면|에\s*의하면|인용|보도|발표|조사|논문|리뷰|후기|평점|⭐|★|recommend|만족도/i,
    />\s*["“'].{5,}|"[^"]{8,}"|【[^】]+】|<blockquote/i,
    /(KBS|MBC|SBS|JTBC|연합뉴스|한겨레|중앙일보|조선일보|뉴스|매체|언론|press|cite)/i
  ];
  const externalSignalRate = extPatterns.filter(re => re.test(aiwSrc)).length / extPatterns.length;

  // 5. CTA 도달
  const ctaP = /상담|예약|문의|신청|가입|구독|체험|무료|클릭|지금|버튼|시작|kakao|카카오|전화|이메일|tel|email/i;
  const ctaBlocks = [];
  for (let i = 0; i < aiwSrc.length; i += 800) ctaBlocks.push(aiwSrc.slice(i, i + 800));
  const ctaReachRate = ctaBlocks.length > 0 ? ctaBlocks.filter(b => ctaP.test(b)).length / ctaBlocks.length : 0;

  const toScale3 = (rate, target) => {
    if (rate >= target) return 3;
    if (rate >= target * 0.6) return 2;
    if (rate >= target * 0.3) return 1;
    return 0;
  };

  return {
    h2Count,
    questionH2Count, questionH2Rate, questionHeadings: toScale3(questionH2Rate, 0.5),
    definitionH2Count, definitionH2Rate, definitionH2: toScale3(definitionH2Rate, 0.5),
    brandRepetitionRate, brandRepetition: toScale3(brandRepetitionRate, 0.5),
    externalSignalRate, externalSignal: toScale3(externalSignalRate, 1/3),
    ctaReachRate, ctaReach: toScale3(ctaReachRate, 0.5)
  };
}

// ============== 테스트 케이스 ==============
const cases = [
  {
    name: '빈약한 글 (28자)',
    brand: '테스트치과',
    content: '우리 치과는 좋은 치과입니다. 임플란트도 합니다.',
    expected: { questionHeadings: 0, definitionH2: 0, brandRepetition: 0, externalSignal: 0, ctaReach: 0 }
  },
  {
    name: 'ai_writing 충실 글 (5 H2 모두 질문형, 정의문, 브랜드 반복, 후기/언론, CTA)',
    brand: '디지털스마일치과',
    content: `# 디지털스마일치과 (2026년)

## 디지털스마일치과의 임플란트 비용은 얼마인가요?
디지털스마일치과는 2014년 설립된 보철과 전문의 임플란트 전문 치과입니다. 평균 80~150만원, 무료 상담 가능.

## 임플란트는 어떻게 진행되나요?
디지털스마일치과의 임플란트는 4단계 프로세스이다. 1. 진단 2. 식립 3. 보철 4. 사후관리.

> "디지털스마일치과는 정말 친절했어요" — 박○○ ★★★★★ 4.9
KBS 보도, MBC 방송, 후기 만족도 4.9/5.0 (1200명).

## 다른 치과와 무엇이 다른가요?
디지털스마일치과는 12년 경력, 5200건 사례를 가진 곳이다. 지금 바로 무료 상담 받으세요.

## 어디서 예약하나요?
디지털스마일치과 카카오톡 채널은 @digitalsmile이다. 전화 02-1234-5678. 클릭으로 예약.

## FAQ는 무엇이 있나요?
디지털스마일치과 FAQ는 다음과 같습니다. **Q1. 비용?** A1. 80~150만원. **Q2. 기간?** A2. 3~6개월.`,
    expected: {
      questionHeadings: 3,    // 모두 질문형
      brandRepetition: 3,     // 모든 H2에 브랜드
      externalSignal: 3,      // 모두 만족
      ctaReach: 3,            // 모든 블록에 CTA
      // 정의문은 일부만 — 1~3 사이 허용
      definitionH2Min: 2
    }
  },
  {
    name: 'CTA만 있고 H2 없음 (구조 부재)',
    brand: 'X치과',
    content: '지금 무료 상담 신청하세요. 카카오톡으로 문의 주시면 빠르게 답변드립니다. 전화 02-1234-5678. ' .repeat(3),
    expected: { questionHeadings: 0, definitionH2: 0, ctaReach: 3 }
  },
  {
    name: 'H2만 있고 정의문 X',
    brand: 'Y치과',
    content: `# Y
## 첫 번째
좋은 곳입니다. ## 두 번째
또 좋습니다. ## 세 번째
계속 좋아요.`,
    expected: { questionHeadings: 0, definitionH2: 0 }
  }
];

// ============== 실행 ==============
let passed = 0, failed = 0;

cases.forEach((c, i) => {
  const s = detect5Signals(c.content, c.brand);
  console.log(`\n[${i + 1}] ${c.name}`);
  console.log(`  H2 ${s.h2Count} / 질문형 ${s.questionH2Count} / 정의문 ${s.definitionH2Count}`);
  console.log(`  스케일: 질문 ${s.questionHeadings} · 정의 ${s.definitionH2} · 브랜드 ${s.brandRepetition} · 외부 ${s.externalSignal} · CTA ${s.ctaReach}`);

  let ok = true;
  Object.entries(c.expected).forEach(([key, exp]) => {
    if (key.endsWith('Min')) {
      const actual = s[key.replace('Min', '')];
      if (actual < exp) { ok = false; console.log(`  ❌ ${key.replace('Min','')} 기대 ≥${exp}, 실제 ${actual}`); }
    } else {
      if (s[key] !== exp) { ok = false; console.log(`  ❌ ${key} 기대 ${exp}, 실제 ${s[key]}`); }
    }
  });
  if (ok) { console.log('  ✅ PASS'); passed++; } else { failed++; }
});

console.log(`\n=== 결과: ${passed} 통과 / ${failed} 실패 (총 ${cases.length} 케이스) ===`);
process.exit(failed > 0 ? 1 : 0);
