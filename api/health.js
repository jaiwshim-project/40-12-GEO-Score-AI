/**
 * GEO Score AI - 헬스 체크 API
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: 'ok',
    service: 'GEO Score AI',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    targets: ['homepage', 'blog', 'article'],
    kpiCounts: { homepage: 7, blog: 5, article: 6, total: 18 },
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasAdminPass: !!process.env.ADMIN_DASH_PASS,
      hasGeoAioUrl: !!process.env.GEO_AIO_URL,
      hasSupabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      node: process.version
    }
  });
}
