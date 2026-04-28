/**
 * GEO Score AI - 메인 페이지 인터랙션
 */

(function() {
  // KPI Grid 렌더링 (새 10 KPI: 외부 인프라 8 + 자체 차별점 2)
  function renderKpiGrid() {
    const grid = document.getElementById('kpiGrid');
    if (!grid || !window.KPI_DEFINITIONS) return;

    const NUM = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
    grid.innerHTML = window.KPI_DEFINITIONS.map((kpi, idx) => `
      <div class="kpi-card" style="--accent-color: ${kpi.color}; --accent-color-2: ${kpi.color2};">
        <div class="kpi-icon">${kpi.icon}</div>
        <div class="kpi-name"><span style="color: var(--accent-color); font-weight: 800; margin-right: 4px;">${NUM[idx] || (idx + 1)}</span> ${kpi.name} <span style="font-size: 0.78rem; color: var(--text-tertiary); font-weight: 600;">(${kpi.weight}%)</span></div>
        <div class="kpi-desc">${kpi.desc}</div>
      </div>
    `).join('');
  }

  // 현재 진단 모드 (url | content)
  let currentMode = 'url';

  function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('#diagModeToggle .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });
    document.getElementById('urlMode').classList.toggle('hidden', mode !== 'url');
    document.getElementById('contentMode').classList.toggle('hidden', mode !== 'content');
  }

  // 진단 시작 핸들러
  async function startDiagnosis() {
    const btn = document.getElementById('startDiagnosis');
    const companyName = document.getElementById('companyName').value.trim();
    const industry = document.getElementById('industry').value;

    if (!companyName) {
      toast('기업/기관명을 입력해주세요', 'warning');
      document.getElementById('companyName').focus();
      return;
    }

    const autoRewrite = document.getElementById('autoRewrite')?.checked || false;
    const diagPayload = {
      id: genId(),
      companyName,
      industry,
      mode: currentMode,
      autoRewrite,
      startedAt: Date.now()
    };

    if (currentMode === 'url') {
      const websiteUrl = document.getElementById('websiteUrl').value.trim();
      const normalizedUrl = normalizeUrl(websiteUrl);
      if (!normalizedUrl) {
        toast('올바른 홈페이지 URL을 입력해주세요', 'warning');
        document.getElementById('websiteUrl').focus();
        return;
      }
      diagPayload.websiteUrl = normalizedUrl;
      diagPayload.domain = extractDomain(normalizedUrl);
    } else {
      const content = document.getElementById('contentText').value.trim();
      if (content.length < 100) {
        toast('분석할 글을 100자 이상 입력해주세요', 'warning');
        document.getElementById('contentText').focus();
        return;
      }
      if (content.length > 20000) {
        toast('너무 깁니다. 20,000자 이내로 줄여주세요', 'warning');
        return;
      }
      diagPayload.content = content;
      diagPayload.websiteUrl = '직접 입력 콘텐츠';
      diagPayload.domain = '(content)';
    }

    sessionStorage.setItem('current_diagnosis', JSON.stringify(diagPayload));

    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span><span>이동 중...</span>';

    setTimeout(() => {
      location.href = `analyzing.html?id=${diagPayload.id}`;
    }, 400);
  }

  // 초기화
  document.addEventListener('DOMContentLoaded', () => {
    renderKpiGrid();

    const startBtn = document.getElementById('startDiagnosis');
    if (startBtn) startBtn.addEventListener('click', startDiagnosis);

    // 모드 토글
    document.querySelectorAll('#diagModeToggle .tab').forEach(t => {
      t.addEventListener('click', () => setMode(t.dataset.mode));
    });

    // Enter 키 지원
    ['companyName', 'websiteUrl'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keypress', e => {
          if (e.key === 'Enter') startDiagnosis();
        });
      }
    });

  });
})();
