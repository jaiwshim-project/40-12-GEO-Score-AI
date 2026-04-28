# 📊 GEO Score AI (v3.0 — 3축 독립 KPI)

> AI 검색 시대 기업의 존재력을 진단하고, 존재하게 만드는 플랫폼

**슬로건**: "AI가 당신을 선택하게 만드십시오"
**철학**: 문제를 보여주고, 해결을 유일하게 만들고, 계약으로 연결한다

**v3.0 주요 변경**: 진단 대상을 **홈페이지 / 블로그 / 글** 3축으로 분리하여 각 축에 독립된 KPI 세트를 적용합니다.

---

## 🎯 핵심 가치

기업의 마케팅·홍보 활동을 객관적인 수치로 드러내고, 부족한 영역을 AI가 채워주는 구조로 계약을 유도하는 **세일즈 퍼널 엔진**입니다.

기존 SEO 툴과 달리:
- 트래픽 분석이 아닌 **AI 인용 가능성 분석**
- 키워드 분석이 아닌 **GEO 기반 전략 제안**
- 분석 도구가 아닌 **자동 계약 연결 시스템**

---

## ✨ 주요 기능

| # | 기능 | 파일 |
|---|---|---|
| 1 | **메인 진단 폼** (Hero + URL 입력) | `index.html` |
| 2 | **진단 결과 페이지** (10 KPI 점수 + 레이더 차트) | `results.html` |
| 3 | **대시보드** (진단 이력 + 추이) | `dashboard.html` |
| 4 | **매뉴얼** (사용 가이드 + FAQ) | `manual.html` |
| 5 | **아키텍처 SVG** (4계층 구조도 + 시퀀스) | `architecture.html` |
| 6 | **AI 챗봇** (RAG + 진단 컨텍스트 연동) | `chatbot.html` |
| 7 | **관리자 대시보드** (전체 통계 + 시스템) | `admin.html` |

---

## 📐 3축 18 KPI (GEO Score Framework v3.0)

진단 대상에 따라 **독립된 KPI 세트**가 적용됩니다. 각 KPI는 0~100점, 가중치 합 100% → 가중평균이 종합 점수.

### 🏠 홈페이지 KPI (인프라 축, 7개)

| ID | KPI | 가중치 | 핵심 신호 |
|---|---|---|---|
| hp_botAccess | AI 봇 접근 | 18 | robots.txt + 7종 AI 봇 (GPTBot/ClaudeBot/PerplexityBot 등) 허용 |
| hp_sitemap | Sitemap 상태 | 12 | sitemap.xml 정상 + URL 50+ + lastmod 갱신 |
| hp_schema | 구조화 데이터 | 16 | JSON-LD / Schema.org / FAQPage / Organization / Article |
| hp_indexExposure | 검색 색인 | 14 | 구글/네이버 색인 페이지 수 |
| hp_cmsAutonomy | CMS 자율성 | 12 | 운영자 직접 글/페이지 추가·수정 가능 여부 |
| hp_ctaDesign | CTA 설계 | 14 | 상담/예약/문의 CTA + 랜딩 페이지 완비도 |
| hp_eeatPage | E-E-A-T 페이지 | 14 | 대표/자격/연혁/연락처/오시는길 등 신뢰 페이지 |

### 📝 블로그 KPI (운영 축, 5개)

| ID | KPI | 가중치 | 핵심 신호 |
|---|---|---|---|
| bl_publishFreq | 발행 빈도·최신성 | 25 | 30일 주기 발행 + 최신 글 1주 이내 |
| bl_categoryDepth | 카테고리 깊이 | 18 | 카테고리 5+ × 카테고리당 글 10+ |
| bl_internalLinks | 내부 링크망 | 18 | 글당 내부 링크 3+ + 토픽 클러스터 |
| bl_authorAuthority | 작성자 권위 | 19 | 저자 프로필 + 자격 + E-E-A-T 신호 |
| bl_channelExpansion | 채널 확장 | 20 | 블로그 + 유튜브 + SNS 멀티채널 |

### 📄 글 KPI (본문 축, 6개) — ai_writing 5신호 + FAQ

| ID | KPI | 가중치 | 핵심 신호 |
|---|---|---|---|
| ar_definitionH2 | 정의문 H2 | 17 | H2 첫 문장 "X는 ~이다" 패턴 ≥ 50% |
| ar_questionH2 | 질문형 H2 | 18 | H2에 ?/어떻게/왜/언제/무엇 ≥ 50% |
| ar_brandRepetition | 브랜드 반복 | 15 | H2 섹션 중 브랜드명 등장 ≥ 50% |
| ar_externalCitation | 외부 인용 | 17 | 후기/언론/"~에 따르면" ≥ 30% |
| ar_ctaReach | CTA 도달률 | 17 | 800자 블록당 CTA 등장 ≥ 50% |
| ar_faq | FAQ 구조 | 16 | FAQ 섹션 + Q&A 5+ + Schema FAQPage |

### 등급 체계

| 점수 | 등급 | 의미 |
|---|---|---|
| 90~100 | 👑 AI Dominant | 시장 지배 수준 |
| 70~89 | 💪 Strong | 상위권 |
| 50~69 | 📈 Growing | 성장 가능 |
| 30~49 | ⚠️ Weak | 위험 단계 |
| 0~29 | 🚨 Critical | 거의 없음 |

---

## 🚀 빠른 시작

### 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env.example을 .env로 복사 후 수정)
cp .env.example .env
# GEMINI_API_KEY=실제_키_입력

# 3. Vercel CLI로 로컬 개발 서버 실행 (API 라우트 동작)
npx vercel dev

