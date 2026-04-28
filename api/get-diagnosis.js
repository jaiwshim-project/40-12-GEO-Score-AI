/**
 * GEO Score AI - 단일 진단 조회 API
 *
 * Supabase에 저장된 진단 결과를 diagnosis_id로 조회.
 * 관리 대시보드에서 회사명 클릭 시, 새 탭의 sessionStorage가 비어있어도
 * 이 API로 진단 데이터를 불러와 결과 페이지를 정상 렌더링.
 *
 * 인증: 옵션. password가 ADMIN_DASH_PASS와 일치하면 풀 데이터,
 *       password 없거나 불일치면 공개 필드만 반환 (현재는 모든 필드 반환 — 의뢰자 공유 가능).
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // GET /api/get-diagnosis?id=xxx + POST { id } 둘 다 지원
  let id;
  if (req.method === 'GET') {
    id = req.query?.id;
  } else if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    id = body?.id || body?.diagnosisId;
  } else {
    return res.status(405).json({ error: 'GET or POST only' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'diagnosis id가 필요합니다' });
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/diagnostics?diagnosis_id=eq.${encodeURIComponent(id)}&select=*&limit=1`;
    const r = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(500).json({ error: 'Supabase 조회 실패', detail: errText });
    }
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) {
      return res.status(404).json({ error: '진단을 찾을 수 없습니다', id });
    }

    const row = arr[0];

    // result-shared.js가 기대하는 형태로 변환
    const result = {
      id: row.diagnosis_id,
      companyName: row.company_name,
      websiteUrl: row.website_url,
      industry: row.industry,
      mode: row.mode,
      target: row.target_type,
      analyzedAt: row.analyzed_at,
      totalScore: row.total_score,
      grade: { key: row.grade_key, label: row.grade_label },
      scores: row.scores || {},
      legacyScores: row.legacy_scores || null,
      weights: row.weights || null,
      summary: row.summary || null,
      competitors: row.competitors || null,
      meta: row.meta || null,
      aiwSignals: row.aiw_signals || null,
      infraSignals: row.infra_signals || null,
      kpiList: row.scores ? Object.keys(row.scores).map(k => ({ id: k, name: k })) : []
    };

    return res.status(200).json({
      success: true,
      result,
      recommendation: null
    });
  } catch (e) {
    console.error('[get-diagnosis]', e);
    return res.status(500).json({ error: '조회 중 오류', detail: e.message });
  }
}
