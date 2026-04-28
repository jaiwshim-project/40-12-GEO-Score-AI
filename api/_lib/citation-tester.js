/**
 * AI 인용 가능성 측정 — Gemini 시뮬레이션
 *
 * 입력 콘텐츠로 만든 가상 사용자 질문에 대해 AI 답변에서 브랜드 인용율을 측정.
 * api/citation-test.js의 측정 로직을 KPI 산출용으로 추출.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

function buildQuestionsPrompt({ brand, industry, content, count }) {
  const half = Math.ceil(count / 2);
  return `당신은 한국의 일반 사용자 검색 행태 전문가입니다. 다음 콘텐츠를 기반으로, AI 검색(Perplexity·SearchGPT·AI Overview)에서 실제 사용자가 물을 만한 자연스러운 질문 정확히 ${count}개를 생성합니다.

# 콘텐츠 (출처)
브랜드: ${brand}
업종: ${industry || '자동'}

\`\`\`
${(content || '').slice(0, 4000)}
\`\`\`

# 규칙
- 질문은 일반 사용자 어투 (전문 용어 X)
- general(브랜드명 미언급) ${half}개 + branded(브랜드명 언급) ${count - half}개
- 모두 다른 의도/장면

# 출력 (JSON 배열만, 다른 텍스트·설명·코드펜스 모두 금지)
배열 길이 정확히 ${count}, 각 원소는 { "id": 정수, "type": "general"|"branded", "question": "..." } 형식.`;
}

function buildAnswerPrompt({ content, question }) {
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
  // 1) 직접 JSON.parse 시도 (responseMimeType: 'application/json' 응답)
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed;
    // 객체 안에 배열 프로퍼티가 있으면 그거 사용
    if (parsed && typeof parsed === 'object') {
      for (const v of Object.values(parsed)) {
        if (Array.isArray(v) && v.length > 0) return v;
      }
    }
  } catch (e) {}
  // 2) 첫 [ ... ] 슬라이스
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  try {
    const arr = JSON.parse(candidate.slice(start, end + 1));
    return Array.isArray(arr) ? arr : null;
  } catch (e) { return null; }
}

function isBrandCited(answer, brand) {
  if (!answer || !brand) return false;
  const a = answer.toLowerCase();
  const b = brand.slice(0, 5).toLowerCase();
  if (a.includes(b)) return true;
  if (brand.length >= 2 && answer.includes(brand.slice(0, Math.min(brand.length, 4)))) return true;
  return false;
}

/**
 * 인용 가능성 측정.
 * @param {{ brand: string, industry?: string, content: string, count?: number, timeoutMs?: number }} opts
 * @returns {Promise<{ ok: boolean, citationRate: number, citedCount: number, total: number, generalRate: number, brandedRate: number, answers: Array, error?: string }>}
 */
export async function runCitationTest({ brand, industry, content, count = 6, timeoutMs = 25000 }) {
  if (!brand || !content || content.length < 100 || !process.env.GEMINI_API_KEY) {
    return { ok: false, error: 'missing brand/content/key', citationRate: 0, citedCount: 0, total: 0, generalRate: 0, brandedRate: 0, answers: [] };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
    });

    const promptText = buildQuestionsPrompt({ brand, industry, content, count });

    const qResult = await Promise.race([
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 2048, responseMimeType: 'application/json' }
      }),
      new Promise((_, rj) => setTimeout(() => rj(new Error('q-timeout')), timeoutMs))
    ]);
    const rawText = qResult.response.text() || '';
    const questions = extractJSONArray(rawText);
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return {
        ok: false,
        error: 'no questions',
        rawSnippet: rawText.slice(0, 200),
        citationRate: 0, citedCount: 0, total: 0, generalRate: 0, brandedRate: 0, answers: []
      };
    }

    const remainingMs = timeoutMs;
    const answers = await Promise.all(
      questions.slice(0, count).map(async (q) => {
        try {
          const aResult = await Promise.race([
            model.generateContent(buildAnswerPrompt({ content, question: q.question })),
            new Promise((_, rj) => setTimeout(() => rj(new Error('a-timeout')), remainingMs))
          ]);
          const answer = aResult.response.text().trim();
          return { id: q.id, type: q.type, question: q.question, answer, cited: isBrandCited(answer, brand) };
        } catch (e) {
          return { id: q.id, type: q.type, question: q.question, error: e.message, cited: false };
        }
      })
    );

    const total = answers.length;
    const citedCount = answers.filter(a => a.cited).length;
    const generalCited = answers.filter(a => a.type === 'general' && a.cited).length;
    const brandedCited = answers.filter(a => a.type === 'branded' && a.cited).length;
    const generalTotal = answers.filter(a => a.type === 'general').length;
    const brandedTotal = answers.filter(a => a.type === 'branded').length;

    return {
      ok: true,
      citationRate: total > 0 ? citedCount / total : 0,
      citedCount,
      total,
      generalRate: generalTotal > 0 ? generalCited / generalTotal : 0,
      brandedRate: brandedTotal > 0 ? brandedCited / brandedTotal : 0,
      answers
    };
  } catch (e) {
    return { ok: false, error: e.message || 'citation-test failed', citationRate: 0, citedCount: 0, total: 0, generalRate: 0, brandedRate: 0, answers: [] };
  }
}

/**
 * citationRate(0~1) → 0~100 점수 변환. 등급 비선형 가중.
 */
export function scoreCitationRate(rate) {
  const r = Math.max(0, Math.min(1, Number(rate) || 0));
  if (r >= 0.8) return 100;
  if (r >= 0.5) return 85;
  if (r >= 0.3) return 65;
  if (r >= 0.15) return 40;
  if (r >= 0.05) return 20;
  return Math.round(r * 100);
}
