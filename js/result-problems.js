/**
 * 문제 영역 탭
 */
(function() {
  function render(result) {
    const problems = result.summary?.topProblems || [];
    const opportunities = result.summary?.opportunities || [];

    document.getElementById('problemGrid').innerHTML = problems.length ? problems.map((p, i) => `
      <div class="problem-card">
        <div class="problem-icon">${['🚨', '⚠️', '🛑'][i] || '⚠️'}</div>
        <div class="problem-title">문제 ${i + 1}</div>
        <div class="problem-desc">${ResultShared.escapeHtml(p)}</div>
      </div>`).join('') : '<div style="color:var(--text-tertiary);text-align:center;width:100%;padding:32px;">분석된 문제가 없습니다.</div>';

    document.getElementById('opportunityGrid').innerHTML = opportunities.length ? opportunities.map((o, i) => `
      <div class="problem-card solution-card">
        <div class="problem-icon">${['✨', '🎯', '🚀'][i] || '✨'}</div>
        <div class="problem-title">기회 ${i + 1}</div>
        <div class="problem-desc">${ResultShared.escapeHtml(o)}</div>
      </div>`).join('') : '<div style="color:var(--text-tertiary);text-align:center;width:100%;padding:32px;">분석된 기회가 없습니다.</div>';
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
