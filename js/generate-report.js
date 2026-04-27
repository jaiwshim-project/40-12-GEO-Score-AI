/**
 * GEO Score AI - 영업 리포트 생성 페이지 JS
 *
 * 역할:
 *  1) URL ?id=... 가 있으면 sessionStorage('current_result_<id>')에서 진단 결과 자동 로드
 *  2) 폼 값 → POST /api/generate-report → { html } 응답 받음
 *  3) iframe 미리보기 + Blob 다운로드 + 새 탭 열기
 *
 * 의존: 없음 (단독 페이지)
 */

(function () {
  'use strict';

  const KPI_IDS = [
    'visibility', 'velocity', 'authority', 'citation',
    'engagement', 'conversion', 'channel', 'brand',
    'competitive', 'aio'
  ];

  // 캐시
  let loadedResult = null;        // sessionStorage에서 가져온 원본 result
  let loadedRecommendation = null; // 원본 recommendation (있으면 그대로 전달)
  let lastHTML = null;
  let lastBrand = null;

  // ===== Helpers =====
  function $(id) { return document.getElementById(id); }

  function toast(msg, type) {
    const el = $('grToast');
    if (!el) return;
    el.textContent = msg;
    el.style.borderColor = type === 'error' ? '#ff3d71' : '#d4af37';
    el.style.color = type === 'error' ? '#ff3d71' : '#d4af37';
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
  }

  function setVal(id, v) {
    const el = $(id);
    if (el && v != null) el.value = v;
  }

  function getVal(id) {
    const el = $(id);
    return el ? el.value : '';
  }

  function getNum(id) {
    const v = parseFloat(getVal(id));
    return isNaN(v) ? 0 : Math.max(0, Math.min(100, v));
  }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function safeFilename(s) {
    return String(s || 'brand').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 40);
  }

  // ===== sessionStorage 자동 로드 =====
  function autoLoadFromSession() {
    try {
      const url = new URL(location.href);
      const id = url.searchParams.get('id');
      if (!id) return false;
      const stored = sessionStorage.getItem('current_result_' + id);
      if (!stored) return false;
      const data = JSON.parse(stored);
      if (!data?.result) return false;

      loadedResult = data.result;
      loadedRecommendation = data.recommendation || null;

      // 폼에 값 채움
      setVal('grBrand', loadedResult.companyName || '');
      setVal('grIndustry', loadedResult.industry || '');
      setVal('grTotalScore', loadedResult.totalScore != null ? loadedResult.totalScore : '');
      setVal('grWebsiteUrl', loadedResult.websiteUrl || '');

      const scores = loadedResult.scores || {};
      KPI_IDS.forEach(id => {
        const v = scores[id]?.value;
        if (v != null) setVal('kpi_' + id, v);
      });

      const badge = $('grLoadedBadge');
      if (badge) {
        badge.classList.add('show');
        badge.innerHTML = `✓ 진단 결과 자동 로드 완료 — <strong>${escapeText(loadedResult.companyName || '-')}</strong> (${loadedResult.totalScore || 0}점)`;
      }
      return true;
    } catch (e) {
      console.warn('[generate-report] sessionStorage 로드 실패', e);
      return false;
    }
  }

  function escapeText(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ===== 폼 → 페이로드 빌드 =====
  function buildPayload() {
    const brand = getVal('grBrand').trim() || '브랜드';
    const industry = getVal('grIndustry').trim() || '산업';
    const websiteUrl = getVal('grWebsiteUrl').trim();
    const totalScore = getNum('grTotalScore');

    // scores: 자동 로드된 게 있으면 우선, 없으면 폼 값 사용
    let scores = {};
    if (loadedResult?.scores) {
      // 자동 로드된 scores 복사 + 사용자가 수정한 값 반영
      KPI_IDS.forEach(id => {
        const formVal = getVal('kpi_' + id);
        const baseVal = loadedResult.scores[id]?.value;
        const v = formVal !== '' ? getNum('kpi_' + id) : (baseVal != null ? Number(baseVal) : 50);
        scores[id] = { value: v, reason: loadedResult.scores[id]?.reason || '' };
      });
    } else {
      KPI_IDS.forEach(id => {
        const formVal = getVal('kpi_' + id);
        scores[id] = { value: formVal !== '' ? getNum('kpi_' + id) : 50, reason: '' };
      });
    }

    // result 객체 (analyze.js 응답 형태와 호환)
    const result = loadedResult ? { ...loadedResult } : {};
    result.companyName = brand;
    result.industry = industry;
    result.websiteUrl = websiteUrl || result.websiteUrl || '';
    result.totalScore = totalScore;
    result.scores = scores;
    result.analyzedAt = result.analyzedAt || new Date().toISOString();
    if (!result.grade) {
      const gradeMap = totalScore >= 90 ? { key: 'dominant', label: 'AI Dominant' }
        : totalScore >= 70 ? { key: 'strong', label: 'Strong' }
        : totalScore >= 50 ? { key: 'growing', label: 'Growing' }
        : totalScore >= 30 ? { key: 'weak', label: 'Weak' }
        : { key: 'critical', label: 'Critical' };
      result.grade = gradeMap;
    }
    if (!result.summary) {
      result.summary = {
        headline: `현재 ${brand}의 GEO 점수는 ${totalScore}점입니다.`,
        diagnosis: totalScore < 40
          ? 'AI 검색 시대 존재력이 부족합니다. 핵심 영역 즉시 보강이 필요합니다.'
          : totalScore < 70
            ? '기반은 형성되어 있으나 약점 영역에 집중 투자가 필요합니다.'
            : '상위권 수준입니다. 미세 조정과 모니터링으로 우위를 유지하세요.'
      };
    }

    return {
      result,
      recommendation: loadedRecommendation || {},
      brand,
      industry
    };
  }

  // ===== 클라이언트 측 폴백 HTML 생성 (서버 실패 시) =====
  function clientSideHTML(payload) {
    // 단순 미니 폴백 (서버 다운 시 최소 보장)
    const { result, brand, industry } = payload;
    const total = result.totalScore || 0;
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8" />
<title>${escapeText(brand)} GEO 리포트 (폴백)</title>
<style>body{font-family:'Pretendard',sans-serif;background:#faf6ed;color:#0a0e1a;padding:48px;max-width:880px;margin:0 auto;}
h1{color:#0a0e1a;border-bottom:4px solid #d4af37;padding-bottom:12px;}
.score{font-size:5rem;font-weight:900;color:#d4af37;text-align:center;}
.note{padding:16px;background:#fff;border:1px solid #d4af37;border-radius:8px;margin-top:24px;}
</style></head><body>
<h1>${escapeText(brand)} GEO 진단 리포트</h1>
<div>${escapeText(industry)} · 발행 ${new Date().toLocaleDateString('ko-KR')}</div>
<div class="score">${total}<span style="font-size:1.5rem;">/100</span></div>
<div class="note">⚠️ 서버 통신 실패로 기본 리포트만 생성되었습니다.<br />AX Biz Group · 심재우 대표 · jaiwshim@gmail.com · 010-2397-5734</div>
</body></html>`;
  }

  // ===== 생성 액션 =====
  async function generate() {
    const btn = $('grGenerateBtn');
    if (!btn) return;

    if (!getVal('grBrand').trim()) {
      toast('브랜드명을 입력해주세요', 'error');
      return;
    }

    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = '⏳ 생성 중...';

    const payload = buildPayload();
    let html = null;

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.html) {
          html = data.html;
        } else {
          console.warn('[generate-report] API 응답 비정상', data);
        }
      } else {
        console.warn('[generate-report] API HTTP', res.status);
      }
    } catch (e) {
      console.warn('[generate-report] API 호출 실패, 폴백 사용', e);
    }

    if (!html) {
      html = clientSideHTML(payload);
      toast('서버 미응답 - 간이 폴백 리포트로 생성됨', 'error');
    } else {
      toast('✓ 영업 리포트 생성 완료');
    }

    lastHTML = html;
    lastBrand = payload.brand;

    // 미리보기
    const empty = $('grPreviewEmpty');
    const frame = $('grPreviewFrame');
    if (empty) empty.style.display = 'none';
    if (frame) {
      frame.style.display = 'block';
      frame.srcdoc = html;
    }
    const meta = $('grPreviewMeta');
    if (meta) meta.textContent = `${(html.length / 1024).toFixed(1)} KB · ${payload.brand}`;

    $('grDownloadBtn').disabled = false;
    $('grOpenBtn').disabled = false;

    btn.disabled = false;
    btn.textContent = origText;
  }

  function download() {
    if (!lastHTML) { toast('먼저 리포트를 생성해주세요', 'error'); return; }
    const blob = new Blob([lastHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-report-${safeFilename(lastBrand)}-${todayStr()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('⬇️ 다운로드 완료');
  }

  function openInTab() {
    if (!lastHTML) { toast('먼저 리포트를 생성해주세요', 'error'); return; }
    const blob = new Blob([lastHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // ===== Init =====
  document.addEventListener('DOMContentLoaded', function () {
    autoLoadFromSession();
    $('grGenerateBtn')?.addEventListener('click', generate);
    $('grDownloadBtn')?.addEventListener('click', download);
    $('grOpenBtn')?.addEventListener('click', openInTab);
  });
})();
