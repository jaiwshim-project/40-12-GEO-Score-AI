/**
 * GEO Score AI - 대시보드 로직
 */

(function() {
  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.querySelector(`.tab-panel[data-panel="${target}"]`).classList.add('active');
      });
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStats(history) {
    document.getElementById('totalDiagnoses').textContent = history.length;

    if (!history.length) {
      document.getElementById('avgScore').textContent = '-';
      document.getElementById('maxScore').textContent = '-';
      document.getElementById('lastDiagnosis').textContent = '-';
      return;
    }

    const avg = Math.round(history.reduce((a, b) => a + (b.totalScore || 0), 0) / history.length);
    const max = Math.max(...history.map(h => h.totalScore || 0));
    const last = history[0];

    document.getElementById('avgScore').textContent = `${avg}/100`;
    document.getElementById('maxScore').textContent = `${max}/100`;
    document.getElementById('lastDiagnosis').textContent = formatRelative(last.savedAt);
  }

  function renderHistory(history) {
    const container = document.getElementById('historyList');
    if (!history.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = history.map(h => {
      const grade = h.grade || window.getGrade(h.totalScore);
      const gradeKey = grade.key || window.getGrade(h.totalScore).key;
      const gradeLabel = grade.label || window.getGrade(h.totalScore).label;

      return `
        <div class="kpi-detail-card" style="margin-bottom: 16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
            <div style="flex:1;min-width:240px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <h3 style="margin:0;font-size:1.25rem;">${escapeHtml(h.companyName)}</h3>
                <span class="score-grade ${gradeKey}" style="font-size:0.8rem;padding:4px 12px;">
                  ${gradeLabel}
                </span>
              </div>
              <div style="color:var(--text-tertiary);font-size:0.9rem;margin-bottom:12px;">
                ${escapeHtml(extractDomain(h.websiteUrl || ''))} · ${escapeHtml(h.industry || '미분류')} · ${formatRelative(h.savedAt)}
              </div>
              <div style="font-size:0.95rem;color:var(--text-secondary);">
                ${escapeHtml(h.summary?.headline || '진단 결과')}
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:2.5rem;font-weight:800;font-family:monospace;background:linear-gradient(135deg,#ff6b35,#ffa800);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;line-height:1;">
                ${h.totalScore}
              </div>
              <div style="font-size:0.85rem;color:var(--text-tertiary);">/ 100</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
            <button class="btn btn-secondary" data-id="${escapeHtml(h.id)}" data-action="view" style="flex:1;min-width:120px;">
              📊 상세 보기
            </button>
            <button class="btn btn-ghost" data-id="${escapeHtml(h.id)}" data-action="delete">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'view') {
        const h = History.get(id);
        if (h) {
          sessionStorage.setItem('view_diagnosis', JSON.stringify(h));
          location.href = `/results.html?id=${id}&view=1`;
        }
      } else if (action === 'delete') {
        if (confirm('이 진단을 삭제하시겠습니까?')) {
          History.remove(id);
          load();
          toast('진단이 삭제되었습니다', 'info');
        }
      }
    });
  }

  function renderTrend(history) {
    const container = document.getElementById('trendChart');
    if (!history.length) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:32px;">데이터가 없습니다</div>';
      return;
    }

    const data = history.slice(0, 10).reverse().map(h => ({
      label: h.companyName.length > 12 ? h.companyName.slice(0, 10) + '..' : h.companyName,
      value: h.totalScore
    }));
    Chart.bar('trendChart', data);
  }

  function renderKpiAvg(history) {
    if (!history.length) {
      document.getElementById('kpiAvgRadar').innerHTML =
        '<div style="text-align:center;color:var(--text-tertiary);padding:32px;">데이터가 없습니다</div>';
      return;
    }

    const sums = {};
    const counts = {};
    history.forEach(h => {
      Object.entries(h.scores || {}).forEach(([id, s]) => {
        sums[id] = (sums[id] || 0) + (s.value || 0);
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    const radarData = window.KPI_DEFINITIONS.map(kpi => ({
      label: kpi.name.replace(' 지수', '').replace('지수', ''),
      value: counts[kpi.id] ? Math.round(sums[kpi.id] / counts[kpi.id]) : 0
    }));
    Chart.radar('kpiAvgRadar', radarData);
  }

  function loadDeriveHistory() {
    let dh = [];
    try { dh = JSON.parse(localStorage.getItem('derive_history') || '[]'); } catch (e) {}
    const container = document.getElementById('deriveHistoryList');
    if (!container) return;

    if (!dh.length) {
      container.innerHTML = `
        <div style="text-align:center;color:var(--text-tertiary);padding:48px 24px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px;">
          <div style="font-size:3rem;margin-bottom:12px;">🌳</div>
          <h3 style="margin-bottom:8px;">아직 30개 파생 이력이 없습니다</h3>
          <p style="margin-bottom: 16px;"><a href="derive.html" style="color: #a855f7;">🌳 30개 파생 생성하기 →</a></p>
        </div>`;
      return;
    }

    container.innerHTML = dh.map(e => {
      const bulk = e.bulkUpgrade;
      const cnt = e.count || (e.derivatives ? e.derivatives.length : 0);
      return `
        <div class="kpi-detail-card" style="margin-bottom: 16px; border-left: 4px solid #a855f7;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap: wrap; gap: 16px;">
            <div style="flex:1; min-width:240px;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                <h3 style="margin:0; font-size:1.15rem; color: #a855f7;">🌳 ${escapeHtml(e.brand || '-')}</h3>
                <span style="font-size: 0.78rem; padding: 2px 10px; background: rgba(168,85,247,0.12); color: #a855f7; border-radius: 999px;">${cnt}개 파생</span>
                ${bulk ? `<span style="font-size: 0.78rem; padding: 2px 10px; background: rgba(0,214,143,0.12); color: #00d68f; border-radius: 999px;">90점 일괄변환 ${bulk.reached90}/${bulk.total}</span>` : ''}
              </div>
              <div style="color: var(--text-tertiary); font-size: 0.85rem; margin-bottom: 8px;">
                ${escapeHtml(e.industry || '-')} · ${formatRelative(e.savedAt)}
                ${e.cepScene ? ` · CEP: "${escapeHtml(e.cepScene.slice(0, 40))}..."` : ''}
              </div>
              ${bulk ? `<div style="font-size: 0.88rem; color: var(--text-secondary);">평균 최종점수: <strong style="color: #00d68f;">${bulk.avgFinal}점</strong> · 성공 ${bulk.success?.length || 0}건 · 실패 ${bulk.fail?.length || 0}건</div>` : ''}
            </div>
            <div style="text-align: right; font-size: 2rem; font-weight: 800; color: #a855f7; font-family: monospace;">${cnt}</div>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
            <button class="btn btn-secondary" data-id="${escapeHtml(e.id)}" data-act="dv-view" style="flex: 1; min-width: 120px;">📖 상세 보기 (마크다운)</button>
            <button class="btn btn-ghost" data-id="${escapeHtml(e.id)}" data-act="dv-delete">🗑️</button>
          </div>
        </div>`;
    }).join('');

    container.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      const item = dh.find(d => d.id === id);
      if (!item) return;
      if (act === 'dv-view') {
        const md = (item.bulkUpgrade?.success || item.derivatives || []).map(r => {
          const title = r.title;
          const body = r.rewritten || r.body;
          return `# ${title}\n\n${body}\n\n---\n`;
        }).join('\n');
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else if (act === 'dv-delete') {
        if (confirm('이 파생 이력을 삭제하시겠습니까?')) {
          const updated = dh.filter(d => d.id !== id);
          localStorage.setItem('derive_history', JSON.stringify(updated));
          loadDeriveHistory();
          toast('삭제되었습니다', 'info');
        }
      }
    });
  }

  function load() {
    const history = History.list();
    let deriveCount = 0;
    try { deriveCount = (JSON.parse(localStorage.getItem('derive_history') || '[]')).length; } catch (e) {}

    if (!history.length && deriveCount === 0) {
      document.getElementById('emptyState').classList.remove('hidden');
      document.querySelectorAll('.tabs, .tab-panel').forEach(el => el.classList.add('hidden'));
    } else {
      document.getElementById('emptyState').classList.add('hidden');
      document.querySelectorAll('.tabs').forEach(el => el.classList.remove('hidden'));
    }

    renderStats(history);
    renderHistory(history);
    renderTrend(history);
    renderKpiAvg(history);
    loadDeriveHistory();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    load();
  });
})();
