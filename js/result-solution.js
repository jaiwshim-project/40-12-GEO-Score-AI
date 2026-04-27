/**
 * 솔루션 제안 탭
 */
(function() {
  function render(result, recommendation) {
    const container = document.getElementById('solutionContent');
    if (!recommendation) {
      container.innerHTML = `
        <div style="text-align:center;padding:48px;color:var(--text-tertiary);">
          솔루션 추천을 불러오지 못했습니다. <a href="chatbot.html">전문가 상담</a>으로 문의해주세요.
        </div>`;
      return;
    }

    const tier = recommendation.packageTier;
    const actions = recommendation.priorityActions;
    const outcome = recommendation.expectedOutcome;
    const pitch = recommendation.personalizedPitch;
    const esc = ResultShared.escapeHtml;

    container.innerHTML = `
      ${pitch ? `
        <div class="cta-section" style="margin-bottom: 32px;">
          <h2 class="cta-title" style="font-size: 1.5rem;">${esc(pitch)}</h2>
        </div>
      ` : ''}

      <div class="section-header">
        <h2>📋 우선순위 액션 플랜</h2>
        <p class="section-subtitle">가장 약한 KPI 3개에 대한 즉시 실행 가능한 액션</p>
      </div>

      <div class="kpi-detail-grid">
        ${actions.map(a => {
          const kpi = window.KPI_DEFINITIONS.find(k => k.id === a.kpiId);
          return `
            <div class="kpi-detail-card">
              <div class="kpi-detail-header">
                <div class="kpi-detail-name">
                  <span class="kpi-icon-mini">${kpi?.icon || '📌'}</span>
                  순위 ${a.rank}: ${kpi?.name || a.kpiId}
                </div>
                <div class="kpi-score low">${a.score}</div>
              </div>
              <div style="font-weight:700;font-size:1.05rem;margin-bottom:8px;color:var(--color-accent);">
                ${esc(a.action)}
              </div>
              <div class="kpi-detail-desc">${esc(a.detail)}</div>
              <div style="display:flex;gap:8px;margin-top:12px;">
                <span style="padding:4px 10px;background:rgba(0,214,143,0.1);color:#00d68f;border-radius:12px;font-size:0.8rem;font-weight:600;">${esc(a.impact)}</span>
                <span style="padding:4px 10px;background:rgba(0,149,255,0.1);color:#0095ff;border-radius:12px;font-size:0.8rem;font-weight:600;">${esc(a.cost)}</span>
              </div>
            </div>`;
        }).join('')}
      </div>

      <div class="section-header" style="margin-top: 64px;">
        <span class="section-tag">추천 패키지</span>
        <h2>🎁 ${esc(tier.name)}</h2>
        <p class="section-subtitle">${esc(tier.reason)}</p>
      </div>

      <div class="kpi-detail-card" style="max-width:720px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:2rem;font-weight:800;color:var(--color-accent);margin-bottom:8px;">${esc(tier.price)}</div>
          <div style="color:var(--text-tertiary);">${esc(tier.duration)}</div>
        </div>
        <div style="border-top:1px solid var(--border-primary);padding-top:24px;">
          <h4 style="margin-bottom:16px;">포함 사항</h4>
          <ul style="list-style:none;padding:0;">
            ${tier.includes.map(item => `
              <li style="padding:8px 0;display:flex;align-items:center;gap:12px;">
                <span style="color:#00d68f;font-weight:700;">✓</span>
                <span style="color:var(--text-secondary);">${esc(item)}</span>
              </li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="section-header" style="margin-top: 64px;">
        <h2>📈 3개월 후 예상 결과</h2>
      </div>

      <div class="stats-grid" style="max-width:720px;margin:0 auto;">
        <div class="stat-card">
          <div class="stat-label">예상 노출 증가</div>
          <div class="stat-value">${esc(outcome.improvement)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">예상 신규 점수</div>
          <div class="stat-value">${outcome.newScoreEstimate}<span style="font-size:1.25rem;color:var(--text-tertiary);">/100</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">달성 기간</div>
          <div class="stat-value">${esc(outcome.timeframe)}</div>
        </div>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
