/**
 * GEO Score AI - 진단 분석 API
 * Gemini AI로 기업 URL 분석 → 10대 KPI 점수 산출
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const KPI_LIST = [
  { id: 'visibility', name: '검색 가시성 지수' },
  { id: 'velocity', name: '콘텐츠 생산력 지수' },
  { id: 'authority', name: 'E-E-A-T 신뢰도 지수' },
  { id: 'citation', name: 'AI 인용 가능성 지수' },
  { id: 'engagement', name: '고객 참여도 지수' },
  { id: 'conversion', name: '전환 설계 지수' },
  { id: 'channel', name: '채널 확장 지수' },
  { id: 'brand', name: '브랜드 일관성 지수' },
  { id: 'competitive', name: '경쟁 대비 점유율 지수' },
  { id: 'aio', name: 'AI 최적화 준비도' }
];

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
      return { ok: false, status: res.status, content: '', meta: {} };
    }

    const html = await res.text();
    const truncated = html.slice(0, 30000);

    const titleMatch = truncated.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = truncated.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const ogTitle = truncated.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
    const ogDesc = truncated.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
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
    const hasCTA = /상담|문의|예약|가입|신청|구독|지금\s*시작|무료|체험/i.test(truncated);
    const hasReview = /리뷰|후기|평점|별점|review/i.test(truncated);
    const hasBlog = /blog|블로그|news|소식|공지/i.test(truncated);
    const hasSocial = /(instagram|facebook|youtube|twitter|linkedin|kakao|naver\s*blog)/i.test(truncated);

    return {
      ok: true,
      status: res.status,
      content: text,
      meta: {
        title: titleMatch?.[1]?.trim() || ogTitle?.[1]?.trim() || '',
        description: descMatch?.[1]?.trim() || ogDesc?.[1]?.trim() || '',
        h1: h1Matches,
        h2: h2Matches,
        hasFaq,
        hasSchema,
        hasCTA,
        hasReview,
        hasBlog,
        hasSocial,
        contentLength: text.length
      }
    };
  } catch (e) {
    return { ok: false, error: e.message, content: '', meta: {} };
  }
}

// AI 인프라 4신호 검증: robots.txt + sitemap.xml 외부 인프라 체크
// 7개 AI 봇 차단 여부 + sitemap 유효성 검출 → robotsScore/sitemapScore (0~5)
async function fetchInfraSignals(url) {
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
    sitemapScore: 0
  };

  let origin = '';
  try {
    const u = new URL(url);
    origin = u.origin;
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

      // User-agent 그룹 단위로 파싱
      const lines = text.split(/\r?\n/);
      const groups = []; // [{ agents: [...], disallows: [...] }]
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

      // 전체 차단(*) 여부
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
          // 명시적 그룹 없고 *가 전체 차단이면 차단으로 간주
          blockedSet.add(bot);
        }
      }
      result.blockedBots = Array.from(blockedSet);
      result.blockedBotsCount = result.blockedBots.length;
      result.allowedBotsCount = 7 - result.blockedBotsCount;
    } catch (e) {
      // 파싱 실패 시 기본값 유지
    }
  }

  // sitemap.xml 파싱
  if (sitemapRes) {
    result.sitemapStatus = sitemapRes.status || 0;
    if (sitemapRes.ok) {
      result.sitemapFound = true;
      try {
        const xml = await sitemapRes.text();
        // 유효성: <urlset 또는 <sitemapindex 태그 + <loc> 1개 이상
        const isXml = /<\?xml|<urlset|<sitemapindex/i.test(xml);
        const locMatches = xml.match(/<loc>[\s\S]*?<\/loc>/gi) || [];
        result.sitemapUrlCount = locMatches.length;
        result.sitemapValid = isXml && locMatches.length > 0;

        const lastModMatch = xml.match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
        if (lastModMatch) result.sitemapLastMod = lastModMatch[1].trim();

        // 외부 도메인 sitemap 여부 (자기 도메인 URL이 하나도 없으면 외부로 간주)
        if (locMatches.length > 0 && origin) {
          const host = new URL(origin).hostname.replace(/^www\./, '');
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

  // 별점 환산 (0~5)
  // robotsScore: 모두 허용 = 5, 차단 1봇 = 4, 2 = 3, 3 = 2, 4 = 1, 5+ = 0
  if (!result.robotsTxtFound) {
    // robots.txt 없으면 모든 봇 허용으로 간주 → 5점
    result.robotsScore = 5;
    result.allowedBotsCount = 7;
    result.blockedBotsCount = 0;
  } else {
    result.robotsScore = Math.max(0, 5 - result.blockedBotsCount);
  }

  // sitemapScore: 자기도메인+50+URL = 5, 자기도메인+10+URL = 4, 1+URL = 3, 발견 but 손상 = 1, 미발견 = 0
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

function buildPrompt({ companyName, websiteUrl, industry, fetchResult }) {
  const meta = fetchResult.meta || {};
  const signals = [
    `사이트 응답: ${fetchResult.ok ? '성공' : '실패'} (${fetchResult.status || 'N/A'})`,
    `타이틀: ${meta.title || '없음'}`,
    `메타 설명: ${meta.description || '없음'}`,
    `H1 (${(meta.h1 || []).length}개): ${(meta.h1 || []).join(' | ') || '없음'}`,
    `H2 (${(meta.h2 || []).length}개): ${(meta.h2 || []).slice(0, 5).join(' | ') || '없음'}`,
    `FAQ 구조: ${meta.hasFaq ? '있음' : '없음'}`,
    `Schema.org/JSON-LD: ${meta.hasSchema ? '있음' : '없음'}`,
    `CTA(전환 유도): ${meta.hasCTA ? '있음' : '없음'}`,
    `리뷰/후기 영역: ${meta.hasReview ? '있음' : '없음'}`,
    `블로그/소식: ${meta.hasBlog ? '있음' : '없음'}`,
    `SNS 채널 링크: ${meta.hasSocial ? '있음' : '없음'}`,
    `본문 길이: ${meta.contentLength || 0}자`
  ].join('\n');

  return `당신은 한국의 AI 검색 최적화(GEO/AIO) 전문가입니다. 아래 기업의 마케팅·홍보 활동을 10가지 KPI로 진단해주세요.

# 진단 대상
- 기업명: ${companyName}
- URL: ${websiteUrl}
- 업종: ${industry || '자동 판단'}

# 사이트 분석 신호
${signals}

# 사이트 본문 발췌 (최대 6000자)
${fetchResult.content || '(본문을 가져오지 못함)'}

# 평가 기준 (각 0~100점)
1. visibility (검색 가시성 지수): 구글·네이버 노출 가능성, 키워드 점유 신호, 메타 태그 품질
2. velocity (콘텐츠 생산력 지수): 블로그/소식 존재, 콘텐츠 양, 최신성 추정
3. authority (E-E-A-T 신뢰도): 전문성·경험 노출, 저자 정보, 자격·실적 신호
4. citation (AI 인용 가능성): FAQ/Q&A 구조, 구조화 데이터(Schema), LLM 친화 형식
5. engagement (고객 참여도): 리뷰/후기, 댓글, SNS 링크 다수, 인터랙션 장치
6. conversion (전환 설계): CTA 존재·반복, 상담/예약/문의 경로, 랜딩 완성도
7. channel (채널 확장): 블로그+SNS+유튜브 등 멀티채널 분포
8. brand (브랜드 일관성): 메시지 통일성, 톤·디자인 일관성
9. competitive (경쟁 점유율): 업종 평균 대비 추정 위치
10. aio (AI 최적화 준비도): 구조화·시맨틱 마크업, AI 시대 대응 인프라

# 평가 가이드
- 사이트 분석 신호와 본문을 모두 활용해 보수적이고 구체적인 점수를 매겨주세요.
- 신호가 거의 없거나 fetch 실패면 25~45점 범위에서 판단합니다.
- 강력한 증거(예: FAQ 다수 + Schema + CTA + 다채널)가 있을 때만 70점 이상을 줍니다.
- 점수만 말고 근거 1줄(reason)도 함께 적어주세요.

# 출력 형식 (반드시 이 JSON만 반환, 다른 텍스트 금지)
{
  "scores": {
    "visibility": { "value": 0, "reason": "..." },
    "velocity": { "value": 0, "reason": "..." },
    "authority": { "value": 0, "reason": "..." },
    "citation": { "value": 0, "reason": "..." },
    "engagement": { "value": 0, "reason": "..." },
    "conversion": { "value": 0, "reason": "..." },
    "channel": { "value": 0, "reason": "..." },
    "brand": { "value": 0, "reason": "..." },
    "competitive": { "value": 0, "reason": "..." },
    "aio": { "value": 0, "reason": "..." }
  },
  "summary": {
    "headline": "한 줄 충격 메시지 (예: 현재 귀사의 AI 인용 가능성은 23%입니다)",
    "diagnosis": "현황 진단 2~3 문장",
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

// ai_writing 4 측정 신호 검출 (서버측 — citation KPI 보강용)
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

  const ctaP = /상담|예약|문의|신청|가입|구독|체험|무료|클릭|지금|버튼|시작|kakao|카카오|전화|이메일|tel|email/i;
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

function fallbackResult({ companyName, websiteUrl, fetchResult }) {
  const meta = fetchResult.meta || {};
  const baseScore = fetchResult.ok ? 35 : 22;
  const adjust = (cond, delta) => cond ? delta : 0;

  const scores = {};
  KPI_LIST.forEach(k => {
    let v = baseScore;
    if (k.id === 'visibility') v += adjust(!!meta.title, 8) + adjust(!!meta.description, 6);
    if (k.id === 'velocity') v += adjust(meta.hasBlog, 12);
    if (k.id === 'authority') v += adjust((meta.h2 || []).length > 3, 8);
    if (k.id === 'citation') v += adjust(meta.hasFaq, 10) + adjust(meta.hasSchema, 12);
    if (k.id === 'engagement') v += adjust(meta.hasReview, 14);
    if (k.id === 'conversion') v += adjust(meta.hasCTA, 14);
    if (k.id === 'channel') v += adjust(meta.hasSocial, 12);
    if (k.id === 'brand') v += adjust(!!meta.title && !!meta.description, 10);
    if (k.id === 'competitive') v += 0;
    if (k.id === 'aio') v += adjust(meta.hasSchema, 14) + adjust(meta.hasFaq, 6);
    scores[k.id] = {
      value: Math.max(5, Math.min(95, Math.round(v))),
      reason: `자동 휴리스틱 점수 (Gemini 분석 미사용)`
    };
  });

  const total = Math.round(
    Object.values(scores).reduce((s, x) => s + x.value, 0) / 10
  );

  return {
    scores,
    summary: {
      headline: `현재 ${companyName}의 GEO 종합 점수는 ${total}점입니다`,
      diagnosis: fetchResult.ok
        ? '사이트 분석은 성공했지만 AI 분석 엔진을 사용하지 못해 휴리스틱 점수만 제공합니다. 정밀 진단을 위해 GEMINI_API_KEY 설정을 권장합니다.'
        : '사이트 데이터를 가져오지 못했습니다. URL을 확인하거나 robots.txt 정책을 점검해주세요.',
      topProblems: [
        meta.hasFaq ? null : 'FAQ/Q&A 구조 부재',
        meta.hasSchema ? null : 'Schema.org 구조화 데이터 미적용',
        meta.hasCTA ? null : 'CTA(전환 유도) 부재'
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
      // 직접 입력 콘텐츠 모드 — fetch 생략, 콘텐츠 자체를 분석 대상으로
      const text = content.slice(0, 6000);
      const hasFaq = /FAQ|자주\s*묻는|Q&A|Q\.\s|질문/i.test(content);
      const hasSchema = /application\/ld\+json|itemtype=|schema\.org/i.test(content);
      const hasCTA = /상담|문의|예약|가입|신청|구독|지금\s*시작|무료|체험/i.test(content);
      const hasReview = /리뷰|후기|평점|별점|review/i.test(content);
      const hasBlog = /blog|블로그|news|소식|공지/i.test(content);
      const hasSocial = /(instagram|facebook|youtube|twitter|linkedin|kakao|naver\s*blog)/i.test(content);
      fetchResult = {
        ok: true,
        status: 200,
        content: text,
        meta: {
          title: companyName,
          description: text.slice(0, 200),
          h1: [],
          h2: [],
          hasFaq, hasSchema, hasCTA, hasReview, hasBlog, hasSocial,
          contentLength: content.length,
          inputMode: 'content'
        }
      };
      url = '직접 입력 콘텐츠';
    } else {
      // URL 모드 (기본)
      if (!websiteUrl) {
        return res.status(400).json({ error: 'URL이 필요합니다' });
      }
      url = websiteUrl;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      try { new URL(url); } catch (e) {
        return res.status(400).json({ error: '올바른 URL이 아닙니다' });
      }
      const [_fr, _is] = await Promise.all([
        fetchWebsiteContent(url),
        fetchInfraSignals(url)
      ]);
      fetchResult = _fr;
      infraSignals = _is;
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

        const prompt = buildPrompt({ companyName, websiteUrl: url, industry, fetchResult });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        analysis = extractJSON(responseText);
        usedGemini = !!analysis;
      } catch (e) {
        console.error('[analyze] Gemini 호출 실패', e.message);
      }
    }

    if (!analysis) {
      analysis = fallbackResult({ companyName, websiteUrl: url, fetchResult });
    }

    // ai_writing 4 신호 검출 — content 모드면 입력 콘텐츠, URL 모드면 fetch한 본문
    const aiwSource = (mode === 'content' && content)
      ? content
      : (fetchResult.content || '');
    const aiwSignals = detectAIWritingSignals(aiwSource, companyName);

    // citation 점수: Gemini 점수와 ai_writing 4신호 측정값을 가중평균
    // (단순 가산 시 같은 신호로 double-counting되어 과대평가될 수 있어 가중평균으로 보정)
    if (analysis.scores?.citation && aiwSource.length > 200) {
      const aiwTotal = (aiwSignals.questionHeadings + aiwSignals.definitionH2
                      + aiwSignals.brandRepetition + aiwSignals.externalSignal
                      + aiwSignals.ctaReach); // 0~15
      // 5신호 측정만으로 산출한 citation 환산 점수 (0~15 → 0~95)
      const aiwScore = Math.min(95, Math.max(5, Math.round(20 + aiwTotal * 5))); // 15점이면 95
      const geminiScore = analysis.scores.citation.value || 0;
      // 0.6 * Gemini + 0.4 * aiw 가중평균
      const blended = Math.round(geminiScore * 0.6 + aiwScore * 0.4);
      analysis.scores.citation.value = Math.max(5, Math.min(95, blended));
      analysis.scores.citation.aiwSignals = aiwSignals;
      analysis.scores.citation.geminiScore = geminiScore;
      analysis.scores.citation.aiwScore = aiwScore;
    }

    // 외부 인프라 신호로 visibility/citation KPI 가산 (URL 모드 전용)
    if (infraSignals) {
      if (analysis.scores?.visibility) {
        const bonus = Math.min(25, infraSignals.robotsScore * 3 + infraSignals.sitemapScore * 2);
        const v = (analysis.scores.visibility.value || 0) + bonus;
        analysis.scores.visibility.value = Math.max(5, Math.min(95, v));
        analysis.scores.visibility.infraBonus = bonus;
      }
      if (analysis.scores?.citation) {
        const bonus = infraSignals.robotsScore * 2;
        const v = (analysis.scores.citation.value || 0) + bonus;
        analysis.scores.citation.value = Math.max(5, Math.min(95, v));
        analysis.scores.citation.infraBonus = bonus;
      }
    }

    const scoreValues = KPI_LIST.map(k => analysis.scores?.[k.id]?.value ?? 0);
    const totalScore = Math.round(scoreValues.reduce((a, b) => a + b, 0) / 10);

    const grade = (() => {
      if (totalScore >= 90) return { key: 'dominant', label: 'AI Dominant' };
      if (totalScore >= 70) return { key: 'strong', label: 'Strong' };
      if (totalScore >= 50) return { key: 'growing', label: 'Growing' };
      if (totalScore >= 30) return { key: 'weak', label: 'Weak' };
      return { key: 'critical', label: 'Critical' };
    })();

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
        infraSignals
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
