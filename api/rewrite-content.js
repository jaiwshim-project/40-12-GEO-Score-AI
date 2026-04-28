/**
 * GEO Score AI - 90점 글 자동 생성 API
 * 진단 결과 기반으로 부족 신호 보강 → Gemini 재작성 → 자가 검증 루프 (최대 3회)
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

function buildRewritePrompt({ companyName, industry, content, weakKPIs, targetScore, prevAttempt, cepScene }) {
  const weakList = weakKPIs.map(k => `- ${k.name} (현재 ${k.value}점, 사유: ${k.reason})`).join('\n');
  const prevNote = prevAttempt
    ? `\n\n# 이전 시도 결과\n${prevAttempt.score}점 (목표 ${targetScore}점 미달). 다음 KPI를 더 강하게 보강:\n${prevAttempt.stillWeak.join(', ')}`
    : '';
  const cepNote = cepScene
    ? `\n\n# 🎯 CEP 장면 (ai_writing 원칙 0 — 장면 점유)\n타겟 장면: "${cepScene}"\n→ 도입부와 적어도 2개 H2에서 이 "순간"을 명시적으로 언급하고, "${cepScene}"을 마주한 사용자가 ${companyName}을(를) 가장 먼저 떠올리도록 작성하세요.`
    : '';

  return `당신은 한국의 GEO/AIO(생성형 AI 검색 최적화) 전문 에디터입니다.

# 임무
입력된 원본 글을 ${targetScore}점 이상의 GEO Score를 받는 글로 재작성합니다.

# 컨텍스트
- 브랜드: ${companyName}
- 업종: ${industry || '자동 판단'}${cepNote}

# 원본 글
\`\`\`
${content.slice(0, 6000)}
\`\`\`

# 부족한 KPI (이 영역들을 명시적으로 보강해야 함)
${weakList}
${prevNote}

# ⭐ ai_writing 6원칙 (AI 인용을 위한 절대 원칙 — 모두 충족할 것)

## 원칙 0. CEP 장면 점유
- "사람"이 아니라 "순간(scene)"을 표적으로 기술. ("아침에 갑자기 ○○할 때" 같은 상황 명시)

## 원칙 1. 작성자 권위
- 도입부와 결론에 작성자/대표 정보를 별도 단락으로 명시 (이름·학력·경력 N년·자격증)

## 원칙 2. 정의문 (각 H2 첫 문장)
- 모든 H2 첫 문장은 "X는 ~이다" 형태의 정의문으로 시작 (LLM 추출 친화)

## 원칙 3. 구조화
- 번호 리스트(1. 2. 3.), 표(\\| --- \\|), Q:A: 페어, 명시적 수치(%, 원, 명, 건)

## 원칙 4. AI 인용 4신호 (반드시 충족 — KPI 4 직접 측정)
- **질문형 H2 ≥ 50%**: H2의 절반 이상이 "?"로 끝나거나 "어떻게/왜/언제/무엇/어디/어떤" 포함
- **브랜드 반복 ≥ 50%**: 각 H2 섹션에 브랜드명 ${companyName} 1회 이상 등장 (전체 H2의 50% 이상)
- **외부 신호 ≥ 30%**: 후기 인용(>" "), 언론 보도(KBS/MBC 등), "에 따르면" 인용 패턴
- **CTA 도달률 ≥ 50%**: 본문 800자 블록의 절반 이상에 상담/예약/문의/메신저/전화 등 CTA 키워드

## 원칙 5. 행동 유도 (CTA 솔루션)
- 각 H2 끝에 "핵심:" 한 줄 요약 + 결론에 "[X 문제]는 ${companyName}로 해결" 패턴

# 7단계 골격 (의무 — 모두 포함)

1. **도입부**: 브랜드 정의 + 핵심 가치 1~2문장
2. **H2 5~7개** (그 중 5개 이상 질문형으로)
3. **단계별 프로세스**: 번호 리스트 (1. 2. 3.)
4. **사례·수치**: 구체적 숫자 5개 이상 + Before/After
5. **FAQ Q1~Q5+**: 각 Q는 질문형, A는 정의문 시작
6. **결론 + CTA**: 메신저/전화/예약 3종 동시 노출
7. **비교 표 3열**: \`| 항목 | 업계 평균 | ${companyName} |\` 형식

# 분량 권장
- **표준 GEO 콘텐츠**: 1,800~2,200자 (절대 1,500자 미만 금지)

# 필수 보강 신호 체크리스트 (모두 포함할 것)

## ① E-E-A-T (전문성·경험·권위·신뢰)
- 저자 정보 블록 (이름, 학력, 경력 N년, 자격증/면허, 전문 분야)
- 직접 경험 사례 ("실제로 ~해본", "테스트 결과", "비교 측정")
- 외부 권위 신호 (언론 보도, 수상, 인증, 협력사)
- 신뢰 신호 (연락처, 이메일, 주소, 환불/보증 조항)

## ② AI 인용 가능성 (FAQ + Schema)
- "## 자주 묻는 질문 (FAQ)" 섹션 명시
- Q1~Q5와 A1~A5 형식의 5쌍 이상
- Schema.org JSON-LD 코드 블록 (FAQPage 타입)
- "<script type=\"application/ld+json\">" 코드 예시 포함

## ③ 전환 설계 (CTA)
- 명확한 행동 유도 3종 이상: 상담 / 예약 / 문의
- 메신저, 전화번호, 이메일 등 즉시 연결 채널 명시
- "지금 바로", "무료 상담" 등 행동 유도 언어

## ④ 사회적 증거 (Engagement)
- 고객 후기 3개 이상 + 평점/별점 표시 (★★★★★ 4.9/5.0)
- 만족도/추천 수치 (구체적 숫자)

## ⑤ 멀티채널 (Channel)
- 블로그, 인스타그램, 유튜브, 네이버블로그, 메신저 채널 중 3개 이상 링크/언급

## ⑥ 브랜드 일관성 (Brand)
- 브랜드명 ${companyName}을(를) 본문에서 3회 이상 자연스럽게 반복
- 미션/비전/가치/약속 메시지

## ⑦ 경쟁 차별화 (Competitive)
- "업계 평균 대비", "경쟁사와 다른 점" 등 비교 표현
- 차별화 포인트 명확히

## ⑧ 콘텐츠 양/구조
- 1,500자 이상 (가능하면 2,500자)
- 마크다운 헤딩 (#, ##, ###) 또는 번호 리스트
- 구체적 숫자 (5건 이상): 연도, 비율(%), 실적 건수, 가격
- 날짜 표기 (2024년, 2025.X 등)

# 출력 규칙
- 마크다운 형식 (헤딩, 리스트, 코드블록 활용)
- 자연스러운 한국어, 부자연스러운 키워드 나열 금지
- ${companyName}의 실제 정보를 모를 경우 합리적인 placeholder 사용 (예: "○○○ 원장", "20XX년", "[연락처]")
- 결과는 본문만, 메타 설명/주석 없이

이제 위 체크리스트를 모두 충족하는 ${targetScore}점 이상의 글을 작성하세요.`;
}

function detectSignalsServer(content, companyName) {
  // 클라이언트 standalone-shim과 동일한 신호 검출 로직 (검증용)
  const text = (content || '') + ' ' + (companyName || '');
  const len = (content || '').length;
  const count = arr => arr.filter(Boolean).length;

  // ============== ai_writing 4 측정 신호 ==============
  const aiwSrc = content || '';
  const cnShort = (companyName || '').slice(0, 5);
  const h2Md = (aiwSrc.match(/^##\s+(.+?)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
  const h2Html = [...aiwSrc.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h2List = [...h2Md, ...h2Html].filter(Boolean);
  const h2Count = h2List.length;

  const qPattern = /\?|어떻게|왜|언제|무엇|어디|누가|어느|얼마|어떤|뭐가|할까|있나|좋을까/i;
  const questionH2Count = h2List.filter(h => qPattern.test(h)).length;
  const questionH2Rate = h2Count > 0 ? questionH2Count / h2Count : 0;

  // 정의문 H2 (원칙 2) — 주어 ≥ 3자, 형용사 어미 오탐 방지
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
        const firstSent = t.split(/(?<=[\.\!\?])\s/)[0];
        sectionFirstSents.push(firstSent);
        break;
      }
    }
  }
  const definitionH2Count = sectionFirstSents.filter(isDefSent).length;
  const definitionH2Rate = h2Count > 0 ? definitionH2Count / h2Count : 0;

  let brandSectionHits = 0;
  if (cnShort && aiwSrc) {
    const sections = aiwSrc.split(/^##\s+/m);
    sections.forEach(sec => { if (sec.includes(cnShort)) brandSectionHits++; });
  }
  const totalBrandMentions = cnShort
    ? (aiwSrc.match(new RegExp(cnShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;
  const brandRepetitionRate = h2Count > 0
    ? brandSectionHits / Math.max(h2Count, 1)
    : (totalBrandMentions >= 3 ? 0.5 : 0);

  const extPatterns = [
    /에\s*따르면|에\s*의하면|인용|보도|발표|조사|논문|리뷰|후기|평점|⭐|★|recommend|만족도/i,
    />\s*["“'].{5,}|"[^"]{8,}"|【[^】]+】|<blockquote/i,
    /(KBS|MBC|SBS|JTBC|연합뉴스|한겨레|중앙일보|조선일보|뉴스|매체|언론|press|cite)/i
  ];
  const externalSignalHits = extPatterns.filter(re => re.test(aiwSrc)).length;
  const externalSignalRate = externalSignalHits / extPatterns.length;

  const ctaP = /상담|예약|문의|신청|가입|구독|체험|무료|클릭|지금|버튼|시작|전화|이메일|tel|email/i;
  const ctaBlocks = [];
  for (let i = 0; i < aiwSrc.length; i += 800) ctaBlocks.push(aiwSrc.slice(i, i + 800));
  const ctaReachHits = ctaBlocks.filter(b => ctaP.test(b)).length;
  const ctaReachRate = ctaBlocks.length > 0 ? ctaReachHits / ctaBlocks.length : 0;

  const toScale3 = (rate, target) => {
    if (rate >= target) return 3;
    if (rate >= target * 0.6) return 2;
    if (rate >= target * 0.3) return 1;
    return 0;
  };

  return {
    expert: count([
      /전문가|박사|전문의|교수|상담사|디자이너|마케터|개발자|엔지니어|작가|컨설턴트/i.test(text),
      /\d+\s*년\s*(경력|경험|운영|진료)|since\s*\d{4}|설립\s*\d{4}|개원\s*\d{4}/i.test(text),
      /자격증|인증|certifi|면허|licen|학위|degree/i.test(text),
      /(논문|특허|등록|published|patent)/i.test(text)
    ]),
    experience: count([
      /(사례|case\s*study|실제|성공\s*사례|실적|portfolio|작품|프로젝트)/i.test(text),
      /(직접\s*경험|실제로\s*해보|체험|사용해\s*본)/i.test(text),
      /(테스트|시험|실험|비교|측정|결과)/i.test(text)
    ]),
    authority: count([
      /(언론|뉴스|보도|매체|방송|기사|보도자료|press)/i.test(text),
      /(수상|선정|1\s*위|top|best|award)/i.test(text),
      /(고객사|클라이언트|client|partner|파트너사|협력사)/i.test(text)
    ]),
    trust: count([
      /(연락처|tel|전화|이메일|email|주소|위치|address)/i.test(text),
      /(개인정보|privacy|약관|terms|환불|refund|보증|guarantee)/i.test(text),
      /(리뷰|후기|평점|별점|고객\s*후기|review|rating|만족도)/i.test(text)
    ]),
    faq: count([
      /FAQ|Q\s*&\s*A|자주\s*묻는|자주\s*하는\s*질문/i.test(text),
      /(Q\.|Q\s*:|질문\s*:|Q\d+|문\s*:)/i.test(text),
      /(A\.|A\s*:|답변\s*:|답\s*:|A\d+)/i.test(text),
      (text.match(/Q\d?[\.:]/gi) || []).length >= 3
    ]),
    schema: count([
      /application\/ld\+json|JSON[\s-]?LD|schema\.org|FAQPage|microdata|itemtype/i.test(text),
      /<\/?(article|section|nav|aside|header|footer|main)/i.test(text)
    ]),
    cta: count([
      /(상담|예약|문의|신청|가입|구독|시작|체험|무료|상담\s*받기)/i.test(text),
      /(클릭|버튼|button|cta|행동|지금\s*바로|today)/i.test(text),
      /(전화|tel|message|메시지)/i.test(text)
    ]),
    review: count([
      /(리뷰|후기|평점|별점|만족도|recommend|추천\s*해|좋아요|like)/i.test(text),
      /\d+\s*점|\d+\.\d+\s*\/\s*\d+|★|⭐|\d+\s*명/i.test(text)
    ]),
    channel: count([
      /(blog|블로그|news|소식|매거진)/i.test(text),
      /(instagram|facebook|youtube|twitter|linkedin|naver|tiktok)/i.test(text)
    ]),
    brand: count([
      companyName && (text.match(new RegExp(companyName.slice(0, 5), 'gi')) || []).length >= 2,
      /(브랜드|brand|미션|vision|비전|철학|약속|가치|차별)/i.test(text),
      /(슬로건|slogan|모토|motto|tagline)/i.test(text)
    ]),
    competitive: count([
      /(비교|vs\.?|compare|대비|차이|선두|업계\s*최고|시장\s*점유율)/i.test(text),
      /(경쟁사|competitor|alternative|타사)/i.test(text)
    ]),
    contentLength: len,

    // ai_writing 5 신호
    h2Count,
    questionH2Count,
    questionH2Rate,
    definitionH2Count,
    definitionH2Rate,
    brandSectionHits,
    totalBrandMentions,
    brandRepetitionRate,
    externalSignalHits,
    externalSignalRate,
    ctaReachHits,
    ctaBlockCount: ctaBlocks.length,
    ctaReachRate,
    questionHeadings: toScale3(questionH2Rate, 0.5),
    definitionH2:     toScale3(definitionH2Rate, 0.5),
    brandRepetition:  toScale3(brandRepetitionRate, 0.5),
    externalSignal:   toScale3(externalSignalRate, 1/3),
    ctaReach:         toScale3(ctaReachRate, 0.5)
  };
}

function quickScore(signals) {
  // 빠른 합산 (실제 detail은 클라이언트에서 다시 계산되지만 여기선 90점 검증용)
  const eeat = signals.expert * 7 + signals.experience * 6 + signals.authority * 5 + signals.trust * 4;
  const cite = signals.faq * 7 + signals.schema * 9;
  const conv = signals.cta * 13;
  const eng = signals.review * 12;
  const ch = signals.channel * 14;
  const br = signals.brand * 10;
  const comp = signals.competitive * 12;
  // ai_writing 5 신호 (각 0~3 → citation 가산)
  const aiw = (signals.questionHeadings || 0) * 2.5
            + (signals.definitionH2     || 0) * 2.5
            + (signals.brandRepetition  || 0) * 2.5
            + (signals.externalSignal   || 0) * 2.5
            + (signals.ctaReach         || 0) * 2.5;

  // 각 KPI별 대략 점수 (검증용)
  const visibility = Math.min(95, 30 + (signals.contentLength > 1500 ? 15 : 5));
  const velocity = Math.min(95, 30 + signals.channel * 12);
  const authority = Math.min(95, 25 + eeat);
  const citation = Math.min(95, 18 + cite + aiw + 6);
  const engagement = Math.min(95, 30 + eng);
  const conversion = Math.min(95, 28 + conv);
  const channel = Math.min(95, 30 + ch);
  const brand = Math.min(95, 35 + br);
  const competitive = Math.min(95, 35 + comp);
  const aio = Math.min(95, 22 + signals.schema * 14 + signals.faq * 6 + 10);

  const all = [visibility, velocity, authority, citation, engagement, conversion, channel, brand, competitive, aio];
  return {
    total: Math.round(all.reduce((a, b) => a + b, 0) / 10),
    perKpi: { visibility, velocity, authority, citation, engagement, conversion, channel, brand, competitive, aio }
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // 한글 인코딩 처리
    ['companyName', 'content'].forEach(field => {
      if (body[field] && /[^\x00-\x7F]/.test(body[field])) {
        try {
          const r = Buffer.from(body[field], 'latin1').toString('utf8');
          if (!r.includes('�')) body[field] = r;
        } catch (e) {}
      }
    });

    const { companyName, industry, content, cepScene, currentScores, currentTotal, targetScore = 90 } = body;

    if (!companyName || !content) {
      return res.status(400).json({ error: 'companyName과 content 필요' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 미설정 — standalone-shim mock 사용' });
    }

    // 부족 KPI 추출
    const KPI_NAMES = {
      visibility: '검색 가시성', velocity: '콘텐츠 생산력', authority: 'E-E-A-T 신뢰도',
      citation: 'AI 인용 가능성', engagement: '고객 참여도', conversion: '전환 설계',
      channel: '채널 확장', brand: '브랜드 일관성', competitive: '경쟁 점유율', aio: 'AI 최적화 준비도'
    };
    const weakKPIs = currentScores
      ? Object.entries(currentScores)
          .filter(([k, s]) => (s.value || 0) < 70)
          .map(([k, s]) => ({ id: k, name: KPI_NAMES[k] || k, value: s.value || 0, reason: s.reason || '' }))
          .sort((a, b) => a.value - b.value)
      : [];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    });

    let rewritten = '';
    let prevAttempt = null;
    let iterations = 0;
    const MAX_ITER = 3;

    for (let i = 0; i < MAX_ITER; i++) {
      iterations++;
      const prompt = buildRewritePrompt({ companyName, industry, content, weakKPIs, targetScore, prevAttempt, cepScene });
      const result = await model.generateContent(prompt);
      rewritten = result.response.text().trim();

      // 검증
      const signals = detectSignalsServer(rewritten, companyName);
      const score = quickScore(signals);

      console.log(`[rewrite] 시도 ${i + 1}: ${score.total}점`);

      if (score.total >= targetScore) {
        return res.status(200).json({
          success: true, rewritten, iterations,
          finalScore: score.total, signals
        });
      }

      // 90점 미달 시 부족 KPI를 보강 요청에 추가
      const stillWeak = Object.entries(score.perKpi)
        .filter(([k, v]) => v < 75)
        .map(([k]) => KPI_NAMES[k] || k);
      prevAttempt = { score: score.total, stillWeak };
    }

    // 3회 시도 후 최종 결과 반환 (목표 미달이라도)
    return res.status(200).json({
      success: true, rewritten, iterations,
      warning: `${MAX_ITER}회 시도 후에도 ${targetScore}점 미달. 입력 콘텐츠가 너무 짧거나 정보가 부족할 수 있습니다.`
    });
  } catch (e) {
    console.error('[rewrite-content]', e);
    return res.status(500).json({ error: e.message });
  }
}
