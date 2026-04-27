/**
 * GEO Score AI - AI 인용성 실제 검증 API
 *
 * 입력된 글이 AI 검색(Perplexity·SearchGPT·AI Overview 등)에서 실제로 인용되는지
 * 시뮬레이션. 10개의 가상 사용자 질문에 대해 글이 출처로 활용될 가능성을 측정.
 *
 * 워크플로:
 *   1. 입력 글 → Gemini로 10개 사용자 질문 생성 (글의 주제 기반)
 *   2. 각 질문 + 글을 함께 Gemini에 입력 → 답변에 brand 인용 여부 측정
 *   3. 인용률 = (brand 인용된 답변 수) / 10
 *   4. 각 질문별 답변, 인용 여부, 답변에서 사용된 출처 키워드 반환
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

function buildQuestionsPrompt({ brand, industry, content }) {
  return `당신은 한국의 일반 사용자 검색 행태 전문가입니다. 다음 콘텐츠를 기반으로, AI 검색(Perplexity·SearchGPT·AI Overview)에서 실제 사용자가 물을 만한 자연스러운 질문 10개를 생성합니다.

# 콘텐츠 (출처)
브랜드: ${brand}
업종: ${industry || '자동'}

\`\`\`
${(content || '').slice(0, 4000)}
\`\`\`

# 규칙
- 질문은 일반 사용자 어투 (전문 용어 X)
- 브랜드명을 명시하지 않은 일반 질문 (5개) + 브랜드명 명시 질문 (5개)
- 모두 다른 의도/장면

# 출력 형식 (JSON 배열만, 다른 텍스트 금지)
[
  { "id": 1, "type": "general", "question": "..." },
  { "id": 2, "type": "general", "question": "..." },
  ... (general 5개, branded 5개, 총 10개)
]`;
}

function buildAnswerPrompt({ brand, content, question }) {
  return `당신은 AI 검색 어시스턴트입니다. 다음 한 가지 출처만 참고하여 사용자 질문에 답변합니다.

# 출처
\`\`\`
${(content || '').slice(0, 4000)}
\`\`\`

# 사용자 질문
"${question}"

# 답변 규칙
- 200자 이내 한국어 답변
- 출처에 정보가 있으면 활용, 없으면 "정보가 없습니다"
- 출처 브랜드명을 답변에 자연스럽게 명시 (해당되면)
- 답변만 출력 (메타·주석·인용 부호 등 X)`;
}

function extractJSONArray(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); }
  catch (e) { return null; }
}

function isBrandCited(answer, brand) {
  if (!answer || !brand) return false;
  const a = answer.toLowerCase();
  const b = brand.slice(0, 5).toLowerCase();
  if (a.includes(b)) return true;
  // 한글 부분 매칭
  if (brand.length >= 2 && answer.includes(brand.slice(0, Math.min(brand.length, 4)))) return true;
  return false;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    ['brand', 'content', 'industry'].forEach(field => {
      if (body[field] && /[^\x00-\x7F]/.test(body[field])) {
        try {
          const r = Buffer.from(body[field], 'latin1').toString('utf8');
          if (!r.includes('�')) body[field] = r;
        } catch (e) {}
      }
    });

    const { brand, industry, content } = body;
    if (!brand || !content) return res.status(400).json({ error: 'brand와 content 필요' });
    if (content.length < 100) return res.status(400).json({ error: 'content는 100자 이상' });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 미설정' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
    });

    // 1. 10개 질문 생성
    const qResult = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: buildQuestionsPrompt({ brand, industry, content }) }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048, responseMimeType: 'application/json' }
    });
    const questions = extractJSONArray(qResult.response.text());
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: '질문 생성 실패', raw: qResult.response.text().slice(0, 500) });
    }

    // 2. 각 질문에 대해 답변 생성 (병렬)
    const answers = await Promise.all(
      questions.slice(0, 10).map(async (q) => {
        try {
          const aResult = await model.generateContent(buildAnswerPrompt({ brand, content, question: q.question }));
          const answer = aResult.response.text().trim();
          const cited = isBrandCited(answer, brand);
          return {
            id: q.id,
            type: q.type,
            question: q.question,
            answer,
            cited,
            // 답변 길이 (정보 풍부도 간접 측정)
            answerLength: answer.length
          };
        } catch (e) {
          return { id: q.id, type: q.type, question: q.question, error: e.message, cited: false };
        }
      })
    );

    // 3. 통계
    const total = answers.length;
    const citedCount = answers.filter(a => a.cited).length;
    const citationRate = total > 0 ? citedCount / total : 0;
    const generalCited = answers.filter(a => a.type === 'general' && a.cited).length;
    const brandedCited = answers.filter(a => a.type === 'branded' && a.cited).length;
    const generalTotal = answers.filter(a => a.type === 'general').length;
    const brandedTotal = answers.filter(a => a.type === 'branded').length;

    return res.status(200).json({
      success: true,
      brand,
      industry: industry || null,
      total,
      citedCount,
      citationRate,
      generalRate: generalTotal > 0 ? generalCited / generalTotal : 0,
      brandedRate: brandedTotal > 0 ? brandedCited / brandedTotal : 0,
      grade: citationRate >= 0.8 ? { key: 'dominant', label: 'AI Dominant' }
           : citationRate >= 0.5 ? { key: 'strong', label: 'Strong' }
           : citationRate >= 0.3 ? { key: 'growing', label: 'Growing' }
           : citationRate >= 0.1 ? { key: 'weak', label: 'Weak' }
           : { key: 'critical', label: 'Critical' },
      answers
    });
  } catch (e) {
    console.error('[citation-test]', e);
    return res.status(500).json({ error: e.message });
  }
}
