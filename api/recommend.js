/**
 * GEO Score AI - 맞춤 솔루션 추천 API
 * 진단 결과를 기반으로 우선순위 액션 + GEO-AIO 패키지 제안
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

function ruleBasedRecommendation(scores, totalScore) {
  const sorted = Object.entries(scores)
    .map(([id, s]) => ({ id, value: s.value || 0 }))
    .sort((a, b) => a.value - b.value);

  const weakest3 = sorted.slice(0, 3);

  const KPI_ACTIONS = {
    visibility: {
      action: '메타 태그 + 타이틀 최적화',
      detail: '핵심 키워드 + AI 검색 의도 반영 (제목, description, og 태그 통합 정비)',
      impact: '검색 노출 +40%',
      cost: 'Quick Win'
    },
    velocity: {
      action: '주 5회 콘텐츠 자동 발행 시스템',
      detail: 'GEO-AIO 콘텐츠 엔진 도입 → 월 150건 블로그 + 웹사이트 자동 반영',
      impact: 'AI 학습 데이터 +500%',
      cost: '월 구독'
    },
    authority: {
      action: 'E-E-A-T 신호 강화 (저자/경력/실적)',
      detail: '대표 프로필, 인증서, 사례 연구 페이지 추가',
      impact: 'AI 신뢰도 +60%',
      cost: '1개월 컨설팅'
    },
    citation: {
      action: 'FAQ + Schema.org 구조화 적용',
      detail: 'FAQPage Schema, JSON-LD 마크업 + 50개 FAQ 자동 생성',
      impact: 'AI 인용률 +80%',
      cost: 'Quick Win'
    },
    engagement: {
      action: '리뷰/후기 시스템 + SNS 인터랙션',
      detail: '구글 리뷰 임베드, 인스타 피드, 카카오 채널 연동',
      impact: '체류시간 +120%',
      cost: '2주 작업'
    },
    conversion: {
      action: 'CTA 반복 노출 + 상담 예약 시스템',
      detail: '히어로 + 미들 + 푸터 3중 CTA, 챗봇 상담, 카카오톡 연동',
      impact: '전환율 +200%',
      cost: 'Quick Win'
    },
    channel: {
      action: '멀티채널 자동 배포 인프라',
      detail: '블로그 + 인스타 + 유튜브 쇼츠 + 네이버 블로그 동시 배포',
      impact: '도달 +400%',
      cost: '월 구독'
    },
    brand: {
      action: '브랜드 가이드라인 + 톤앤매너 통일',
      detail: '컬러 팔레트, 톤 가이드, 키 메시지 5개 정립',
      impact: '인지도 +50%',
      cost: '2주 작업'
    },
    competitive: {
      action: '경쟁사 키워드 + 콘텐츠 갭 분석',
      detail: '상위 5개 경쟁사 모니터링 → 빈틈 키워드 100개 점유',
      impact: '점유율 +35%',
      cost: '월 구독'
    },
    aio: {
      action: 'AI 최적화 풀스택 구축',
      detail: 'GEO-AIO 인프라 전면 도입 (Schema + 구조화 + LLM 친화 글쓰기)',
      impact: 'AIO 준비도 100% 달성',
      cost: 'AI Dominance Package'
    }
  };

  const priorityActions = weakest3.map((w, idx) => ({
    rank: idx + 1,
    kpiId: w.id,
    score: w.value,
    ...KPI_ACTIONS[w.id]
  }));

  let packageTier;
  if (totalScore < 30) {
    packageTier = {
      name: 'AI Dominance Package',
      price: '월 1000만원 (초기 세팅 300만원)',
      duration: '12개월 권장',
      reason: '거의 부재 상태 - 풀스택 즉시 도입 필요',
      includes: [
        '월 150~300개 AI 최적화 콘텐츠',
        'GEO 풀스택 구축 (Schema + FAQ + 구조화)',
        '멀티채널 자동 배포 (블로그+SNS+웹)',
        '경쟁사 실시간 모니터링',
        '월 1~2회 전략 컨설팅',
        'KPI 변화 추적 리포트'
      ]
    };
  } else if (totalScore < 50) {
    packageTier = {
      name: 'AI Growth Package',
      price: '월 500만원 (초기 세팅 150만원)',
      duration: '6개월 권장',
      reason: '위험 단계 - 핵심 KPI 우선 보강 필요',
      includes: [
        '월 80개 AI 최적화 콘텐츠',
        'FAQ + Schema.org 적용',
        '블로그 + 인스타 자동 배포',
        '월간 진단 리포트',
        '분기 전략 미팅'
      ]
    };
  } else if (totalScore < 70) {
    packageTier = {
      name: 'AI Boost Package',
      price: '월 200만원',
      duration: '3개월 권장',
      reason: '성장 가능 - 약점 KPI 집중 보강',
      includes: [
        '월 30개 핵심 콘텐츠',
        '약점 KPI 3개 집중 개선',
        '월간 KPI 리포트'
      ]
    };
  } else {
    packageTier = {
      name: 'AI Maintain Package',
      price: '월 100만원',
      duration: '운영 유지',
      reason: '상위권 - 지속적 모니터링 + 미세 조정',
      includes: [
        '월 10개 프리미엄 콘텐츠',
        '경쟁사 모니터링',
        '분기 리포트'
      ]
    };
  }

  return {
    priorityActions,
    packageTier,
    expectedOutcome: {
      timeframe: '3개월',
      improvement: totalScore < 30 ? '+300% 노출' : totalScore < 50 ? '+200% 노출' : '+80% 노출',
      newScoreEstimate: Math.min(95, totalScore + (totalScore < 30 ? 35 : totalScore < 50 ? 25 : 15))
    },
    cta: {
      primary: '🚀 GEO-AIO 솔루션 시작하기',
      primaryUrl: process.env.GEO_AIO_URL || 'https://geo-aio.vercel.app',
      secondary: '💬 전문가 상담 예약',
      secondaryUrl: '/chatbot.html'
    }
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

    const { scores, totalScore, companyName, industry } = body;

    if (!scores || typeof totalScore !== 'number') {
      return res.status(400).json({ error: 'scores와 totalScore가 필요합니다' });
    }

    const recommendation = ruleBasedRecommendation(scores, totalScore);

    if (process.env.GEMINI_API_KEY && companyName) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        });

        const personalized = await model.generateContent(
          `${companyName}(${industry || '미분류'})의 GEO 진단 결과 ${totalScore}점입니다.
가장 약한 KPI 3개: ${recommendation.priorityActions.map(p => p.kpiId).join(', ')}.

이 기업에게 GEO-AIO 솔루션을 도입해야 하는 이유를 3문장 이내로, 강력하지만 강압적이지 않게 작성해주세요. 한국어로.`
        );
        recommendation.personalizedPitch = personalized.response.text().trim();
      } catch (e) {
        console.error('[recommend] 개인화 메시지 실패', e.message);
      }
    }

    return res.status(200).json({
      success: true,
      ...recommendation
    });
  } catch (e) {
    console.error('[recommend] 오류', e);
    return res.status(500).json({
      error: '추천 생성 중 오류가 발생했습니다',
      detail: e.message
    });
  }
}
