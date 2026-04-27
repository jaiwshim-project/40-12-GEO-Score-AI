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
    set('resultMeta', `${formatDate(Date.parse(result.analyzedAt) || Date.now())} · ${result.meta?.usedGemini ? 'Gemini AI' : '기본 분석'}`);

    animateScore(result.totalScore);

    const gradeEl = document.getElementById('scoreGrade');
    if (gradeEl) {
      const g = getGrade(result.totalScore);
      gradeEl.textContent = `${g.emoji} ${result.grade.label} - ${g.desc}`;
      gradeEl.className = `score-grade ${result.grade.key}`;
    }

    setHTML('shockMessage',
      `<span class="highlight">${escapeHtml(result.summary?.headline || `현재 점수는 ${result.totalScore}점입니다`)}</span>`);
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

  // 진입점
  function init(renderTabContent) {
    const result = load();
    if (!result) {
      // 결과 없으면 analyzing.html로 리다이렉트 (id가 있으면) 또는 에러
      if (_id) {
        const stored = sessionStorage.getItem('current_diagnosis');
        if (stored) {
          location.href = 'analyzing.html?id=' + _id;
          return;
        }
      }
      showError('진단 정보를 찾을 수 없습니다. 처음부터 다시 시작해주세요.');
      return;
    }
    syncTabLinks();
    renderScoreHero(result);
    setupCTA(result, _recommendation);
    if (typeof renderTabContent === 'function') {
      try { renderTabContent(result, _recommendation); } catch (e) { console.error('[result-shared] tab render 실패', e); }
    }
  }

  return { init, escapeHtml, get result() { return _result; }, get recommendation() { return _recommendation; }, get id() { return _id; } };
})();
