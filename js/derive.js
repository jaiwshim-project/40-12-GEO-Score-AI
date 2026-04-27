/**
 * GEO Score AI - 30개 질문형 파생 워크플로
 */
(function() {
  let lastDerivatives = null;
  let lastBrand = '';
  let activeCategory = 'all';

  function show(id) {
    document.getElementById('dvInputSection').classList.toggle('hidden', id !== 'input');
    document.getElementById('dvLoaderSection').classList.toggle('hidden', id !== 'loader');
    document.getElementById('dvResultSection').classList.toggle('hidden', id !== 'result');
  }

  // CEP 자동 채움 (?cep=X 또는 sessionStorage.selected_cep)
  function autoFill() {
    const url = new URL(location.href);
    const cepParam = url.searchParams.get('cep');
    let scene = null;
    let brand = null;
    let industry = null;
    if (cepParam) {
      try { scene = decodeURIComponent(cepParam); } catch (e) { scene = cepParam; }
    }
    const cepStored = sessionStorage.getItem('selected_cep');
    if (cepStored) {
      try {
        const c = JSON.parse(cepStored);
        if (!scene) scene = c.scene;
        brand = c.brand;
        industry = c.industry;
      } catch (e) {}
    }
    if (scene) {
      document.getElementById('dvCepScene').value = scene;
      document.getElementById('dvCepNotice').style.display = 'inline';
    }
    if (brand) document.getElementById('dvBrand').value = brand;
    if (industry) document.getElementById('dvIndustry').value = industry;

    // P. 한도 패널 렌더링
    const usagePanel = document.getElementById('dvUsagePanel');
    if (usagePanel) usagePanel.innerHTML = Usage.panelHtml('derive');
  }

  async function startDerive() {
    const brand = document.getElementById('dvBrand').value.trim();
    const industry = document.getElementById('dvIndustry').value;
    const cepScene = document.getElementById('dvCepScene').value.trim();
    const masterContent = document.getElementById('dvMaster').value.trim();

    if (!brand) { toast('브랜드/회사명을 입력해주세요', 'warning'); return; }
    if (!cepScene && !masterContent) {
      toast('CEP 장면 또는 마스터 글 중 하나는 필요합니다', 'warning');
      return;
    }

    // P. 요금제 한도 검사
    if (!Usage.check('derive')) {
      toast(Usage.message('derive'), 'error', 5000);
      return;
    }
    Usage.consume('derive');

    show('loader');
    document.getElementById('dvLoaderInfo').textContent =
      cepScene ? `CEP 장면 "${cepScene.slice(0, 40)}..." 기반 30개 파생 생성 중...` : '마스터 글 분해 + 30개 파생 생성 중...';

    try {
      const result = await api.post('/api/derive-30', {
        brand, industry, cepScene, masterContent, count: 30
      });
      if (!result.success || !result.derivatives) {
        throw new Error(result.error || '생성 실패');
      }
      lastDerivatives = result.derivatives;
      lastBrand = brand;
      renderResult(result);
    } catch (e) {
      console.error('[derive]', e);
      toast('생성 실패: ' + e.message, 'error');
      show('input');
    }
  }

  function renderResult(result) {
    show('result');
    document.getElementById('dvResultTitle').textContent = `🌳 ${result.count}개 질문형 파생 생성 완료`;
    document.getElementById('dvResultMeta').innerHTML =
      `<strong>${result.brand}</strong> · ${result.industry || '자동'}` +
      (result.cepScene ? ` · CEP: "${escapeHtml(result.cepScene)}"` : '');

    // L. 대시보드 이력에 저장
    saveDeriveHistory(result);

    const cats = {};
    result.derivatives.forEach(d => {
      const c = d.category || '기타';
      cats[c] = (cats[c] || 0) + 1;
    });

    const totalChars = result.derivatives.reduce((s, d) => s + (d.body?.length || 0), 0);
    const avgChars = Math.round(totalChars / result.derivatives.length);
    document.getElementById('dvStats').innerHTML = `
      <div class="derive-stat">
        <div class="derive-stat-value">${result.count}</div>
        <div class="derive-stat-label">파생 수</div>
      </div>
      <div class="derive-stat">
        <div class="derive-stat-value">${Object.keys(cats).length}</div>
        <div class="derive-stat-label">카테고리</div>
      </div>
      <div class="derive-stat">
        <div class="derive-stat-value">${avgChars}</div>
        <div class="derive-stat-label">평균 글자수</div>
      </div>
      <div class="derive-stat">
        <div class="derive-stat-value">${totalChars.toLocaleString()}</div>
        <div class="derive-stat-label">총 글자수</div>
      </div>`;

    // 카테고리 필터
    activeCategory = 'all';
    const filterContainer = document.getElementById('dvFilter');
    filterContainer.innerHTML = `
      <button class="derive-filter-btn active" data-cat="all">전체 ${result.count}</button>
      ${Object.entries(cats).map(([k, v]) => `
        <button class="derive-filter-btn" data-cat="${escapeHtml(k)}">${escapeHtml(k)} ${v}</button>
      `).join('')}`;
    filterContainer.querySelectorAll('.derive-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterContainer.querySelectorAll('.derive-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        renderGrid();
      });
    });

    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById('dvGrid');
    const items = activeCategory === 'all'
      ? lastDerivatives
      : lastDerivatives.filter(d => (d.category || '기타') === activeCategory);

    grid.innerHTML = items.map(d => `
      <div class="derive-card">
        <div>
          <span class="derive-card-rank">#${d.rank || '-'}</span>
          <span class="derive-card-cat">${escapeHtml(d.category || '기타')}</span>
        </div>
        <div class="derive-card-title">${escapeHtml(d.title || '-')}</div>
        <div class="derive-card-body">${escapeHtml(d.body || '').replace(/\n/g, '<br>')}</div>
        <div class="derive-card-actions">
          <button class="dv-expand">📖 펼쳐보기</button>
          <button class="dv-copy">📋 복사</button>
        </div>
      </div>`).join('');

    grid.querySelectorAll('.derive-card').forEach((card, i) => {
      const realItem = items[i];
      card.querySelector('.dv-expand').addEventListener('click', (e) => {
        e.stopPropagation();
        const body = card.querySelector('.derive-card-body');
        body.classList.toggle('expanded');
        e.target.textContent = body.classList.contains('expanded') ? '📕 접기' : '📖 펼쳐보기';
      });
      card.querySelector('.dv-copy').addEventListener('click', (e) => {
        e.stopPropagation();
        const text = `## ${realItem.title}\n\n${realItem.body}`;
        navigator.clipboard.writeText(text).then(() => toast('복사 완료', 'success'));
      });
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 다운로드
  document.getElementById('btnDvDownloadJson')?.addEventListener('click', () => {
    if (!lastDerivatives) return;
    const blob = new Blob([JSON.stringify(lastDerivatives, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `derive-30-${lastBrand}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnDvDownloadMd')?.addEventListener('click', () => {
    if (!lastDerivatives) return;
    const md = lastDerivatives.map(d =>
      `# ${d.title}\n\n> 카테고리: ${d.category || '-'} · 순번: #${d.rank}\n\n${d.body}\n\n---\n`
    ).join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `derive-30-${lastBrand}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnDvCopyAll')?.addEventListener('click', () => {
    if (!lastDerivatives) return;
    const text = lastDerivatives.map(d => `## ${d.title}\n\n${d.body}\n`).join('\n---\n\n');
    navigator.clipboard.writeText(text).then(() => toast('전체 복사 완료', 'success'));
  });
  document.getElementById('btnDvDownloadPdf')?.addEventListener('click', () => {
    if (!lastDerivatives) return;
    // 결과 영역 전체를 PDF로
    const target = document.getElementById('dvResultSection');
    if (!target || !window.PdfExport) {
      toast('PDF 라이브러리 로드 실패', 'error');
      return;
    }
    window.PdfExport.exportElementsToPDF(target, {
      filename: `derive-30-${lastBrand}-${Date.now()}.pdf`
    }).then(() => toast('PDF 다운로드 완료', 'success'))
      .catch(e => toast('PDF 실패: ' + e.message, 'error'));
  });

  document.getElementById('btnDvNew')?.addEventListener('click', () => show('input'));
  document.getElementById('btnDerive')?.addEventListener('click', startDerive);

  // ============== K. 30개 일괄 90점 변환 ==============
  let bulkResults = [];

  async function bulkUpgrade() {
    if (!lastDerivatives || !lastDerivatives.length) return;
    // P. 요금제 한도 검사
    if (!Usage.check('bulkUpgrade')) {
      toast(Usage.message('bulkUpgrade'), 'error', 5000);
      return;
    }
    if (!confirm(`${lastDerivatives.length}개 파생을 모두 90점 글로 변환합니다. Gemini API ${lastDerivatives.length * 2}회 호출(분석+재작성)이 일어나며 약 ${Math.ceil(lastDerivatives.length * 1.5)}~${lastDerivatives.length * 2}분 소요될 수 있습니다. 계속하시겠습니까?`)) return;
    Usage.consume('bulkUpgrade');

    const progress = document.getElementById('dvBulkProgress');
    const result = document.getElementById('dvBulkResult');
    const statusEl = document.getElementById('dvBulkStatus');
    const countEl = document.getElementById('dvBulkCount');
    const barEl = document.getElementById('dvBulkBar');
    const logEl = document.getElementById('dvBulkLog');
    progress.classList.remove('hidden');
    result.classList.add('hidden');
    bulkResults = [];

    // R. 지수 백오프 (Gemini 429 / rate limit 대응)
    const callWithBackoff = async (fn, label) => {
      let delay = 1000;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          return await fn();
        } catch (e) {
          const msg = e.message || '';
          const is429 = /429|rate|limit|too many/i.test(msg);
          if (!is429 || attempt === 3) throw e;
          statusEl.textContent = `${label} rate limit — ${delay/1000}초 대기 후 재시도 (${attempt + 1}/3)`;
          await new Promise(r => setTimeout(r, delay));
          delay *= 2; // 1s → 2s → 4s → 8s
        }
      }
    };

    const total = lastDerivatives.length;
    for (let i = 0; i < total; i++) {
      const d = lastDerivatives[i];
      countEl.textContent = `${i} / ${total}`;
      barEl.style.width = ((i / total) * 100) + '%';
      statusEl.textContent = `#${d.rank} "${d.title.slice(0, 40)}..." 변환 중...`;

      try {
        // 1) 원본 분석 (백오프)
        const beforeRes = await callWithBackoff(() => api.post('/api/analyze', {
          companyName: lastBrand,
          industry: document.getElementById('dvIndustry').value || undefined,
          mode: 'content',
          content: `## ${d.title}\n\n${d.body}`
        }), `#${d.rank} 분석`);
        // 2) 90점 재작성 (백오프)
        const rewriteRes = await callWithBackoff(() => api.post('/api/rewrite-content', {
          companyName: lastBrand,
          industry: document.getElementById('dvIndustry').value || undefined,
          content: `## ${d.title}\n\n${d.body}`,
          cepScene: document.getElementById('dvCepScene').value.trim(),
          currentScores: beforeRes.scores,
          currentTotal: beforeRes.totalScore,
          targetScore: 90
        }), `#${d.rank} 재작성`);

        bulkResults.push({
          rank: d.rank,
          title: d.title,
          category: d.category,
          beforeContent: d.body,
          beforeScore: beforeRes.totalScore,
          rewritten: rewriteRes.rewritten,
          finalScore: rewriteRes.finalScore || null,
          iterations: rewriteRes.iterations
        });

        const logEntry = document.createElement('div');
        logEntry.innerHTML = `✅ #${d.rank} ${beforeRes.totalScore}점 → ${rewriteRes.finalScore || '?'}점 (반복 ${rewriteRes.iterations}회)`;
        logEl.appendChild(logEntry);
        logEl.scrollTop = logEl.scrollHeight;
      } catch (e) {
        const logEntry = document.createElement('div');
        logEntry.style.color = '#ef4444';
        logEntry.innerHTML = `🚨 #${d.rank} 실패: ${e.message}`;
        logEl.appendChild(logEntry);
        bulkResults.push({ rank: d.rank, title: d.title, category: d.category, error: e.message });
      }
    }

    countEl.textContent = `${total} / ${total}`;
    barEl.style.width = '100%';
    statusEl.textContent = '✅ 일괄 변환 완료';

    renderBulkResult();
  }

  function renderBulkResult() {
    const result = document.getElementById('dvBulkResult');
    result.classList.remove('hidden');

    const success = bulkResults.filter(r => !r.error);
    const fail = bulkResults.filter(r => r.error);
    const avgFinal = success.length > 0
      ? Math.round(success.reduce((s, r) => s + (r.finalScore || 0), 0) / success.length)
      : 0;
    const reached90 = success.filter(r => (r.finalScore || 0) >= 90).length;

    result.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,214,143,0.08)); border: 1px solid rgba(168,85,247,0.3); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #a855f7; margin-bottom: 12px;">✨ 30개 일괄 90점 변환 결과</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          <div class="derive-stat"><div class="derive-stat-value">${success.length}</div><div class="derive-stat-label">성공</div></div>
          <div class="derive-stat"><div class="derive-stat-value" style="color: ${reached90 === success.length ? '#00d68f' : '#ffa800'};">${reached90}</div><div class="derive-stat-label">90점 달성</div></div>
          <div class="derive-stat"><div class="derive-stat-value">${avgFinal}</div><div class="derive-stat-label">평균 최종점수</div></div>
          <div class="derive-stat"><div class="derive-stat-value" style="color: ${fail.length > 0 ? '#ef4444' : 'inherit'};">${fail.length}</div><div class="derive-stat-label">실패</div></div>
        </div>
      </div>
      <div class="derive-grid">
        ${success.map(r => `
          <div class="derive-card" style="border-left: 4px solid ${(r.finalScore || 0) >= 90 ? '#00d68f' : '#ffa800'};">
            <div>
              <span class="derive-card-rank">#${r.rank}</span>
              <span class="derive-card-cat">${escapeHtml(r.category || '-')}</span>
              <span style="float: right; font-weight: 800; color: ${(r.finalScore || 0) >= 90 ? '#00d68f' : '#ffa800'};">${r.beforeScore} → ${r.finalScore || '?'}점</span>
            </div>
            <div class="derive-card-title">${escapeHtml(r.title)}</div>
            <div class="derive-card-body">${escapeHtml(r.rewritten || '').replace(/\n/g, '<br>')}</div>
            <div class="derive-card-actions">
              <button class="dv-bulk-expand">📖 펼쳐보기</button>
              <button class="dv-bulk-copy">📋 복사</button>
            </div>
          </div>`).join('')}
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <button class="btn btn-primary" id="btnBulkDownloadMd">📥 30개 90점 글 다운로드 (MD)</button>
        <button class="btn btn-secondary" id="btnBulkDownloadJson">📥 JSON 다운로드</button>
      </div>`;

    result.querySelectorAll('.derive-card').forEach((card, i) => {
      const r = success[i];
      card.querySelector('.dv-bulk-expand')?.addEventListener('click', (e) => {
        const body = card.querySelector('.derive-card-body');
        body.classList.toggle('expanded');
        e.target.textContent = body.classList.contains('expanded') ? '📕 접기' : '📖 펼쳐보기';
      });
      card.querySelector('.dv-bulk-copy')?.addEventListener('click', () => {
        navigator.clipboard.writeText(`# ${r.title}\n\n${r.rewritten}`).then(() => toast('복사 완료', 'success'));
      });
    });

    document.getElementById('btnBulkDownloadMd')?.addEventListener('click', () => {
      const md = success.map(r =>
        `# ${r.title}\n\n> 카테고리: ${r.category || '-'} · ${r.beforeScore}점 → ${r.finalScore}점\n\n${r.rewritten}\n\n---\n`
      ).join('\n');
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `derive-30-upgraded-${lastBrand}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('btnBulkDownloadJson')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(bulkResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `derive-30-upgraded-${lastBrand}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // 결과를 derive_history에 통합 저장
    saveDeriveHistory({
      brand: lastBrand,
      derivatives: lastDerivatives,
      bulkUpgrade: { success, fail, avgFinal, reached90, total: bulkResults.length }
    });
  }

  document.getElementById('btnDvUpgradeAll')?.addEventListener('click', bulkUpgrade);

  // ============== L. 대시보드 이력 저장 ==============
  function saveDeriveHistory(payload) {
    try {
      const KEY = 'derive_history';
      const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        brand: payload.brand || lastBrand,
        industry: payload.industry,
        cepScene: payload.cepScene,
        count: payload.count || (payload.derivatives ? payload.derivatives.length : 0),
        derivatives: payload.derivatives,
        bulkUpgrade: payload.bulkUpgrade || null,
        savedAt: new Date().toISOString()
      };
      // 동일 brand+savedAt 1분 이내는 동일 세션 — 갱신
      const recentIdx = existing.findIndex(e => e.brand === entry.brand && (Date.now() - new Date(e.savedAt).getTime()) < 60000);
      if (recentIdx >= 0) {
        existing[recentIdx] = { ...existing[recentIdx], ...entry, id: existing[recentIdx].id };
      } else {
        existing.unshift(entry);
      }
      // 최대 50건 유지
      const trimmed = existing.slice(0, 50);
      localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch (e) { console.warn('[derive history] 저장 실패', e); }
  }

  document.addEventListener('DOMContentLoaded', autoFill);
})();
