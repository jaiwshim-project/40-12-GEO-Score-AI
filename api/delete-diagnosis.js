/**
 * GEO Score AI - 진단 항목 삭제 API (관리 대시보드용)
 *
 * 관리자 비밀번호(ADMIN_DASH_PASS) 인증 필요.
 * Supabase에서 diagnosis_id 또는 ids 배열로 삭제.
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_PASS = process.env.ADMIN_DASH_PASS;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  if (!ADMIN_PASS) {
    return res.status(500).json({ error: 'ADMIN_DASH_PASS 환경 변수 미설정' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // 관리자 인증
    if (body.password !== ADMIN_PASS) {
      return res.status(401).json({ error: '관리자 비밀번호가 올바르지 않습니다' });
    }

    // 삭제 대상: 단일 id 또는 ids 배열
    let ids = [];
    if (Array.isArray(body.ids)) ids = body.ids.filter(x => typeof x === 'string' && x.length);
    else if (typeof body.diagnosisId === 'string' && body.diagnosisId.length) ids = [body.diagnosisId];
    else if (typeof body.id === 'string' && body.id.length) ids = [body.id];

    if (ids.length === 0) {
      return res.status(400).json({ error: '삭제할 diagnosisId 또는 ids가 필요합니다' });
    }

    // 명시적 재확인 토큰 (프론트에서 2단계 확인 후 전달)
    if (body.confirm !== 'YES_DELETE') {
      return res.status(400).json({ error: 'confirm 필드가 "YES_DELETE"여야 합니다 (재확인 단계)' });
    }

    const supaHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // PostgREST의 in.() 필터 — 인용 문자가 있으면 이중인용 필요. diagnosis_id는 base36이라 안전.
    const inList = ids.map(id => `"${encodeURIComponent(id)}"`).join(',');
    const url = `${SUPABASE_URL}/rest/v1/diagnostics?diagnosis_id=in.(${inList})`;

    const delRes = await fetch(url, {
      method: 'DELETE',
      headers: supaHeaders
    });

    if (!delRes.ok) {
      const errText = await delRes.text();
      return res.status(500).json({ error: 'Supabase 삭제 실패', detail: errText });
    }

    const deleted = await delRes.json();

    return res.status(200).json({
      success: true,
      deletedCount: Array.isArray(deleted) ? deleted.length : 0,
      deletedIds: Array.isArray(deleted) ? deleted.map(d => d.diagnosis_id) : ids
    });
  } catch (e) {
    console.error('[delete-diagnosis]', e);
    return res.status(500).json({ error: '삭제 중 오류', detail: e.message });
  }
}
