# /90upgrade — GEO Score 90점 자동 업그레이드 (v3.0 — Article 축 기준)

입력된 **글 본문**을 분석·평가한 뒤, **부족한 신호를 자동 보강**하여 Article 축 GEO Score **90점 이상**의 글로 재작성한다. 자가 검증 루프(최대 3회)로 목표 점수 도달까지 자동 반복.

> 단순 "AI 글쓰기"가 아니라, **측정 가능한 점수 체계**에 기반한 **결정적(deterministic) 콘텐츠 업그레이드 알고리즘**.

**v3.0 변경**: 본 문서는 **Article 축 6 KPI** 기준으로 동작합니다.
- `ar_definitionH2` (정의문 H2) · `ar_questionH2` (질문형 H2) · `ar_brandRepetition` (브랜드 반복)
- `ar_externalCitation` (외부 인용) · `ar_ctaReach` (CTA 도달률) · `ar_faq` (FAQ 구조)

홈페이지/블로그 축 업그레이드는 별도 도구(`/90upgrade-homepage`, `/90upgrade-blog`)로 분리됩니다 (향후 도입).

---

## 빠른 실행

```
사용자: "/90upgrade [원본 글]"
또는
사용자: "이 글을 GEO 90점으로 만들어줘 [브랜드명] [업종] [원본 글]"

→ 실행 순서:
  1. 원본 글 → 신호 검출 → 점수 산출
  2. 부족 KPI 식별 (70점 미만 영역)
  3. 보강 체크리스트 적용 → Gemini 재작성
  4. 재작성 글 점수 검증
  5. 90점 미달 시 부족 영역 강조 후 재시도 (최대 3회)
  6. 좌(원본) ↔ 우(재작성) 비교 + KPI 변화 차트 출력
```

---

## PART 1: 핵심 원리

### 1.1 결정적 점수 시스템

**원칙**: 점수는 의사난수가 아닌 **신호 기반 결정적 함수**로 계산된다.

```
score(content) = baseline + Σ(signal_count × weight)
```

같은 입력 → 항상 같은 점수. 신호가 많을수록 점수가 높다.

### 1.2 10대 KPI

| ID | 한국어명 | 핵심 신호 |
|----|---------|----------|
| visibility | 검색 가시성 | 헤딩 구조, 콘텐츠 길이, 숫자/리스트 |
| velocity | 콘텐츠 생산력 | 채널, 날짜, 콘텐츠 양 |
| authority | E-E-A-T 신뢰도 | 전문성, 경험, 권위, 신뢰 4축 |
| citation | AI 인용 가능성 | FAQ, Schema.org, 헤딩 |
| engagement | 고객 참여도 | 리뷰, 채널, 신뢰 |
| conversion | 전환 설계 | CTA, 신뢰 신호 |
| channel | 채널 확장 | 멀티채널 |
| brand | 브랜드 일관성 | 브랜드명 반복, 미션, 슬로건 |
| competitive | 경쟁 점유율 | 비교, 차별화, 권위 |
| aio | AI 최적화 준비도 | Schema, FAQ, 헤딩, 리스트 |

### 1.3 등급 매핑

```
90점 이상  → AI Dominant (지배)
70~89점    → Strong (강세)
50~69점    → Growing (성장)
30~49점    → Weak (취약)
30점 미만  → Critical (위기)
```

---

## PART 1.4: ai_writing 6원칙 통합 매핑

`/ai_writing` 스킬의 6원칙·7단계·4신호와 본 GEO Score 10 KPI는 다음과 같이 1:1 매핑된다. 90upgrade는 이 매핑을 그대로 점수 산출 + Gemini 프롬프트에 사용한다.

| ai_writing 요소 | 매핑 KPI | 측정 방법 |
|---|---|---|
| 원칙 0 CEP 장면 점유 | competitive | "○○할 때/순간" 패턴 검출 |
| 원칙 1 작성자 권위 | authority (E-E-A-T) | expert + experience + authority + trust 신호 |
| 원칙 2 정의문 H2 | citation | H2 첫 문장 "X는 ~이다" 패턴 |
| 원칙 3 구조화 | visibility / aio | heading + lists + numbers |
| **원칙 4-1 질문형 H2 ≥50%** | **citation** ⭐ | H2에 "?" 또는 "어떻게/왜/언제/무엇" 포함 비율 |
| **원칙 4-2 브랜드 반복 ≥50%** | **citation + brand** ⭐ | H2 섹션 중 브랜드명 등장 비율 |
| **원칙 4-3 외부 신호 ≥30%** | **citation + authority** ⭐ | 후기 인용 + 언론 보도 + "에 따르면" |
| **원칙 4-4 CTA 도달률 ≥50%** | **citation + conversion** ⭐ | 800자 블록당 CTA 키워드 등장 비율 |
| 원칙 5 행동 유도 | conversion | CTA 3종 (상담/예약/문의) |
| 7단계 골격 충족 | aio | 도입+H2+프로세스+사례+FAQ+CTA+표 |
| 1글→30개 파생 | velocity | 콘텐츠 양 + 채널 분포 |

