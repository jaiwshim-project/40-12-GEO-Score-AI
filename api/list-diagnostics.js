/**
 * GEO Score AI - 진단 이력 조회 API (관리 대시보드용)
 *
 * 관리자 비밀번호(ADMIN_DASH_PASS) 인증 필요.
 * Supabase REST API로 진단 이력 조회 + 통계 + 업종별 평균.
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_PASS = process.env.ADMIN_DASH_PASS;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured', help: 'SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY 환경 변수 필요' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // 관리자 인증
    if (!ADMIN_PASS) {
      return res.status(500).json({ error: 'ADMIN_DASH_PASS 환경 변수 미설정' });
    }
    if (body.password !== ADMIN_PASS) {
      return res.status(401).json({ error: '관리자 비밀번호가 올바르지 않습니다' });
    }

    const supaHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    };

    // 1. 통계 조회 (diagnostics_stats 뷰)
    const statsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/diagnostics_stats?select=*&limit=1`,
      { headers: supaHeaders }
    );
    let stats = null;
    if (statsRes.ok) {
      const arr = await statsRes.json();
      stats = arr[0] || null;
    }

    // 2. 업종별 평균
    const industryRes = await fetch(
      `${SUPABASE_URL}/rest/v1/diagnostics_by_industry?select=*`,
      { headers: supaHeaders }
    );
    const byIndustry = industryRes.ok ? await industryRes.json() : [];

    // 3. 진단 이력 (필터 + 정렬 + 페이지네이션)
    const limit = Math.min(parseInt(body.limit, 10) || 50, 200);
    const offset = parseInt(body.offset, 10) || 0;
    const sortBy = body.sortBy || 'created_at';
    const order  = body.order === 'asc' ? 'asc' : 'desc';

    let qs = `select=*&order=${encodeURIComponent(sortBy)}.${order}&limit=${limit}&offset=${offset}`;

    if (body.filter) {
      const f = body.filter;
      if (f.gradeKey) qs += `&grade_key=eq.${encodeURIComponent(f.gradeKey)}`;
      if (f.industry) qs += `&industry=eq.${encodeURIComponent(f.industry)}`;
      if (f.minScore != null) qs += `&total_score=gte.${parseInt(f.minScore, 10)}`;
      if (f.maxScore != null) qs += `&total_score=lte.${parseInt(f.maxScore, 10)}`;
      if (f.search) {
        // 회사명 또는 URL 검색
        const s = encodeURIComponent(`*${f.search}*`);
        qs += `&or=(company_name.ilike.${s},website_url.ilike.${s})`;
      }
      if (f.dateFrom) qs += `&created_at=gte.${encodeURIComponent(f.dateFrom)}`;
      if (f.dateTo)   qs += `&created_at=lte.${encodeURIComponent(f.dateTo)}`;
    }

    const listRes = await fetch(
      `${SUPABASE_URL}/rest/v1/diagnostics?${qs}`,
      { headers: { ...supaHeaders, 'Prefer': 'count=exact' } }
    );

    if (!listRes.ok) {
      const text = await listRes.text();
      return res.status(500).json({ error: 'Supabase list failed', status: listRes.status, detail: text.slice(0, 200) });
    }

    const items = await listRes.json();
    const totalCount = parseInt((listRes.headers.get('content-range') || '0/0').split('/')[1], 10) || items.length;

    return res.status(200).json({
      success: true,
      stats,
      byIndustry,
      items,
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: (offset + items.length) < totalCount
      }
    });
  } catch (e) {
    console.error('[list-diagnostics]', e);
    return res.status(500).json({ error: e.message });
  }
}
