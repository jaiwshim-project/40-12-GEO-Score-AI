-- GEO Score AI - Supabase 스키마
-- 진단 결과 저장 + 관리자 대시보드용 테이블
--
-- 적용 방법:
--   1. Supabase 프로젝트 생성 (https://supabase.com)
--   2. SQL Editor → 이 파일 전체 복사 + 실행
--   3. .env에 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 추가
--   4. Vercel 환경 변수에도 동일하게 등록

-- ============================================================
-- 1. diagnostics 테이블 (진단 결과 저장)
-- ============================================================
CREATE TABLE IF NOT EXISTS diagnostics (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_id    TEXT            UNIQUE NOT NULL,        -- 클라이언트 측 sessionStorage ID와 매칭
  company_name    TEXT            NOT NULL,
  website_url     TEXT,
  industry        TEXT,
  mode            TEXT,                                    -- 'url' or 'content'
  -- 점수
  total_score     INTEGER,
  grade_key       TEXT,                                    -- dominant/strong/growing/weak/poor/critical
  grade_label     TEXT,                                    -- A+ Premium ~ F 위급
  -- 데이터
  scores          JSONB,                                   -- 새 10 KPI scores
  legacy_scores   JSONB,                                   -- 옛 KPI 마이그레이션 (호환)
  meta            JSONB,                                   -- usedGemini, contentLength, kpiVersion
  aiw_signals     JSONB,                                   -- ai_writing 5신호
  infra_signals   JSONB,                                   -- robots/sitemap/색인/백링크
  weights         JSONB,                                   -- KPI 가중치
  summary         JSONB,                                   -- headline, diagnosis, topProblems, opportunities
  competitors     JSONB,                                   -- 업계 평균/상위 10%
  -- 시간
  analyzed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     DEFAULT NOW(),
  -- 추적 (privacy)
  user_agent      TEXT,
  ip_hash         TEXT,                                    -- IP를 SHA-256 해시로만 저장
  -- 검색용 인덱스
  CONSTRAINT diagnostics_total_score_chk CHECK (total_score >= 0 AND total_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at ON diagnostics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostics_total_score ON diagnostics(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostics_grade_key ON diagnostics(grade_key);
CREATE INDEX IF NOT EXISTS idx_diagnostics_company_name ON diagnostics USING gin(to_tsvector('simple', company_name));
CREATE INDEX IF NOT EXISTS idx_diagnostics_industry ON diagnostics(industry);

-- ============================================================
-- 2. RLS (Row Level Security) — 기본 차단
-- ============================================================
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- 서비스 롤 키만 INSERT/SELECT 가능 (anon 키는 차단)
-- 관리자 페이지는 service role key로 접근

-- ============================================================
-- 3. 통계 뷰 (관리 대시보드용)
-- ============================================================
CREATE OR REPLACE VIEW diagnostics_stats AS
SELECT
  COUNT(*) AS total_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS last_30_days,
  ROUND(AVG(total_score)::numeric, 1) AS avg_score,
  COUNT(*) FILTER (WHERE grade_key = 'dominant') AS grade_a_plus,
  COUNT(*) FILTER (WHERE grade_key = 'strong')   AS grade_a,
  COUNT(*) FILTER (WHERE grade_key = 'growing')  AS grade_b,
  COUNT(*) FILTER (WHERE grade_key = 'weak')     AS grade_c,
  COUNT(*) FILTER (WHERE grade_key = 'poor')     AS grade_d,
  COUNT(*) FILTER (WHERE grade_key = 'critical') AS grade_f,
  COUNT(DISTINCT company_name) AS unique_companies,
  COUNT(DISTINCT industry) AS unique_industries
FROM diagnostics;

-- ============================================================
-- 4. 업종별 평균
-- ============================================================
CREATE OR REPLACE VIEW diagnostics_by_industry AS
SELECT
  industry,
  COUNT(*) AS count,
  ROUND(AVG(total_score)::numeric, 1) AS avg_score,
  MAX(total_score) AS max_score,
  MIN(total_score) AS min_score
FROM diagnostics
WHERE industry IS NOT NULL AND industry != ''
GROUP BY industry
ORDER BY count DESC;
