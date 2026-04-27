/**
 * CEP 좌표 탭 - 진단 결과에 통합된 CEP 표시
 */
(function() {
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(result) {
    const container = document.getElementById('cepContent');
    const cep = result.cep || (sessionStorage.getItem('cep_result_latest') ? JSON.parse(sessionStorage.getItem('cep_result_latest')) : null);

    if (!cep || !cep.finalCEPs || cep.finalCEPs.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 64px 24px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px;">
          <div style="font-size: 4rem; margin-bottom: 16px;">🎯</div>
          <h2 style="margin-bottom: 12px;">CEP 발굴이 필요합니다</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px; max-width: 560px; margin-left: auto; margin-right: auto;">
            카테고리 진입점(CEP)은 AI 검색 시대에 가장 효과적인 콘텐츠 전략의 출발점입니다.
            5단계 워크플로로 브랜드가 점유할 진입 좌표를 발굴하세요.
          </p>
          <a href="cep.html?id=${ResultShared.id}" class="btn btn-primary btn-large" style="width: auto;">
            🎯 CEP 5단계 발굴 시작
          </a>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, rgba(255, 107, 53, 0.06), rgba(255, 168, 0, 0.04)); border: 1px solid rgba(255, 107, 53, 0.18); border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="font-size: 1.4rem;">🎯</span>
          <strong style="font-size: 1.1rem;">${escapeHtml(cep.brand)} CEP 좌표</strong>
          <span style="font-size: 0.8rem; color: var(--text-tertiary); padding: 3px 10px; background: rgba(255,255,255,0.06); border-radius: 4px;">${escapeHtml(cep.category)}</span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.7; margin: 0;">
          소비자의 검색 데이터에서 발굴한 ${cep.finalCEPs.length}개의 진입 좌표입니다.
          각 좌표는 콘텐츠 메시지·제품 포인트·GEO 대응 근거를 함께 제공합니다.
        </p>
      </div>

      ${cep.finalCEPs.map((c, i) => `
        <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px; margin-bottom: 16px;">
          <div style="display: inline-block; padding: 4px 12px; background: var(--color-accent); color: white; border-radius: 6px; font-size: 0.78rem; font-weight: 800; margin-bottom: 12px;">CEP ${i + 1}</div>
          <div style="font-size: 1.15rem; font-weight: 700; line-height: 1.5; margin-bottom: 18px; color: var(--text-primary);">"${escapeHtml(c.scene)}"</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
            <div style="padding: 14px; background: var(--bg-tertiary); border-radius: 10px;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 6px;">💬 핵심 메시지</div>
              <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">${escapeHtml(c.message || '-')}</div>
            </div>
            <div style="padding: 14px; background: var(--bg-tertiary); border-radius: 10px;">
              <div style="font-size: 0.72rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 6px;">📦 제품 포인트</div>
              <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">${escapeHtml(c.productAngle || '-')}</div>
            </div>
          </div>

          <div style="margin-top: 12px; padding: 14px; background: var(--bg-tertiary); border-radius: 10px;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px;">📝 콘텐츠 아이디어</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${(c.contentIdeas || []).map(t => `<span style="padding: 5px 12px; background: rgba(0, 149, 255, 0.1); color: #7dd3fc; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>

          <div style="margin-top: 12px; padding: 14px; background: rgba(0, 214, 143, 0.05); border-radius: 10px; border-left: 3px solid #00d68f;">
            <div style="font-size: 0.72rem; color: #00d68f; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 6px;">🤖 GEO 대응 근거</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">${escapeHtml(c.geoBasis || '-')}</div>
          </div>
        </div>`).join('')}

      <div style="text-align: center; margin-top: 24px;">
        <a href="cep.html?id=${ResultShared.id}" class="btn btn-secondary">🔁 CEP 재발굴</a>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
