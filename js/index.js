/**
 * GEO Score AI - 메인 페이지 인터랙션 (v3.0 — 3축 진단)
 */

(function() {
  // KPI Grid 렌더링 — 현재 선택된 target에 맞는 KPI 정의를 표시
  function renderKpiGrid() {
    const grid = document.getElementById('kpiGrid');
    if (!grid) return;

    const defs = (window.getKPIDefinitions ? window.getKPIDefinitions(currentTarget) : null) || window.KPI_DEFINITIONS;
    if (!defs || defs.length === 0) return;

    const NUM = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫'];
    grid.innerHTML = defs.map((kpi, idx) => `
      <div class="kpi-card" style="--accent-color: ${kpi.color}; --accent-color-2: ${kpi.color2};">
        <div class="kpi-icon">${kpi.icon}</div>
        <div class="kpi-name"><span style="color: var(--accent-color); font-weight: 800; margin-right: 4px;">${NUM[idx] || (idx + 1)}</span> ${kpi.name} <span style="font-size: 0.78rem; color: var(--text-tertiary); font-weight: 600;">(${kpi.weight}%)</span></div>
        <div class="kpi-desc" style="font-size: 0.82rem; line-height: 1.65;">${kpi.description || kpi.desc}</div>
      </div>
    `).join('');
  }

  // 현재 진단 대상 (homepage | blog | article)
  let currentTarget = 'homepage';
  // article 축 내 입력 방식 (url | content)
  let articleInputMode = 'url';

  const TARGET_CONFIG = {
    homepage: {
      icon: '🏠',
      label: '홈페이지',
      hint: '🏠 <strong>홈페이지 축</strong>: AI 봇 접근 / sitemap / schema / 색인 / CMS 자율성 / CTA / E-E-A-T 페이지 (인프라 7 KPI)',
      urlLabel: '홈페이지 URL',
      urlPlaceholder: 'https://example.com'
    },
    blog: {
      icon: '📝',
      label: '블로그',
      hint: '📝 <strong>블로그 축</strong>: 발행 빈도/최신성 · 카테고리 깊이 · 내부 링크망 · 작성자 권위 · 채널 확장 (운영 5 KPI)',
      urlLabel: '블로그 메인 URL',
      urlPlaceholder: 'https://example.com/blog 또는 https://blog.naver.com/xxx'
    },
    article: {
      icon: '📄',
      label: '글(콘텐츠)',
      hint: '📄 <strong>글 축</strong>: 정의문 H2 · 질문형 H2 · 브랜드 반복 · 외부 인용 · CTA 도달률 · FAQ (본문 6 KPI)',
      urlLabel: '글 URL (또는 아래에서 본문 직접 붙여넣기)',
      urlPlaceholder: 'https://example.com/post/123'
    }
  };

  function setTarget(target) {
    if (!TARGET_CONFIG[target]) return;
    currentTarget = target;
    document.querySelectorAll('#diagTargetToggle .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.target === target);
    });
    const cfg = TARGET_CONFIG[target];
    const hint = document.getElementById('targetHint');
    if (hint) hint.innerHTML = cfg.hint;
    const urlLabel = document.getElementById('urlModeLabel');
    if (urlLabel) urlLabel.textContent = cfg.urlLabel;
    const urlInput = document.getElementById('websiteUrl');
    if (urlInput) urlInput.placeholder = cfg.urlPlaceholder;

    // article 축에서만 본문 직접 입력 토글 노출
    const articleWrapper = document.getElementById('articleInputModeWrapper');
    if (articleWrapper) articleWrapper.classList.toggle('hidden', target !== 'article');

    // 입력 모드 적용
    applyInputMode();

    // KPI 그리드 다시 렌더 (타겟별 KPI 표시)
    renderKpiGrid();
  }

  function setArticleInputMode(mode) {
    articleInputMode = mode;
    document.querySelectorAll('#articleInputMode .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.input === mode);
    });
    applyInputMode();
  }

  function applyInputMode() {
    // article + content 모드일 때만 텍스트 영역 표시, 그 외엔 URL 입력 표시
    const showContent = (currentTarget === 'article' && articleInputMode === 'content');
    document.getElementById('urlMode')?.classList.toggle('hidden', showContent);
    document.getElementById('contentMode')?.classList.toggle('hidden', !showContent);
  }

  // 진단 시작 핸들러
  async function startDiagnosis() {
    const btn = document.getElementById('startDiagnosis');
    const companyName = document.getElementById('companyName').value.trim();
    const industry = document.getElementById('industry').value;

    if (!companyName) {
      toast('기업/기관명 또는 브랜드명을 입력해주세요', 'warning');
      document.getElementById('companyName').focus();
      return;
    }

    const autoRewrite = document.getElementById('autoRewrite')?.checked || false;
    const isContentInput = (currentTarget === 'article' && articleInputMode === 'content');
    const diagPayload = {
      id: genId(),
      companyName,
      industry,
      target: currentTarget,
      mode: isContentInput ? 'content' : 'url',
      autoRewrite,
      startedAt: Date.now()
    };

    if (!isContentInput) {
      const websiteUrl = document.getElementById('websiteUrl').value.trim();
      const normalizedUrl = normalizeUrl(websiteUrl);
      if (!normalizedUrl) {
        toast(`올바른 ${TARGET_CONFIG[currentTarget].label} URL을 입력해주세요`, 'warning');
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
      location.href = `analyzing.html?id=${diagPayload.id}&target=${diagPayload.target}`;
    }, 400);
  }

  // 초기화
  document.addEventListener('DOMContentLoaded', () => {
    renderKpiGrid();

    const startBtn = document.getElementById('startDiagnosis');
    if (startBtn) startBtn.addEventListener('click', startDiagnosis);

    // 3축 target 토글
    document.querySelectorAll('#diagTargetToggle .tab').forEach(t => {
      t.addEventListener('click', () => setTarget(t.dataset.target));
    });

    // article 입력 모드 토글
    document.querySelectorAll('#articleInputMode .tab').forEach(t => {
      t.addEventListener('click', () => setArticleInputMode(t.dataset.input));
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
