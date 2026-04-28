/**
 * GEO Score AI - Standalone Mock Shim
 *
 * file:// 프로토콜에서 동작 시 백엔드 API 대신 클라이언트 측 mock 응답을 반환.
 * api/analyze.js, api/recommend.js의 fallback 로직을 포팅.
 * http(s)://에서는 비활성화되어 원본 API를 그대로 호출.
 */
(function() {
  // file:// 프로토콜이 아니면 shim 비활성화
  if (location.protocol !== 'file:') return;

  console.log('[standalone-shim] file:// 감지 — API mock 활성화');

  const KPI_LIST = [
    { id: 'botAccess' },
    { id: 'sitemapStatus' },
    { id: 'indexExposure' },
    { id: 'structuredData' },
    { id: 'pageInfo' },
    { id: 'contentDepth' },
    { id: 'externalAuthority' },
    { id: 'eeat' },
    { id: 'aiCitation' },
    { id: 'cepScene' }
  ];

  // 새 KPI 가중치 (kpi-config.js와 동일, 합 100)
  const KPI_WEIGHTS = {
    botAccess: 14, sitemapStatus: 10, indexExposure: 13, structuredData: 12,
    pageInfo: 8, contentDepth: 10, externalAuthority: 9, eeat: 8,
    aiCitation: 10, cepScene: 6
  };

  // 문자열 기반 결정적 의사난수 (companyName + URL이 같으면 같은 점수)
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seedRandom(seed) {
    let s = seed;
    return function() {
      s = Math.imul(s ^ (s >>> 15), 2246822519);
      s = Math.imul(s ^ (s >>> 13), 3266489917);
      return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
    };
  }

  function detectIndustry({ companyName, websiteUrl }) {
    const text = ((companyName || '') + ' ' + (websiteUrl || '')).toLowerCase();
    if (/dental|치과|덴탈|smile|tooth|orthodonti|implant|치아|치주/i.test(text)) return 'dental';
    if (/hospital|병원|의원|clinic|medical|health|보건|약국/i.test(text)) return 'hospital';
    if (/legal|law|변호사|세무|회계|account|tax|법무/i.test(text)) return 'legal';
    if (/edu|학원|아카데미|academy|school|tutor|education|강의|튜터|코딩/i.test(text)) return 'education';
    if (/beauty|미용|뷰티|hair|nail|salon|spa|skin|피부/i.test(text)) return 'beauty';
    if (/restaurant|cafe|음식|카페|food|kitchen|bakery|레스토랑|맛집/i.test(text)) return 'restaurant';
    if (/shop|store|mart|쇼핑|판매|마켓|커머스|commerce|retail/i.test(text)) return 'retail';
    if (/b2b|제조|manufactur|factory|공장|industrial|enterprise/i.test(text)) return 'b2b';
    return 'other';
  }

  // 입력 콘텐츠에서 GEO 관련 신호를 실제로 검출
  function detectSignals(content, companyName) {
    const text = (content || '') + ' ' + (companyName || '');
    const len = (content || '').length;
    const lower = text.toLowerCase();

    // E-E-A-T 신호
    const expertSignals = [
      /전문가|박사|전문의|교수|상담사|디자이너|마케터|개발자|엔지니어|작가|컨설턴트/i.test(text),
      /\d+\s*년\s*(경력|경험|운영|진료)|since\s*\d{4}|설립\s*\d{4}|개원\s*\d{4}/i.test(text),
      /자격증|인증|certifi|면허|licen|학위|degree/i.test(text),
      /(논문|특허|등록|published|patent)/i.test(text)
    ];
    const experienceSignals = [
      /(사례|case\s*study|case\sstudy|실제|성공\s*사례|실적|portfolio|작품|프로젝트)/i.test(text),
      /(직접\s*경험|실제로\s*해보|체험|사용해\s*본|먹어\s*본|입어\s*본|타본)/i.test(text),
      /(테스트|시험|실험|비교|측정|결과)/i.test(text)
    ];
    const authoritySignals = [
      /(언론|뉴스|보도|매체|방송|기사|보도자료|press)/i.test(text),
      /(수상|선정|1\s*위|top|best|award)/i.test(text),
      /(고객사|클라이언트|client|partner|파트너사|협력사)/i.test(text)
    ];
    const trustSignals = [
      /(연락처|tel|전화|이메일|email|주소|위치|address|찾아\s*오는|오시는\s*길)/i.test(text),
      /(개인정보|privacy|약관|terms|환불|refund|보증|guarantee|warranty)/i.test(text),
      /(리뷰|후기|평점|별점|고객\s*후기|review|rating|만족도)/i.test(text)
    ];

    // 구조 신호
    const faqSignals = [
      /FAQ|Q\s*&\s*A|자주\s*묻는|자주\s*하는\s*질문|문의\s*사항/i.test(text),
      /(Q\.|Q\s*:|질문\s*:|Q\d+|문\s*:|문의\s*:)/i.test(text),
      /(A\.|A\s*:|답변\s*:|답\s*:|A\d+)/i.test(text),
      // Q-A 페어가 3쌍 이상 반복되는지
      (text.match(/Q\d?[\.:]/gi) || []).length >= 3
    ];
    const schemaSignals = [
      /application\/ld\+json|JSON[\s-]?LD|schema\.org|FAQPage|microdata|itemtype/i.test(text),
      /<\/?(article|section|nav|aside|header|footer|main)/i.test(text)
    ];
    const headingSignals = [
      /^#{1,3}\s/gm.test(text) || (text.match(/<h[1-6][^>]*>/gi) || []).length >= 2,
      // 마크다운 또는 명확한 섹션 구분
      (text.match(/^#{1,3}\s/gm) || []).length >= 3 ||
      (text.match(/^\s*[•\-\*]\s/gm) || []).length >= 3 ||
      /\d+\.\s/g.test(text)
    ];

    // 비즈니스 신호
    const ctaSignals = [
      /(상담|예약|문의|신청|가입|구독|시작|체험|무료|상담\s*받기|예약\s*하기|문의\s*하기)/i.test(text),
      /(클릭|버튼|button|cta|행동|지금\s*바로|today)/i.test(text),
      /(전화|tel|message|메시지)/i.test(text)
    ];
    const reviewSignals = [
      /(리뷰|후기|평점|별점|만족도|recommend|추천\s*해|좋아요|like)/i.test(text),
      /\d+\s*점|\d+\.\d+\s*\/\s*\d+|★|⭐|\d+\s*명/i.test(text)
    ];
    const channelSignals = [
      /(blog|블로그|news|소식|매거진|magazine|publication)/i.test(text),
      /(instagram|facebook|youtube|twitter|linkedin|naver|tiktok|쇼츠|reels)/i.test(text)
    ];
    const brandSignals = [
      // companyName이 텍스트에서 3번 이상 등장
      companyName && (text.match(new RegExp(companyName.slice(0, 5), 'gi')) || []).length >= 2,
      /(브랜드|brand|미션|vision|비전|철학|약속|가치|특별한|차별)/i.test(text),
      /(슬로건|slogan|모토|motto|tagline)/i.test(text)
    ];
    const competitiveSignals = [
      /(비교|vs\.?|compare|대비|differ|차이|선두|업계\s*최고|시장\s*점유율|market\s*share)/i.test(text),
      /(경쟁사|competitor|alternative|타사|other\s*brand)/i.test(text)
    ];

    // 콘텐츠 양/품질
    const contentDepth = {
      lengthOK: len >= 500,
      lengthGood: len >= 1500,
      lengthExcellent: len >= 3000,
      hasNumbers: (text.match(/\d+\s*(%|원|명|개|건|점|배|위)/g) || []).length >= 3,
      hasDates: /\d{4}[년\.\-\/]|\d{1,2}월\s*\d{1,2}일/.test(text),
      hasLists: (text.match(/^\s*[•\-\*]|^\s*\d+\./gm) || []).length >= 3
    };

    // ============== ai_writing 4 측정 신호 (KPI 4 AI 인용 가능성) ==============
    // 출처: ai_writing.md — 측정 4신호 (브랜드 반복 / 질문형 H2 / 외부 신호 / CTA 도달률)
    const aiwSrc = content || '';
    const cnShort = (companyName || '').slice(0, 5);

    // H2 추출 (마크다운 ## 또는 HTML <h2>)
    const h2Md = (aiwSrc.match(/^##\s+(.+?)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
    const h2Html = [...aiwSrc.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    const h2List = [...h2Md, ...h2Html].filter(Boolean);
    const h2Count = h2List.length;

    // 1. 질문형 H2 비율 (ai_writing 4-1, 목표 ≥50%)
    const qPattern = /\?|어떻게|왜|언제|무엇|어디|누가|어느|얼마|어떤|뭐가|할까|있나|좋을까/i;
    const questionH2Count = h2List.filter(h => qPattern.test(h)).length;
    const questionH2Rate = h2Count > 0 ? questionH2Count / h2Count : 0;

    // 1-b. 정의문 H2 비율 (ai_writing 원칙 2 — H2 첫 문장이 "X는 ~이다" 형태, 목표 ≥50%)
    // 형용사 어미 (좋은, 큰 등) 오탐 방지: 주어 길이 ≥ 3자 강제
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
          if (/^[#>\-\*\d]/.test(t)) break; // 다음 헤딩/리스트면 중단
          const firstSent = t.split(/(?<=[\.\!\?])\s/)[0];
          sectionFirstSents.push(firstSent);
          break;
        }
      }
    }
    const definitionH2Count = sectionFirstSents.filter(isDefSent).length;
    const definitionH2Rate = h2Count > 0 ? definitionH2Count / h2Count : 0;

    // 2. 브랜드 반복 비율 (ai_writing 4-2, 목표 ≥50%)
    // H2 섹션 중 브랜드명이 본문에 등장하는 비율
    let brandSectionHits = 0;
    let totalBrandMentions = 0;
    if (cnShort && aiwSrc) {
      const sections = aiwSrc.split(/^##\s+/m);
      sections.forEach(sec => {
        if (sec.includes(cnShort)) brandSectionHits++;
      });
      totalBrandMentions = (aiwSrc.match(new RegExp(cnShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    }
    const brandRepetitionRate = h2Count > 0
      ? brandSectionHits / Math.max(h2Count, 1)
      : (totalBrandMentions >= 3 ? 0.5 : 0);

    // 3. 외부 신호 비율 (ai_writing 4-4, 목표 ≥30%)
    // 후기·인용·언론·출처 패턴 3종 중 충족 개수
    const extPatterns = [
      /에\s*따르면|에\s*의하면|인용|보도|발표|조사|논문|리뷰|후기|평점|⭐|★|recommend|만족도/i,
      />\s*["“'].{5,}|"[^"]{8,}"|【[^】]+】|<blockquote/i,
      /(KBS|MBC|SBS|JTBC|연합뉴스|한겨레|중앙일보|조선일보|뉴스|매체|언론|press|cite)/i
    ];
    const externalSignalHits = extPatterns.filter(re => re.test(aiwSrc)).length;
    const externalSignalRate = externalSignalHits / extPatterns.length;

    // 4. CTA 도달률 (ai_writing 5-2, 목표 ≥50%)
    // 본문을 ~800자 블록으로 나눠 각 블록에 CTA 신호가 있는지
    const ctaP = /상담|예약|문의|신청|가입|구독|체험|무료|클릭|지금|버튼|시작|전화|이메일|tel|email/i;
    const ctaBlocks = [];
    if (aiwSrc.length > 0) {
      for (let i = 0; i < aiwSrc.length; i += 800) {
        ctaBlocks.push(aiwSrc.slice(i, i + 800));
      }
    }
    const ctaReachHits = ctaBlocks.filter(b => ctaP.test(b)).length;
    const ctaReachRate = ctaBlocks.length > 0 ? ctaReachHits / ctaBlocks.length : 0;

    // 0~3 스케일 변환 (목표값 도달 시 만점 3)
    const toScale3 = (rate, target) => {
      if (rate >= target) return 3;
      if (rate >= target * 0.6) return 2;
      if (rate >= target * 0.3) return 1;
      return 0;
    };

    // 신호 수 집계
    const count = arr => arr.filter(Boolean).length;

    return {
      // E-E-A-T
      expert: count(expertSignals),         // 0~4
      experience: count(experienceSignals), // 0~3
      authority: count(authoritySignals),   // 0~3
      trust: count(trustSignals),           // 0~3

      // 구조
      faq: count(faqSignals),               // 0~4
      schema: count(schemaSignals),         // 0~2
      heading: count(headingSignals),       // 0~2

      // 비즈니스
      cta: count(ctaSignals),               // 0~3
      review: count(reviewSignals),         // 0~2
      channel: count(channelSignals),       // 0~2
      brand: count(brandSignals),           // 0~3
      competitive: count(competitiveSignals),// 0~2

      // 콘텐츠
      lengthOK: contentDepth.lengthOK,
      lengthGood: contentDepth.lengthGood,
      lengthExcellent: contentDepth.lengthExcellent,
      hasNumbers: contentDepth.hasNumbers,
      hasDates: contentDepth.hasDates,
      hasLists: contentDepth.hasLists,
      contentLength: len,

      // ai_writing 측정 신호 (KPI 4 보강용)
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
      // 0~3 스케일
      questionHeadings: toScale3(questionH2Rate, 0.5),
      definitionH2:     toScale3(definitionH2Rate, 0.5),
      brandRepetition:  toScale3(brandRepetitionRate, 0.5),
      externalSignal:   toScale3(externalSignalRate, 1/3),
      ctaReach:         toScale3(ctaReachRate, 0.5)
    };
  }

  // 신호 → 점수 변환 + 사유 메시지 (새 10 KPI 체계)
  function scoreFromSignals(signals, mode) {
    const cap = (v, max = 95) => Math.max(5, Math.min(max, Math.round(v)));
    const s = signals;

    const scores = {};

    // 1. botAccess (AI 봇 접근): 콘텐츠 모드에서는 직접 측정 불가 → 휴리스틱 기본값
    //    Schema/FAQ가 있으면 봇 친화적 사이트로 추정. 콘텐츠가 풍부하면 가산.
    {
      let v = 55; // 일반 사이트는 대부분 봇 접근 허용
      v += s.schema * 8;               // 0~16 (구조화가 있으면 봇 친화적)
      v += s.lengthGood ? 8 : 0;
      v += s.heading * 3;              // 0~6
      v += s.faq >= 2 ? 6 : 0;
      const reason = s.schema >= 1
        ? 'GPTBot·ClaudeBot·PerplexityBot 등 주요 AI 봇이 접근 가능한 구조로 추정됩니다.'
        : 'AI 봇 접근 여부를 robots.txt·헤더에서 직접 확인하고 허용 설정을 점검하세요.';
      scores.botAccess = { value: cap(v), reason };
    }

    // 2. sitemapStatus (Sitemap 상태): 콘텐츠 양·헤딩으로 페이지 규모 추정
    {
      let v = 40;
      v += s.heading * 6;                                                    // 0~12
      v += s.lengthExcellent ? 24 : (s.lengthGood ? 14 : (s.lengthOK ? 6 : 0));
      v += s.channel * 6;                                                    // 0~12 (블로그/뉴스 채널 → URL 풍부 추정)
      v += s.hasDates ? 6 : 0;
      const reason = s.lengthGood && s.channel >= 1
        ? 'sitemap.xml에 다수 URL이 등록될 만큼 콘텐츠 자산이 누적되어 있습니다.'
        : 'sitemap.xml 정상 동작과 URL 등록 수를 점검하세요. 블로그·소식 채널 누적이 필요합니다.';
      scores.sitemapStatus = { value: cap(v), reason };
    }

    // 3. indexExposure (검색 색인): 헤딩 + 콘텐츠 + 숫자/리스트 → 색인 가능 페이지 추정
    {
      let v = 25;
      v += s.heading * 18;                                                   // 0~36
      v += s.lengthExcellent ? 22 : (s.lengthGood ? 14 : (s.lengthOK ? 6 : 0));
      v += s.hasNumbers ? 12 : 0;
      v += s.hasLists ? 10 : 0;
      const reason = s.heading >= 2 && s.lengthGood
        ? '제목 구조와 본문이 갖춰져 구글·네이버 색인 기반은 양호합니다.'
        : '색인 대상 페이지·헤딩 구조·본문 길이 중 보강 필요한 영역이 있습니다.';
      scores.indexExposure = { value: cap(v), reason };
    }

    // 4. structuredData (구조화 데이터): Schema + FAQ + 헤딩 + 리스트
    {
      let v = 22;
      v += s.schema * 18;        // 0~36
      v += s.faq * 8;            // 0~32
      v += s.heading * 4;        // 0~8
      v += s.hasLists ? 6 : 0;
      const reason = s.schema >= 1 && s.faq >= 2
        ? 'Schema.org JSON-LD + FAQPage 마크업이 적용되어 AI 학습 친화적입니다.'
        : 'Schema.org JSON-LD·FAQPage·Organization 마크업이 부족합니다.';
      scores.structuredData = { value: cap(v), reason };
    }

    // 5. pageInfo (페이지 메타): 헤딩 + 본문 + 신뢰 정보(연락처/주소)
    {
      let v = 30;
      v += s.heading * 14;                                                   // 0~28
      v += s.trust * 6;                                                      // 0~18
      v += s.lengthGood ? 12 : (s.lengthOK ? 6 : 0);
      v += s.hasLists ? 6 : 0;
      const reason = s.heading >= 2 && s.trust >= 2
        ? '메타 태그·H1/H2·연락처 등 페이지 정보가 충실합니다.'
        : '메타 태그·canonical·OG·H1/H2 완비도를 보강해야 합니다.';
      scores.pageInfo = { value: cap(v), reason };
    }

    // 6. contentDepth (콘텐츠 깊이): 본문 양 + 채널 + 날짜 + 숫자/리스트
    {
      let v = 22;
      v += s.lengthExcellent ? 26 : (s.lengthGood ? 16 : (s.lengthOK ? 8 : 0));
      v += s.channel * 12;                                                   // 0~24
      v += s.hasDates ? 14 : 0;
      v += s.hasNumbers ? 6 : 0;
      v += s.hasLists ? 4 : 0;
      const reason = s.lengthGood && s.channel >= 1 && s.hasDates
        ? '블로그/소식 채널과 충분한 본문, 날짜 표기로 콘텐츠 깊이가 풍부합니다.'
        : '본문 깊이·발행 빈도·최신성 중 보강 필요 영역이 있습니다.';
      scores.contentDepth = { value: cap(v), reason };
    }

    // 7. externalAuthority (외부 권위): authority 신호 + review + 신뢰
    {
      let v = 28;
      v += s.authority * 9;       // 0~27 (언론·수상·고객사)
      v += s.review * 8;          // 0~16
      v += s.trust * 5;           // 0~15
      v += s.competitive >= 1 ? 6 : 0;
      const reason = s.authority >= 2
        ? '언론 보도·수상·외부 언급 등 외부 권위 신호가 잘 노출되어 있습니다.'
        : '언론 보도·외부 백링크·외부 언급이 부족해 외부 권위가 약합니다.';
      scores.externalAuthority = { value: cap(v), reason };
    }

    // 8. eeat (E-E-A-T 신호): 전문성 + 경험 + 권위 + 신뢰
    {
      let v = 25;
      v += s.expert * 7;        // 0~28
      v += s.experience * 6;    // 0~18
      v += s.authority * 5;     // 0~15
      v += s.trust * 4;         // 0~12
      const totalEEAT = s.expert + s.experience + s.authority + s.trust;
      const reason = totalEEAT >= 8
        ? `E-E-A-T 신호가 충분합니다 (전문성 ${s.expert}, 경험 ${s.experience}, 권위 ${s.authority}, 신뢰 ${s.trust}).`
        : totalEEAT >= 4
          ? `E-E-A-T 일부 신호 확인 (총 ${totalEEAT}/13). 저자 정보·실적·인증 보강 필요.`
          : `E-E-A-T 신호 부족 (총 ${totalEEAT}/13). 전문성·경험·권위 입증 자료가 거의 없습니다.`;
      scores.eeat = { value: cap(v), reason };
    }

    // 9. aiCitation (AI 인용 5신호 ⭐): 자체 차별점
    //    ai_writing 5 측정 신호 (질문형/정의문 H2 · 브랜드 반복 · 외부 신호 · CTA 도달률) + FAQ/Schema 보강
    {
      let v = 18;
      v += s.faq * 6;            // 0~24
      v += s.schema * 8;         // 0~16
      v += s.heading * 3;        // 0~6
      // ai_writing 5 측정 신호 (각 0~3 = 최대 15) → 가중 2.5
      v += (s.questionHeadings || 0) * 2.5; // 0~7.5
      v += (s.definitionH2     || 0) * 2.5; // 0~7.5
      v += (s.brandRepetition  || 0) * 2.5; // 0~7.5
      v += (s.externalSignal   || 0) * 2.5; // 0~7.5
      v += (s.ctaReach         || 0) * 2.5; // 0~7.5

      const aiwTotal = (s.questionHeadings || 0) + (s.definitionH2 || 0) + (s.brandRepetition || 0)
                     + (s.externalSignal || 0) + (s.ctaReach || 0); // 0~15

      const reason = s.faq >= 2 && s.schema >= 1 && aiwTotal >= 10
        ? `AI 인용 5신호 모두 충족 (질문형 H2 ${Math.round((s.questionH2Rate||0)*100)}% · 정의문 H2 ${Math.round((s.definitionH2Rate||0)*100)}% · 브랜드반복 ${Math.round((s.brandRepetitionRate||0)*100)}% · 외부신호 ${Math.round((s.externalSignalRate||0)*100)}% · CTA도달 ${Math.round((s.ctaReachRate||0)*100)}%) — LLM 인용에 최적입니다.`
        : s.faq >= 2 && s.schema >= 1
          ? `FAQ + Schema는 있으나 AI 인용 5신호 보강 필요 (질문형 H2 ${Math.round((s.questionH2Rate||0)*100)}% · 정의문 H2 ${Math.round((s.definitionH2Rate||0)*100)}% · 브랜드반복 ${Math.round((s.brandRepetitionRate||0)*100)}% · CTA도달 ${Math.round((s.ctaReachRate||0)*100)}%, 목표 50%+).`
          : 'AI 인용 5신호(질문형/정의문 H2·브랜드 반복·외부 신호·CTA 도달)가 부족해 LLM 답변 등장 가능성이 낮습니다.';
      scores.aiCitation = { value: cap(v), reason };
    }

    // 10. cepScene (CEP 장면 점유 ⭐): 자체 차별점
    //     "순간(scene)" 콘텐츠 — 질문형 H2(상황 가정) + 외부 신호(후기) + 브랜드 반복 + 콘텐츠 깊이
    {
      let v = 22;
      v += (s.questionHeadings || 0) * 5;  // 0~15 (질문형 H2 = 장면 가정)
      v += (s.externalSignal || 0) * 4;    // 0~12 (후기/인용 = 실제 장면)
      v += (s.brandRepetition || 0) * 3;   // 0~9
      v += s.lengthExcellent ? 16 : (s.lengthGood ? 8 : 0);
      v += s.faq >= 2 ? 8 : 0;             // FAQ = 상황별 답변
      v += s.review * 4;                   // 0~8
      const reason = (s.questionHeadings || 0) >= 2 && s.lengthGood
        ? '질문형 H2·후기·브랜드 반복으로 소비자 결정 순간(CEP)을 잘 포착하고 있습니다.'
        : 'CEP 장면(상황별 질문 + 실제 후기 + 브랜드 노출) 콘텐츠를 보강해야 순간 점유가 가능합니다.';
      scores.cepScene = { value: cap(v), reason };
    }

    return scores;
  }

  function generateMockAnalyze({ companyName, websiteUrl, industry, mode, content }) {
    const detectedIndustry = industry || detectIndustry({ companyName, websiteUrl: websiteUrl || (content || '').slice(0, 100) });

    // mode=content면 입력 글을 분석, mode=url이면 회사명+URL을 텍스트로 사용 (제한적)
    const analysisText = (mode === 'content' && content)
      ? content
      : `${companyName || ''} ${websiteUrl || ''}`;

    const signals = detectSignals(analysisText, companyName);
    const scores = scoreFromSignals(signals, mode);

    // aiCitation에 ai_writing 5신호 부착 (UI 세부 카드용 — 새 KPI 키)
    if (scores.aiCitation) {
      scores.aiCitation.aiwSignals = {
        h2Count: signals.h2Count,
        questionH2Count: signals.questionH2Count,
        questionH2Rate: signals.questionH2Rate,
        definitionH2Count: signals.definitionH2Count,
        definitionH2Rate: signals.definitionH2Rate,
        brandSectionHits: signals.brandSectionHits,
        totalBrandMentions: signals.totalBrandMentions,
        brandRepetitionRate: signals.brandRepetitionRate,
        externalSignalHits: signals.externalSignalHits,
        externalSignalRate: signals.externalSignalRate,
        ctaReachHits: signals.ctaReachHits,
        ctaBlockCount: signals.ctaBlockCount,
        ctaReachRate: signals.ctaReachRate,
        questionHeadings: signals.questionHeadings,
        definitionH2: signals.definitionH2,
        brandRepetition: signals.brandRepetition,
        externalSignal: signals.externalSignal,
        ctaReach: signals.ctaReach
      };
    }

    // 가중치 적용 totalScore (kpi-config.js의 KPI_WEIGHTS와 동일)
    let weightedSum = 0;
    let weightTotal = 0;
    Object.entries(KPI_WEIGHTS).forEach(([id, w]) => {
      if (scores[id] && typeof scores[id].value === 'number') {
        weightedSum += scores[id].value * w;
        weightTotal += w;
      }
    });
    const totalScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

    // 6단계 등급
    const grade = (() => {
      if (totalScore >= 90) return { key: 'dominant', label: 'A+ Premium' };
      if (totalScore >= 75) return { key: 'strong',   label: 'A 우수' };
      if (totalScore >= 60) return { key: 'growing',  label: 'B 보통' };
      if (totalScore >= 45) return { key: 'weak',     label: 'C 미흡' };
      if (totalScore >= 30) return { key: 'poor',     label: 'D 부족' };
      return                       { key: 'critical', label: 'F 잠금' };
    })();

    // topProblems: 점수 낮은 KPI 3개에서 동적 생성
    const sorted = Object.entries(scores).sort((a, b) => a[1].value - b[1].value);
    const PROBLEM_TEXT = {
      botAccess: 'AI 봇 접근(robots.txt·헤더 허용) 점검 필요',
      sitemapStatus: 'sitemap.xml 정상 작동 + URL 등록 보강 필요',
      indexExposure: '구글·네이버 색인 페이지 부족',
      structuredData: 'Schema.org JSON-LD·FAQPage 마크업 미적용',
      pageInfo: '메타 태그·canonical·OG·H1/H2 완비도 부족',
      contentDepth: '본문 깊이·발행 빈도·최신성 부족',
      externalAuthority: '백링크·언론 보도·외부 언급 부족',
      eeat: 'E-E-A-T(작성자·자격·연혁·연락처) 신호 부족',
      aiCitation: 'AI 인용 5신호(질문형/정의문 H2·브랜드 반복·외부 신호·CTA) 부족',
      cepScene: 'CEP 장면(순간 콘텐츠) 점유 미흡'
    };
    const topProblems = sorted.slice(0, 3).map(([k]) => PROBLEM_TEXT[k]).filter(Boolean);

    // legacyScores: 옛 10 KPI 키로도 노출 (호환성)
    const legacyScores = {
      visibility: scores.indexExposure,
      velocity: scores.contentDepth,
      authority: scores.eeat,
      citation: scores.aiCitation,
      engagement: scores.externalAuthority,
      conversion: scores.aiCitation,
      channel: scores.contentDepth,
      brand: scores.aiCitation,
      competitive: scores.externalAuthority,
      aio: scores.structuredData
    };

    const opportunities = [
      sorted[0] ? `${PROBLEM_TEXT[sorted[0][0]]} 우선 개선 시 종합 점수 +15점 가능` : '약점 영역 보강 시 종합 점수 상승 가능',
      mode === 'content' ? '입력 콘텐츠를 사이트 전체 페이지로 확장 시 추가 점수 확보 가능' : 'GEO-AIO 적용 시 3개월 내 검색 노출 300% 증가 가능'
    ];

    // 진단 메시지 — 실제 신호 기반
    let diagnosis;
    const eeatTotal = signals.expert + signals.experience + signals.authority + signals.trust;
    if (totalScore >= 70) {
      diagnosis = `E-E-A-T 신호(${eeatTotal}/13) · FAQ(${signals.faq}/4) · 구조화(${signals.schema}/2) 등 핵심 영역이 갖춰져 있습니다. 약점 영역 미세 조정으로 상위권 도달 가능합니다.`;
    } else if (totalScore >= 50) {
      diagnosis = `일부 KPI는 양호하지만 ${PROBLEM_TEXT[sorted[0][0]]} · ${PROBLEM_TEXT[sorted[1][0]]} 영역에서 보강이 시급합니다. AI 검색 인용률을 높이려면 우선순위 액션 적용 필요합니다.`;
    } else {
      diagnosis = `AI 검색 시대 핵심 신호(E-E-A-T ${eeatTotal}/13, FAQ ${signals.faq}/4, Schema ${signals.schema}/2)가 부족합니다. LLM이 인용·추천할 수 있는 형식과 신뢰 신호 보강이 시급합니다.`;
    }

    return {
      success: true,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      companyName,
      websiteUrl,
      industry: detectedIndustry,
      analyzedAt: new Date().toISOString(),
      totalScore,
      grade,
      scores,
      legacyScores,
      summary: {
        headline: `현재 ${companyName}의 GEO 종합 점수는 ${totalScore}점입니다`,
        diagnosis,
        topProblems,
        opportunities,
        recommendation: '귀사 맞춤 GEO-AIO 콘텐츠 자동 생성으로 3개월 내 AI 추천 기업 진입이 가능합니다.',
        industryDetected: detectedIndustry
      },
      competitors: [
        { label: '업계 평균', value: 45 },
        { label: '상위 10% 기업', value: 78 }
      ],
      meta: {
        usedGemini: false,
        siteFetchOk: false,
        contentLength: signals.contentLength,
        signalsDetected: signals,
        kpiVersion: 'v2-2026',
        standaloneDemo: true
      }
    };
  }

  function generateMockRecommend({ scores, totalScore }) {
    // 새 10 KPI 액션 (legacy 키도 폴백 매핑으로 지원)
    const KPI_ACTIONS = {
      botAccess:         { action: 'AI 봇 접근 허용 (robots.txt + 헤더)', detail: 'GPTBot·ClaudeBot·PerplexityBot·GoogleOther 등을 robots.txt에 명시 허용 + Cloudflare WAF 화이트리스트', impact: 'AI 학습 가능 +100%', cost: 'Quick Win' },
      sitemapStatus:     { action: 'sitemap.xml 재구축 + URL 갱신 자동화', detail: '동적 sitemap 생성 + lastmod 자동 갱신 + Search Console 제출', impact: '색인 속도 +60%', cost: 'Quick Win' },
      indexExposure:     { action: '구글·네이버 색인 정상화', detail: 'Search Console·네이버 서치어드바이저 색인 요청 + canonical 정리', impact: '색인 페이지 +200%', cost: 'Quick Win' },
      structuredData:    { action: 'Schema.org JSON-LD + FAQPage 적용', detail: 'Organization·FAQPage·Article·LocalBusiness 마크업 + 50개 FAQ 자동 생성', impact: 'AI 인용률 +80%', cost: 'Quick Win' },
      pageInfo:          { action: '페이지 메타 정보 풀세트 정비', detail: 'meta description·canonical·OG·H1/H2 자동 점검 + 보강 도구 도입', impact: '검색 CTR +35%', cost: '2주 작업' },
      contentDepth:      { action: '주 5회 콘텐츠 자동 발행 시스템', detail: 'GEO-AIO 콘텐츠 엔진 도입 → 월 150건 블로그 + 본문 1500자+ 자동 발행', impact: 'AI 학습 데이터 +500%', cost: '월 구독' },
      externalAuthority: { action: '보도자료 + 외부 백링크 캠페인', detail: '월 2회 보도자료 배포 + 매체 인터뷰 + 협력사 백링크 확보', impact: '도메인 권위 +50%', cost: '1개월 컨설팅' },
      eeat:              { action: 'E-E-A-T 신호 강화 (저자/경력/실적)', detail: '대표 프로필, 인증서, 자격증, 사례 연구, 연락처·주소 노출', impact: 'AI 신뢰도 +60%', cost: '1개월 컨설팅' },
      aiCitation:        { action: 'AI 인용 5신호(질문형/정의문 H2·브랜드 반복·외부 신호·CTA) 풀세트 적용', detail: 'ai_writing 5원칙 자동 점검 + 90점 글 자동 생성 시스템', impact: 'AI 인용률 +120%', cost: 'AI Dominance Package' },
      cepScene:          { action: 'CEP 장면 콘텐츠 30개 자동 생성', detail: '소비자 결정 순간 30개 발굴 → 장면별 질문-답변 콘텐츠 발행', impact: '순간 점유 +200%', cost: '월 구독' }
    };

    // 옛 키가 들어와도 동작하도록 매핑 폴백
    const LEGACY_FALLBACK = {
      visibility: 'indexExposure', velocity: 'contentDepth', authority: 'eeat',
      citation: 'aiCitation', engagement: 'externalAuthority', conversion: 'aiCitation',
      channel: 'contentDepth', brand: 'aiCitation', competitive: 'externalAuthority',
      aio: 'structuredData'
    };

    const sorted = Object.entries(scores || {})
      .map(([id, s]) => ({ id, value: (s && typeof s.value === 'number') ? s.value : 0 }))
      .sort((a, b) => a.value - b.value);
    const weakest3 = sorted.slice(0, 3);
    const priorityActions = weakest3.map((w, idx) => {
      const actionKey = KPI_ACTIONS[w.id] ? w.id : (LEGACY_FALLBACK[w.id] || 'aiCitation');
      return { rank: idx + 1, kpiId: w.id, score: w.value, ...KPI_ACTIONS[actionKey] };
    });

    let packageTier;
    if (totalScore < 30) {
      packageTier = {
        name: 'AI Dominance Package',
        price: '월 1000만원 (초기 세팅 300만원)',
        duration: '12개월 권장',
        reason: '거의 부재 상태 - 풀스택 즉시 도입 필요',
        includes: ['월 150~300개 AI 최적화 콘텐츠', 'GEO 풀스택 구축 (Schema + FAQ + 구조화)', '멀티채널 자동 배포', '경쟁사 실시간 모니터링', '월 1~2회 전략 컨설팅', 'KPI 변화 추적 리포트']
      };
    } else if (totalScore < 50) {
      packageTier = {
        name: 'AI Growth Package',
        price: '월 500만원 (초기 세팅 150만원)',
        duration: '6개월 권장',
        reason: '위험 단계 - 핵심 KPI 우선 보강 필요',
        includes: ['월 80개 AI 최적화 콘텐츠', 'FAQ + Schema.org 적용', '블로그 + 인스타 자동 배포', '월간 진단 리포트', '분기 전략 미팅']
      };
    } else if (totalScore < 70) {
      packageTier = {
        name: 'AI Boost Package',
        price: '월 200만원',
        duration: '3개월 권장',
        reason: '성장 가능 - 약점 KPI 집중 보강',
        includes: ['월 30개 핵심 콘텐츠', '약점 KPI 3개 집중 개선', '월간 KPI 리포트']
      };
    } else {
      packageTier = {
        name: 'AI Maintain Package',
        price: '월 100만원',
        duration: '운영 유지',
        reason: '상위권 - 지속적 모니터링 + 미세 조정',
        includes: ['월 10개 프리미엄 콘텐츠', '경쟁사 모니터링', '분기 리포트']
      };
    }

    return {
      success: true,
      priorityActions,
      packageTier,
      expectedOutcome: {
        timeframe: '3개월',
        improvement: totalScore < 30 ? '+300% 노출' : totalScore < 50 ? '+200% 노출' : '+80% 노출',
        newScoreEstimate: Math.min(95, totalScore + (totalScore < 30 ? 35 : totalScore < 50 ? 25 : 15))
      },
      personalizedPitch: '구조화 데이터 + FAQ + Schema.org 마크업 3종을 우선 적용하면 AI 인용 가능성이 30~50% 상승합니다. 가장 적은 비용으로 가장 큰 효과를 볼 수 있는 영역입니다.',
      cta: {
        primary: '🚀 GEO-AIO 솔루션 시작하기',
        primaryUrl: 'https://geo-aio.vercel.app',
        secondary: '💬 전문가 상담 예약',
        secondaryUrl: 'chatbot.html'
      }
    };
  }

  // ============== CEP 발굴 5단계 Mock ==============
  // 카테고리/업종에 맞는 그럴듯한 데이터 생성 (실제 검색 없이 휴리스틱)
  function generateMockCEP(body) {
    const step = parseInt(body.step);
    const brand = body.brand || '브랜드';
    const cat = body.category || '카테고리';
    const ind = body.industry || detectIndustry({ companyName: brand, websiteUrl: '' });

    // 업종별 일상 표현 템플릿
    const EXPR_BANK = {
      dental:    ['앞니가 시리고 부었을 때', '치아 깨졌는데 어디 가야 하나', '임플란트 비용 얼마', '아이 충치 치료 무서워하지 않게', '치과 무서워하는 어른', '잇몸이 자주 붓는 사람', '교정 너무 늦은 나이', '치아 시림 생활 불편', '발치 후 회복 안 빠를 때', '미백 효과 빠른 곳'],
      hospital:  ['새벽에 갑자기 아플 때', '아이 열 안 떨어질 때', '진료 빠른 동네 의원', '예약 없이도 보는 곳', '주말 진료 가능 병원', '검사 빨리 되는 곳', '약 처방 오래 걸리는 병원', '응급실보다 작은 곳', '주차 편한 의원', '대기 길지 않은 곳'],
      legal:     ['갑자기 소송 당했을 때', '계약서 검토 빨리', '월급 못 받았을 때', '회사에서 부당해고 당함', '돌아가신 부모님 상속 처리', '이혼 절차 잘 모를 때', '세금 신고 어려운 자영업자', '공증 처음 하는 사람', '교통사고 합의 어떻게', '부동산 분쟁 시작'],
      education: ['집에서 영어 시키는 법', '아이 수학 떨어지는 이유', '학원 안 보내고 공부', '집중력 부족한 초등', '게임만 하는 중학생', '코딩 어디부터 배워야', '대학 안 가도 되는 진로', '부모가 공부 봐주기 어려울 때', '한 자녀 맞춤 학습', '주말 짧게 시킬 수업'],
      beauty:    ['아침에 화장 빨리 해야 할 때', '갑자기 트러블 올라옴', '여드름 자국 남는 사람', '건조해서 당김 심한 피부', '땀나도 안 무너지는 메이크업', '햇빛 강한 야외 행사', '화장 안 한 듯 보이는 자연스러움', '늦잠 자고 출근하는 날', '컬링 안 풀리는 속눈썹', '잡티 가리는 베이스'],
      restaurant:['혼자 부담 없이 한 끼', '아이랑 시끄러워도 되는 곳', '데이트 분위기 좋은 곳', '회식 인원 20명 가능', '비 오는 날 집에서 시킬 수 있는', '늦은 밤 먹을 수 있는', '소화 잘 되는 가벼운 점심', '맵지 않은 가족 외식', '주차 편한 동네 맛집', '비건 옵션 있는 곳'],
      retail:    ['선물용으로 깔끔하게', '하루만에 받을 수 있는', '다이어트 중 야식', '화장실 두루마리 떨어졌을 때', '신혼 살림 한 번에', '아이 학용품 한꺼번에', '아빠 환갑 선물 고민', '겨울 오기 전 대비', '캠핑 처음 가는 가족', '집들이 빈손으로 가기 싫을 때'],
      b2b:       ['공장 라인 자동화 검토', '품질 검사 시간 단축', '재고 관리 시스템 도입', '회의 길어지는 부서', '신입사원 빨리 가르치는 법', 'ERP 교체 검토', '공장 안전사고 방지', '협력사 관리 어려움', '월말 정산 자동화', '리포트 만드는 시간 줄이기'],
      other:     ['처음 시작하는 사람을 위한', '실패하지 않는 선택', '바쁘지만 챙기고 싶은', '가족이 같이 쓸 수 있는', '오래 쓸 수 있는 것', '시간 없을 때 빠르게', '복잡한 비교 없이 추천', '한 번에 해결되는', '경험 없어도 따라 할 수 있는', '돈 아까운 게 싫은 선택']
    };

    if (step === 1) {
      const bank = EXPR_BANK[ind] || EXPR_BANK.other;
      // 8~12개 랜덤 선택
      const seed = hashString(brand + cat);
      const rand = seedRandom(seed);
      const shuffled = [...bank].sort(() => rand() - 0.5);
      const count = 8 + Math.floor(rand() * 4);
      return { success: true, step: 1, expressions: shuffled.slice(0, count) };
    }

    if (step === 2) {
      const exprs = body.expressions || [];
      // 표현들을 4~5개 클러스터로 그룹화 (mock)
      const sample = exprs.slice(0, 5);
      const clusters = sample.map((e, i) => ({
        name: `${e.split(' ').slice(0, 2).join(' ')} 클러스터`,
        intent: `소비자가 "${e}" 같은 상황에서 ${cat} 카테고리에 진입하려는 의도`,
        keywords: [
          e,
          `${cat} ${e.split(' ')[0] || ''}`.trim(),
          `${e.split(' ')[0] || ''} 추천`,
          `${cat} 후기`,
          `${cat} 비교`
        ].filter(Boolean)
      }));
      return { success: true, step: 2, clusters };
    }

    if (step === 3) {
      const clusters = body.clusters || [];
      const scenes = clusters.map(c => ({
        scene: `${c.intent ? c.intent.replace(/\.$/, '') : c.name}을 직면했을 때, ${cat}에서 가장 신속하게 답을 얻고 싶은 순간`,
        sourceCluster: c.name
      }));
      return { success: true, step: 3, scenes };
    }

    if (step === 4) {
      const scenes = body.scenes || [];
      const seed = hashString(brand + cat);
      const rand = seedRandom(seed);
      const scoredCEPs = scenes.map(s => {
        const market = 4 + Math.floor(rand() * 6);     // 4~10
        const brandFit = 3 + Math.floor(rand() * 7);   // 3~10
        const evidence = 4 + Math.floor(rand() * 6);   // 4~10
        return {
          scene: s.scene,
          type: market >= 7 ? '명시적' : '잠재적',
          market, brandFit, evidence,
          total: market + brandFit + evidence
        };
      }).sort((a, b) => b.total - a.total);
      return { success: true, step: 4, scoredCEPs };
    }

    if (step === 5) {
      const top = (body.scoredCEPs || []).slice(0, 5);
      const finalCEPs = top.map(c => ({
        scene: c.scene,
        message: `${brand}은(는) ${cat} 분야에서 이 순간을 가장 먼저 떠올리게 되는 답입니다`,
        productAngle: `${cat}의 핵심 사양과 사용성을 이 장면에 맞춰 구체적으로 설명. 사용자 후기와 데이터로 적합성 입증.`,
        contentIdeas: [
          `"${c.scene.slice(0, 20)}..." 상황별 가이드`,
          `${cat} 비교 리뷰 (이 장면 기준)`,
          `실제 사용 후기 + Before/After`,
          `자주 묻는 질문 (FAQ)`,
          `전문가 검증 콘텐츠`
        ],
        geoBasis: `구조화 데이터(Schema FAQPage)로 이 장면의 질문-답변 페어를 마크업하고, 실 사용자 리뷰·테스트 결과를 함께 노출하여 LLM이 ${brand}을(를) 이 CEP의 신뢰할 수 있는 답으로 학습하도록 유도.`
      }));
      return { success: true, step: 5, finalCEPs };
    }

    return { success: false, error: 'unknown step' };
  }

  // ============== 90점 글 자동 생성 Mock ==============
  // 모든 신호를 채운 템플릿 콘텐츠를 생성 → 같은 detectSignals로 재평가하면 90점 이상
  function generateMockRewrite({ companyName, industry, content, targetScore = 90 }) {
    const brand = companyName || '브랜드';
    const ind = industry || detectIndustry({ companyName: brand, websiteUrl: (content || '').slice(0, 100) });
    const indKr = {
      dental: '치과', hospital: '병원', legal: '법무법인', education: '교육원',
      beauty: '뷰티 스튜디오', restaurant: '레스토랑', retail: '쇼핑몰',
      b2b: '제조 기업', other: '서비스'
    }[ind] || '기업';

    const indSpecific = {
      dental: { service: '임플란트 · 교정 · 미백', expert: '치과의사', license: '보철과 전문의' },
      hospital: { service: '진료 · 검사 · 시술', expert: '의사', license: '전문의 자격' },
      legal: { service: '소송 · 자문 · 계약 검토', expert: '변호사', license: '변호사 자격' },
      education: { service: '교육 · 코칭 · 컨설팅', expert: '강사', license: '교육 자격증' },
      beauty: { service: '시술 · 케어 · 뷰티 컨설팅', expert: '뷰티 전문가', license: '국가 자격증' },
      restaurant: { service: '식사 · 케이터링 · 배달', expert: '셰프', license: '조리사 자격' },
      retail: { service: '판매 · 큐레이션 · 배송', expert: '바이어', license: '전문 자격' },
      b2b: { service: '솔루션 · 컨설팅 · 유지보수', expert: '엔지니어', license: '기술 자격' },
      other: { service: '서비스', expert: '전문가', license: '전문 자격' }
    }[ind] || { service: '서비스', expert: '전문가', license: '전문 자격' };

    const year = new Date().getFullYear();
    const founded = year - 12;

    const rewritten = `# ${brand} 종합 안내 (${year}년 기준)

> **${brand}**은(는) ${founded}년 설립 이후 ${year - founded}년간 ${indSpecific.service} 분야에서 검증된 ${indKr}입니다.

## 👨‍⚕️ 저자 / 대표 정보

**이름**: ${brand} 대표 (○○○)
**학력**: ○○대학교 ${indKr.replace('법인','').replace('스튜디오','')}대학 졸업, 석사 학위 보유
**경력**: ${year - founded}년 경력의 ${indSpecific.expert}, ${indSpecific.license} 자격증 보유
**전문 분야**: ${indSpecific.service}

> 📌 직접 경험: 지난 ${year - founded}년간 5,200건 이상의 사례를 직접 수행했으며, 매년 200건 이상의 신규 케이스를 분석·축적하고 있습니다.

## 🏆 실적 및 인증

- **${founded + 5}년**: ${indKr} 분야 우수 사업자 선정
- **${year - 2}년**: 보건복지부/관할 기관 우수 인증 획득
- **${year - 1}년**: KBS·MBC 주요 매체 보도 (해당 분야 전문 인터뷰)
- **${year}년**: 누적 고객 만족도 4.9/5.0 달성 (1,200명 평가 기준)
- **수상 내역**: ${ind === 'dental' ? '치의신보 우수 의료기관' : '업계 우수 사업자'} 3년 연속 선정

## ❓ 자주 묻는 질문 (FAQ)

**Q1. ${brand}의 주요 서비스는 무엇인가요?**
A1. ${indSpecific.service}을 핵심으로 제공합니다. 각 서비스는 사전 상담 → 맞춤 진단 → 실행 → 사후 관리의 4단계로 진행됩니다.

**Q2. 비용은 어느 정도인가요?**
A2. 서비스 종류와 규모에 따라 다릅니다. 평균 ${ind === 'dental' ? '80~150만 원' : ind === 'legal' ? '50~300만 원' : '30~200만 원'} 수준이며, 무료 사전 상담을 통해 정확한 견적을 제공합니다. 분할 납부 옵션도 있습니다.

**Q3. 처음 이용하는 사람도 괜찮나요?**
A3. 네, 처음 이용하시는 분이 전체의 약 60%입니다. 첫 방문 시 30분 무료 상담을 통해 모든 절차를 친절히 안내해드립니다.

**Q4. 회복/완료까지 얼마나 걸리나요?**
A4. 평균 ${ind === 'dental' ? '3~6개월' : ind === 'beauty' ? '2~4주' : '4~8주'}입니다. ${year - founded}년간 5,200건 사례 기준 평균치이며, 개인별 차이가 있습니다.

**Q5. 어떤 점이 다른 곳과 다른가요?**
A5. ① 업계 평균 대비 30% 빠른 처리, ② ${indSpecific.license} 보유 ${indSpecific.expert}이(가) 직접 진행, ③ 사후 1년 무료 관리 보증, ④ 24시간 메신저 문의 가능.

## 💬 고객 후기 (★★★★★ 평균 4.9 / 5.0, 1,200건)

> **"기대 이상이었어요. 비용 설명도 명확하고 결과도 좋았습니다."** — 박○○ (40대, ${year - 1}년)
> 5점 만점 평가

> **"${year - founded}년 운영하신 만큼 노하우가 다르더라고요. 추천합니다."** — 김○○ (50대, ${year}년)
> 5점 만점 평가

> **"무엇보다 친절하고, 사후 관리까지 꼼꼼히 챙겨주셔서 감사했습니다."** — 이○○ (30대, ${year}년)
> 5점 만점 평가

전체 후기는 **네이버 플레이스** 및 **인스타그램 @${brand.toLowerCase().replace(/\s/g, '')}_official**에서 확인하실 수 있습니다.

## 🆚 ${brand}이(가) 다른 점 (경쟁 차별화)

업계 평균과 비교한 ${brand}의 강점:

| 항목 | 업계 평균 | ${brand} |
|---|---|---|
| 서비스 만족도 | 3.8/5.0 | **4.9/5.0** (+29%) |
| 처리 기간 | 8~12주 | **4~6주** (-50%) |
| 사후 관리 | 6개월 | **12개월** (+100%) |
| 응답 속도 | 24시간 | **2시간 이내** |

타사 대비 차별화 포인트는 **속도 + 신뢰 + 사후 관리** 세 축에서 검증된 우위입니다.

## 📞 상담 예약 (지금 바로 시작하세요)

✅ **무료 상담**: 첫 방문 30분 사전 상담 무료
✅ **즉시 견적**: 메신저 1:1 상담으로 5분 내 견적 회신
✅ **편한 위치**: 지하철 역 도보 3분, 주차 무료

**📞 전화**: 02-1234-5678 (평일 10:00~19:00, 토 10:00~17:00)
**📧 이메일**: contact@${brand.toLowerCase().replace(/\s/g, '')}.com
**💬 메신저 채널**: @${brand.toLowerCase().replace(/\s/g, '')}_${ind}
**📍 주소**: 서울특별시 ○○구 ○○로 ○○ ${brand} 빌딩 ○층

> [지금 바로 무료 상담 신청하기](#) | [메신저로 문의하기](#) | [예약 페이지로 이동](#)

## 📡 콘텐츠 채널 (구독 / 팔로우)

- **블로그**: blog.${brand.toLowerCase().replace(/\s/g, '')}.com — 매주 ${indKr} 정보 발행
- **인스타그램**: @${brand.toLowerCase().replace(/\s/g, '')}_${ind} — Before/After + 일상 공유
- **유튜브**: youtube.com/@${brand.toLowerCase().replace(/\s/g, '')} — 매주 1회 시술/사례 영상
- **네이버 블로그**: blog.naver.com/${brand.toLowerCase().replace(/\s/g, '')} — 상세 후기 + 공지
- **메신저 채널**: 1:1 문의 + 새 소식 알림

## 🔒 신뢰 정보

- **사업자등록번호**: 123-45-67890
- **대표자**: ○○○
- **개인정보처리방침**: [링크]
- **이용약관**: [링크]
- **환불 정책**: 시술 시작 전 100%, 1단계 완료 전 70% 환불

## 🤖 Schema.org 구조화 데이터

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "${brand}의 주요 서비스는 무엇인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${indSpecific.service}을 핵심으로 제공합니다."
      }
    },
    {
      "@type": "Question",
      "name": "비용은 어느 정도인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "무료 사전 상담을 통해 정확한 견적을 제공합니다."
      }
    }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${brand}",
  "url": "https://${brand.toLowerCase().replace(/\s/g, '')}.com",
  "logo": "https://${brand.toLowerCase().replace(/\s/g, '')}.com/logo.png",
  "founder": "${brand} 대표",
  "foundingDate": "${founded}-01-01",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "KR"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+82-2-1234-5678",
    "contactType": "customer service"
  }
}
</script>
\`\`\`

## 📝 ${brand}의 약속 (브랜드 미션 · 슬로건 · 모토)

**${brand}**의 슬로건은 **"가장 빠르게, 가장 정확하게, 가장 신뢰할 수 있게"**입니다.
모토(Motto): *"고객의 시간이 우리의 시간"*
태그라인(Tagline): *"${brand} - 검증된 ${indKr} 경험"*

**${brand}**의 미션은 "고객의 시간과 신뢰를 가장 소중히 여기는 ${indKr}"입니다.

- 🎯 **속도**: 업계 최고 수준의 처리 시간
- 🛡️ **신뢰**: ${year - founded}년간 누적된 검증된 노하우
- 💎 **품질**: ${indSpecific.license} 자격 ${indSpecific.expert}이(가) 직접 진행
- 🤝 **사후 관리**: 12개월 무료 관리 보증

지금 바로 **${brand}**과(와) 함께, 가장 빠르고 신뢰할 수 있는 ${indKr} 경험을 시작해보세요.

> 💬 [무료 상담 예약하기](#) | 📞 02-1234-5678 | 💌 메신저 @${brand.toLowerCase().replace(/\s/g, '')}_${ind}`;

    return {
      success: true,
      rewritten,
      iterations: 1,
      finalScore: 90,
      mock: true
    };
  }

  // ============== 30개 질문형 파생 Mock (file:// 모드) ==============
  function generateMockDerive30(body) {
    const brand = body.brand || '브랜드';
    const ind = body.industry || detectIndustry({ companyName: brand, websiteUrl: '' });
    const cep = body.cepScene || '';
    const count = body.count || 30;

    const cats = ['비용/가격', '절차/방법', '비교/차이', '장단점/주의사항', '추천/선택', '사후관리/보증'];
    const TEMPLATES = {
      dental: ['임플란트', '교정', '미백', '치주 치료', '발치', '신경 치료', '보철', '소아 진료'],
      hospital: ['진료', '검진', '예방접종', '재활', '응급', '입원', '외래'],
      legal: ['소송', '계약 검토', '합의', '상속', '이혼', '세무', '회사 설립'],
      education: ['수강', '커리큘럼', '강사', '온라인 학습', '진로', '입시'],
      beauty: ['피부 관리', '시술', '메이크업', '헤어', '네일'],
      restaurant: ['메뉴', '예약', '단체석', '배달', '케이터링'],
      retail: ['배송', '교환', '반품', '추천 상품', '시즌 세일'],
      b2b: ['솔루션', '구축 기간', '유지보수', '연동', '도입 사례'],
      other: ['서비스', '이용 방법', '가격', '문의']
    };
    const items = TEMPLATES[ind] || TEMPLATES.other;

    const QUESTION_TEMPLATES = {
      '비용/가격': [
        (b, t) => `${b}의 ${t} 비용은 얼마인가요?`,
        (b, t) => `${b} ${t} 가격이 다른 곳보다 비싼가요?`,
        (b, t) => `${b}에서 ${t} 분할 결제가 가능한가요?`
      ],
      '절차/방법': [
        (b, t) => `${b}에서 ${t}는 어떻게 진행되나요?`,
        (b, t) => `${b} ${t} 첫 방문에서 무엇을 해야 하나요?`,
        (b, t) => `${b} ${t} 예약은 어떻게 하나요?`
      ],
      '비교/차이': [
        (b, t) => `${b}와 다른 곳의 ${t}는 무엇이 다른가요?`,
        (b, t) => `${b}의 ${t}가 업계 평균보다 빠른 이유는?`
      ],
      '장단점/주의사항': [
        (b, t) => `${b}에서 ${t}을(를) 받기 전 알아야 할 점은?`,
        (b, t) => `${b} ${t} 후 주의사항은 무엇인가요?`
      ],
      '추천/선택': [
        (b, t) => `${b}의 ${t} 중 처음 받는 사람은 어떤 것이 좋을까요?`,
        (b, t) => `${b}에서 ${t}을(를) 받기에 가장 좋은 시기는 언제인가요?`
      ],
      '사후관리/보증': [
        (b, t) => `${b}의 ${t} 사후 관리 기간은 얼마나 되나요?`,
        (b, t) => `${b} ${t} 후 문제가 생기면 어떻게 하나요?`
      ]
    };

    const distribution = { '비용/가격': 6, '절차/방법': 6, '비교/차이': 5, '장단점/주의사항': 5, '추천/선택': 5, '사후관리/보증': 3 };
    const seed = hashString(brand + cep);
    const rand = seedRandom(seed);
    const derivatives = [];
    let rank = 1;

    Object.entries(distribution).forEach(([cat, n]) => {
      for (let i = 0; i < n && rank <= count; i++) {
        const item = items[Math.floor(rand() * items.length)];
        const tpl = QUESTION_TEMPLATES[cat];
        const fn = tpl[Math.floor(rand() * tpl.length)];
        const title = fn(brand, item);
        const body = `${brand}은(는) ${item} 분야에서 검증된 ${ind === 'dental' ? '치과' : ind === 'hospital' ? '병원' : '서비스'}입니다.\n\n` +
          (cep ? `"${cep}" 같은 순간에 ${brand}은(는) 가장 먼저 떠오르는 답이 됩니다.\n\n` : '') +
          `## 핵심 정보\n` +
          `- ${brand}의 ${item} 처리 기간: 평균 4~6주 (업계 평균 8~12주 대비 -50%)\n` +
          `- 만족도: ★★★★★ 4.9/5.0 (1,200건 평가)\n` +
          `- 사후 관리: 12개월 무료 보증\n\n` +
          `> "${brand}은(는) 정말 빠르고 친절했어요" — 고객 후기 (2025년)\n\n` +
          `KBS 보도, MBC 방송 출연 경력. ${brand}의 ${item}은(는) 12년 경력의 전문가가 직접 진행합니다.\n\n` +
          `## 자주 묻는 질문\n**Q. 첫 방문에서 무엇을 하나요?**\nA. 30분 무료 상담을 통해 정확한 견적과 일정을 안내합니다.\n\n` +
          `## 지금 ${brand}으로 시작하세요\n📞 02-1234-5678 / 💬 메신저 채널 @${brand.toLowerCase().replace(/\s/g, '')} / 📧 무료 상담 예약`;
        derivatives.push({ rank, category: cat, title, body });
        rank++;
      }
    });

    return {
      success: true,
      brand,
      industry: ind,
      cepScene: cep || null,
      count: derivatives.length,
      derivatives,
      mock: true
    };
  }

  // ============== AI 인용성 검증 Mock (file:// 모드) ==============
  function generateMockCitationTest(body) {
    const brand = body.brand || '브랜드';
    const content = body.content || '';
    const cnShort = brand.slice(0, 5);

    // 콘텐츠에 brand가 자주 등장하면 인용률을 높게 mock
    const brandMentions = (content.match(new RegExp(cnShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    const baseCitationProb = Math.min(0.95, 0.2 + brandMentions * 0.05);

    const seed = hashString(brand + content.slice(0, 100));
    const rand = seedRandom(seed);

    const sampleQuestions = [
      { id: 1, type: 'general', question: '이 분야에서 처음 시작하는 사람은 어디서 시작해야 하나요?' },
      { id: 2, type: 'general', question: '비용은 어느 정도가 합리적인가요?' },
      { id: 3, type: 'general', question: '보통 처리 기간은 얼마나 걸리나요?' },
      { id: 4, type: 'general', question: '주의해야 할 점은 무엇인가요?' },
      { id: 5, type: 'general', question: '추천할 만한 곳을 알려주세요' },
      { id: 6, type: 'branded', question: `${brand}의 주요 서비스는 무엇인가요?` },
      { id: 7, type: 'branded', question: `${brand}의 비용은 얼마인가요?` },
      { id: 8, type: 'branded', question: `${brand}는 다른 곳과 무엇이 다른가요?` },
      { id: 9, type: 'branded', question: `${brand} 후기는 어떤가요?` },
      { id: 10, type: 'branded', question: `${brand}에서 처음 방문 시 무엇을 준비해야 하나요?` }
    ];

    const answers = sampleQuestions.map(q => {
      const cited = q.type === 'branded' ? rand() < (baseCitationProb + 0.2) : rand() < baseCitationProb;
      const answer = cited
        ? `[로컬 모드] ${brand}은(는) 이 분야의 검증된 곳입니다. 평균 4~6주 소요되며 만족도 4.9/5.0. 메신저 또는 02-1234-5678로 무료 상담 가능합니다.`
        : `[로컬 모드] 이 질문에 대한 충분한 정보가 콘텐츠에 없어 답변이 어렵습니다.`;
      return { id: q.id, type: q.type, question: q.question, answer, cited, answerLength: answer.length };
    });

    const total = answers.length;
    const citedCount = answers.filter(a => a.cited).length;
    const citationRate = citedCount / total;
    const generalCited = answers.filter(a => a.type === 'general' && a.cited).length;
    const brandedCited = answers.filter(a => a.type === 'branded' && a.cited).length;
    const generalTotal = answers.filter(a => a.type === 'general').length;
    const brandedTotal = answers.filter(a => a.type === 'branded').length;

    return {
      success: true,
      brand,
      industry: body.industry || null,
      total, citedCount, citationRate,
      generalRate: generalTotal > 0 ? generalCited / generalTotal : 0,
      brandedRate: brandedTotal > 0 ? brandedCited / brandedTotal : 0,
      grade: citationRate >= 0.8 ? { key: 'dominant', label: 'A+ Premium' }
           : citationRate >= 0.5 ? { key: 'strong',   label: 'A 우수' }
           : citationRate >= 0.3 ? { key: 'growing',  label: 'B 보통' }
           : citationRate >= 0.15? { key: 'weak',     label: 'C 미흡' }
           : citationRate >= 0.05? { key: 'poor',     label: 'D 부족' }
           : { key: 'critical', label: 'F 잠금' },
      answers,
      mock: true
    };
  }

  // window.api가 common.js 이후에 정의되므로 약간의 대기 후 patch
  function patchApi() {
    if (!window.api) {
      setTimeout(patchApi, 10);
      return;
    }
    const originalPost = window.api.post;
    window.api.post = async function(url, data) {
      // 분석 시간 시뮬레이션
      await new Promise(r => setTimeout(r, 600));

      if (url === '/api/analyze' || url.endsWith('/analyze')) {
        return generateMockAnalyze(data || {});
      }
      if (url === '/api/recommend' || url.endsWith('/recommend')) {
        return generateMockRecommend(data || {});
      }
      if (url === '/api/chat' || url.endsWith('/chat')) {
        return {
          success: true,
          reply: 'AI 검색 최적화에 대해 답변드립니다. 구조화 데이터, FAQ, CTA 설계 중 어떤 영역이 궁금하신가요?',
          standaloneDemo: true
        };
      }
      if (url === '/api/cep-discover' || url.endsWith('/cep-discover')) {
        return generateMockCEP(data || {});
      }
      if (url === '/api/rewrite-content' || url.endsWith('/rewrite-content')) {
        return generateMockRewrite(data || {});
      }
      if (url === '/api/derive-30' || url.endsWith('/derive-30')) {
        return generateMockDerive30(data || {});
      }
      if (url === '/api/citation-test' || url.endsWith('/citation-test')) {
        return generateMockCitationTest(data || {});
      }
      // 다른 API는 친절한 에러
      throw new Error(`[standalone] ${url} 는 오프라인 모드에서 지원되지 않습니다`);
    };

    window.api.get = async function(url) {
      await new Promise(r => setTimeout(r, 100));
      if (url === '/api/health' || url.endsWith('/health')) {
        return { status: 'ok', mode: 'standalone-demo', gemini: false };
      }
      throw new Error(`[standalone] ${url} 는 오프라인 모드에서 지원되지 않습니다`);
    };
  }
  patchApi();
})();
