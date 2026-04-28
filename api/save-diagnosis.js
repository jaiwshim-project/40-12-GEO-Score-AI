/**
 * GEO Score AI - 진단 결과 Supabase 저장 API
 *
 * analyze.js가 결과를 받은 후 fire-and-forget으로 호출.
 * Supabase REST API를 직접 사용 (의존성 없음).
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // 환경 변수 확인
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    // Supabase 미설정 시 silently skip — 진단 자체는 정상 작동
    return res.status(200).json({ success: false, skipped: true, reason: 'Supabase not configured' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const result = body.result || {};
    if (!result.id || !result.companyName) {
      return res.status(400).json({ error: 'result.id, result.companyName 필수' });
    }

    // IP 해시 (privacy)
    const xff = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
    const ip = xff.split(',')[0].trim() || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // 3축 target_type (homepage/blog/article) — 기본 homepage
    const targetType = ['homepage', 'blog', 'article'].includes(result.target || body.target)
      ? (result.target || body.target)
      : 'homepage';

    const record = {
      diagnosis_id:  String(result.id),
      target_type:   targetType,
      company_name:  String(result.companyName).slice(0, 200),
      website_url:   result.websiteUrl ? String(result.websiteUrl).slice(0, 500) : null,
      industry:      result.industry ? String(result.industry).slice(0, 50) : null,
      mode:          body.mode || 'url',
      total_score:   typeof result.totalScore === 'number' ? Math.round(result.totalScore) : null,
      grade_key:     result.grade?.key || null,
      grade_label:   result.grade?.label || null,
      scores:        result.scores || null,
      legacy_scores: result.legacyScores || null,
      meta:          result.meta || null,
      aiw_signals:   result.meta?.aiwSignals || null,
      infra_signals: result.meta?.infraSignals || null,
      weights:       result.weights || null,
      summary:       result.summary || null,
      competitors:   result.competitors || null,
      analyzed_at:   result.analyzedAt || new Date().toISOString(),
      user_agent:    (req.headers['user-agent'] || '').slice(0, 200),
      ip_hash:       ipHash
    };

    const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/diagnostics`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(record)
    });

    if (!supaRes.ok) {
      const text = await supaRes.text();
      console.error('[save-diagnosis] Supabase insert 실패', supaRes.status, text);
      return res.status(500).json({ error: 'Supabase insert failed', status: supaRes.status, detail: text.slice(0, 200) });
    }

    return res.status(200).json({ success: true, diagnosis_id: record.diagnosis_id });
  } catch (e) {
    console.error('[save-diagnosis]', e);
    return res.status(500).json({ error: e.message });
  }
}
