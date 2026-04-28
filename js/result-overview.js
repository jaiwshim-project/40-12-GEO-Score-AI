/**
 * 종합 분석 탭 - radar chart + 강점/약점/즉시 개선
 */
(function() {
  // 일련번호 (① ~ ⑩) — 1~10 자리수
  const NUMBER_GLYPHS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

  function renderKpiLegend(result) {
    const target = document.getElementById('kpiLegendGrid');
    if (!target) return;
    target.innerHTML = window.KPI_DEFINITIONS.map((kpi, i) => {
      const score = result.scores?.[kpi.id]?.value || 0;
      const num = NUMBER_GLYPHS[i] || `(${i + 1})`;
      const desc = kpi.description || kpi.desc || '';
      return `
        <div style="padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-left: 4px solid ${kpi.color}; border-radius: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 1.2rem; font-weight: 800; color: ${kpi.color};">${num}</span>
            <span style="font-size: 1.1rem;">${kpi.icon}</span>
            <strong style="font-size: 0.95rem;">${ResultShared.escapeHtml(kpi.name)}</strong>
            <span style="margin-left: auto; font-size: 0.72rem; padding: 2px 8px; background: ${kpi.color}22; color: ${kpi.color}; border-radius: 999px; font-weight: 700;">가중치 ${kpi.weight}%</span>
            <span style="font-size: 0.85rem; font-weight: 800; font-family: monospace; color: ${kpi.color};">${score}점</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">${ResultShared.escapeHtml(desc)}</p>
        </div>`;
    }).join('');
  }

  function render(result) {
    // 레이더 차트 — 일련번호 표시 (① ~ ⑩)
    const radarData = window.KPI_DEFINITIONS.map((kpi, i) => ({
      label: `${NUMBER_GLYPHS[i] || (i+1)} ${kpi.name.replace(' 지수', '').replace('지수', '')}`,
      value: result.scores[kpi.id]?.value || 0
    }));
    Chart.radar('radarChart', radarData);

    // 10대 KPI 범례 렌더링
    renderKpiLegend(result);

    // 강점/약점/즉시 개선
    const sorted = Object.entries(result.scores)
      .map(([id, s]) => ({
        id, value: s.value || 0,
        kpi: window.KPI_DEFINITIONS.find(k => k.id === id),
        reason: s.reason
      }))
      .filter(x => x.kpi);

    const strengths = [...sorted].sort((a, b) => b.value - a.value).slice(0, 3);
    const weaknesses = [...sorted].sort((a, b) => a.value - b.value).slice(0, 3);

    document.getElementById('strengthsList').innerHTML = strengths.map(s => `
      <div style="margin-bottom: 12px; padding: 12px; background: rgba(0,214,143,0.08); border-left: 3px solid #00d68f; border-radius: 6px;">
        <div style="display:flex;justify-content:space-between;font-weight:600;">
          <span>${s.kpi.icon} ${s.kpi.name}</span>
          <span style="color:#00d68f;font-family:monospace;">${s.value}</span>
        </div>
      </div>`).join('');

    document.getElementById('weaknessesList').innerHTML = weaknesses.map(w => `
      <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,61,113,0.08); border-left: 3px solid #ff3d71; border-radius: 6px;">
        <div style="display:flex;justify-content:space-between;font-weight:600;">
          <span>${w.kpi.icon} ${w.kpi.name}</span>
          <span style="color:#ff3d71;font-family:monospace;">${w.value}</span>
        </div>
      </div>`).join('');

    const quickWins = sorted.filter(s => s.value < 50 && ['citation', 'conversion', 'visibility'].includes(s.id));
    document.getElementById('quickWinsList').innerHTML = quickWins.length ? quickWins.map(q => `
      <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,168,0,0.08); border-left: 3px solid #ffa800; border-radius: 6px;">
        <div style="font-weight:600;margin-bottom:4px;">${q.kpi.icon} ${q.kpi.name}</div>
        <div style="font-size:0.85rem;color:var(--text-tertiary);">2주 내 적용 가능</div>
      </div>`).join('') : '<div style="color:var(--text-tertiary);font-size:0.9rem;">현재 즉시 개선 가능한 항목이 적습니다.</div>';
  }

  document.addEventListener('DOMContentLoaded', () => {
    ResultShared.init(render);
    document.getElementById('saveReportPdf')?.addEventListener('click', () => {
      const r = ResultShared.result;
      window.PdfExport?.exportResultPagePDF(r, ResultShared.recommendation);
    });
  });
})();