### KPI 4 (citation) 점수 = ai_writing 4신호의 직접 측정

```javascript
citation = 18
        + faq × 7        + schema × 9     + heading × 3 + (lists ? 4 : 0)  // 기존 구조 신호
        + questionHeadings × 3   // ai_writing 4-1
        + brandRepetition × 3    // ai_writing 4-2
        + externalSignal × 3     // ai_writing 4-3
        + ctaReach × 3           // ai_writing 4-4
```

각 ai_writing 신호는 0~3 스케일 (목표값 100% 도달 시 3, 60% 도달 시 2, 30% 도달 시 1, 미달 0).

따라서 **KPI 4가 90+ 도달 = ai_writing 4신호 모두 ≥ 60% 충족**.

---

## PART 2: 신호 검출 알고리즘

### 2.1 E-E-A-T 신호 (총 13점 만점)

#### Expert (전문성, 0~4)
```regex
/전문가|박사|전문의|교수|상담사|디자이너|마케터|개발자|엔지니어|작가|컨설턴트/i
/\d+\s*년\s*(경력|경험|운영|진료)|since\s*\d{4}|설립\s*\d{4}|개원\s*\d{4}/i
/자격증|인증|certifi|면허|licen|학위|degree/i
/(논문|특허|등록|published|patent)/i
```

#### Experience (경험, 0~3)
```regex
/(사례|case\s*study|실제|성공\s*사례|실적|portfolio|작품|프로젝트)/i
/(직접\s*경험|실제로\s*해보|체험|사용해\s*본|먹어\s*본|입어\s*본|타본)/i
/(테스트|시험|실험|비교|측정|결과)/i
```

#### Authority (권위, 0~3)
```regex
/(언론|뉴스|보도|매체|방송|기사|보도자료|press)/i
/(수상|선정|1\s*위|top|best|award)/i
/(고객사|클라이언트|client|partner|파트너사|협력사)/i
```

#### Trust (신뢰, 0~3)
```regex
/(연락처|tel|전화|이메일|email|주소|위치|address|찾아\s*오는|오시는\s*길)/i
/(개인정보|privacy|약관|terms|환불|refund|보증|guarantee|warranty)/i
/(리뷰|후기|평점|별점|고객\s*후기|review|rating|만족도)/i
```

### 2.2 구조 신호

#### FAQ (0~4)
```regex
/FAQ|Q\s*&\s*A|자주\s*묻는|자주\s*하는\s*질문|문의\s*사항/i
/(Q\.|Q\s*:|질문\s*:|Q\d+|문\s*:|문의\s*:)/i
/(A\.|A\s*:|답변\s*:|답\s*:|A\d+)/i
// + Q-A 페어 3쌍 이상 반복 검출
(text.match(/Q\d?[\.:]/gi) || []).length >= 3
```

#### Schema (0~2)
```regex
/application\/ld\+json|JSON[\s-]?LD|schema\.org|FAQPage|microdata|itemtype/i
/<\/?(article|section|nav|aside|header|footer|main)/i
```

#### Heading (0~2)
```regex
// 마크다운 헤딩 또는 HTML 헤딩 2개 이상
/^#{1,3}\s/gm.test(text) || (text.match(/<h[1-6][^>]*>/gi) || []).length >= 2
// 헤딩/리스트/번호 3개 이상
(text.match(/^#{1,3}\s/gm) || []).length >= 3 ||
(text.match(/^\s*[•\-\*]\s/gm) || []).length >= 3 ||
/\d+\.\s/g.test(text)
```

### 2.3 비즈니스 신호

#### CTA (0~3)
```regex
/(상담|예약|문의|신청|가입|구독|시작|체험|무료|상담\s*받기|예약\s*하기|문의\s*하기)/i
/(클릭|버튼|button|cta|행동|지금\s*바로|today)/i
/(전화|tel|message|메시지)/i
```

