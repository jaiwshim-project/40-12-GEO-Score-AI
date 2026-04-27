/**
 * GEO Score AI - CEP 발굴 5단계 API
 * 단계별 Gemini 호출로 CEP 좌표 발굴
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

function extractJSON(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); } catch (e) { return null; }
}

const PROMPTS = {
  1: ({ brand, category, industry, target }) => `당신은 한국의 카테고리 전입점(CEP) 분석 전문가입니다.

# 대상
브랜드: ${brand}
카테고리: ${category}
업종: ${industry || '자동 판단'}
대상 고객: ${target || '일반 소비자'}

# 작업: 일상의 언어 수집 (Step 1)
소비자가 "${category}" 카테고리에 들어오기 직전에 사용하는 **삶의 언어**를 8~12개 수집해주세요.
브랜드명이나 제품명이 아닌, 사람들이 카페·검색·SNS에서 실제로 표현하는 일상 상황 언어여야 합니다.

# 좋은 예
- "비 오는 주말 아이와 갈 곳"
- "7인 이상 대가족이 사용할 냉장고"
- "부스러기 잘 안 떨어지고 손에도 잘 안 묻는 간식"
- "야근 후에 빨리 먹을 수 있는 저녁"

# 나쁜 예 (사용하지 말 것)
- "냉장고 추천" (카테고리 키워드)
- "삼성 냉장고" (브랜드)
- "30대 여성" (페르소나)

# 출력 형식 (JSON만)
{ "expressions": ["표현1", "표현2", ...] }`,

  2: ({ brand, category, expressions }) => `당신은 한국의 검색 데이터 분석 전문가입니다.

# 컨텍스트
브랜드: ${brand}, 카테고리: ${category}
1단계 일상 표현: ${expressions.slice(0, 12).map(e => `"${e}"`).join(', ')}

# 작업: 검색 클러스터 그룹화 (Step 2)
위 표현들과 관련된 검색어들을 의도가 같은 4~7개의 클러스터로 묶어주세요.
각 클러스터는 같은 소비자 과업/장면에 속하는 검색어 흐름을 표현합니다.

# 좋은 예 (선크림 카테고리)
- 클러스터: "선크림 화장 호환 문제"
  - 의도: "아침 화장 전 선크림이 베이스 메이크업을 망치지 않기를 원함"
  - 키워드: ["선크림 밀림", "선크림 안 밀리는 법", "화장 잘먹는 선크림", "선크림 화장 뜸", "톤업 선크림 밀림"]

# 출력 형식 (JSON만, 4~7개 클러스터)
{ "clusters": [
  { "name": "클러스터명", "intent": "소비자 의도 한 문장", "keywords": ["검색어1", "검색어2", ...] }
] }`,

  3: ({ brand, category, clusters }) => `당신은 카테고리 전입점(CEP) 전략가입니다.

# 컨텍스트
브랜드: ${brand}, 카테고리: ${category}
검색 클러스터: ${JSON.stringify(clusters.slice(0, 7).map(c => ({ name: c.name, intent: c.intent })), null, 2)}

# 작업: CEP 장면 문장으로 번역 (Step 3)
각 클러스터를 "타깃(사람)"이 아닌 "장면(순간)"으로 정의하는 CEP 문장으로 번역해주세요.

# 좋은 예
"30대 직장인 여성" (X) → "아침에 화장하기 전, 선크림은 꼭 발라야 하지만 베이스 메이크업이 들뜨거나 뭉치지 않기를 바라는 순간" (O)

CEP 문장은 ① 시점/상황 ② 직면한 문제 ③ 원하는 결과를 모두 포함해야 합니다.

# 출력 형식 (JSON만, 클러스터 수만큼)
{ "scenes": [
  { "scene": "장면 문장", "sourceCluster": "원본 클러스터명" }
] }`,

  4: ({ brand, category, scenes }) => `당신은 카테고리 전입점(CEP) 평가 전문가입니다.

# 컨텍스트
브랜드: ${brand}, 카테고리: ${category}
CEP 장면 후보: ${JSON.stringify(scenes.slice(0, 10).map(s => s.scene), null, 2)}

# 작업: 3가지 기준으로 우선순위 평가 (Step 4)
각 CEP 후보를 다음 기준으로 0~10점 평가해주세요:
1. **시장성 (market)**: 이 장면이 충분히 반복·확장될 수 있는가
2. **브랜드 적합성 (brandFit)**: ${brand}이/가 이 장면에서 자연스럽고 설득력 있는 답이 될 수 있는가
3. **입증 가능성 (evidence)**: 데이터·리뷰·테스트 결과로 적합성을 증명할 수 있는가

또한 각 CEP를 "명시적"(이미 알려진 큰 시장) vs "잠재적"(작지만 선점 가능)으로 분류해주세요.
총점은 (market + brandFit + evidence)로 계산합니다.

# 출력 형식 (JSON만, scenes 수만큼, total 내림차순)
{ "scoredCEPs": [
  { "scene": "장면 문장", "type": "명시적" 또는 "잠재적", "market": 0~10, "brandFit": 0~10, "evidence": 0~10, "total": 합계 }
] }`,

  5: ({ brand, category, target, scoredCEPs }) => `당신은 GEO/AIO 콘텐츠 전략가입니다.

# 컨텍스트
브랜드: ${brand}, 카테고리: ${category}, 대상 고객: ${target || '일반'}
평가된 CEP (총점 내림차순 상위): ${JSON.stringify(scoredCEPs.slice(0, 7).map(c => ({ scene: c.scene, total: c.total, type: c.type })), null, 2)}

# 작업: 실행 가능한 CEP 좌표 확정 (Step 5)
상위 5개 CEP 후보 각각에 대해 다음을 작성해주세요:
- **scene**: 원래 장면 문장 (그대로)
- **message**: 콘텐츠/광고에서 사용할 핵심 메시지 (1문장)
- **productAngle**: 제품 설명에서 강조할 포인트 (1~2문장)
- **contentIdeas**: 작성 가능한 콘텐츠 아이디어 4~5개 (짧은 제목)
- **geoBasis**: AI가 ${brand}을/를 이 장면에서 추천하도록 만들 수 있는 근거 (1~2문장)

# 출력 형식 (JSON만, 상위 5개)
{ "finalCEPs": [
  { "scene": "...", "message": "...", "productAngle": "...", "contentIdeas": ["아이디어1", ...], "geoBasis": "..." }
] }`
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // 한글 인코딩 처리
    ['brand', 'category', 'target'].forEach(field => {
      if (body[field] && /[^\x00-\x7F]/.test(body[field])) {
        try {
          const r = Buffer.from(body[field], 'latin1').toString('utf8');
          if (!r.includes('�')) body[field] = r;
        } catch (e) {}
      }
    });

    const step = parseInt(body.step);
    if (![1, 2, 3, 4, 5].includes(step)) {
      return res.status(400).json({ error: 'step은 1~5만 허용' });
    }

    const promptFn = PROMPTS[step];
    const prompt = promptFn(body);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 미설정 — standalone-shim에서 mock 사용' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = extractJSON(text);

    if (!data) {
      return res.status(500).json({ error: 'AI 응답 파싱 실패', raw: text.slice(0, 300) });
    }

    return res.status(200).json({ success: true, step, ...data });
  } catch (e) {
    console.error('[cep-discover]', e);
    return res.status(500).json({ error: e.message });
  }
}
