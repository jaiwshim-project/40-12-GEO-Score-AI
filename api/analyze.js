/**
 * GEO Score AI - 진단 분석 API
 * Gemini AI로 기업 URL 분석 → 새 10대 KPI 점수 산출 (가중치 합 100%)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// 새 10 KPI 명세 (가중치 합 100%)
const KPI_LIST = [
  { id: 'botAccess',          name: 'AI 봇 접근',         weight: 14 },
  { id: 'sitemapStatus',      name: 'Sitemap 상태',       weight: 10 },
  { id: 'indexExposure',      name: '검색 색인',          weight: 13 },
  { id: 'structuredData',     name: '구조화 데이터',       weight: 12 },
  { id: 'pageInfo',           name: '페이지 정보',         weight:  8 },
  { id: 'contentDepth',       name: '콘텐츠 깊이',         weight: 10 },
  { id: 'externalAuthority',  name: '외부 권위',          weight:  9 },
  { id: 'eeat',               name: 'E-E-A-T 신호',       weight:  8 },
  { id: 'aiCitation',         name: 'AI 인용 5신호',      weight: 10 },
  { id: 'cepScene',           name: 'CEP 장면 점유',      weight:  6 }
];

const WEIGHTS = KPI_LIST.reduce((acc, k) => { acc[k.id] = k.weight; return acc; }, {});

async function fetchWebsiteContent(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GEOScoreAI/1.0; +https://geo-score-ai.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9'
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, status: res.status, content: '', meta: {}, rawHtml: '' };
    }

    const html = await res.text();
    const truncated = html.slice(0, 30000);

    const titleMatch = truncated.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = truncated.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const ogTitle = truncated.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
    const ogDesc = truncated.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
    const ogImage = truncated.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
    const canonical = truncated.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
    const h1Matches = [...truncated.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map(m => m[1].trim()).slice(0, 5);
    const h2Matches = [...truncated.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map(m => m[1].trim()).slice(0, 10);

    const text = truncated
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000);

    const hasFaq = /FAQ|자주\s*묻는|Q&A|Q\.\s|질문/i.test(truncated);
    const hasSchema = /application\/ld\+json|itemtype=|schema\.org/i.test(truncated);
    const hasJsonLd = /application\/ld\+json/i.test(truncated);
    const hasCTA = /상담|문의|예약|가입|신청|구독|지금\s*시작|무료|체험/i.test(truncated);
    const hasReview = /리뷰|후기|평점|별점|review/i.test(truncated);
    const hasBlog = /blog|블로그|news|소식|공지/i.test(truncated);
    const hasSocial = /(instagram|facebook|youtube|twitter|linkedin|naver\s*blog)/i.test(truncated);
    const hasAuthor = /(작성자|저자|글쓴이|by\s+[A-Za-z가-힣]|author)/i.test(truncated);
    const hasCertification = /(자격|면허|학위|박사|교수|전문의|인증|certified|MD|PhD)/i.test(truncated);
    const hasContact = /(연락처|전화|이메일|tel:|mailto:|02-|010-)/i.test(truncated);
    const hasHistory = /(연혁|설립|since|founded|since\s+\d{4}|\d{4}년\s*설립)/i.test(truncated);

    return {
      ok: true,
      status: res.status,
      content: text,
      rawHtml: truncated,
      meta: {
        title: titleMatch?.[1]?.trim() || ogTitle?.[1]?.trim() || '',
        description: descMatch?.[1]?.trim() || ogDesc?.[1]?.trim() || '',
        ogImage: ogImage?.[1]?.trim() || '',
        canonical: canonical?.[1]?.trim() || '',
        h1: h1Matches,
        h2: h2Matches,
        hasFaq,
        hasSchema,
        hasJsonLd,
        hasCTA,
        hasReview,
        hasBlog,
        hasSocial,
        hasAuthor,
        hasCertification,
        hasContact,
        hasHistory,
        contentLength: text.length
      }
    };
  } catch (e) {
    return { ok: false, error: e.message, content: '', meta: {}, rawHtml: '' };
  }
}

// AI 인프라 + 외부 측정 신호: robots.txt + sitemap.xml + 색인 추정 + 백링크 추정
async function fetchInfraSignals(url, mainPageHtml) {
  const AI_BOTS = ['GPTBot', 'ClaudeBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended', 'Amazonbot', 'CCBot'];
  const result = {
    robotsTxtFound: false,
    robotsContent: '',
    blockedBots: [],
    blockedBotsCount: 0,
    allowedBotsCount: 7,
    sitemapFound: false,
    sitemapValid: false,
    sitemapUrlCount: 0,
    sitemapLastMod: null,
    sitemapStatus: 0,
    robotsScore: 0,
    sitemapScore: 0,
    // 외부 측정 휴리스틱 (확장)
    indexExposureCount: 0,        // 0~150+ 추정
    indexExposureLevel: 0,        // 0~5 환산
    backlinkEstimate: 0,          // 0~50+ 추정
    backlinkScore: 0,             // 0~5 환산
    pressMentionHits: 0,          // 언론 키워드 빈도
    externalLinkCount: 0,         // 본문 외부 링크 수
    internalLinkCount: 0          // 본문 내부 링크 수
  };

  let origin = '';
  let host = '';
  try {
    const u = new URL(url);
    origin = u.origin;
    host = u.hostname.replace(/^www\./, '');
  } catch (e) {
    return result;
  }

  const robotsUrl = origin + '/robots.txt';
  const sitemapUrl = origin + '/sitemap.xml';

  const fetchWithTimeout = async (target, ms = 5000) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(target, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GEOScoreAI/1.0; +https://geo-score-ai.vercel.app)'
        },
        redirect: 'follow'
      });
      clearTimeout(t);
      return r;
    } catch (e) {
      clearTimeout(t);
      return null;
    }
  };

  const [robotsRes, sitemapRes] = await Promise.all([
    fetchWithTimeout(robotsUrl),
    fetchWithTimeout(sitemapUrl)
  ]);

  // robots.txt 파싱
  if (robotsRes && robotsRes.ok) {
    try {
      const text = await robotsRes.text();
      result.robotsTxtFound = true;
      result.robotsContent = text.slice(0, 1000);

      const lines = text.split(/\r?\n/);
      const groups = [];
      let cur = null;
      let lastWasAgent = false;
      for (let raw of lines) {
        const line = raw.replace(/#.*$/, '').trim();
        if (!line) continue;
        const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
        if (!m) continue;
        const key = m[1].toLowerCase();
        const val = m[2].trim();
        if (key === 'user-agent') {
          if (!lastWasAgent || !cur) {
            cur = { agents: [], disallows: [] };
            groups.push(cur);
          }
          cur.agents.push(val);
          lastWasAgent = true;
        } else if (key === 'disallow') {
          if (cur) cur.disallows.push(val);
          lastWasAgent = false;
        } else {
          lastWasAgent = false;
        }
      }

      const wildcardBlocksAll = groups.some(g =>
        g.agents.some(a => a === '*') &&
        g.disallows.some(d => d === '/' )
      );

      const blockedSet = new Set();
      for (const bot of AI_BOTS) {
        const botLc = bot.toLowerCase();
        const grp = groups.find(g => g.agents.some(a => a.toLowerCase() === botLc));
        if (grp) {
          if (grp.disallows.some(d => d === '/')) blockedSet.add(bot);
        } else if (wildcardBlocksAll) {
          blockedSet.add(bot);
        }
      }
      result.blockedBots = Array.from(blockedSet);
      result.blockedBotsCount = result.blockedBots.length;
      result.allowedBotsCount = 7 - result.blockedBotsCount;
    } catch (e) {}
  }

  // sitemap.xml 파싱
  if (sitemapRes) {
    result.sitemapStatus = sitemapRes.status || 0;
    if (sitemapRes.ok) {
      result.sitemapFound = true;
      try {
        const xml = await sitemapRes.text();
        const isXml = /<\?xml|<urlset|<sitemapindex/i.test(xml);
        const locMatches = xml.match(/<loc>[\s\S]*?<\/loc>/gi) || [];
        result.sitemapUrlCount = locMatches.length;
        result.sitemapValid = isXml && locMatches.length > 0;

        const lastModMatch = xml.match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
        if (lastModMatch) result.sitemapLastMod = lastModMatch[1].trim();

        if (locMatches.length > 0 && origin) {
          const ownDomain = locMatches.some(loc => {
            const inner = loc.replace(/<\/?loc>/gi, '').trim();
            try {
              const lh = new URL(inner).hostname.replace(/^www\./, '');
              return lh === host || lh.endsWith('.' + host);
            } catch (_) {
              return false;
            }
          });
          if (!ownDomain) result.sitemapValid = false;
        }
      } catch (e) {
        result.sitemapValid = false;
      }
    }
  }

  // robots score
  if (!result.robotsTxtFound) {
    result.robotsScore = 5;
    result.allowedBotsCount = 7;
    result.blockedBotsCount = 0;
  } else {
    result.robotsScore = Math.max(0, 5 - result.blockedBotsCount);
  }

  // sitemap score
  if (!result.sitemapFound) {
    result.sitemapScore = 0;
  } else if (!result.sitemapValid) {
    result.sitemapScore = 1;
  } else if (result.sitemapUrlCount >= 50) {
    result.sitemapScore = 5;
  } else if (result.sitemapUrlCount >= 20) {
    result.sitemapScore = 4;
  } else if (result.sitemapUrlCount >= 10) {
    result.sitemapScore = 3;
  } else if (result.sitemapUrlCount >= 1) {
    result.sitemapScore = 2;
  } else {
    result.sitemapScore = 1;
  }

  // === 추가: 색인 수 / 백링크 휴리스틱 (외부 검색 API 없이) ===
  const html = mainPageHtml || '';
  if (html && host) {
    // 모든 링크 수집
    const hrefMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].map(m => m[1]);
    const internalSet = new Set();
    let externalCnt = 0;
    let pressHits = 0;

    for (const href of hrefMatches) {
      if (!href) continue;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
      try {
        const abs = href.startsWith('http') ? new URL(href) : new URL(href, origin);
        const linkHost = abs.hostname.replace(/^www\./, '');
        if (linkHost === host || linkHost.endsWith('.' + host)) {
          // 내부 링크: pathname을 unique 카운트
          internalSet.add(abs.pathname.replace(/\/$/, '') || '/');
        } else {
          externalCnt++;
        }
      } catch (_) {}
    }

    result.internalLinkCount = internalSet.size;
    result.externalLinkCount = externalCnt;

    // 언론/인용 키워드 빈도
    const pressPatterns = [
      /에\s*따르면/g,
      /에\s*의하면/g,
      /보도/g,
      /언론/g,
      /기사/g,
      /인용/g,
      /발표/g,
      /(KBS|MBC|SBS|JTBC|YTN|연합뉴스|한겨레|중앙일보|조선일보|동아일보|매일경제|한국경제)/g
    ];
    for (const re of pressPatterns) {
      const m = html.match(re);
      if (m) pressHits += m.length;
    }
    result.pressMentionHits = pressHits;

    // 색인 수 추정: 내부 링크 다양성 + sitemap URL 수 가중평균
    // 내부링크 30개 + sitemap 100개 → ~130 정도 추정
    const sitemapUrls = result.sitemapUrlCount;
    const internalDiversity = Math.min(80, internalSet.size); // 캡 80
    result.indexExposureCount = Math.round(sitemapUrls * 0.6 + internalDiversity * 1.2);
    // 0~5 환산
    if (result.indexExposureCount >= 100) result.indexExposureLevel = 5;
    else if (result.indexExposureCount >= 50) result.indexExposureLevel = 4;
    else if (result.indexExposureCount >= 20) result.indexExposureLevel = 3;
    else if (result.indexExposureCount >= 10) result.indexExposureLevel = 2;
    else if (result.indexExposureCount >= 3) result.indexExposureLevel = 1;
    else result.indexExposureLevel = 0;

    // 백링크 추정: 외부 링크 수 + 언론 키워드 빈도
    // 외부 5개 + 언론 3회 → ~8 추정
    result.backlinkEstimate = Math.round(externalCnt * 0.6 + pressHits * 1.5);
    if (result.backlinkEstimate >= 30) result.backlinkScore = 5;
    else if (result.backlinkEstimate >= 15) result.backlinkScore = 4;
    else if (result.backlinkEstimate >= 8) result.backlinkScore = 3;
    else if (result.backlinkEstimate >= 4) result.backlinkScore = 2;
    else if (result.backlinkEstimate >= 1) result.backlinkScore = 1;
    else result.backlinkScore = 0;
  }

  return result;
}

function extractJSON(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

function buildPrompt({ companyName, websiteUrl, industry, fetchResult, infraSignals }) {
  const meta = fetchResult.meta || {};
  const infra = infraSignals || {};
  const signals = [
    `사이트 응답: ${fetchResult.ok ? '성공' : '실패'} (${fetchResult.status || 'N/A'})`,
    `타이틀: ${meta.title || '없음'}`,
    `메타 설명: ${meta.description || '없음'}`,
    `Canonical: ${meta.canonical || '없음'}`,
    `OG 이미지: ${meta.ogImage ? '있음' : '없음'}`,
    `H1 (${(meta.h1 || []).length}개): ${(meta.h1 || []).join(' | ') || '없음'}`,
    `H2 (${(meta.h2 || []).length}개): ${(meta.h2 || []).slice(0, 5).join(' | ') || '없음'}`,
    `FAQ 구조: ${meta.hasFaq ? '있음' : '없음'}`,
    `Schema.org/JSON-LD: ${meta.hasSchema ? '있음' : '없음'}`,
    `CTA(전환 유도): ${meta.hasCTA ? '있음' : '없음'}`,
    `리뷰/후기 영역: ${meta.hasReview ? '있음' : '없음'}`,
    `블로그/소식: ${meta.hasBlog ? '있음' : '없음'}`,
    `SNS 채널 링크: ${meta.hasSocial ? '있음' : '없음'}`,
    `작성자/저자 정보: ${meta.hasAuthor ? '있음' : '없음'}`,
    `자격/면허/학위 신호: ${meta.hasCertification ? '있음' : '없음'}`,
    `연락처 정보: ${meta.hasContact ? '있음' : '없음'}`,
    `연혁/설립 정보: ${meta.hasHistory ? '있음' : '없음'}`,
    `본문 길이: ${meta.contentLength || 0}자`,
    `--- 외부 인프라 신호 ---`,
    `robots.txt: ${infra.robotsTxtFound ? '발견' : '없음'} / 7봇 중 ${infra.allowedBotsCount || 0}봇 허용`,
    `sitemap.xml: ${infra.sitemapFound ? '발견' : '없음'} / 유효 ${infra.sitemapValid ? '예' : '아니오'} / URL ${infra.sitemapUrlCount || 0}개`,
    `색인 추정 수: ${infra.indexExposureCount || 0}개`,
    `백링크 추정: ${infra.backlinkEstimate || 0}개 (외부 링크 ${infra.externalLinkCount || 0}, 언론 키워드 ${infra.pressMentionHits || 0}회)`
  ].join('\n');

  return `당신은 한국의 AI 검색 최적화(GEO/AIO) 전문가입니다. 아래 기업의 웹 인프라와 콘텐츠를 새 10대 KPI(가중치 합 100%)로 진단해주세요.

# 진단 대상
- 기업명: ${companyName}
- URL: ${websiteUrl}
- 업종: ${industry || '자동 판단'}

# 사이트 분석 신호
${signals}

# 사이트 본문 발췌 (최대 6000자)
${fetchResult.content || '(본문을 가져오지 못함)'}

# 평가 기준 (각 0~100점, 가중치는 별도)
1. botAccess (AI 봇 접근, 가중치 14%): robots.txt에서 7개 AI 봇(GPTBot/ClaudeBot/ChatGPT-User/PerplexityBot/Google-Extended/Amazonbot/CCBot) 허용 비율. 모두 허용=90+, 1~2봇 차단=70대, 3봇 이상 차단=50 이하.
2. sitemapStatus (Sitemap 상태, 가중치 10%): sitemap.xml 정상 + URL 수. 50개 이상=90+, 10~49=70대, 1~9=50대, 없음=20 이하.
3. indexExposure (검색 색인, 가중치 13%): site:domain 검색 색인 수 추정 (위 색인 추정 수 활용). 100+=90, 50~99=75, 20~49=60, 10~19=45, 그 이하 30 이하.
4. structuredData (구조화 데이터, 가중치 12%): Schema.org + FAQ + JSON-LD 적용 여부. 셋 다 있음=85+, 둘=65, 하나=45, 없음=25 이하.
5. pageInfo (페이지 정보, 가중치 8%): 메타 태그·canonical·OG·H1/H2 완성도. 모두 있음=85+, 부분=50~70, 부재=30 이하.
6. contentDepth (콘텐츠 깊이, 가중치 10%): 블로그 발행 여부 + 본문 양. 블로그+5000자 이상=85+, 블로그만=60~70, 본문 짧음=30~45.
7. externalAuthority (외부 권위, 가중치 9%): 백링크 + 언론 언급 (위 백링크 추정 활용). 30+=90, 15~29=75, 8~14=60, 4~7=45, 그 이하 25 이하.
8. eeat (E-E-A-T 신호, 가중치 8%): 작성자·자격·연혁·연락처 노출. 4개 모두=85+, 3개=70, 2개=55, 1개 이하=35.
9. aiCitation (AI 인용 5신호, 가중치 10%): 질문형 H2, 정의형 문장, 브랜드 반복, 외부 인용, CTA 도달의 균형.
10. cepScene (CEP 장면 점유, 가중치 6%): "순간/장면(scene)" 콘텐츠. 사용자가 처한 구체적 상황(예: "야근 후 피곤할 때")을 다루는가.

# 평가 가이드
- 외부 인프라 신호(robots/sitemap/색인/백링크)가 명확히 측정된 KPI는 그 측정값을 우선 반영합니다.
- 신호가 거의 없으면 25~45점 범위로 보수적으로 책정합니다.
- 점수와 함께 근거 1줄(reason)을 적어주세요.

# 출력 형식 (반드시 이 JSON만 반환, 다른 텍스트 금지)
{
  "scores": {
    "botAccess": { "value": 0, "reason": "..." },
    "sitemapStatus": { "value": 0, "reason": "..." },
    "indexExposure": { "value": 0, "reason": "..." },
    "structuredData": { "value": 0, "reason": "..." },
    "pageInfo": { "value": 0, "reason": "..." },
    "contentDepth": { "value": 0, "reason": "..." },
    "externalAuthority": { "value": 0, "reason": "..." },
    "eeat": { "value": 0, "reason": "..." },
    "aiCitation": { "value": 0, "reason": "..." },
    "cepScene": { "value": 0, "reason": "..." }
  },
  "summary": {
    "headline": "한 줄 충격 메시지 — 위 10 KPI 중 가장 낮은 1~2개 KPI를 명시 (임의 % 숫자 절대 금지, 위에서 산출한 KPI 점수만 인용)",
    "diagnosis": "현황 진단 2~3 문장 — 종합 점수와 일관된 진단 작성. 가장 약한 KPI 2~3개를 구체적으로 거론하고, 60점 이상이면 '기본은 갖춰졌으나 AI 인용 최적화에 미달' 톤, 45~59점이면 '구조 정비 필요' 톤, 45점 미만이면 '신규 개발 권장' 톤. 진단 메시지에 임의의 %·숫자 생성 금지. 위 KPI 점수만 사용.",
    "topProblems": ["문제 1", "문제 2", "문제 3"],
    "opportunities": ["기회 1", "기회 2"],
    "recommendation": "GEO-AIO 솔루션 적용 시 기대 효과 1~2 문장",
    "industryDetected": "감지된 업종"
  },
  "competitors": [
    { "label": "업계 평균", "value": 0 },
    { "label": "상위 10% 기업", "value": 0 }
  ]
}`;
}

// ai_writing 5 측정 신호 검출 (서버측 — aiCitation KPI 보강용)
function detectAIWritingSignals(content, companyName) {
  const aiwSrc = content || '';
  const cnShort = (companyName || '').slice(0, 5);
  const h2Md = (aiwSrc.match(/^##\s+(.+?)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
  const h2Html = [...aiwSrc.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h2List = [...h2Md, ...h2Html].filter(Boolean);
  const h2Count = h2List.length;

  const qPattern = /\?|어떻게|왜|언제|무엇|어디|누가|어느|얼마|어떤|뭐가|할까|있나|좋을까/i;
  const questionH2Count = h2List.filter(h => qPattern.test(h)).length;
  const questionH2Rate = h2Count > 0 ? questionH2Count / h2Count : 0;

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
    h2Count, questionH2Count, questionH2Rate,
    definitionH2Count, definitionH2Rate,
    brandSectionHits, totalBrandMentions, brandRepetitionRate,
    externalSignalHits, externalSignalRate,
    ctaReachHits, ctaBlockCount: ctaBlocks.length, ctaReachRate,
    questionHeadings: toScale3(questionH2Rate, 0.5),
    definitionH2:     toScale3(definitionH2Rate, 0.5),
    brandRepetition:  toScale3(brandRepetitionRate, 0.5),
    externalSignal:   toScale3(externalSignalRate, 1/3),
    ctaReach:         toScale3(ctaReachRate, 0.5)
  };
}

function fallbackResult({ companyName, websiteUrl, fetchResult, infraSignals, hasGeminiKey }) {
  const meta = fetchResult.meta || {};
  const infra = infraSignals || {};
  // [옵션 1] base score 엄격화: 35→25 (측정 안 한 항목은 default 25)
  const baseScore = fetchResult.ok ? 25 : 15;
  const adjust = (cond, delta) => cond ? delta : 0;

  const scores = {};

  // 1. botAccess: robotsScore(0~5) → 0~95
  // [옵션 2] Generosity 보정: robots.txt 단순 허용만으로는 70점, sitemap도 정상이어야 95점
  let botAccessVal;
  if (infra.robotsTxtFound !== undefined) {
    const robotsBase = 25 + (infra.robotsScore || 0) * 11; // 0~5 → 25~80 (기존 30~95)
    // sitemap도 동시 정상일 때만 +15 보너스 (실제 AI 봇 발견 + 색인 가능)
    const synergyBonus = (infra.robotsScore >= 4 && infra.sitemapValid) ? 15 : 0;
    botAccessVal = Math.max(10, Math.min(95, robotsBase + synergyBonus));
  } else {
    botAccessVal = baseScore;
  }
  scores.botAccess = {
    value: botAccessVal,
    reason: `robots.txt 7봇 중 ${infra.allowedBotsCount ?? 7}봇 허용` +
            ((infra.robotsScore >= 4 && infra.sitemapValid) ? ' + sitemap 정상 동시 충족' :
             (infra.robotsScore >= 4 ? ' (단, sitemap 부재 → 시너지 미달)' : ''))
  };

  // 2. sitemapStatus: sitemapScore(0~5) → 0~95
  const sitemapVal = infra.sitemapFound !== undefined
    ? Math.max(10, Math.min(95, 25 + (infra.sitemapScore || 0) * 14))
    : baseScore;
  scores.sitemapStatus = {
    value: sitemapVal,
    reason: `sitemap URL ${infra.sitemapUrlCount || 0}개`
  };

  // 3. indexExposure: indexExposureLevel(0~5) → 0~95
  const indexVal = infra.indexExposureCount !== undefined
    ? Math.max(10, Math.min(95, 25 + (infra.indexExposureLevel || 0) * 14))
    : baseScore;
  scores.indexExposure = {
    value: indexVal,
    reason: `색인 추정 ${infra.indexExposureCount || 0}개`
  };

  // 4. structuredData: Schema + FAQ + JSON-LD
  let sdVal = baseScore;
  sdVal += adjust(meta.hasSchema, 18);
  sdVal += adjust(meta.hasFaq, 12);
  sdVal += adjust(meta.hasJsonLd, 8);
  scores.structuredData = {
    value: Math.max(5, Math.min(95, Math.round(sdVal))),
    reason: `Schema=${meta.hasSchema ? 'O' : 'X'}, FAQ=${meta.hasFaq ? 'O' : 'X'}, JSON-LD=${meta.hasJsonLd ? 'O' : 'X'}`
  };

  // 5. pageInfo: 메타·canonical·OG·H1/H2
  let piVal = baseScore;
  piVal += adjust(!!meta.title, 8);
  piVal += adjust(!!meta.description, 8);
  piVal += adjust(!!meta.canonical, 6);
  piVal += adjust(!!meta.ogImage, 6);
  piVal += adjust((meta.h1 || []).length > 0, 5);
  piVal += adjust((meta.h2 || []).length > 0, 5);
  scores.pageInfo = {
    value: Math.max(5, Math.min(95, Math.round(piVal))),
    reason: `타이틀/설명/canonical/OG/H 태그 종합`
  };

  // 6. contentDepth: 블로그 + 본문 양
  let cdVal = baseScore;
  cdVal += adjust(meta.hasBlog, 14);
  if ((meta.contentLength || 0) > 5000) cdVal += 14;
  else if ((meta.contentLength || 0) > 2000) cdVal += 8;
  else if ((meta.contentLength || 0) > 800) cdVal += 4;
  scores.contentDepth = {
    value: Math.max(5, Math.min(95, Math.round(cdVal))),
    reason: `블로그=${meta.hasBlog ? 'O' : 'X'}, 본문 ${meta.contentLength || 0}자`
  };

  // 7. externalAuthority: backlinkScore(0~5) + 언론 키워드
  const eaVal = infra.backlinkEstimate !== undefined
    ? Math.max(10, Math.min(95, 25 + (infra.backlinkScore || 0) * 13))
    : baseScore;
  scores.externalAuthority = {
    value: eaVal,
    reason: `백링크 추정 ${infra.backlinkEstimate || 0}개, 언론 키워드 ${infra.pressMentionHits || 0}회`
  };

  // 8. eeat: 작성자·자격·연혁·연락처
  let eeatVal = baseScore;
  eeatVal += adjust(meta.hasAuthor, 9);
  eeatVal += adjust(meta.hasCertification, 9);
  eeatVal += adjust(meta.hasContact, 7);
  eeatVal += adjust(meta.hasHistory, 7);
  scores.eeat = {
    value: Math.max(5, Math.min(95, Math.round(eeatVal))),
    reason: `저자/자격/연혁/연락처 4신호 합산`
  };

  // 9. aiCitation: 본문 길이 기반 휴리스틱 (실제 ai_writing 5신호는 후처리에서 가산)
  let aicVal = baseScore;
  aicVal += adjust(meta.hasFaq, 10);
  aicVal += adjust(meta.hasSchema, 8);
  aicVal += adjust((meta.h2 || []).length > 3, 6);
  scores.aiCitation = {
    value: Math.max(5, Math.min(95, Math.round(aicVal))),
    reason: `FAQ/Schema/H2 기반 1차 추정 (5신호 측정 후 보정)`
  };

  // 10. cepScene: 본문 내 "장면/순간" 키워드
  const sceneRe = /(순간|장면|상황|할\s*때|밤에|새벽|퇴근|출근|식사|이후|전에|직후|앞두고)/i;
  const hasScene = sceneRe.test(fetchResult.content || '');
  const cepVal = baseScore + (hasScene ? 14 : 0);
  scores.cepScene = {
    value: Math.max(5, Math.min(95, Math.round(cepVal))),
    reason: hasScene ? '본문에 장면/순간 키워드 포함' : '장면 키워드 미검출'
  };

  // 가중 평균 종합
  const total = Math.round(
    Object.entries(scores).reduce((sum, [k, s]) => sum + (s.value || 0) * (WEIGHTS[k] || 0) / 100, 0)
  );

  return {
    scores,
    summary: {
      headline: `현재 ${companyName}의 GEO 종합 점수는 ${total}점입니다`,
      diagnosis: fetchResult.ok
        ? (hasGeminiKey
            ? 'AI 분석 엔진이 일시적으로 응답을 반환하지 못해 규칙 기반 점수로 대체했습니다. 잠시 후 다시 시도하시면 정밀 진단을 받을 수 있습니다.'
            : 'AI 분석 엔진(Gemini API)이 설정되지 않아 규칙 기반 점수로 진단했습니다. 정밀 진단을 위해 환경 변수 GEMINI_API_KEY 설정이 필요합니다.')
        : '사이트 데이터를 가져오지 못했습니다. URL을 확인하거나 robots.txt 정책을 점검해주세요.',
      topProblems: [
        infra.robotsTxtFound === false ? 'robots.txt 부재' : null,
        infra.sitemapFound === false ? 'sitemap.xml 부재' : null,
        meta.hasSchema ? null : 'Schema.org 구조화 데이터 미적용',
        meta.hasFaq ? null : 'FAQ/Q&A 구조 부재'
      ].filter(Boolean).slice(0, 3),
      opportunities: [
        '구조화 데이터 적용 시 AI 인용 가능성 30~50% 상승',
        'GEO-AIO 적용 시 3개월 내 검색 노출 300% 증가 가능'
      ],
      recommendation: '귀사 맞춤 GEO-AIO 콘텐츠 자동 생성으로 3개월 내 AI 추천 기업 진입이 가능합니다.',
      industryDetected: '미분류'
    },
    competitors: [
      { label: '업계 평균', value: 45 },
      { label: '상위 10% 기업', value: 78 }
    ]
  };
}

// 옛 KPI alias 매핑 (마이그레이션 호환성)
function buildLegacyScores(scores, meta) {
  const v = (k) => scores?.[k]?.value || 0;
  const ctaCnt = meta?.hasCTA ? 60 : 30;
  return {
    visibility:  { value: Math.round((v('indexExposure') + v('pageInfo')) / 2), legacy: true },
    velocity:    { value: v('contentDepth'), legacy: true },
    authority:   { value: v('eeat'), legacy: true },
    citation:    { value: Math.round((v('aiCitation') + v('structuredData')) / 2), legacy: true },
    engagement:  { value: v('externalAuthority'), legacy: true },
    conversion:  { value: ctaCnt, legacy: true },
    channel:     { value: v('contentDepth'), legacy: true },
    brand:       { value: v('aiCitation'), legacy: true },
    competitive: { value: v('externalAuthority'), legacy: true },
    aio:         { value: Math.round(v('structuredData') * 0.6 + v('botAccess') * 0.4), legacy: true }
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 메서드만 허용됩니다' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    if (body.companyName && /[^\x00-\x7F]/.test(body.companyName)) {
      try {
        const reEncoded = Buffer.from(body.companyName, 'latin1').toString('utf8');
        if (!reEncoded.includes('�')) body.companyName = reEncoded;
      } catch (e) {}
    }

    const { companyName, websiteUrl, industry, mode, content } = body;

    console.log('[analyze]', {
      companyName, websiteUrl, industry, mode,
      contentLen: content ? content.length : 0,
      hasGemini: !!process.env.GEMINI_API_KEY
    });

    if (!companyName) {
      return res.status(400).json({ error: '기업명이 필요합니다' });
    }

    let url = '';
    let fetchResult;
    let infraSignals = null;

    if (mode === 'content' && content) {
      const text = content.slice(0, 6000);
      const hasFaq = /FAQ|자주\s*묻는|Q&A|Q\.\s|질문/i.test(content);
      const hasSchema = /application\/ld\+json|itemtype=|schema\.org/i.test(content);
      const hasJsonLd = /application\/ld\+json/i.test(content);
      const hasCTA = /상담|문의|예약|가입|신청|구독|지금\s*시작|무료|체험/i.test(content);
      const hasReview = /리뷰|후기|평점|별점|review/i.test(content);
      const hasBlog = /blog|블로그|news|소식|공지/i.test(content);
      const hasSocial = /(instagram|facebook|youtube|twitter|linkedin|naver\s*blog)/i.test(content);
      const hasAuthor = /(작성자|저자|글쓴이|by\s+[A-Za-z가-힣]|author)/i.test(content);
      const hasCertification = /(자격|면허|학위|박사|교수|전문의|인증|certified|MD|PhD)/i.test(content);
      const hasContact = /(연락처|전화|이메일|tel:|mailto:|02-|010-)/i.test(content);
      const hasHistory = /(연혁|설립|since|founded|since\s+\d{4}|\d{4}년\s*설립)/i.test(content);
      fetchResult = {
        ok: true,
        status: 200,
        content: text,
        rawHtml: content.slice(0, 30000),
        meta: {
          title: companyName,
          description: text.slice(0, 200),
          ogImage: '',
          canonical: '',
          h1: [],
          h2: [],
          hasFaq, hasSchema, hasJsonLd, hasCTA, hasReview, hasBlog, hasSocial,
          hasAuthor, hasCertification, hasContact, hasHistory,
          contentLength: content.length,
          inputMode: 'content'
        }
      };
      url = '직접 입력 콘텐츠';
    } else {
      if (!websiteUrl) {
        return res.status(400).json({ error: 'URL이 필요합니다' });
      }
      url = websiteUrl;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      try { new URL(url); } catch (e) {
        return res.status(400).json({ error: '올바른 URL이 아닙니다' });
      }
      // fetchWebsiteContent 먼저 → rawHtml을 fetchInfraSignals에 전달
      fetchResult = await fetchWebsiteContent(url);
      infraSignals = await fetchInfraSignals(url, fetchResult.rawHtml || '');
    }

    let analysis = null;
    let usedGemini = false;

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json'
          }
        });

        const prompt = buildPrompt({ companyName, websiteUrl: url, industry, fetchResult, infraSignals });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        analysis = extractJSON(responseText);
        usedGemini = !!analysis;
      } catch (e) {
        console.error('[analyze] Gemini 호출 실패', e.message);
      }
    }

    if (!analysis) {
      analysis = fallbackResult({ companyName, websiteUrl: url, fetchResult, infraSignals, hasGeminiKey: !!process.env.GEMINI_API_KEY });
    }

    // 누락된 KPI 보강 (Gemini가 일부 키만 반환했을 경우)
    if (!analysis.scores) analysis.scores = {};
    const fb = fallbackResult({ companyName, websiteUrl: url, fetchResult, infraSignals, hasGeminiKey: !!process.env.GEMINI_API_KEY });
    for (const k of KPI_LIST) {
      if (!analysis.scores[k.id] || typeof analysis.scores[k.id].value !== 'number') {
        analysis.scores[k.id] = fb.scores[k.id];
      }
    }

    // ai_writing 5 신호 검출
    const aiwSource = (mode === 'content' && content)
      ? content
      : (fetchResult.content || '');
    const aiwSignals = detectAIWritingSignals(aiwSource, companyName);

    // aiCitation 점수: Gemini 점수와 ai_writing 5신호 측정값을 가중평균 + aiwSignals 부착
    if (analysis.scores?.aiCitation && aiwSource.length > 200) {
      const aiwTotal = (aiwSignals.questionHeadings + aiwSignals.definitionH2
                      + aiwSignals.brandRepetition + aiwSignals.externalSignal
                      + aiwSignals.ctaReach); // 0~15
      const aiwScore = Math.min(95, Math.max(5, Math.round(20 + aiwTotal * 5)));
      const geminiScore = analysis.scores.aiCitation.value || 0;
      const blended = Math.round(geminiScore * 0.6 + aiwScore * 0.4);
      analysis.scores.aiCitation.value = Math.max(5, Math.min(95, blended));
      analysis.scores.aiCitation.aiwSignals = aiwSignals;
      analysis.scores.aiCitation.geminiScore = geminiScore;
      analysis.scores.aiCitation.aiwScore = aiwScore;
    } else if (analysis.scores?.aiCitation) {
      // aiwSignals는 항상 부착 (UI 호환성)
      analysis.scores.aiCitation.aiwSignals = aiwSignals;
    }

    // 외부 인프라 신호로 botAccess/sitemapStatus/indexExposure/externalAuthority 측정값 우선 반영
    // (Gemini가 추정한 값보다 측정값이 더 정확함)
    if (infraSignals) {
      // botAccess: 측정값 70% + Gemini 30%
      if (analysis.scores?.botAccess && infraSignals.robotsTxtFound !== undefined) {
        const measured = Math.max(10, Math.min(95, 30 + (infraSignals.robotsScore || 0) * 13));
        const gemini = analysis.scores.botAccess.value || 0;
        analysis.scores.botAccess.value = Math.round(measured * 0.7 + gemini * 0.3);
        analysis.scores.botAccess.measuredScore = measured;
        analysis.scores.botAccess.allowedBotsCount = infraSignals.allowedBotsCount;
      }
      // sitemapStatus: 측정값 70% + Gemini 30%
      if (analysis.scores?.sitemapStatus && infraSignals.sitemapFound !== undefined) {
        const measured = Math.max(10, Math.min(95, 25 + (infraSignals.sitemapScore || 0) * 14));
        const gemini = analysis.scores.sitemapStatus.value || 0;
        analysis.scores.sitemapStatus.value = Math.round(measured * 0.7 + gemini * 0.3);
        analysis.scores.sitemapStatus.measuredScore = measured;
        analysis.scores.sitemapStatus.sitemapUrlCount = infraSignals.sitemapUrlCount;
      }
      // indexExposure: 측정값 60% + Gemini 40%
      if (analysis.scores?.indexExposure) {
        const measured = Math.max(10, Math.min(95, 25 + (infraSignals.indexExposureLevel || 0) * 14));
        const gemini = analysis.scores.indexExposure.value || 0;
        analysis.scores.indexExposure.value = Math.round(measured * 0.6 + gemini * 0.4);
        analysis.scores.indexExposure.measuredScore = measured;
        analysis.scores.indexExposure.indexExposureCount = infraSignals.indexExposureCount;
      }
      // externalAuthority: 측정값 60% + Gemini 40%
      if (analysis.scores?.externalAuthority) {
        const measured = Math.max(10, Math.min(95, 25 + (infraSignals.backlinkScore || 0) * 13));
        const gemini = analysis.scores.externalAuthority.value || 0;
        analysis.scores.externalAuthority.value = Math.round(measured * 0.6 + gemini * 0.4);
        analysis.scores.externalAuthority.measuredScore = measured;
        analysis.scores.externalAuthority.backlinkEstimate = infraSignals.backlinkEstimate;
      }
    }

    // [옵션 3] AI 인용 페널티 매트릭스 — 핵심 신호 부재 시 다른 KPI에도 페널티
    const penalties = [];
    if (analysis.scores) {
      // 페널티 1: structuredData < 30 → 모든 KPI -15% (Schema 없으면 AI 인용 자체 X)
      if ((analysis.scores.structuredData?.value || 0) < 30) {
        Object.entries(analysis.scores).forEach(([k, s]) => {
          if (s && typeof s.value === 'number') s.value = Math.max(5, Math.round(s.value * 0.85));
        });
        penalties.push('structuredData < 30 (Schema 부재) → 전 KPI -15%');
      }
      // 페널티 2: indexExposure < 20 (색인 5건 미만) → aiCitation 강제 ≤ 25
      if ((analysis.scores.indexExposure?.value || 0) < 20) {
        if (analysis.scores.aiCitation) {
          analysis.scores.aiCitation.value = Math.min(analysis.scores.aiCitation.value || 25, 25);
        }
        penalties.push('indexExposure < 20 (색인 부족) → aiCitation 상한 25');
      }
      // 페널티 3: AI 봇 5종+ 차단 → 모든 KPI -30% (AI 발견 자체 차단)
      if (infraSignals && infraSignals.blockedBotsCount >= 5) {
        Object.entries(analysis.scores).forEach(([k, s]) => {
          if (s && typeof s.value === 'number') s.value = Math.max(5, Math.round(s.value * 0.7));
        });
        penalties.push(`AI 봇 ${infraSignals.blockedBotsCount}종 차단 → 전 KPI -30%`);
      }
    }

    // 가중 평균 종합 점수
    const totalScore = Math.round(
      Object.entries(analysis.scores).reduce((sum, [k, s]) => {
        const w = WEIGHTS[k];
        if (!w) return sum;
        return sum + (s.value || 0) * w / 100;
      }, 0)
    );

    // [옵션 4] 6단계 등급 임계값 상향 — 60점대 사각지대 제거
    // 기존: 90/75/60/45/30 → 변경: 95/85/70/55/40
    const grade = (() => {
      if (totalScore >= 95) return { key: 'dominant', label: 'A+ Premium', desc: '최상위' };
      if (totalScore >= 85) return { key: 'strong',   label: 'A 우수',     desc: '우수' };
      if (totalScore >= 70) return { key: 'growing',  label: 'B 보통',     desc: '보통' };
      if (totalScore >= 55) return { key: 'weak',     label: 'C 미흡',     desc: '구조 정비 필요' };
      if (totalScore >= 40) return { key: 'poor',     label: 'D 부족',     desc: '상당한 개선 필요' };
      return { key: 'critical', label: 'F 잠금', desc: '신규 개발 필수' };
    })();

    // 옛 KPI alias (마이그레이션 호환)
    const legacyScores = buildLegacyScores(analysis.scores, fetchResult.meta);

    // diagnosis 메시지 일관성 보장 — 임의 % 숫자 제거 + 종합 점수 기반 톤 강제
    if (analysis.summary) {
      // 임의의 "AI 최적화 준비도 NN%" 같은 hallucinated 숫자 제거
      const sortedKpis = Object.entries(analysis.scores)
        .map(([id, s]) => ({ id, value: s.value || 0, name: KPI_LIST.find(k => k.id === id)?.name || id }))
        .sort((a, b) => a.value - b.value);
      const weakest = sortedKpis.slice(0, 3);

      // 종합 점수 기반 톤 (새 임계값 85/70/55/40에 맞춤)
      let toneLine;
      if (totalScore >= 85) {
        toneLine = `상위권에 진입했습니다. 약점 KPI(${weakest[0].name} ${weakest[0].value}점)만 추가 강화하면 1위권 도달이 가능합니다.`;
      } else if (totalScore >= 70) {
        toneLine = `기본 구조는 갖춰졌으나 AI 인용·추천 최적화에는 미달합니다. ${weakest[0].name}(${weakest[0].value}점), ${weakest[1].name}(${weakest[1].value}점) 2개 영역의 보강이 우선입니다.`;
      } else if (totalScore >= 55) {
        toneLine = `AI 검색 시대 핵심 신호가 부족합니다. ${weakest[0].name}(${weakest[0].value}점), ${weakest[1].name}(${weakest[1].value}점), ${weakest[2].name}(${weakest[2].value}점) 영역에서 구조 정비가 시급합니다.`;
      } else if (totalScore >= 40) {
        toneLine = `AI 검색에서 인용·추천이 거의 어려운 상태입니다. 약점 KPI 다수(${weakest.map(w => w.name + ' ' + w.value).join(', ')})가 임계점 미만이며, 부분 개선보다 신규 개발이 효율적입니다.`;
      } else {
        toneLine = `AI 검색에서 사실상 발견되지 않는 잠금 상태입니다. 기존 구조로는 회복이 어려워 신규 개발이 필수입니다.`;
      }

      // headline + diagnosis 일관성 강제
      const cleanHeadline = (analysis.summary.headline || '').replace(/\d+%/g, '').replace(/\s+/g, ' ').trim();
      analysis.summary.headline = `현재 ${companyName}의 GEO 종합 점수는 ${totalScore}점 (${grade.label})입니다`;
      analysis.summary.diagnosis = toneLine;
    }

    return res.status(200).json({
      success: true,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      companyName,
      websiteUrl: url,
      industry: industry || analysis.summary?.industryDetected || '미분류',
      analyzedAt: new Date().toISOString(),
      totalScore,
      grade,
      scores: analysis.scores,
      legacyScores,
      weights: WEIGHTS,
      summary: analysis.summary,
      competitors: analysis.competitors || [
        { label: '업계 평균', value: 45 },
        { label: '상위 10% 기업', value: 78 }
      ],
      meta: {
        usedGemini,
        siteFetchOk: fetchResult.ok,
        contentLength: fetchResult.meta?.contentLength || 0,
        aiwSignals,
        infraSignals,
        kpiVersion: '2.0-weighted-10kpi'
      }
    });
  } catch (e) {
    console.error('[analyze] 처리 실패', e);
    return res.status(500).json({
      error: '분석 중 오류가 발생했습니다',
      detail: e.message
    });
  }
}
