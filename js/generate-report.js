/**
 * GEO Score AI - 영업 리포트 생성 페이지 JS
 *
 * AX Biz Group 양식 기반(api/generate-report.js 출력) 단일 HTML 영업 리포트를
 * 폼 입력 + sessionStorage 자동 로드 → 서버 호출 → 미리보기/다운로드한다.
 *
 * 역할:
 *  1) URL ?id=... 가 있으면 sessionStorage('current_result_<id>')에서 자동 로드
 *  2) 폼 값 → POST /api/generate-report → { html } 응답 받음
 *  3) iframe 미리보기 + Blob 다운로드 + 새 탭 열기 + 인쇄
 *  4) 서버 실패 시 클라이언트에서 AX Biz Group 양식 호환 단순 폴백 HTML 생성
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
  let loadedResult = null;
  let loadedRecommendation = null;
  let lastHTML = null;
  let lastBrand = null;
  let lastRecommendationKey = null;

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

  function getNum(id, max) {
    const v = parseFloat(getVal(id));
    if (isNaN(v)) return null;
    return Math.max(0, Math.min(max != null ? max : 100, v));
  }

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function safeFilename(s) {
    return String(s || 'brand').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 40);
  }

  function escapeText(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ===== sessionStorage 자동 로드 =====
  function autoLoadFromSession() {
    try {
      const url = new URL(location.href);
      const id = url.searchParams.get('id');
      const badge = $('grLoadedBadge');

      if (!id) {
        // ID 미지정 — 가장 최근 결과 자동 탐색 (있으면 안내)
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith('current_result_'));
        if (keys.length > 0 && badge) {
          badge.classList.add('show');
          badge.innerHTML = `ℹ️ URL에 <code>?id=</code> 가 없어 자동 로드를 건너뜁니다. 폼에 직접 입력하거나 진단 페이지에서 다시 진입하세요.`;
        }
        return false;
      }

      const stored = sessionStorage.getItem('current_result_' + id);
      if (!stored) {
        if (badge) {
          badge.classList.add('show', 'error');
          badge.innerHTML = `⚠️ 진단 ID <strong>${escapeText(id)}</strong>의 sessionStorage 데이터를 찾을 수 없습니다. 폼에 직접 입력해주세요.`;
        }
        return false;
      }
      const data = JSON.parse(stored);
      if (!data?.result) return false;

      loadedResult = data.result;
      loadedRecommendation = data.recommendation || null;

      // 폼 채움
      setVal('grBrand', loadedResult.companyName || '');
      setVal('grIndustry', loadedResult.industry || '');
      setVal('grTotalScore', loadedResult.totalScore != null ? loadedResult.totalScore : '');
      setVal('grWebsiteUrl', loadedResult.websiteUrl || '');

      const scores = loadedResult.scores || {};
      KPI_IDS.forEach(kid => {
        const v = scores[kid]?.value;
        if (v != null) setVal('kpi_' + kid, v);
      });

      // 인프라 신호
      const infra = loadedResult.meta?.infraSignals || {};
      if (infra.blockedBotsCount != null) setVal('infra_blocked', infra.blockedBotsCount);
      if (infra.sitemapScore != null) setVal('infra_sitemap', infra.sitemapScore);

      if (badge) {
        badge.classList.remove('error');
        badge.classList.add('show');
        badge.innerHTML = `✓ 진단 결과 자동 로드 완료 — <strong>${escapeText(loadedResult.companyName || '-')}</strong> (${loadedResult.totalScore || 0}점, ${escapeText(loadedResult.grade?.label || '-')})`;
      }
      return true;
    } catch (e) {
      console.warn('[generate-report] sessionStorage 로드 실패', e);
      return false;
    }
  }

  // ===== 폼 → 페이로드 빌드 =====
  function buildPayload() {
    const brand = (getVal('grBrand') || '').trim() || '브랜드';
    const industry = (getVal('grIndustry') || '').trim() || '산업';
    const websiteUrl = (getVal('grWebsiteUrl') || '').trim();
    const totalScoreInput = getNum('grTotalScore');

    // scores
    const scores = {};
    let scoreSum = 0;
    let scoreCount = 0;
    KPI_IDS.forEach(kid => {
      const formVal = getVal('kpi_' + kid);
      const baseVal = loadedResult?.scores?.[kid]?.value;
      const aiwSig = loadedResult?.scores?.[kid]?.aiwSignals;
      let v;
      if (formVal !== '' && formVal != null) {
        v = getNum('kpi_' + kid);
      } else if (baseVal != null) {
        v = Number(baseVal);
      } else {
        v = 50;
      }
      scores[kid] = {
        value: v,
        reason: loadedResult?.scores?.[kid]?.reason || ''
      };
      if (aiwSig) scores[kid].aiwSignals = aiwSig;
      scoreSum += v;
      scoreCount += 1;
    });

    const computedTotal = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
    const totalScore = totalScoreInput != null ? totalScoreInput : computedTotal;

    // result 객체
    const result = loadedResult ? { ...loadedResult } : {};
    result.companyName = brand;
    result.industry = industry;
    result.websiteUrl = websiteUrl || result.websiteUrl || '';
    result.totalScore = totalScore;
    result.scores = scores;
    result.analyzedAt = result.analyzedAt || new Date().toISOString();

    // grade
    if (!result.grade || totalScoreInput != null) {
      result.grade = totalScore >= 90 ? { key: 'dominant', label: 'AI Dominant' }
        : totalScore >= 70 ? { key: 'strong', label: 'Strong' }
        : totalScore >= 50 ? { key: 'growing', label: 'Growing' }
        : totalScore >= 30 ? { key: 'weak', label: 'Weak' }
        : { key: 'critical', label: 'Critical' };
    }

    // summary
    if (!result.summary) {
      result.summary = {
        headline: `현재 ${brand}의 GEO 점수는 ${totalScore}점입니다.`,
        diagnosis: totalScore < 40
          ? 'AI 검색 시대 존재력이 부족합니다. 핵심 영역의 즉시 보강이 필요합니다.'
          : totalScore < 70
            ? '기반은 형성되어 있으나 약점 KPI에 집중 투자가 필요합니다.'
            : '상위권 수준입니다. 미세 조정과 모니터링으로 우위를 유지하세요.'
      };
    }

    // 인프라 신호 (폼 입력 우선)
    const blocked = getNum('infra_blocked', 7);
    const sitemap = getNum('infra_sitemap', 5);
    if (blocked != null || sitemap != null) {
      const meta = result.meta || {};
      const infra = meta.infraSignals || {};
      if (blocked != null) {
        infra.blockedBotsCount = blocked;
        infra.allowedBotsCount = 7 - blocked;
        infra.robotsScore = Math.max(0, 5 - blocked);
      }
      if (sitemap != null) {
        infra.sitemapScore = sitemap;
        infra.sitemapValid = sitemap >= 2;
      }
      meta.infraSignals = infra;
      result.meta = meta;
    }

    return {
      result,
      recommendation: loadedRecommendation || {},
      brand,
      industry
    };
  }

  // ===== 클라이언트 폴백 (서버 실패 시 AX Biz Group 양식 호환 단순 버전) =====
  function clientSideHTML(payload) {
    const { result, brand, industry } = payload;
    const total = result.totalScore || 0;
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    const isMustRebuild = total < 30;
    const isRebuild = total < 45;

    return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8" />
<title>${escapeText(brand)} — GEO 진단 리포트 (간이 폴백)</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;1,500&display=swap" rel="stylesheet">
<style>
:root{--bg:#f5f1e8;--ink:#0a0e1a;--ink2:#14213d;--gold:#b8945a;--goldBright:#d4b078;--goldDeep:#8b6f3f;--critical:#8b1f1f;--warning:#a05d1c;--success:#2f5d3f;--line:#e6dec8;}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Pretendard',sans-serif;background:var(--bg);color:var(--ink2);padding:48px 20px;line-height:1.7;}
.container{max-width:1100px;margin:0 auto;background:#fff;box-shadow:0 24px 60px rgba(20,33,61,.10);border-radius:4px;overflow:hidden;position:relative;}
.container::before{content:"";position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,var(--goldDeep),var(--goldBright),var(--goldDeep));}
header{background:linear-gradient(135deg,var(--ink) 0%,var(--ink2) 100%);color:#fff;padding:60px 50px 50px;}
header .label{color:var(--goldBright);font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-weight:600;}
header h1{font-family:'Noto Serif KR',serif;font-size:34px;margin:14px 0;line-height:1.35;}
header h1 .acc{color:var(--goldBright);font-style:italic;font-family:'Cormorant Garamond',serif;}
header p{color:rgba(255,255,255,.78);font-size:14.5px;max-width:700px;}
.content{padding:48px 50px;}
.summary{background:linear-gradient(135deg,var(--ink),var(--ink2));color:#fff;padding:36px 40px;border-radius:4px;margin:30px 0;position:relative;}
.summary::before{content:"";position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,var(--goldBright),var(--goldDeep));}
.summary h3{color:var(--goldBright);font-family:'Cormorant Garamond',serif;font-size:13px;letter-spacing:0.4em;margin-bottom:14px;text-transform:uppercase;}
.summary .big{font-family:'Cormorant Garamond',serif;font-size:50px;font-weight:600;margin:14px 0;color:var(--goldBright);}
.summary p{color:rgba(255,255,255,.85);font-size:14.5px;}
h2{font-family:'Noto Serif KR',serif;font-size:22px;margin:42px 0 18px;padding-bottom:14px;border-bottom:1px solid var(--line);position:relative;color:var(--ink);}
h2::before{content:"";position:absolute;bottom:-1px;left:0;width:54px;height:2px;background:var(--gold);}
.alert{padding:18px 22px;border-radius:4px;margin:14px 0;border-left:3px solid;background:#fdfbf6;}
.alert.danger{border-color:var(--critical);color:#5c1818;background:linear-gradient(to right,rgba(139,31,31,.04),#fdfbf6);}
.alert.warning{border-color:var(--warning);color:#6e3e10;}
.alert.success{border-color:var(--success);color:#1d3d29;}
.alert strong{display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;font-size:13px;letter-spacing:0.03em;}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;border:1px solid var(--line);}
th,td{padding:12px 16px;text-align:left;border-bottom:1px solid var(--line);}
th{background:#fdfbf6;border-bottom:2px solid var(--gold);font-weight:600;text-transform:uppercase;font-size:12px;letter-spacing:0.04em;color:var(--ink);}
td{color:#4a5568;}
footer{background:linear-gradient(180deg,var(--ink),#050810);color:rgba(255,255,255,.7);padding:36px 50px;font-size:13px;}
footer strong{color:var(--goldBright);}
.fallback-note{padding:14px 18px;background:rgba(160,93,28,.08);border:1px solid var(--warning);border-radius:4px;color:#6e3e10;font-size:13px;margin-top:20px;}
@media print{body{background:#fff;padding:0;}.container{box-shadow:none;}.summary,header{-webkit-print-color-adjust:exact;}}
</style></head><body>
<div class="container">
<header>
  <div class="label">${escapeText(brand)} · GEO Diagnostic Report (Fallback)</div>
  <h1>AI 검색 시대를 위한<br><span class="acc">${escapeText(brand)}</span> 존재력 진단</h1>
  <p>${escapeText(industry)} — 발행일 ${escapeText(dateStr)} · AX Biz Group</p>
</header>
<div class="content">
  <div class="summary">
    <h3>Executive Summary</h3>
    <div class="big">${total} / 100</div>
    <p>${escapeText(brand)}의 종합 GEO 점수입니다. 본 페이지는 서버 통신 실패 시의 간이 폴백 리포트로, 정식 영업용 리포트는 서버 응답이 정상화되면 자동 생성됩니다.</p>
  </div>

  <h2>권장 경로</h2>
  <div class="alert ${isMustRebuild ? 'danger' : isRebuild ? 'danger' : total < 60 ? 'warning' : 'success'}">
    <strong>${isMustRebuild ? '신규 개발 필수' : isRebuild ? '신규 개발 권장' : total < 60 ? '비교 검토' : total < 75 ? '부분 개선' : '콘텐츠 강화'}</strong>
    ${isRebuild
      ? `현재 점수는 ${total}점으로, 부분 개선보다 신규 개발이 ROI 측면에서 유리합니다. 3주 / 400만원(VAT 별도)으로 AI 검색에서 인용되는 새로운 홈페이지를 구축할 수 있습니다.`
      : total < 75
        ? `점수는 ${total}점입니다. 핵심 자산은 살아 있어 약점 KPI 보강이 효율적입니다.`
        : `점수는 ${total}점으로 상위권입니다. 콘텐츠 누적 발행으로 우위를 유지하세요.`}
  </div>

  ${isRebuild ? `
  <h2>견적 (총 400만원 / VAT 별도)</h2>
  <table>
    <tr><th>항목</th><th>내용</th><th style="text-align:right;">금액</th></tr>
    <tr><td>기획·정보 구조 설계</td><td>메뉴 구성, 키워드 정리</td><td style="text-align:right;">600,000원</td></tr>
    <tr><td>디자인 (PC+모바일)</td><td>${escapeText(brand)} 톤 디자인 시안</td><td style="text-align:right;">800,000원</td></tr>
    <tr><td>홈페이지 화면 개발</td><td>전체 18페이지 + 반응형</td><td style="text-align:right;">1,200,000원</td></tr>
    <tr><td>AI 검색·일반 검색 최적화</td><td>봇 접근·사이트 지도·구조화 정보</td><td style="text-align:right;">700,000원</td></tr>
    <tr><td>블로그 시스템 구축</td><td>운영자 글쓰기 화면</td><td style="text-align:right;">400,000원</td></tr>
    <tr><td>초기 콘텐츠 작성</td><td>CEP 장면 기반 6편</td><td style="text-align:right;">300,000원</td></tr>
    <tr style="background:#fdfbf6;"><td colspan="2"><strong>합계 (VAT 별도)</strong></td><td style="text-align:right;color:var(--goldDeep);"><strong>4,000,000원</strong></td></tr>
  </table>
  ` : ''}

  <div class="fallback-note">
    ⚠️ 본 리포트는 서버 통신이 일시적으로 실패하여 클라이언트에서 즉석 생성된 간이 버전입니다. 8 KPI 별점·AI 인용 5신호·CEP 장면·AXOS 사슬 시각화 등 정식 컴포넌트는 서버가 정상화되면 자동 포함됩니다.
  </div>
</div>
<footer>
  <strong>AX Biz Group</strong> · 심재우 대표 · jaiwshim@gmail.com · 010-2397-5734<br/>
  © ${today.getFullYear()} AX Biz Group · All Rights Reserved
</footer>
</div>
</body></html>`;
  }

  // ===== 권장 경로 표시 (응답 받은 후) =====
  function showRecommendation(key, label) {
    const el = $('grRecommendation');
    if (!el) return;
    if (!key) { el.classList.remove('show'); return; }
    const labels = {
      'must-rebuild': '🔴 신규 개발 필수 — 점수 또는 인프라 손상으로 부분 개선 불가',
      'rebuild-recommend': '🟠 신규 개발 권장 — 부분 패치보다 ROI 우월',
      'compare': '🟡 비교 검토 — 부분 개선 vs 신규 개발 양쪽 비교 필요',
      'selective': '🟢 부분 개선 (Selective Boost) — 핵심 자산 살아 있음',
      'reinforce': '⭐ 콘텐츠 강화 (Reinforce) — 상위권, 미세 조정만 필요'
    };
    el.innerHTML = `<strong>권장 경로:</strong> ${escapeText(labels[key] || label || key)}`;
    el.classList.add('show');
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
    let recKey = null;
    let recLabel = null;

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
          recKey = data.recommendation || null;
          recLabel = data.recommendationLabel || null;
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
      toast('서버 미응답 — 간이 폴백 리포트로 생성됨', 'error');
    } else {
      toast('✓ 영업 리포트 생성 완료');
    }

    lastHTML = html;
    lastBrand = payload.brand;
    lastRecommendationKey = recKey;

    // 미리보기
    const empty = $('grPreviewEmpty');
    const frame = $('grPreviewFrame');
    if (empty) empty.style.display = 'none';
    if (frame) {
      frame.style.display = 'block';
      frame.srcdoc = html;
    }
    const meta = $('grPreviewMeta');
    if (meta) {
      const kb = (html.length / 1024).toFixed(1);
      meta.textContent = `${kb} KB · ${payload.brand} · ${recKey || 'fallback'}`;
    }

    showRecommendation(recKey, recLabel);

    $('grDownloadBtn').disabled = false;
    $('grOpenBtn').disabled = false;
    $('grPrintBtn').disabled = false;

    btn.disabled = false;
    btn.textContent = origText;
  }

  function download() {
    if (!lastHTML) { toast('먼저 리포트를 생성해주세요', 'error'); return; }
    const blob = new Blob([lastHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-proposal-${safeFilename(lastBrand)}-${todayStr()}.html`;
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

  function printReport() {
    const frame = $('grPreviewFrame');
    if (!frame || !lastHTML) { toast('먼저 리포트를 생성해주세요', 'error'); return; }
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (e) {
      console.warn('[generate-report] print 실패, 새 탭에서 인쇄 안내', e);
      openInTab();
      toast('새 탭에서 Ctrl+P 로 인쇄해주세요', 'error');
    }
  }

  // ===== Init =====
  document.addEventListener('DOMContentLoaded', function () {
    autoLoadFromSession();
    $('grGenerateBtn')?.addEventListener('click', generate);
    $('grDownloadBtn')?.addEventListener('click', download);
    $('grOpenBtn')?.addEventListener('click', openInTab);
    $('grPrintBtn')?.addEventListener('click', printReport);
  });
})();