# OR — API 없이 정적 페이지만 보고 싶다면
node dev-server.cjs
# http://127.0.0.1:8765 접속
```

### Vercel 배포

```bash
# Vercel CLI로 배포
npx vercel --prod

# 환경 변수 설정 (대시보드 또는 CLI)
npx vercel env add GEMINI_API_KEY production
npx vercel env add ADMIN_DASH_PASS production
npx vercel env add GEO_AIO_URL production
```

---

## 🔌 API 엔드포인트

### `POST /api/analyze` (v3.0 — target 분기)
3축 진단 대상별로 해당 KPI 세트만 산출.

```json
{
  "companyName": "디지털스마일치과",
  "websiteUrl": "https://example.com",
  "industry": "dental",
  "target": "homepage"   // "homepage" | "blog" | "article"
}
```

응답:
```json
{
  "id": "...",
  "target": "homepage",
  "totalScore": 73,
  "grade": { "key": "growing", "label": "B 보통" },
  "scores": { "hp_botAccess": { "value": 85, "reason": "..." }, ... },
  "kpiList": [{ "id": "hp_botAccess", "name": "AI 봇 접근", "weight": 18 }, ...],
  "weights": { "hp_botAccess": 18, ... },
  "summary": { "headline": "...", "diagnosis": "..." }
}
```

`target='article'`일 때는 `mode: 'content'` + `content` 필드로 본문 텍스트도 직접 입력 가능.

### `POST /api/recommend`
진단 결과 기반 솔루션 추천 (target별 약점 우선 추천)

```json
{
  "scores": { ... },
  "totalScore": 42,
  "target": "homepage",
  "companyName": "...",
  "industry": "..."
}
```

### `POST /api/chat`
RAG 챗봇 (진단 컨텍스트 연동 가능)

```json
{
  "message": "GEO와 SEO는 어떻게 다른가요?",
  "history": [],
  "diagnosisContext": null
}
```

### `GET /api/health`
서비스 상태 + 환경 변수 확인

---

## 🏗️ 아키텍처 (4계층)

```
Layer 1 · Frontend (정적 HTML)
  index / results / dashboard / manual / architecture / chatbot / admin
              ↓
Layer 2 · Logic (Vanilla JS)
  kpi-config / common / chart / index / results / dashboard / chatbot / admin
              ↓
Layer 3 · Backend API (Vercel Serverless)
  /api/analyze · /api/recommend · /api/chat · /api/health
              ↓
Layer 4 · AI & Integration
  Gemini 1.5 Flash · Web Crawler · GEO-AIO Platform
```

자세한 다이어그램은 `architecture.html`에서 확인.

---

## 🔐 환경 변수

| 키 | 필수 | 설명 |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Gemini AI 분석용 (없으면 휴리스틱 점수만 제공) |
| `ADMIN_DASH_PASS` | ⚠️ | 관리자 비밀번호 (기본값: `admin0425`) |
| `GEO_AIO_URL` | ⚠️ | GEO-AIO 솔루션 연결 URL |

---

## 💼 GEO-AIO 솔루션 패키지

진단 결과에 따라 자동 추천:

| 점수 | 패키지 | 가격 |
|---|---|---|
| 0~29 | AI Dominance Package | 월 1000만원 + 초기 300만 |
| 30~49 | AI Growth Package | 월 500만원 + 초기 150만 |
| 50~69 | AI Boost Package | 월 200만원 |
| 70+ | AI Maintain Package | 월 100만원 |

---

## 🛠️ 개발 노트

- **순수 Vanilla JS** — 외부 차트 라이브러리 없이 SVG 자체 렌더 (`js/chart.js`)
- **localStorage 기반 이력** — 최대 50건 (브라우저별 격리)
- **Gemini fallback** — API 키 없을 때 휴리스틱 점수 자동 적용
- **인코딩 보정** — Vercel latin1 → UTF-8 자동 변환 (한글 안전)
- **반응형 디자인** — 768px 분기점에서 모바일 최적화

---

## 📂 디렉토리 구조 (v3.0)

```
geo-score-ai/
├── index.html / results.html / dashboard.html / ...
├── api/
│   ├── analyze.js          # 3축 분기 (homepage/blog/article) → 해당 축 KPI 산출
│   ├── recommend.js        # 솔루션 추천 (target-aware)
│   ├── chat.js             # RAG 챗봇
│   ├── save-diagnosis.js   # Supabase 저장 (target_type 컬럼)
│   ├── list-diagnostics.js # Supabase 조회 (target_type 필터)
│   ├── health.js
│   └── _lib/
│       └── target-scoring.js  # 서버 측 3축 KPI 스코어링 (article/blog 전용 로직 + homepage 파생)
├── js/
│   ├── kpi-homepage.js     # 7 KPI (인프라 축) + 신호 검출/점수
│   ├── kpi-blog.js         # 5 KPI (운영 축)
│   ├── kpi-article.js      # 6 KPI (본문 축)
│   ├── kpi-config.js       # 3축 통합 레지스트리 + 후방호환 단일 KPI
│   ├── common.js / chart.js / index.js / analyzing.js / results.js
│   ├── result-overview.js / result-kpi.js / ... (target-aware 렌더)
│   └── dashboard.js / chatbot.js / admin.js
├── css/
│   ├── main.css / dashboard.css
├── supabase/
│   └── schema.sql          # target_type 컬럼 + diagnostics_by_target 뷰
├── package.json / vercel.json / .env.example
└── dev-server.cjs
```

---

## 📝 라이센스 / 저자

- **저자**: 심재우 ([jaiwshim@gmail.com](mailto:jaiwshim@gmail.com))
- **버전**: 1.0.0 (2026)
- **라이센스**: MIT

---

> "문제를 수치로 보여주고, 해결을 자동화하고, 계약을 강제한다."
