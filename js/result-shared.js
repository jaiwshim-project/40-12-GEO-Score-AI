/**
 * GEO Score AI - 결과 페이지 공통 모듈
 * 모든 result-*.html 페이지가 공유: sessionStorage 로드 + 스코어 히어로 렌더 + 탭 링크 동기화
 */
window.ResultShared = (function() {
  let _result = null;
  let _recommendation = null;
  let _id = null;

  function load() {
    const url = new URL(location.href);
    _id = url.searchParams.get('id');
    if (!_id) return null;
    const stored = sessionStorage.getItem('current_result_' + _id);
    if (!stored) return null;
    try {
      const data = JSON.parse(stored);
      _result = data.result;
      _recommendation = data.recommendation;

      // KPI 마이그레이션: 옛 진단 데이터(visibility/citation/...)와 새 데이터(botAccess/...) 양쪽 호환
      if (_result && _result.scores) {
        const keys = Object.keys(_result.scores);
        const hasNewKpi = keys.some(k => ['botAccess','sitemapStatus','indexExposure','aiCitation','cepScene'].includes(k));
        const hasLegacyKpi = keys.some(k => ['visibility','velocity','citation','aio'].includes(k));

        if (!hasNewKpi && hasLegacyKpi && window.migrateLegacyScores) {
          // 옛 진단 → 새 KPI 추가 (양쪽 보유)
          const migrated = window.migrateLegacyScores(_result.scores);
          _result.scores = Object.assign({}, _result.scores, migrated);
        } else if (hasNewKpi && !hasLegacyKpi && _result.legacyScores) {
          // 새 진단 + 서버에서 보낸 legacyScores 병합 (옛 코드 호환)
          _result.scores = Object.assign({}, _result.scores, _result.legacyScores);
        }
      }

      return _result;
    } catch (e) { return null; }
  }

  function showError(msg) {
    const sec = document.getElementById('resultSection');
    const err = document.getElementById('errorSection');
    if (sec) sec.classList.add('hidden');
    if (err) {
      err.classList.remove('hidden');
      const m = document.getElementById('errorMessage');
      if (m) m.textContent = msg;
    }
  }

  function syncTabLinks() {
    if (!_id) return;
    // 탭 버튼 + data-href를 가진 모든 링크에 id 자동 추가
    document.querySelectorAll('[data-href]').forEach(a => {
      const base = a.dataset.href;
      a.setAttribute('href', base + '?id=' + _id);
    });
  }

  function animateScore(target) {
    const valueEl = document.getElementById('scoreValue');
    const fgEl = document.getElementById('scoreFg');
    if (!valueEl || !fgEl) return;
    const circumference = 753.98;
    const offset = circumference - (target / 100) * circumference;
    let current = 0;
    const duration = 1200;
    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(target * eased);
      valueEl.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    tick();
    setTimeout(() => { fgEl.setAttribute('stroke-dashoffset', offset); }, 100);
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderScoreHero(result) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

    set('companyTitle', result.companyName);
    set('urlSubtitle', `${extractDomain(result.websiteUrl)} · ${result.industry || '미분류'}`);
    set('resultMeta', `${formatDate(Date.parse(result.analyzedAt) || Date.now())} · ${result.meta?.usedGemini ? 'Gemini AI' : '상세 분석'}`);

    animateScore(result.totalScore);

    const gradeEl = document.getElementById('scoreGrade');
    if (gradeEl) {
      const g = getGrade(result.totalScore);
      gradeEl.textContent = `${g.emoji} ${result.grade.label} - ${g.desc}`;
      gradeEl.className = `score-grade ${result.grade.key}`;
    }

    // headline의 \n을 <br/>로 변환 (escapeHtml 후)
    const rawHeadline = result.summary?.headline || `현재 점수는 ${result.totalScore}점입니다`;
    const headlineHtml = escapeHtml(rawHeadline).replace(/\n/g, '<br/>');
    setHTML('shockMessage', `<span class="highlight">${headlineHtml}</span>`);
    set('diagnosisText', result.summary?.diagnosis || '');
  }

  function setupCTA(result, recommendation) {
    const cta = document.getElementById('ctaPrimary');
    if (cta && recommendation?.cta?.primaryUrl) {
      cta.href = recommendation.cta.primaryUrl;
      cta.target = '_blank';
    }
    const save = document.getElementById('saveReport');
    if (save && result) {
      save.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geo-score-${result.companyName}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('리포트가 다운로드되었습니다', 'success');
      });
    }
  }

  // Supabase에서 단일 진단 조회 (sessionStorage 없을 때 fallback)
  async function loadFromApi(id) {
    try {
      const r = await fetch('/api/get-diagnosis?id=' + encodeURIComponent(id), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!r.ok) return null;
      const data = await r.json();
      if (!data.success || !data.result) return null;
      _result = data.result;
      _recommendation = data.recommendation || null;
      // KPI 마이그레이션 (옛 진단 호환)
      if (_result && _result.scores) {
        const keys = Object.keys(_result.scores);
        const hasNewKpi = keys.some(k => ['botAccess','sitemapStatus','indexExposure','aiCitation','cepScene','hp_botAccess','hp_schema','hp_pageInfo'].includes(k));
        const hasLegacyKpi = keys.some(k => ['visibility','velocity','citation','aio'].includes(k));
        if (!hasNewKpi && hasLegacyKpi && window.migrateLegacyScores) {
          const migrated = window.migrateLegacyScores(_result.scores);
          _result.scores = Object.assign({}, _result.scores, migrated);
        } else if (hasNewKpi && !hasLegacyKpi && _result.legacyScores) {
          _result.scores = Object.assign({}, _result.scores, _result.legacyScores);
        }
      }
      // recommendation도 별도 fetch — Supabase에 저장 안 되어 있으므로 클라이언트에서 자동 생성
      // (솔루션 탭 등 recommendation 의존 영역이 비어있던 문제 해결)
      if (!_recommendation && _result && _result.scores) {
        try {
          const rr = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scores: _result.scores,
              totalScore: _result.totalScore,
              companyName: _result.companyName,
              industry: _result.industry,
              target: _result.target || 'homepage'
            })
          });
          if (rr.ok) {
            const recData = await rr.json();
            _recommendation = recData.recommendation || recData;
          }
        } catch (e) {
          console.warn('[result-shared] recommendation fetch 실패', e);
        }
      }

      // sessionStorage에도 캐시 (같은 탭 내 다른 result-* 페이지 방문 시 재요청 방지)
      try {
        sessionStorage.setItem('current_result_' + id, JSON.stringify({ result: _result, recommendation: _recommendation }));
      } catch (e) {}
      return _result;
    } catch (e) {
      console.warn('[result-shared] API fallback 실패', e);
      return null;
    }
  }

  // 진입점 (비동기 — API fallback 지원)
  function init(renderTabContent) {
    let result = load();
    if (result) {
      // 정상 흐름: sessionStorage에서 즉시 로드
      _renderAll(result, renderTabContent);
      return;
    }
    // sessionStorage 없음 → API fallback (관리 대시보드에서 새 탭으로 열린 경우 등)
    if (_id) {
      // 진단 진행 중 (current_diagnosis가 있으면) → analyzing 페이지로
      const stored = sessionStorage.getItem('current_diagnosis');
      if (stored) {
        try {
          const d = JSON.parse(stored);
          if (d.id === _id) {
            location.href = 'analyzing.html?id=' + _id;
            return;
          }
        } catch (e) {}
      }
      // Supabase에서 가져오기
      loadFromApi(_id).then(r => {
        if (r) _renderAll(r, renderTabContent);
        else showError('진단 정보를 찾을 수 없습니다. 처음부터 다시 시작해주세요.');
      });
      return;
    }
    showError('진단 ID가 없습니다.');
  }

  function _renderAll(result, renderTabContent) {
    syncTabLinks();
    renderScoreHero(result);
    setupCTA(result, _recommendation);
    if (typeof renderTabContent === 'function') {
      try { renderTabContent(result, _recommendation); } catch (e) { console.error('[result-shared] tab render 실패', e); }
    }
  }

  return { init, escapeHtml, get result() { return _result; }, get recommendation() { return _recommendation; }, get id() { return _id; } };
})();
