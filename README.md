# 📊 GEO Score AI

> AI 검색 시대 기업의 존재력을 진단하고, 존재하게 만드는 플랫폼

**슬로건**: "AI가 당신을 선택하게 만드십시오"
**철학**: 문제를 보여주고, 해결을 유일하게 만들고, 계약으로 연결한다

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

## 📐 10대 KPI (GEO Score Framework)

각 KPI는 0~100점 → 평균이 종합 점수가 됩니다.

1. **검색 가시성 지수** — 구글·네이버 노출 + AI Overview
2. **콘텐츠 생산력 지수** — 발행 빈도 + 최신성
3. **E-E-A-T 신뢰도 지수** — 전문성·경험 기반 콘텐츠
4. **AI 인용 가능성 지수** — 구조화 콘텐츠, FAQ, Q&A ⭐ 가장 중요
5. **고객 참여도 지수** — 댓글, 리뷰, SNS 반응
6. **전환 설계 지수** — CTA + 상담 유도 + 랜딩
7. **채널 확장 지수** — 블로그, 유튜브, SNS 멀티채널
8. **브랜드 일관성 지수** — 메시지·디자인 통일성
9. **경쟁 대비 점유율 지수** — 경쟁사 대비 키워드·콘텐츠량
10. **AI 최적화 준비도** — GEO 구조 + AIO 인프라

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

### `POST /api/analyze`
URL 분석 → 10 KPI 점수 산출

```json
{
  "companyName": "디지털스마일치과",
  "websiteUrl": "https://example.com",
  "industry": "dental"
}
```

### `POST /api/recommend`
진단 결과 기반 솔루션 추천

```json
{
  "scores": { ... },
  "totalScore": 42,
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

## 📂 디렉토리 구조

```
geo-score-ai/
├── index.html / results.html / dashboard.html / ...
├── api/
│   ├── analyze.js          # URL → 10 KPI 분석
│   ├── recommend.js        # 솔루션 추천 엔진
│   ├── chat.js             # RAG 챗봇
│   └── health.js
├── js/
│   ├── kpi-config.js       # 10 KPI 정의
│   ├── common.js           # Session, History, API client
│   ├── chart.js            # SVG 차트
│   ├── results.js / dashboard.js / chatbot.js / admin.js / index.js
├── css/
│   ├── main.css            # 디자인 시스템
│   └── dashboard.css
├── package.json / vercel.json / .env.example
└── dev-server.cjs          # 로컬 개발 서버
```

---

## 📝 라이센스 / 저자

- **저자**: 심재우 ([jaiwshim@gmail.com](mailto:jaiwshim@gmail.com))
- **버전**: 1.0.0 (2026)
- **라이센스**: MIT

---

> "문제를 수치로 보여주고, 해결을 자동화하고, 계약을 강제한다."
