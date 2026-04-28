/**
 * GEO Score AI - 30개 질문형 파생 자동 생성 API
 * ai_writing 원칙: "1글 → 30개 파생"
 *   마스터 글 또는 CEP 장면을 바탕으로 30개의 질문형 H2 + 짧은 답변(800~1500자)을 생성.
 *   파생은 각각 다른 질문을 표적으로 하여 LLM 인용 노출을 30배로 확장.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

function buildDerivePrompt({ brand, industry, masterContent, cepScene, count = 30 }) {
  const ctx = [];
  if (cepScene) ctx.push(`CEP 장면(타겟 순간): "${cepScene}"`);
  if (masterContent) ctx.push(`마스터 글 발췌:\n\`\`\`\n${masterContent.slice(0, 4000)}\n\`\`\``);

  return `당신은 한국의 GEO/AIO 전문 에디터입니다. ai_writing 원칙 "1글 → ${count}개 파생"을 실행합니다.

# 임무
브랜드 ${brand} (${industry || '업종 자동'})에 대해, AI 검색(Perplexity·SearchGPT·AI Overview)이 인용할 수 있는 ${count}개의 질문형 파생 콘텐츠를 생성합니다.

# 컨텍스트
${ctx.join('\n\n') || '(컨텍스트 없음 — 일반 ' + (industry || '서비스') + ' 도메인으로 작성)'}

# 규칙 (모두 충족)

1. **${count}개의 서로 다른 질문**: 사용자가 AI에게 실제로 물을 만한 자연스러운 질문 ${count}개. 중복 금지, 모두 다른 의도/장면.
2. **질문형 H2**: 각 파생의 title은 "?"로 끝나거나 "어떻게/왜/언제/무엇/얼마/어떤" 포함.
3. **짧은 답변**: 각 body는 600~1200자. 첫 문장은 "${brand}은(는) ~이다" 형태의 정의문으로 시작.
4. **브랜드 자연 반복**: body 안에 ${brand}을(를) 2~3회 자연스럽게 반복.
5. **외부 신호 1개 이상**: 후기 인용("...") 또는 실적 수치 또는 언론 보도 패턴 포함.
6. **CTA**: body 마지막에 "지금 ${brand} 메신저 / 전화 / 무료 상담" 형태 1줄.

# 다양성 (질문 카테고리 골고루)
- 비용/가격: 5~6개
- 절차/방법: 5~6개
- 비교/차이: 4~5개
- 장단점/주의사항: 4~5개
- 추천/선택: 4~5개
- 사후관리/보증: 3~4개

# 출력 형식 (JSON 배열만 반환, 다른 텍스트 금지)
[
  {
    "rank": 1,
    "category": "비용/가격",
    "title": "${brand}의 ○○ 비용은 얼마인가요?",
    "body": "${brand}은(는) ... [600~1200자 답변]"
  },
  ... (총 ${count}개)
]`;
}

function extractJSONArray(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // 한글 인코딩 처리
    ['brand', 'masterContent', 'cepScene'].forEach(field => {
      if (body[field] && /[^\x00-\x7F]/.test(body[field])) {
        try {
          const r = Buffer.from(body[field], 'latin1').toString('utf8');
          if (!r.includes('�')) body[field] = r;
        } catch (e) {}
      }
    });

    const { brand, industry, masterContent, cepScene, count = 30 } = body;
    if (!brand) return res.status(400).json({ error: 'brand 필요' });
    if (!masterContent && !cepScene) {
      return res.status(400).json({ error: 'masterContent 또는 cepScene 중 하나 필요' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 미설정' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json'
      }
    });

    const prompt = buildDerivePrompt({ brand, industry, masterContent, cepScene, count });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const derivatives = extractJSONArray(responseText);

    if (!derivatives || !Array.isArray(derivatives) || derivatives.length === 0) {
      return res.status(500).json({ error: 'Gemini 응답 파싱 실패', raw: responseText.slice(0, 500) });
    }

    return res.status(200).json({
      success: true,
      brand,
      industry,
      cepScene: cepScene || null,
      count: derivatives.length,
      derivatives
    });
  } catch (e) {
    console.error('[derive-30]', e);
    return res.status(500).json({ error: e.message });
  }
}