#### Review (0~2)
```regex
/(리뷰|후기|평점|별점|만족도|recommend|추천\s*해|좋아요|like)/i
/\d+\s*점|\d+\.\d+\s*\/\s*\d+|★|⭐|\d+\s*명/i
```

#### Channel (0~2)
```regex
/(blog|블로그|news|소식|매거진|magazine|publication)/i
/(instagram|facebook|youtube|twitter|linkedin|naver|tiktok|쇼츠|reels)/i
```

#### Brand (0~3)
```javascript
companyName && (text.match(new RegExp(companyName.slice(0, 5), 'gi')) || []).length >= 2
/(브랜드|brand|미션|vision|비전|철학|약속|가치|특별한|차별)/i
/(슬로건|slogan|모토|motto|tagline)/i
```

#### Competitive (0~2)
```regex
/(비교|vs\.?|compare|대비|차이|선두|업계\s*최고|시장\s*점유율|market\s*share)/i
/(경쟁사|competitor|alternative|타사|other\s*brand)/i
```

### 2.4 콘텐츠 양/품질
```javascript
lengthOK:        len >= 500
lengthGood:      len >= 1500
lengthExcellent: len >= 3000
hasNumbers: (text.match(/\d+\s*(%|원|명|개|건|점|배|위)/g) || []).length >= 3
hasDates:   /\d{4}[년\.\-\/]|\d{1,2}월\s*\d{1,2}일/.test(text)
hasLists:   (text.match(/^\s*[•\-\*]|^\s*\d+\./gm) || []).length >= 3
```

---

## PART 3: 점수 산출 공식

각 KPI는 `cap(value, 5, 95)` 범위로 클램프된다.

```
1. visibility (검색 가시성)
   25 + heading×18 + (excellent?22 : good?14 : ok?6) + numbers?12 + lists?10
   최대 95점

2. velocity (콘텐츠 생산력)
   25 + channel×14 + dates?18 + (excellent?22 : good?12) + numbers?8
   최대 95점

3. authority (E-E-A-T 신뢰도)
   25 + expert×7 + experience×6 + authority×5 + trust×4
   최대 25 + 28 + 18 + 15 + 12 = 98 → 95 캡

4. citation (AI 인용 가능성)
   22 + faq×9 + schema×12 + heading×5 + lists?6
   최대 22 + 36 + 24 + 10 + 6 = 98 → 95 캡

5. engagement (고객 참여도)
   26 + review×18 + channel×10 + trust×6 + numbers?6
   최대 26 + 36 + 20 + 18 + 6 = 95 (정확히 캡)

6. conversion (전환 설계)
   25 + cta×18 + trust×7
   최대 25 + 54 + 21 = 95 (정확히 캡)

7. channel (채널 확장)
   25 + channel×22 + (heading>=1?8) + (good?8)
   최대 25 + 44 + 8 + 8 = 85 → 90+ 위해 추가 신호 필요

8. brand (브랜드 일관성)
   25 + brand×20 + (good?10 : ok?5) + (heading>=2?8)
   최대 25 + 60 + 10 + 8 = 95 (정확히 캡)

9. competitive (경쟁 점유율)
   30 + competitive×22 + (authority>=2?12) + numbers?8
   최대 30 + 44 + 12 + 8 = 94

10. aio (AI 최적화 준비도)
    22 + schema×18 + faq×8 + heading×6 + lists?8
    최대 22 + 36 + 32 + 12 + 8 = 95 (정확히 캡)

종합 점수 = round(Σ KPI / 10)
```

---

## PART 4: 재작성 알고리즘

### 4.1 보강 체크리스트 (Gemini 프롬프트에 포함)

#### ① E-E-A-T 보강
- 저자 정보 블록 (이름, 학력, 경력 N년, 자격증/면허, 전문 분야)
- 직접 경험 사례 ("실제로 ~해본", "테스트 결과", "비교 측정")
- 외부 권위 신호 (언론 보도, 수상, 인증, 협력사)
- 신뢰 신호 (연락처, 이메일, 주소, 환불/보증 조항)

#### ② AI 인용 가능성 보강 (FAQ + Schema)
- "## 자주 묻는 질문 (FAQ)" 섹션 명시
- Q1~Q5와 A1~A5 형식의 5쌍 이상
- Schema.org JSON-LD 코드 블록 (FAQPage 타입)
- `<script type="application/ld+json">` 코드 예시 포함

