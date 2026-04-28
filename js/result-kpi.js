/**
 * 10대 KPI 상세 탭
 * KPI 4 (citation)에는 ai_writing 4 측정 신호 세부 패널을 함께 표시
 */
(function() {
  // 0~3 스케일 → 색상 + 이모지
  function signalColor(scale) {
    if (scale >= 3) return { color: '#00d68f', emoji: '✅', label: '충족' };
    if (scale >= 2) return { color: '#ffa800', emoji: '⚠️', label: '근접' };
    if (scale >= 1) return { color: '#ff6b35', emoji: '🟡', label: '부족' };
    return { color: '#ef4444', emoji: '🚨', label: '미달' };
  }

  function renderAIWritingPanel(aiw) {
    if (!aiw) return '';
    const pct = (v) => (typeof v === 'number') ? Math.round(v * 100) + '%' : '-';

    const items = [
      { key: 'questionHeadings', label: '① 질문형 H2 비율', target: '≥ 50%', actual: pct(aiw.questionH2Rate),
        scale: aiw.questionHeadings || 0,
        tip: 'H2 제목을 "어떻게/왜/무엇" 패턴으로 변경하면 +점수' },
      { key: 'definitionH2', label: '② 정의문 H2 비율', target: '≥ 50%', actual: pct(aiw.definitionH2Rate),
        scale: aiw.definitionH2 || 0,
        tip: 'H2 첫 문장을 "X는 ~이다" 정의문으로 작성 (LLM 추출 친화)' },
      { key: 'brandRepetition', label: '③ 브랜드 반복 비율', target: '≥ 50%', actual: pct(aiw.brandRepetitionRate),
        scale: aiw.brandRepetition || 0,
        tip: '각 H2 섹션에 브랜드명을 자연스럽게 1회 이상 반복' },
      { key: 'externalSignal', label: '④ 외부 신호 비율', target: '≥ 30%', actual: pct(aiw.externalSignalRate),
        scale: aiw.externalSignal || 0,
        tip: '후기 인용("…") + 언론 보도 + "에 따르면" 패턴 추가' },
      { key: 'ctaReach', label: '⑤ CTA 도달률', target: '≥ 50%', actual: pct(aiw.ctaReachRate),
        scale: aiw.ctaReach || 0,
        tip: '본문 800자마다 상담/예약/메신저 CTA 1개씩 배치' }
    ];

    const totalScale = items.reduce((sum, i) => sum + i.scale, 0); // 0~15

    return `
      <div class="aiw-signals-panel" style="margin-top: 16px; padding: 16px; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <strong style="color: #a855f7;">⭐ ai_writing 5 측정 신호</strong>
          <span style="font-size: 0.85rem; color: var(--text-tertiary);">총 ${totalScale}/15</span>
        </div>
        <div style="display: grid; gap: 10px;">
          ${items.map(it => {
            const c = signalColor(it.scale);
            const bar = (it.scale / 3) * 100;
            return `
              <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: start;">
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 4px;">
                    <span>${it.label}</span>
                    <span style="color: ${c.color}; font-weight: 600;">${c.emoji} ${it.actual} <span style="opacity: 0.6; font-size: 0.85em;">(목표 ${it.target})</span></span>
                  </div>
                  <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${bar}%; background: ${c.color}; transition: width 0.4s;"></div>
                  </div>
                  ${it.scale < 3 ? `<div style="font-size: 0.78rem; color: var(--text-tertiary); margin-top: 4px;">💡 ${it.tip}</div>` : ''}
                </div>
                <span style="font-size: 0.78rem; padding: 2px 8px; background: ${c.color}22; color: ${c.color}; border-radius: 8px; align-self: center;">${it.scale}/3</span>
              </div>`;
          }).join('')}
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(168, 85, 247, 0.2); font-size: 0.82rem; color: var(--text-secondary);">
          출처: <a href="manual.html#ai-writing" style="color: #a855f7;">/ai_writing 6원칙</a> · KPI 4는 이 5신호의 직접 측정값입니다.
        </div>
      </div>`;
  }

  function render(result) {
    const grid = document.getElementById('kpiDetailGrid');
    // 신호는 result.meta.signalsDetected (standalone) 또는 result.meta.aiwSignals (server) 또는 scores.citation.aiwSignals
    const aiw = result.scores?.citation?.aiwSignals
              || result.meta?.aiwSignals
              || result.meta?.signalsDetected;

    grid.innerHTML = window.KPI_DEFINITIONS.map(kpi => {
      const s = result.scores[kpi.id] || {};
      const value = s.value || 0;
      const insight = window.getKpiInsight(kpi, value);
      const scoreCls = window.getScoreClass(value);
      // KPI 4 (citation)에 ai_writing 4신호 패널 부착
      const aiwPanel = (kpi.id === 'citation' && aiw) ? renderAIWritingPanel(aiw) : '';
      return `
        <div class="kpi-detail-card">
          <div class="kpi-detail-header">
            <div class="kpi-detail-name">
              <span class="kpi-icon-mini">${kpi.icon}</span>
              ${kpi.name}
            </div>
            <div class="kpi-score ${scoreCls}">${value}</div>
          </div>
          <div class="kpi-bar"><div class="kpi-bar-fill" style="width: ${value}%;"></div></div>
          <div class="kpi-detail-desc">${kpi.desc}</div>
          <div class="kpi-insight">
            <strong>📌 진단 인사이트</strong>
            ${ResultShared.escapeHtml(s.reason || insight)}
          </div>
          ${aiwPanel}
        </div>`;
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
