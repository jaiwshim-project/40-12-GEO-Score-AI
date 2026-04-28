/**
 * 업그레이드 제안 탭 — 진단 결과 기반으로
 *  1) 한계점 분석
 *  2) 업그레이드 vs 신규 개발 자동 판단
 *  3) 영역별 작업 가이드 (10 KPI)
 *  4) Claude Code 바이브 코딩 마스터 프롬프트 자동 생성
 */
(function () {

  // KPI별 90점 도달 작업 카드 (homepage 축 10 KPI)
  // 각 카드: 90점 작업 + 코드/설정 예시 + 작업 시간 + 난이도
  const KPI_GUIDE = {
    hp_botAccess: {
      label: 'AI 봇 접근 (robots.txt)',
      target: 95,
      tasks: [
        '/robots.txt에 GPTBot · ClaudeBot · ChatGPT-User · PerplexityBot · Google-Extended · Amazonbot · CCBot 7종 모두 Allow',
        '기존 Disallow 규칙 점검 — AI 봇이 차단된 경로(/blog, /service 등) 해제',
        'Cloudflare/CDN의 봇 차단 규칙도 함께 해제 (Bot Fight Mode 검토)'
      ],
      sample: `# /robots.txt — AI 검색 7종 모두 허용
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`,
      time: '15분',
      diff: '낮음'
    },
    hp_sitemap: {
      label: 'Sitemap 정상화',
      target: 90,
      tasks: [
        '/sitemap.xml 자동 생성 (Next.js: app/sitemap.ts / WordPress: Yoast SEO 플러그인)',
        '최소 50개 이상 URL 등록 + lastmod · changefreq · priority 모두 채우기',
        'sitemap을 robots.txt 마지막 줄에 명시 + Search Console·Bing에 제출'
      ],
      sample: `// Next.js — app/sitemap.ts
import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://your-domain.com/',         lastModified: new Date(), priority: 1.0 },
    { url: 'https://your-domain.com/about',    lastModified: new Date(), priority: 0.8 },
    { url: 'https://your-domain.com/services', lastModified: new Date(), priority: 0.8 },
    // ... 50+ URLs
  ]
}`,
      time: '30~60분',
      diff: '중간'
    },
    hp_indexExposure: {
      label: '검색 색인량 확보',
      target: 80,
      tasks: [
        'Google Search Console / 네이버 서치어드바이저 등록 + sitemap 제출',
        '내부 링크 풍부화 — 메인 → 서비스 → 사례 → 블로그 글 깊이 4단계 이상',
        '신규 콘텐츠 30일 주기 발행 (블로그 또는 사례·인사이트 페이지)'
      ],
      sample: `// 색인 가속 가이드
// 1. https://search.google.com/search-console → 속성 추가 → sitemap 제출
// 2. https://searchadvisor.naver.com → 사이트 등록 → sitemap 제출
// 3. URL 검사 도구로 핵심 10개 URL "색인 요청" 직접 트리거
// 4. <link rel="canonical"> 모든 페이지에 명시 — 중복 색인 방지`,
      time: '1~2일 (제출) + 7~14일 (반영)',
      diff: '중간'
    },
    hp_schema: {
      label: '구조화 데이터 (Schema.org JSON-LD)',
      target: 95,
      tasks: [
        'Organization Schema — 전역 적용 (회사명·로고·연락처·소셜 프로필)',
        'LocalBusiness Schema — 매장형 비즈니스라면 주소·운영시간·평점 추가',
        'FAQPage Schema — FAQ 섹션 5개 이상 + Question/Answer 마크업',
        'BreadcrumbList Schema — 경로 표시',
        'Article Schema — 블로그 글마다 author·datePublished·image 마크업'
      ],
      sample: `<!-- Organization Schema (모든 페이지 공통 head) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "회사명",
  "url": "https://your-domain.com",
  "logo": "https://your-domain.com/logo.png",
  "telephone": "+82-2-1234-5678",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "서울시 ...",
    "addressCountry": "KR"
  },
  "sameAs": [
    "https://www.instagram.com/...",
    "https://www.facebook.com/..."
  ]
}
</script>`,
      time: '2~4시간',
      diff: '중간'
    },
    hp_pageInfo: {
      label: '페이지 메타 7신호',
      target: 95,
      tasks: [
        '모든 페이지 고유 title (50~60자) + description (140~160자)',
        'canonical 링크 명시 (중복 색인 방지)',
        'OG 4종: og:title · og:description · og:image · og:url',
        'H1은 페이지당 1개 + H2 3~7개 (질문형/정의문 권장)'
      ],
      sample: `<head>
  <title>회사명 — 핵심 가치 제안 (50~60자)</title>
  <meta name="description" content="페이지 핵심을 140~160자로 자연어 요약. 검색 결과·AI 답변에서 그대로 인용됨." />
  <link rel="canonical" href="https://your-domain.com/page" />

  <meta property="og:title" content="..." />
  <meta property="og:description" content="..." />
  <meta property="og:image" content="https://your-domain.com/og-image.jpg" />
  <meta property="og:url" content="https://your-domain.com/page" />
  <meta property="og:type" content="website" />
</head>`,
      time: '1~2시간',
      diff: '낮음'
    },
    hp_externalAuthority: {
      label: '외부 권위 (백링크 · 언론)',
      target: 70,
      tasks: [
        '뉴스와이어 · 디지털타임스 · 머니투데이 보도자료 발행 (월 1회)',
        '업종 전문 매체 인터뷰·기고 노출 — 영구 백링크 확보',
        '협회·인증 페이지에 공식 회원사 등재',
        '블로거·인플루언서 협업 (해시태그·링크 포함)'
      ],
      sample: `# 백링크 빌딩 12주 로드맵
## 1~4주
- 보도자료 1건 (뉴스와이어 무료 발신 → 30+ 매체 게재)
- 업종 협회 회원 가입 + 회원사 페이지 등재 요청
## 5~8주
- 업종 매체 인터뷰 1건 (직접 컨택 또는 PR 대행)
- 게스트 포스트 2건 (업종 블로그 기고)
## 9~12주
- 인플루언서 1명 협업 (실사용 후기 + DoFollow 링크)
- 사용자 후기 모음 페이지 신설 (자체 백링크 자산화)`,
      time: '12주 (지속)',
      diff: '높음'
    },
    hp_eeatPage: {
      label: 'E-E-A-T 신호 (저자/자격/연혁/연락처)',
      target: 90,
      tasks: [
        '/about 또는 /team 페이지 신설 — 대표·핵심 인력 프로필 + 사진 + 자격',
        '저자 메타: 블로그 글마다 author 마크업 + 프로필 링크',
        '자격증·면허·인증 이미지 노출 (footer 또는 about 페이지)',
        '운영 연혁 타임라인 (since 2015 등)',
        'footer에 전화·이메일·주소·사업자등록번호 모두 명시'
      ],
      sample: `<!-- /about 페이지 — 저자 프로필 -->
<section itemscope itemtype="https://schema.org/Person">
  <h1 itemprop="name">홍길동 대표 / 치과의사 (서울대 박사)</h1>
  <img itemprop="image" src="/profile.jpg" alt="홍길동 대표" />
  <p itemprop="description">
    서울대학교 치의학 박사 · 미국 보철과 전문의 · 18년 임상 경력
  </p>
  <ul>
    <li itemprop="alumniOf">서울대학교 치의학대학원 박사 (2008)</li>
    <li itemprop="hasCredential">미국 보철과 전문의 (2012)</li>
    <li itemprop="memberOf">대한치과보철학회 정회원</li>
  </ul>
</section>`,
      time: '4~8시간',
      diff: '중간'
    },
    hp_ctaDesign: {
      label: 'CTA 설계 (전환 경로)',
      target: 90,
      tasks: [
        '4종 CTA 모두 배치: 전화·예약·상담폼·메신저 (페이지당 최소 2개)',
        'Sticky CTA 모바일 하단 고정 — 스크롤해도 항상 노출',
        '상담폼 5필드 이내 (이름·전화·메시지·동의·전송) — 이탈 최소화',
        'CTA 버튼 색상: 강조색(주황/빨강 계열) + 충분한 padding'
      ],
      sample: `<!-- Sticky 모바일 CTA -->
<div class="sticky-cta">
  <a href="tel:0212345678" class="cta-call">📞 전화</a>
  <a href="#booking" class="cta-book">📅 예약</a>
  <a href="#contact" class="cta-form">📝 상담</a>
  <a href="https://pf.kakao.com/_xxxxx" class="cta-msg">💬 메신저</a>
</div>
<style>
  .sticky-cta { position: fixed; bottom: 0; left: 0; right: 0;
    display: grid; grid-template-columns: repeat(4, 1fr);
    background: #fff; box-shadow: 0 -2px 12px rgba(0,0,0,0.08); z-index: 100; }
  .sticky-cta a { padding: 14px; text-align: center; font-weight: 700; }
</style>`,
      time: '2~4시간',
      diff: '낮음'
    },
    hp_mobilePerf: {
      label: '모바일 성능 (Lighthouse 90+)',
      target: 90,
      tasks: [
        '이미지 최적화: WebP/AVIF 변환 + lazy loading + width/height 명시',
        'CSS/JS 번들 최소화 — 사용 안 하는 라이브러리 제거',
        'Preload critical fonts + display: swap',
        'CDN 적용 (Vercel · Cloudflare)',
        'Lighthouse 모바일 점수 90+ 도달 (LCP < 2.5s, CLS < 0.1, INP < 200ms)'
      ],
      sample: `// Next.js — Image 최적화
import Image from 'next/image'

<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  alt="..."
  priority
  placeholder="blur"
  blurDataURL="data:image/..."
/>

// 폰트 swap
@font-face {
  font-family: 'Pretendard';
  src: url('...') format('woff2');
  font-display: swap;
}`,
      time: '1~2일',
      diff: '높음'
    },
    hp_cmsAutonomy: {
      label: 'CMS 자율성 (자체 운영 가능)',
      target: 90,
      tasks: [
        '임대형 사이트빌더(Wix · 카페24 · 임대형 솔루션) 탈출 → 자체 도메인 + 자체 호스팅',
        'Headless CMS (Sanity · Contentful · Strapi) 또는 WordPress 자체 호스팅',
        '관리자 페이지에서 운영자가 직접 콘텐츠/메타 수정 가능',
        '도메인은 유지 (DNS만 새 호스팅 가리키게 변경) — SEO 가치 보존'
      ],
      sample: `# CMS 마이그레이션 권장 옵션
## 옵션 A — Next.js + Sanity (개발 친화)
- 페이지: Next.js App Router (정적 생성 + 빠른 로딩)
- CMS: Sanity (헤드리스, 운영자 GUI 제공)
- 호스팅: Vercel (자동 배포 + CDN)
- 비용: 월 0~25달러

## 옵션 B — WordPress 자체 호스팅 (운영자 친화)
- 호스팅: AWS Lightsail · 가비아 호스팅 (월 1~3만원)
- 테마: Astra · GeneratePress (가벼움)
- 플러그인: Yoast SEO · WP Rocket · Elementor
- 비용: 월 1~5만원

## 옵션 C — Webflow / Framer (디자이너 친화)
- 노코드 + 풀 커스텀 가능
- SEO·sitemap 기본 지원
- 비용: 월 14~39달러`,
      time: '1~2주 마이그레이션',
      diff: '높음'
    }
  };

  /** 업그레이드 vs 신규 개발 자동 판단 */
  function decideStrategy(result) {
    const s = result.scores || {};
    const t = result.totalScore || 0;
    const newDevReasons = [];
    const upgradeReasons = [];

    // 신규 개발 권장 트리거
    if (t < 40) newDevReasons.push(`총점 ${t}점 — F 위급 (40점 미만)`);
    if ((s.hp_botAccess?.value || 0) < 30) newDevReasons.push(`AI 봇 접근 ${s.hp_botAccess?.value || 0}점 — 5종+ 차단으로 추정 (robots.txt 구조적 차단)`);
    if ((s.hp_cmsAutonomy?.value || 0) < 30) newDevReasons.push(`CMS 자율성 ${s.hp_cmsAutonomy?.value || 0}점 — 임대형/락인 사이트로 추정 (수정 한계)`);
    if ((s.hp_indexExposure?.value || 0) < 20) newDevReasons.push(`색인 ${s.hp_indexExposure?.value || 0}점 — 5건 미만 추정 (검색 발견 자체 불가)`);
    if ((s.hp_schema?.value || 0) < 25 && (s.hp_pageInfo?.value || 0) < 35) newDevReasons.push(`구조화 + 메타 모두 임계 미만 — 페이지 단위 수정 한계`);

    // 업그레이드 가능 신호
    if ((s.hp_pageInfo?.value || 0) >= 60) upgradeReasons.push(`페이지 메타 ${s.hp_pageInfo?.value}점 — 메타 인프라 양호`);
    if ((s.hp_indexExposure?.value || 0) >= 40) upgradeReasons.push(`색인 ${s.hp_indexExposure?.value}점 — 검색 발견 기반 보유`);
    if ((s.hp_eeatPage?.value || 0) >= 50) upgradeReasons.push(`E-E-A-T ${s.hp_eeatPage?.value}점 — 신뢰 신호 일부 보유`);
    if ((s.hp_ctaDesign?.value || 0) >= 60) upgradeReasons.push(`CTA ${s.hp_ctaDesign?.value}점 — 전환 경로 양호`);
    if ((s.hp_cmsAutonomy?.value || 0) >= 50) upgradeReasons.push(`CMS 자율성 ${s.hp_cmsAutonomy?.value}점 — 자체 수정 가능`);

    let recommend;
    if (newDevReasons.length >= 2) recommend = 'new';
    else if (newDevReasons.length === 1 && t < 55) recommend = 'new';
    else if (t >= 70) recommend = 'upgrade';
    else if (upgradeReasons.length >= 3) recommend = 'upgrade';
    else recommend = 'upgrade'; // 기본은 업그레이드 시도

    return { recommend, newDevReasons, upgradeReasons, totalScore: t };
  }

  /** 90점 도달 효과 시뮬레이션 — 어떤 KPI를 올리면 몇 점 상승? */
  function simulate90Path(result) {
    const s = result.scores || {};
    const weights = result.weights || {};
    const path = [];

    Object.entries(s).forEach(([id, score]) => {
      const cur = score.value || 0;
      const w = weights[id] || 0;
      const target = KPI_GUIDE[id]?.target || 90;
      if (cur < target && w > 0) {
        const gain = ((target - cur) * w) / 100;
        path.push({ id, label: KPI_GUIDE[id]?.label || id, current: cur, target, weight: w, gain: Math.round(gain * 10) / 10 });
      }
    });
    path.sort((a, b) => b.gain - a.gain);
    return path;
  }

  /** Claude Code 바이브 코딩 마스터 프롬프트 자동 생성 */
  function buildMasterPrompt(result, decision, path) {
    const company = result.companyName || '-';
    const url = result.websiteUrl || '-';
    const total = result.totalScore || 0;
    const grade = result.grade?.label || '-';
    const strategy = decision.recommend === 'new' ? '신규 개발' : '업그레이드';

    let prompt = `# 홈페이지 GEO 최적화 작업 지시서 (Claude Code 바이브 코딩 입력)

## 1. 진단 현황
- 회사: **${company}**
- 도메인: ${url}
- 현재 GEO 종합 점수: **${total}점 / 100점 (${grade})**
- 진단 일시: ${new Date(result.analyzedAt || Date.now()).toLocaleString('ko-KR')}
- 진단 출처: GEO Score AI 플랫폼 v3.1

## 2. 권장 전략: **${strategy}**
`;
    if (decision.recommend === 'new') {
      prompt += `\n### 신규 개발 권장 근거\n`;
      decision.newDevReasons.forEach(r => prompt += `- ${r}\n`);
      prompt += `\n→ 기존 사이트 부분 개선만으로는 90점 도달이 구조적으로 어렵습니다. 도메인은 유지하되 시스템 전체를 AI 친화적으로 신규 개발하는 것이 효율적입니다.\n`;
    } else {
      prompt += `\n### 업그레이드 가능 근거\n`;
      if (decision.upgradeReasons.length) decision.upgradeReasons.forEach(r => prompt += `- ${r}\n`);
      else prompt += `- 총점 ${total}점 — 부분 개선으로 70~85점 도달 가능 범위\n`;
      prompt += `\n→ 약점 KPI 2~3개 집중 개선으로 1위권 도달이 가능합니다.\n`;
    }

    // 3. 우선 작업 — 점수 상승 효과 큰 순
    prompt += `\n## 3. 우선 작업 (점수 상승 효과 큰 순서대로)\n`;
    path.slice(0, 6).forEach((p, i) => {
      const guide = KPI_GUIDE[p.id];
      if (!guide) return;
      prompt += `\n### ${i + 1}. ${guide.label} — 현재 ${p.current}점 → 목표 ${p.target}점 (예상 상승 +${p.gain}점)\n`;
      prompt += `- 가중치: ${p.weight}% · 작업 시간: ${guide.time} · 난이도: ${guide.diff}\n`;
      guide.tasks.forEach(t => prompt += `- ${t}\n`);
      prompt += `\n**예시 코드:**\n\`\`\`\n${guide.sample}\n\`\`\`\n`;
    });

    // 4. 신규 개발 시 마스터 사양
    if (decision.recommend === 'new') {
      prompt += `\n## 4. 신규 개발 마스터 사양

### 4.1 기술 스택 (권장)
- **프레임워크**: Next.js 14+ (App Router) — SSG/ISR로 빠른 로딩 + 자동 sitemap
- **스타일링**: Tailwind CSS 또는 CSS Modules
- **CMS**: Sanity (헤드리스, 운영자 GUI) 또는 자체 마크다운
- **호스팅**: Vercel (자동 배포 + Edge CDN)
- **분석**: Google Analytics 4 + Search Console

### 4.2 페이지 구조 (필수 8 페이지)
1. **/ (홈)** — 핵심 가치 제안 + 4종 CTA + 강점 3가지
2. **/about** — E-E-A-T 페이지 (대표·자격·연혁·인증)
3. **/services** — 서비스 일람 + 각 서비스 상세 페이지
4. **/services/[slug]** — 서비스별 상세 + FAQ + 전후 사례
5. **/blog** — 블로그 일람
6. **/blog/[slug]** — 글 상세 (Article Schema + 작성자 메타)
7. **/contact** — 상담 폼 + 지도 + 운영시간 + LocalBusiness Schema
8. **/faq** — 자주 묻는 질문 (FAQPage Schema)

### 4.3 필수 SEO/GEO 신호 (모든 페이지)
- robots.txt: AI 봇 7종 모두 Allow
- sitemap.xml: 자동 생성 + lastmod 갱신
- 메타 7신호: title · description · canonical · og:title/desc/image/url
- Schema.org JSON-LD: Organization (전역) · LocalBusiness (해당 시) · FAQPage (FAQ 페이지) · Article (블로그)
- H1 페이지당 1개 + H2 3~7개 (질문형/정의문)
- Lighthouse 모바일 90+ 목표

### 4.4 디자인 시스템
- **색상**: 브랜드 메인 + 강조색 (CTA용) + 중립 그레이스케일
- **타이포**: Pretendard 또는 시스템 폰트
- **컴포넌트**: Button(3종) · Card · Hero · Sticky CTA · Form · Footer

### 4.5 운영 가이드
- **도메인 유지**: 기존 도메인 그대로 사용 (DNS A 레코드만 Vercel로 변경)
- **301 리다이렉트**: 옛 URL → 새 URL 매핑 (SEO 가치 보존)
- **백업**: 옛 사이트 정적 캡처 (Wayback Machine 또는 wget)
- **점검**: 배포 후 24시간 내 Search Console URL 검사 — 색인 요청 트리거
`;
    } else {
      prompt += `\n## 4. 업그레이드 시 작업 순서 (4 Phase, 4주)

### Phase 1 (1주차) — 즉시 효과
- robots.txt + sitemap.xml + 메타 7신호 일괄 정비
- Schema.org Organization 전역 추가
- Search Console / 네이버 서치어드바이저 등록 + sitemap 제출

### Phase 2 (2주차) — 신뢰 강화
- /about 페이지 신설 또는 보강 (저자·자격·연혁·연락처)
- footer에 사업자번호·연락처·주소 명시
- FAQPage Schema (FAQ 5+ 마크업)

### Phase 3 (3주차) — 콘텐츠 가속
- 블로그 발행 시작 (월 4편 이상) + Article Schema 마크업
- 4종 CTA + Sticky 모바일 CTA 적용
- 내부 링크 구조 정비 (메인 → 서비스 → 사례 → 블로그 4단계)

### Phase 4 (4주차) — 외부 권위
- 보도자료 1건 발행 + 협회 회원사 등재
- Lighthouse 모바일 90+ 도달 (이미지 최적화 + JS 번들 슬림)
- 재진단 → 점수 변화 확인
`;
    }

    prompt += `\n## 5. 검증 체크리스트
- [ ] /robots.txt — AI 봇 7종 모두 Allow (curl로 확인)
- [ ] /sitemap.xml — 50+ URL 등록 + lastmod 갱신
- [ ] 모든 페이지 — 고유 title/description + canonical + og 4종
- [ ] Schema.org — Organization 전역 + 해당 페이지 LocalBusiness/FAQ/Article
- [ ] H1 페이지당 1개 + H2 3~7개 (질문형/정의문 권장)
- [ ] CTA — 4종(전화/예약/폼/메신저) + 모바일 Sticky
- [ ] /about — 대표·자격·연혁·연락처 모두 노출
- [ ] Lighthouse 모바일 — Performance 90+ / SEO 100 / Accessibility 90+
- [ ] Search Console — sitemap 제출 + 핵심 10 URL 색인 요청
- [ ] 재진단 — GEO Score AI에서 동일 URL 다시 진단 → 70+ 도달 확인

## 6. 작업 결과 산출물
- [ ] 라이브 사이트 URL
- [ ] Lighthouse 리포트 PDF
- [ ] Search Console 색인 현황 스크린샷
- [ ] GEO Score AI 재진단 결과 (현재 vs 개선 후 비교)

---

위 사양서를 기준으로 ${decision.recommend === 'new' ? '신규 사이트 개발을' : '기존 사이트 업그레이드 작업을'} 시작해 주세요.
실제 작업 시 본 회사의 비즈니스 도메인 · 색상 · 폰트 · 로고 · 콘텐츠를 반영해 커스터마이즈 해 주시고,
완료 후 라이브 URL을 https://40-12-geo-score-ai.vercel.app 에서 재진단해 점수 변화를 확인해 주세요.
`;
    return prompt;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render(result) {
    const target = document.getElementById('upgradeTabContent');
    if (!target) return;

    const decision = decideStrategy(result);
    const path = simulate90Path(result);
    const masterPrompt = buildMasterPrompt(result, decision, path);

    const total = result.totalScore || 0;
    const company = result.companyName || '-';
    const isNew = decision.recommend === 'new';

    // 90점 도달 시뮬레이션 — 상위 6개 KPI만 90점 도달했을 때 예상 점수
    const top6Gain = path.slice(0, 6).reduce((a, p) => a + p.gain, 0);
    const projected = Math.min(95, Math.round(total + top6Gain));

    target.innerHTML = `
      <!-- A. 한 줄 진단 -->
      <div style="padding: 18px 22px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; margin-bottom: 24px;">
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 4px;">현재 점수</div>
            <div style="font-size: 2rem; font-weight: 900; font-family: monospace; color: ${total >= 70 ? '#00d68f' : total >= 40 ? '#ffa800' : '#ff3d71'};">${total}<span style="font-size: 0.95rem; color: var(--text-tertiary); font-weight: 400;"> / 100</span></div>
          </div>
          <div style="font-size: 1.6rem; color: var(--text-tertiary);">→</div>
          <div>
            <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 4px;">90점 작업 후 예상</div>
            <div style="font-size: 2rem; font-weight: 900; font-family: monospace; color: #00d68f;">${projected}<span style="font-size: 0.95rem; color: var(--text-tertiary); font-weight: 400;"> / 100</span></div>
          </div>
          <div style="margin-left: auto; font-size: 0.85rem; color: var(--text-secondary); max-width: 360px;">
            <strong>${escapeHtml(company)}</strong>의 홈페이지를 90점 이상 GEO 친화 사이트로 끌어올리는 경로를 자동으로 분석했습니다.
          </div>
        </div>
      </div>

      <!-- B. 한계점 분석 -->
      <h3 style="margin: 32px 0 12px; font-size: 1.2rem;">⚠️ 한계점 분석 — 왜 현재 ${total}점이 천장처럼 보이는가</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; margin-bottom: 24px;">
        ${path.slice(0, 4).map(p => `
          <div style="padding: 14px 16px; background: var(--bg-card); border-left: 4px solid #ff3d71; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
              <strong style="font-size: 0.92rem;">${escapeHtml(p.label)}</strong>
              <span style="font-family: monospace; font-weight: 800; color: #ff3d71;">${p.current}점</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-tertiary);">가중치 ${p.weight}% · 90점 도달 시 +${p.gain}점 상승</div>
          </div>
        `).join('')}
      </div>

      <!-- C. 의사결정 매트릭스 — 업그레이드 vs 신규 개발 -->
      <h3 style="margin: 32px 0 12px; font-size: 1.2rem;">🎯 권장 방향 — ${isNew ? '신규 개발' : '업그레이드'}</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">

        <!-- 업그레이드 -->
        <div style="padding: 20px; background: ${!isNew ? 'linear-gradient(135deg, rgba(0,214,143,0.10), rgba(0,214,143,0.04))' : 'var(--bg-card)'}; border: 2px solid ${!isNew ? '#00d68f' : 'var(--border-primary)'}; border-radius: 14px; opacity: ${!isNew ? '1' : '0.6'};">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <span style="font-size: 1.6rem;">🔧</span>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem;">기존 사이트 업그레이드</div>
              <div style="font-size: 0.78rem; color: var(--text-tertiary);">200~500만원 · 2~4주</div>
            </div>
            ${!isNew ? '<span style="margin-left: auto; padding: 4px 10px; background: #00d68f; color: white; border-radius: 999px; font-size: 0.7rem; font-weight: 800;">권장</span>' : ''}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
            ${decision.upgradeReasons.length ? decision.upgradeReasons.slice(0, 3).map(r => `✓ ${escapeHtml(r)}`).join('<br/>') : '✓ 부분 개선으로 70~85점 도달 가능 범위'}
          </div>
        </div>

        <!-- 신규 개발 -->
        <div style="padding: 20px; background: ${isNew ? 'linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,168,0,0.06))' : 'var(--bg-card)'}; border: 2px solid ${isNew ? '#ff6b35' : 'var(--border-primary)'}; border-radius: 14px; opacity: ${isNew ? '1' : '0.6'};">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <span style="font-size: 1.6rem;">🚀</span>
            <div>
              <div style="font-weight: 800; font-size: 1.05rem;">AI 최적화 신규 개발</div>
              <div style="font-size: 0.78rem; color: var(--text-tertiary);">400만원 · 3주</div>
            </div>
            ${isNew ? '<span style="margin-left: auto; padding: 4px 10px; background: #ff6b35; color: white; border-radius: 999px; font-size: 0.7rem; font-weight: 800;">권장</span>' : ''}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
            ${decision.newDevReasons.length ? decision.newDevReasons.slice(0, 3).map(r => `⚠️ ${escapeHtml(r)}`).join('<br/>') : '구조적 결함이 다수일 때 신규 개발이 효율적'}
          </div>
        </div>
      </div>

      <!-- D. 영역별 작업 가이드 (점수 상승 효과 큰 순) -->
      <h3 style="margin: 32px 0 12px; font-size: 1.2rem;">📋 영역별 작업 가이드 — 90점 도달 경로 (효과 큰 순)</h3>
      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
        ${path.slice(0, 8).map((p, i) => {
          const g = KPI_GUIDE[p.id];
          if (!g) return '';
          const sampleId = `sample-${p.id}`;
          return `
          <div style="padding: 18px 20px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px;">
            <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; flex-wrap: wrap;">
              <span style="font-size: 1rem; font-weight: 800; color: #ff8800;">#${i + 1}</span>
              <strong style="font-size: 1rem;">${escapeHtml(g.label)}</strong>
              <span style="font-family: monospace; color: var(--text-tertiary); font-size: 0.85rem;">${p.current} → ${p.target}</span>
              <span style="margin-left: auto; padding: 3px 10px; background: rgba(0,214,143,0.15); color: #00d68f; border-radius: 999px; font-size: 0.78rem; font-weight: 700;">+${p.gain}점</span>
              <span style="padding: 3px 10px; background: var(--bg-tertiary); border-radius: 999px; font-size: 0.72rem;">⏱️ ${escapeHtml(g.time)}</span>
              <span style="padding: 3px 10px; background: var(--bg-tertiary); border-radius: 999px; font-size: 0.72rem;">💪 ${escapeHtml(g.diff)}</span>
            </div>
            <ul style="margin: 0 0 10px 20px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
              ${g.tasks.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
            </ul>
            <details style="margin-top: 6px;">
              <summary style="cursor: pointer; font-size: 0.82rem; color: #ff8800; font-weight: 700;">▸ 코드 예시 보기</summary>
              <pre style="margin: 10px 0 0; padding: 12px; background: #0d1117; color: #e6edf3; border-radius: 8px; font-size: 0.78rem; overflow-x: auto; line-height: 1.5;"><code>${escapeHtml(g.sample)}</code></pre>
            </details>
          </div>`;
        }).join('')}
      </div>

      <!-- E. Claude Code 바이브 코딩 마스터 프롬프트 -->
      <h3 style="margin: 32px 0 12px; font-size: 1.2rem;">🤖 Claude Code 바이브 코딩 마스터 프롬프트</h3>
      <p style="margin-bottom: 14px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.7;">
        아래 프롬프트를 통째로 복사해서 <strong>Claude Code(터미널) · ChatGPT · Cursor</strong> 등에 붙여넣으면 위 사양대로 ${isNew ? '신규 사이트 개발을' : '기존 사이트 업그레이드 작업을'} 자동으로 시작합니다.
      </p>

      <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
        <button id="copyMasterPrompt" class="btn btn-primary" style="padding: 10px 18px; font-size: 0.88rem;">📋 프롬프트 복사</button>
        <button id="downloadMasterPrompt" class="btn btn-secondary" style="padding: 10px 18px; font-size: 0.88rem;">📥 .md 다운로드</button>
        <button id="downloadJsonSpec" class="btn btn-secondary" style="padding: 10px 18px; font-size: 0.88rem;">📦 JSON 사양</button>
        <a href="chatbot.html" class="btn btn-ghost" style="padding: 10px 18px; font-size: 0.88rem;">💬 전문가 상담</a>
      </div>

      <pre id="masterPromptText" style="max-height: 480px; overflow: auto; padding: 18px 20px; background: #0d1117; color: #e6edf3; border-radius: 12px; font-size: 0.78rem; line-height: 1.6; border: 1px solid #30363d; white-space: pre-wrap; word-break: break-word;"><code>${escapeHtml(masterPrompt)}</code></pre>
    `;

    // 복사·다운로드 핸들러
    document.getElementById('copyMasterPrompt')?.addEventListener('click', () => {
      navigator.clipboard.writeText(masterPrompt).then(() => {
        if (window.toast) window.toast('마스터 프롬프트가 클립보드에 복사되었습니다 — Claude Code에 붙여넣으세요', 'success');
        else alert('복사되었습니다');
      }).catch(() => alert('복사 실패 — 텍스트를 직접 선택해 주세요'));
    });

    document.getElementById('downloadMasterPrompt')?.addEventListener('click', () => {
      const blob = new Blob([masterPrompt], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geo-upgrade-spec-${(company || 'site').replace(/[^a-zA-Z0-9가-힣]/g, '_')}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('downloadJsonSpec')?.addEventListener('click', () => {
      const spec = {
        company, websiteUrl: result.websiteUrl, totalScore: total,
        grade: result.grade, recommendation: decision.recommend,
        decision, improvementPath: path, kpiGuide: KPI_GUIDE,
        masterPrompt, generatedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geo-upgrade-spec-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.ResultShared) return;
    ResultShared.init(render);
  });
})();