#### ③ 전환 설계 (CTA) 보강
- 명확한 행동 유도 3종 이상: 상담 / 예약 / 문의
- 메신저, 전화번호, 이메일 등 즉시 연결 채널 명시
- "지금 바로", "무료 상담" 등 행동 유도 언어

#### ④ 사회적 증거 (Engagement) 보강
- 고객 후기 3개 이상 + 평점/별점 표시 (★★★★★ 4.9/5.0)
- 만족도/추천 수치 (구체적 숫자)

#### ⑤ 멀티채널 (Channel) 보강
- 블로그, 인스타그램, 유튜브, 네이버블로그, 메신저 채널 중 3개 이상

#### ⑥ 브랜드 일관성 (Brand) 보강
- 브랜드명을 본문에서 3회 이상 자연스럽게 반복
- 미션 / 비전 / 가치 / 약속 메시지
- 슬로건 / 모토 / 태그라인 명시

#### ⑦ 경쟁 차별화 (Competitive) 보강
- "업계 평균 대비", "경쟁사와 다른 점" 등 비교 표현
- 차별화 포인트 명확히 + 비교 표 형식 추천

#### ⑧ 콘텐츠 양/구조 보강
- 1,500자 이상 (이상적 2,500~3,000자)
- 마크다운 헤딩 (#, ##, ###) 또는 번호 리스트
- 구체적 숫자 (5건 이상): 연도, 비율(%), 실적 건수, 가격
- 날짜 표기 (2024년, 2025.X 등)

### 4.2 자가 검증 루프

```python
for iteration in range(MAX_ITER=3):
    rewritten = gemini.generate(prompt)
    signals = detect_signals(rewritten, companyName)
    score = calculate_score(signals)

    if score.total >= TARGET=90:
        return rewritten

    # 90점 미달 시 부족 KPI를 다음 프롬프트에 명시
    still_weak = [kpi for kpi in score.per_kpi if kpi.value < 75]
    prompt = build_prompt(..., prev_attempt={
        score: score.total,
        still_weak: still_weak
    })

return rewritten  # 3회 시도 후 최종 결과 (목표 미달이라도)
```

### 4.3 표준 출력 템플릿

업종별 변수 채워서 다음 구조의 글 생성:

```markdown
# [브랜드명] 종합 안내 ([연도]년 기준)

> [브랜드명]은(는) [설립연도]년 설립 이후 [경력]년간 ...

## 👨‍⚕️ 저자 / 대표 정보
**이름**: [대표명] (○○○)
**학력**: ○○대학교 ○○대학 졸업, 석사 학위 보유
**경력**: [경력]년 경력의 [전문가], [자격증] 보유
**전문 분야**: [서비스]
> 📌 직접 경험: [경력]년간 5,200건 사례 직접 수행

## 🏆 실적 및 인증
- [년도]: [업종] 분야 우수 사업자 선정
- [년도]: [기관] 우수 인증 획득
- [년도]: KBS·MBC 보도
- 누적 만족도 4.9/5.0 (1,200명 평가 기준)

## ❓ 자주 묻는 질문 (FAQ)
**Q1. [브랜드]의 주요 서비스는?**
A1. ...

**Q2. 비용은?**
A2. ...

(Q3, Q4, Q5 추가)

## 💬 고객 후기 (★★★★★ 평균 4.9 / 5.0, 1,200건)
> "[후기1]" — 박○○ (40대)
> "[후기2]" — 김○○ (50대)
> "[후기3]" — 이○○ (30대)

## 🆚 [브랜드]이(가) 다른 점 (경쟁 차별화)
| 항목 | 업계 평균 | [브랜드] |
|---|---|---|
| 만족도 | 3.8/5.0 | **4.9/5.0** (+29%) |
| 처리 기간 | 8~12주 | **4~6주** (-50%) |

## 📞 상담 예약
✅ 무료 상담 / ✅ 즉시 견적 / ✅ 편한 위치
**📞 전화**: 02-1234-5678
**💬 메신저 채널**: @[브랜드]_[업종]
**📍 주소**: 서울 ○○구 ○○로

## 📡 콘텐츠 채널
- 블로그: blog.[brand].com — 매주 발행
- 인스타그램: @[brand]_[ind]
- 유튜브: youtube.com/@[brand]
- 네이버 블로그: blog.naver.com/[brand]
- 메신저 채널

## 🔒 신뢰 정보
- 사업자등록번호 / 대표자 / 개인정보 / 약관 / 환불 정책

## 🤖 Schema.org 구조화 데이터
\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  ...
}
</script>
\`\`\`

## 📝 [브랜드]의 약속 (브랜드 미션 · 슬로건 · 모토)
**슬로건**: "가장 빠르게, 가장 정확하게, 가장 신뢰할 수 있게"
**모토**: "고객의 시간이 우리의 시간"
**태그라인**: "[브랜드] - 검증된 [업종] 경험"
**미션**: "고객의 시간과 신뢰를 가장 소중히 여기는 [업종]"
```

이 템플릿을 따르면 모든 신호 검출이 통과되어 90점 이상 달성.

---

## PART 5: 업종별 변수

```javascript
const indSpecific = {
  dental:    { service: '임플란트·교정·미백', expert: '치과의사', license: '보철과 전문의' },
  hospital:  { service: '진료·검사·시술', expert: '의사', license: '전문의 자격' },
  legal:     { service: '소송·자문·계약 검토', expert: '변호사', license: '변호사 자격' },
  education: { service: '교육·코칭·컨설팅', expert: '강사', license: '교육 자격증' },
  beauty:    { service: '시술·케어·뷰티 컨설팅', expert: '뷰티 전문가', license: '국가 자격증' },
  restaurant:{ service: '식사·케이터링·배달', expert: '셰프', license: '조리사 자격' },
  retail:    { service: '판매·큐레이션·배송', expert: '바이어', license: '전문 자격' },
  b2b:       { service: '솔루션·컨설팅·유지보수', expert: '엔지니어', license: '기술 자격' },
  other:     { service: '서비스', expert: '전문가', license: '전문 자격' }
};
```

---

## PART 6: 결과 출력 형식

### 6.1 JSON 응답 구조
```json
{
  "success": true,
  "original": "원본 글",
  "rewritten": "재작성 글",
  "beforeTotal": 25,
  "afterTotal": 93,
  "beforeGrade": { "key": "critical", "label": "Critical" },
  "afterGrade": { "key": "dominant", "label": "AI Dominant" },
  "beforeScores": {
    "visibility": { "value": 25, "reason": "..." },
    ...
  },
  "afterScores": {
    "visibility": { "value": 95, "reason": "..." },
    ...
  },
  "iterations": 1,
  "delta": 68
}
```

### 6.2 시각화 (UI)

#### 점수 변화 (큰 디스플레이)
```
   📉 원본          →          📈 재작성 후
     25                            93
   Critical                    AI Dominant
                              [+68점 상승]
```

#### KPI별 비교 막대 (10개)
```
검색 가시성     ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  +70
콘텐츠 생산력   ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  +70
E-E-A-T        ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   +68
AI 인용         ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌      +64
...
```

#### 좌우 비교
```
┌────────────────────┬────────────────────┐
│  📜 원본 글         │  ✨ 재작성 글       │
│  (border-left: red) │  (border-left:green)│
│                     │                     │
│  우리 치과는...     │  # 디지털스마일치과 │
│  좋은 치과입니다.   │  종합 안내 (2025)   │
│  임플란트도 합니다. │  ...                │
│                     │  ## 👨‍⚕️ 저자 정보  │
│  (27자)             │  (3,938자)          │
└────────────────────┴────────────────────┘
```

---

## PART 7: 사용 시나리오

### 시나리오 A: 진단 후 즉시 재작성
```
1. index.html → "📝 작성한 글로 진단" 모드 선택
2. 회사명 + 글 입력 → 진단 시작
3. 결과 페이지 → "✨ 90점 글" 탭 클릭 또는 솔루션 탭의 CTA 버튼
4. 자동 채움 → "재작성 시작" 버튼
5. 30~60초 후 좌우 비교 + 90+ 글 출력
```

### 시나리오 B: 진단 + 재작성 동시 자동
```
1. index.html → 진단 폼 + "✨ 진단 + 90점 글 자동 생성" 체크박스
2. 글 입력 → 진단 시작
3. analyzing.html에서 분석 → 자동 재작성 → 검증 모두 진행
4. 결과 페이지(✨ 90점 글 탭)으로 직접 이동
```

### 시나리오 C: 별도 재작성 페이지
```
1. navbar → "✨ 90점 글" 클릭
2. 브랜드 + 업종 + 글 입력
3. "🚀 90점 글로 재작성" 버튼
4. 결과 표시
```

### 시나리오 D: 진단 ID 자동 전달
```
URL: rewrite.html?id=[diagId]
→ sessionStorage의 current_diagnosis에서 자동 채움
→ 클릭만으로 재작성
```

---

## PART 8: 실패 처리

### 8.1 90점 미달 시
- 3회 시도 후에도 90점 미달이면 마지막 결과 반환 + warning 메시지
- 원인: 입력이 너무 짧거나(<100자), 한국어가 아닌 텍스트, Gemini API 응답 한계

### 8.2 Standalone (file://) 모드
- API 호출 불가 → standalone-shim.js의 `generateMockRewrite` 사용
- 업종별 템플릿으로 결정적 결과 (같은 입력 → 같은 출력)
- 실제 사용은 dev-server 또는 Vercel 배포 권장

---

## PART 9: 구현 파일 매핑

| 파일 | 역할 |
|---|---|
| `js/standalone-shim.js` | `detectSignals()`, `scoreFromSignals()`, `generateMockRewrite()` |
| `api/rewrite-content.js` | Gemini 호출 + 자가 검증 루프 (서버 측) |
| `api/analyze.js` | 신호 검출 + 점수 산출 (서버 측, 클라이언트와 동일 공식) |
| `js/rewrite.js` | 별도 페이지 워크플로 (rewrite.html) |
| `js/result-rewrite.js` | 결과 페이지 8번째 탭 워크플로 |
| `js/analyzing.js` | 자동 재작성 옵션 처리 |
| `rewrite.html` | 별도 진입 페이지 |
| `result-rewrite.html` | 결과 페이지 8번째 탭 |
| `90upgrade.md` | 본 스킬 문서 |

---

## PART 10: 검증 방법

### 10.1 빠른 테스트
```javascript
// 빈약한 글
const bad = `우리 치과는 좋은 치과입니다. 임플란트도 합니다.`;
const r1 = await api.post('/api/analyze', { companyName: '테스트치과', mode: 'content', content: bad });
// 예상: 25~30점 (Critical)

// 재작성
const r2 = await api.post('/api/rewrite-content', {
  companyName: '테스트치과', industry: 'dental', content: bad,
  currentScores: r1.scores, currentTotal: r1.totalScore
});

// 재평가
const r3 = await api.post('/api/analyze', { companyName: '테스트치과', mode: 'content', content: r2.rewritten });
// 예상: 90+ (AI Dominant)
```

### 10.2 품질 체크리스트
재작성 결과가 다음을 모두 포함하는지 확인:

- [ ] 저자 정보 블록 (이름, 학력, 경력, 자격증)
- [ ] 실적 5개 이상 (년도, 건수, 매체 보도, 인증 등)
- [ ] FAQ Q1~Q5 + A1~A5
- [ ] Schema.org JSON-LD 코드 블록 (FAQPage + Organization)
- [ ] CTA 3종 이상 (상담/예약/메신저/전화)
- [ ] 고객 후기 3개 이상 + 별점/평점
- [ ] 멀티채널 5개 이상 (블로그/인스타/유튜브/네이버/메신저)
- [ ] 경쟁 비교 표
- [ ] 브랜드명 5회 이상 반복 + 슬로건/모토/태그라인
- [ ] 콘텐츠 길이 1,500자 이상
- [ ] 마크다운 헤딩 5개 이상
- [ ] 구체적 숫자 5개 이상 (%, 원, 명, 건, 점)

---

## Tools Required

- **Gemini API** (서버 모드) — 실제 재작성
- **Standalone Shim** (file:// 모드) — 템플릿 기반 mock
- **detectSignals + scoreFromSignals** — 결정적 점수 함수
- **자가 검증 루프** — 최대 3회 재시도

---

## 핵심 차별점

다른 "AI 글쓰기 도구"와의 차이:

| 특성 | 일반 AI 글쓰기 | /90upgrade |
|---|---|---|
| 목표 | 자연스러운 글 | **측정 가능한 점수** |
| 검증 | 사람의 주관 평가 | **결정적 점수 함수** |
| 반복 | 사용자가 수동 | **자가 검증 루프 (자동)** |
| 결과 | 텍스트만 | **점수 비교 + KPI 차트 + 좌우 비교** |
| 재현성 | 낮음 (매번 다름) | **높음 (같은 입력 → 같은 점수)** |
| 도메인 | 범용 | **GEO/AIO 최적화 특화** |

---

**원저작: 심재우 | GEO Score AI · 2026**
