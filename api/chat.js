/**
 * GEO Score AI - 챗봇 / RAG API
 * GEO/AIO 지식베이스를 컨텍스트로 Gemini 답변 생성
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const KNOWLEDGE_BASE = `
[GEO Score AI 지식베이스]

# 플랫폼 정의
- GEO Score AI는 AI 검색 시대 기업의 존재 가능성을 점수로 진단하고, 존재하게 만드는 플랫폼입니다.
- 핵심 가치: "문제를 보여주고, 해결을 유일하게 만들고, 계약으로 연결한다"
- 슬로건: "AI가 당신을 선택하게 만드십시오"

# 10대 KPI (GEO Score Framework)
1. 검색 가시성 지수(visibility) - 구글·네이버 노출 + AI Overview 노출 가능성
2. 콘텐츠 생산력 지수(velocity) - 발행 빈도 + 최신성
3. E-E-A-T 신뢰도 지수(authority) - 전문성·경험 기반 콘텐츠
4. AI 인용 가능성 지수(citation) - 구조화 콘텐츠, FAQ, Q&A
5. 고객 참여도 지수(engagement) - 댓글, 리뷰, SNS 반응
6. 전환 설계 지수(conversion) - CTA + 상담 유도 + 랜딩
7. 채널 확장 지수(channel) - 블로그, 유튜브, SNS 멀티채널
8. 브랜드 일관성 지수(brand) - 메시지·디자인 통일성
9. 경쟁 대비 점유율(competitive) - 경쟁사 대비 키워드 + 콘텐츠량
10. AI 최적화 준비도(aio) - GEO 구조 + AI 검색 대응 + 콘텐츠 구조화

# 등급 체계 (총점 100점 기준)
- AI Dominant (90~100): 시장 지배 수준
- Strong (70~89): 상위권
- Growing (50~69): 성장 가능
- Weak (30~49): 위험 단계
- Critical (0~29): 거의 없음

# 핵심 차별점 (vs 기존 SEO)
- 기존 SEO: 트래픽 분석, 키워드 분석
- GEO Score AI: AI 인용 가능성 분석, GEO 기반 전략 제안, 자동 계약 연결

# GEO-AIO 솔루션 (해결책)
- 월 150~300개 AI 최적화 콘텐츠 자동 생성
- FAQ/Q&A 구조화 자동 적용
- 블로그 + 웹사이트 + SNS 멀티채널 자동 배포
- 경쟁사 모니터링 + 전략 업데이트
- KPI 변화 추적 리포트

# 가격 (AI Dominance Package)
- 초기 세팅: 300만원
- 월 구독: 1000만원
- 무료 진단 → 유료 정밀 리포트 (30~100만원) → GEO-AIO 월 구독

# 진단 프로세스 (8단계)
정보 입력 → 자동 크롤링 → AI 분석 → KPI 점수화 → 레이더 차트 → 문제 도출 → 솔루션 제안 → 계약 전환

# 자주 묻는 질문
Q: 왜 GEO가 SEO보다 중요한가?
A: 사용자가 검색 결과를 클릭하지 않고 AI 답변만 보는 시대로 넘어가고 있기 때문입니다. AI가 인용하지 않으면 사실상 존재하지 않는 것과 같습니다.

Q: 진단은 얼마나 걸리나요?
A: 약 30초~1분 내 완료됩니다. URL 크롤링 + Gemini AI 분석 시간이 포함됩니다.

Q: 어떤 업종에 적용 가능한가요?
A: 치과, 병원, 법무, 교육, 미용, 음식점, 유통, B2B 등 거의 모든 업종에 적용됩니다. 업종별 가중치가 자동 적용됩니다.

Q: 점수가 낮으면 어떻게 해야 하나요?
A: 가장 빠른 해결책은 GEO-AIO 솔루션 도입입니다. 3개월 내 노출 300% 증가 가능합니다.
`;

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

    const message = (body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    const diagnosisContext = body.diagnosisContext || null;

    if (!message) {
      return res.status(400).json({ error: '메시지를 입력해주세요' });
    }

    console.log('[chat]', {
      msgLength: message.length,
      hasContext: !!diagnosisContext,
      hasGemini: !!process.env.GEMINI_API_KEY
    });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: true,
        reply: 'AI 상담사가 현재 점검 중입니다. GEMINI_API_KEY가 설정되지 않았습니다. 직접 문의는 jaiwshim@gmail.com 으로 부탁드립니다.',
        usedGemini: false
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      },
      systemInstruction: `당신은 GEO Score AI의 전문 컨설턴트입니다.

[역할]
- 친절하지만 전문적으로 답변합니다.
- 항상 한국어로 답변합니다.
- 답변은 간결하게 (1~3 문단). 불필요하게 길지 않게.
- 사용자가 진단 결과를 가지고 있을 때는 그 점수를 인용해서 구체적으로 답변합니다.
- 마지막에는 자연스럽게 GEO-AIO 솔루션이나 무료 진단으로 유도합니다.

[중요 원칙]
- 거짓 정보를 만들어내지 않습니다.
- 모르는 것은 "정확한 답변을 위해 컨설턴트(jaiwshim@gmail.com)에게 문의해주세요"라고 안내합니다.
- 위급한 압박 메시지를 사용하지만 강압적이지 않게.

[지식베이스]
${KNOWLEDGE_BASE}

${diagnosisContext ? `\n[현재 사용자 진단 결과]\n${JSON.stringify(diagnosisContext, null, 2)}` : ''}`
    });

    const chatHistory = history
      .filter(m => m && m.role && m.content)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return res.status(200).json({
      success: true,
      reply,
      usedGemini: true
    });
  } catch (e) {
    console.error('[chat] 오류', e);
    return res.status(500).json({
      error: '챗봇 응답 중 오류가 발생했습니다',
      detail: e.message
    });
  }
}
