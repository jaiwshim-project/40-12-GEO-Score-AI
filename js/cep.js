/**
 * GEO Score AI - CEP 발굴 5단계 워크플로
 */
(function() {
  let currentStep = 0;
  let cepState = {
    brand: '', category: '', industry: '', target: '',
    expressions: [],   // step1: 일상 언어 표현 배열
    clusters: [],      // step2: 검색 클러스터 [{name, intent, keywords[]}, ...]
    scenes: [],        // step3: CEP 장면 [{scene, sourceCluster}, ...]
    scoredCEPs: [],    // step4: 평가된 CEP [{scene, market, brandFit, evidence, total, type}, ...]
    finalCEPs: []      // step5: 최종 좌표 [{rank, scene, message, productAngle, geoBasis, contentIdeas[]}, ...]
  };

  function setStep(n) {
    currentStep = n;
    document.querySelectorAll('.cep-panel').forEach(p => p.classList.add('hidden'));
    document.querySelector(`.cep-panel[data-panel="${n}"]`).classList.remove('hidden');
    document.querySelectorAll('.cep-step-pill').forEach(p => {
      const sn = parseInt(p.dataset.step);
      p.classList.remove('active', 'done');
      if (sn < n) p.classList.add('done');
      else if (sn === n) p.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showLoader(containerId, label) {
    document.getElementById(containerId).innerHTML = `
      <div class="cep-loader">
        <div class="cep-loader-spinner"></div>
        <div>${label}</div>
        <div style="font-size: 0.8rem; color: var(--text-tertiary);">Gemini AI 분석 중...</div>
      </div>`;
  }

  function showError(containerId, msg) {
    document.getElementById(containerId).innerHTML = `
      <div style="padding: 32px; text-align: center; color: #ff3d71; background: rgba(255, 61, 113, 0.05); border: 1px solid rgba(255, 61, 113, 0.2); border-radius: 12px;">
        ❌ ${msg}
      </div>`;
  }

  // ============== Step 0: 브랜드 입력 ==============
  document.getElementById('btnStart').addEventListener('click', async () => {
    cepState.brand = document.getElementById('cepBrand').value.trim();
    cepState.category = document.getElementById('cepCategory').value.trim();
    cepState.industry = document.getElementById('cepIndustry').value;
    cepState.target = document.getElementById('cepTarget').value.trim();

    if (!cepState.brand || !cepState.category) {
      toast('브랜드명과 카테고리는 필수 입력입니다', 'warning');
      return;
    }
    setStep(1);
    await runStep1();
  });

  // ============== Step 1: 일상 언어 수집 ==============
  async function runStep1() {
    showLoader('step1Result', '카테고리에 진입하기 직전 사용하는 일상 표현을 수집 중...');
    try {
      const data = await api.post('/api/cep-discover', {
        step: 1,
        brand: cepState.brand,
        category: cepState.category,
        industry: cepState.industry,
        target: cepState.target
      });
      cepState.expressions = data.expressions || [];
      renderStep1();
    } catch (e) {
      showError('step1Result', '표현 수집 실패: ' + e.message);
    }
  }

  function renderStep1() {
    const container = document.getElementById('step1Result');
    container.innerHTML = `
      <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.88rem;">
        ✨ AI가 ${cepState.expressions.length}개의 일상 언어 표현을 추출했습니다. 부적절한 항목을 삭제하거나 직접 추가할 수 있습니다.
      </div>
      <div class="cep-chip-list" id="exprList">
        ${cepState.expressions.map((e, i) => `
          <div class="cep-chip">
            <span>${escapeHtml(e)}</span>
            <span class="cep-chip-remove" data-idx="${i}">×</span>
          </div>`).join('')}
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <input type="text" id="newExpr" class="form-input" placeholder="직접 추가: '비 오는 주말 아이와 갈 곳' 같은 표현" style="flex: 1;" />
        <button class="btn btn-secondary" id="btnAddExpr">+ 추가</button>
      </div>`;
    bindStep1();
    document.getElementById('btnStep2').disabled = cepState.expressions.length < 3;
  }

  function bindStep1() {
    document.querySelectorAll('#exprList .cep-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        cepState.expressions.splice(idx, 1);
        renderStep1();
      });
    });
    document.getElementById('btnAddExpr').addEventListener('click', () => {
      const input = document.getElementById('newExpr');
      const v = input.value.trim();
      if (v) { cepState.expressions.push(v); input.value = ''; renderStep1(); }
    });
    document.getElementById('newExpr').addEventListener('keypress', e => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btnAddExpr').click(); }
    });
  }

  // ============== Step 2: 검색 클러스터 ==============
  document.getElementById('btnStep2').addEventListener('click', async () => {
    setStep(2);
    showLoader('step2Result', '검색 경로와 클러스터를 분석 중...');
    try {
      const data = await api.post('/api/cep-discover', {
        step: 2,
        brand: cepState.brand,
        category: cepState.category,
        industry: cepState.industry,
        expressions: cepState.expressions
      });
      cepState.clusters = data.clusters || [];
      renderStep2();
    } catch (e) {
      showError('step2Result', '클러스터 분석 실패: ' + e.message);
    }
  });

  function renderStep2() {
    const container = document.getElementById('step2Result');
    container.innerHTML = `
      <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.88rem;">
        🔍 ${cepState.clusters.length}개의 검색 클러스터로 그룹화했습니다.
      </div>
      ${cepState.clusters.map(c => `
        <div class="cep-cluster">
          <div class="cep-cluster-name">${escapeHtml(c.name)}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">${escapeHtml(c.intent)}</div>
          <div class="cep-cluster-keywords">
            ${(c.keywords || []).map(k => `<span class="cep-cluster-kw">${escapeHtml(k)}</span>`).join('')}
          </div>
        </div>`).join('')}`;
    document.getElementById('btnStep3').disabled = cepState.clusters.length === 0;
  }

  // ============== Step 3: 장면 번역 ==============
  document.getElementById('btnStep3').addEventListener('click', async () => {
    setStep(3);
    showLoader('step3Result', '클러스터를 CEP 장면 문장으로 번역 중...');
    try {
      const data = await api.post('/api/cep-discover', {
        step: 3,
        brand: cepState.brand,
        category: cepState.category,
        industry: cepState.industry,
        clusters: cepState.clusters
      });
      cepState.scenes = data.scenes || [];
      renderStep3();
    } catch (e) {
      showError('step3Result', '장면 번역 실패: ' + e.message);
    }
  });

  function renderStep3() {
    const container = document.getElementById('step3Result');
    container.innerHTML = `
      <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.88rem;">
        🎬 ${cepState.scenes.length}개의 CEP 장면 문장이 도출됐습니다. 사람(타깃)이 아닌 <strong>순간</strong>으로 정의됩니다.
      </div>
      ${cepState.scenes.map((s, i) => `
        <div class="cep-scene-card">
          <div class="cep-scene-text">"${escapeHtml(s.scene)}"</div>
          <div class="cep-scene-source">📌 출처 클러스터: ${escapeHtml(s.sourceCluster || '-')}</div>
        </div>`).join('')}`;
    document.getElementById('btnStep4').disabled = cepState.scenes.length === 0;
  }

  // ============== Step 4: 우선순위 평가 ==============
  document.getElementById('btnStep4').addEventListener('click', async () => {
    setStep(4);
    showLoader('step4Result', '시장성 · 브랜드 적합성 · 입증 가능성으로 평가 중...');
    try {
      const data = await api.post('/api/cep-discover', {
        step: 4,
        brand: cepState.brand,
        category: cepState.category,
        industry: cepState.industry,
        scenes: cepState.scenes
      });
      cepState.scoredCEPs = data.scoredCEPs || [];
      renderStep4();
    } catch (e) {
      showError('step4Result', '평가 실패: ' + e.message);
    }
  });

  function scoreCls(v) { return v >= 7 ? 'high' : v >= 4 ? 'med' : 'low'; }

  function renderStep4() {
    const container = document.getElementById('step4Result');
    container.innerHTML = `
      <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.88rem;">
        📊 3가지 기준 (각 0~10점)으로 평가했습니다. 명시적/잠재적 CEP를 고루 선택해 균형 잡으세요.
      </div>
      <div style="overflow-x: auto;">
        <table class="cep-priority-table">
          <thead>
            <tr>
              <th style="width: 50%;">CEP 장면</th>
              <th>유형</th>
              <th>시장성</th>
              <th>브랜드 적합성</th>
              <th>입증 가능성</th>
              <th>총점</th>
            </tr>
          </thead>
          <tbody>
            ${cepState.scoredCEPs.map(c => `
              <tr>
                <td style="font-size: 0.92rem; line-height: 1.5;">"${escapeHtml(c.scene)}"</td>
                <td><span style="font-size: 0.78rem; padding: 3px 8px; border-radius: 4px; background: ${c.type === '명시적' ? 'rgba(0,149,255,0.1)' : 'rgba(168,85,247,0.1)'}; color: ${c.type === '명시적' ? '#7dd3fc' : '#c4b5fd'};">${c.type || '-'}</span></td>
                <td><span class="cep-score-badge ${scoreCls(c.market || 0)}">${c.market || 0}</span></td>
                <td><span class="cep-score-badge ${scoreCls(c.brandFit || 0)}">${c.brandFit || 0}</span></td>
                <td><span class="cep-score-badge ${scoreCls(c.evidence || 0)}">${c.evidence || 0}</span></td>
                <td><span class="cep-total-score">${c.total || 0}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    document.getElementById('btnStep5').disabled = cepState.scoredCEPs.length === 0;
  }

  // ============== Step 5: 최종 좌표 확정 ==============
  document.getElementById('btnStep5').addEventListener('click', async () => {
    setStep(5);
    showLoader('step5Result', '실행 가능한 좌표 문장 + 액션 플랜 생성 중...');
    try {
      const data = await api.post('/api/cep-discover', {
        step: 5,
        brand: cepState.brand,
        category: cepState.category,
        industry: cepState.industry,
        target: cepState.target,
        scoredCEPs: cepState.scoredCEPs
      });
      cepState.finalCEPs = data.finalCEPs || [];
      renderStep5();
    } catch (e) {
      showError('step5Result', '최종 확정 실패: ' + e.message);
    }
  });

  function renderStep5() {
    const container = document.getElementById('step5Result');
    container.innerHTML = `
      <div style="margin-bottom: 20px; color: var(--text-secondary); font-size: 0.88rem;">
        ✅ ${cepState.finalCEPs.length}개의 실행 가능한 CEP 좌표가 확정됐습니다. 각 좌표마다 메시지·제품 포인트·콘텐츠·GEO 근거가 함께 제안됩니다.
      </div>
      ${cepState.finalCEPs.map((c, i) => `
        <div class="cep-final-card">
          <div class="cep-final-rank">CEP ${i + 1}</div>
          <div class="cep-final-scene">"${escapeHtml(c.scene)}"</div>

          <div class="cep-final-section">
            <div class="cep-final-label">💬 핵심 메시지</div>
            <div class="cep-final-value">${escapeHtml(c.message || '-')}</div>
          </div>

          <div class="cep-final-section">
            <div class="cep-final-label">📦 제품 설명 포인트</div>
            <div class="cep-final-value">${escapeHtml(c.productAngle || '-')}</div>
          </div>

          <div class="cep-final-section">
            <div class="cep-final-label">📝 콘텐츠 아이디어</div>
            <div class="cep-final-actions">
              ${(c.contentIdeas || []).map(t => `<span class="cep-final-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>

          <div class="cep-final-section">
            <div class="cep-final-label">🤖 GEO 대응 근거</div>
            <div class="cep-final-value">${escapeHtml(c.geoBasis || '-')}</div>
          </div>

          <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-cep-rewrite" data-scene="${escapeHtml(c.scene)}" style="font-size: 0.85rem; padding: 8px 16px;">
              ✨ 이 CEP로 90점 글 만들기
            </button>
            <button class="btn btn-secondary btn-cep-derive" data-scene="${escapeHtml(c.scene)}" style="font-size: 0.85rem; padding: 8px 16px;">
              🌳 30개 질문형 파생 생성
            </button>
          </div>
        </div>`).join('')}`;

    // CEP → rewrite 자동 연결 (H)
    container.querySelectorAll('.btn-cep-rewrite').forEach(btn => {
      btn.addEventListener('click', () => {
        const scene = btn.dataset.scene;
        sessionStorage.setItem('selected_cep', JSON.stringify({ scene, brand: cepState.brand, industry: cepState.industry }));
        location.href = 'rewrite.html?cep=' + encodeURIComponent(scene);
      });
    });
    container.querySelectorAll('.btn-cep-derive').forEach(btn => {
      btn.addEventListener('click', () => {
        const scene = btn.dataset.scene;
        sessionStorage.setItem('selected_cep', JSON.stringify({ scene, brand: cepState.brand, industry: cepState.industry }));
        location.href = 'derive.html?cep=' + encodeURIComponent(scene);
      });
    });

    // sessionStorage에 저장 (진단 결과와 통합용)
    sessionStorage.setItem('cep_result_latest', JSON.stringify({
      brand: cepState.brand,
      category: cepState.category,
      industry: cepState.industry,
      finalCEPs: cepState.finalCEPs,
      scoredCEPs: cepState.scoredCEPs,
      savedAt: Date.now()
    }));
  }

  // ============== 뒤로 가기 ==============
  document.querySelectorAll('.btn-cep-back').forEach(btn => {
    if (btn.dataset.back) {
      btn.addEventListener('click', () => setStep(parseInt(btn.dataset.back)));
    }
  });

  // ============== JSON 저장 ==============
  document.getElementById('btnSaveCEP').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(cepState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cep-${cepState.brand}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CEP 발굴 결과가 다운로드되었습니다', 'success');
  });

  // ============== 진단 결과에 통합 ==============
  document.getElementById('btnApplyCEP').addEventListener('click', () => {
    const url = new URL(location.href);
    const id = url.searchParams.get('id');
    if (id) {
      // 진단 결과에 CEP 데이터 추가
      const stored = sessionStorage.getItem('current_result_' + id);
      if (stored) {
        const data = JSON.parse(stored);
        data.cep = cepState;
        sessionStorage.setItem('current_result_' + id, JSON.stringify(data));
      }
      location.href = 'result-cep.html?id=' + id;
    } else {
      toast('진단 ID가 없습니다. 먼저 GEO 진단을 실행해주세요.', 'warning');
      setTimeout(() => { location.href = 'index.html'; }, 1500);
    }
  });

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
