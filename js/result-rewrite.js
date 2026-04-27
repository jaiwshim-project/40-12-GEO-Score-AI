/**
 * 90점 글 생성 탭 (결과 페이지 8번째 탭)
 * 진단 결과를 바탕으로 자동 채움 → 즉시 재작성 가능
 */
(function() {
  let lastRewrite = null;

  function show(id) {
    document.getElementById('rwInputArea').classList.toggle('hidden', id !== 'input');
    document.getElementById('rwLoaderArea').classList.toggle('hidden', id !== 'loader');
    document.getElementById('rwResultArea').classList.toggle('hidden', id !== 'result');
  }

  function setStage(n, info) {
    document.querySelectorAll('#rwLoaderStages .rewrite-loader-stage').forEach(el => {
      const s = parseInt(el.dataset.stage);
      el.classList.remove('active', 'done');
      if (s < n) el.classList.add('done');
      else if (s === n) el.classList.add('active');
    });
    if (info) document.getElementById('rwLoaderInfo').textContent = info;
  }

  async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function runRewrite(brand, industry, content, beforeScores, beforeTotal, beforeGrade) {
    show('loader');

    setStage(1, '원본 글 점수 측정 완료');
    await sleep(300);
    setStage(2, `부족 KPI ${Object.values(beforeScores).filter(s => s.value < 70).length}개 영역 식별`);
    await sleep(300);

    setStage(3, 'Gemini AI가 신호를 보강한 글을 작성 중...');
    const rewriteResult = await api.post('/api/rewrite-content', {
      companyName: brand, industry, content,
      currentScores: beforeScores, currentTotal: beforeTotal,
      targetScore: 90
    });
    await sleep(300);

    setStage(4, '재작성 글 점수 검증');
    const after = await api.post('/api/analyze', {
      companyName: brand, industry, mode: 'content', content: rewriteResult.rewritten
    });
    await sleep(300);

    setStage(5, `✅ ${after.totalScore}점 달성`);
    await sleep(500);

    lastRewrite = {
      brand, industry,
      original: content,
      rewritten: rewriteResult.rewritten,
      beforeScores, afterScores: after.scores,
      beforeTotal, afterTotal: after.totalScore,
      beforeGrade, afterGrade: after.grade,
      iterations: rewriteResult.iterations || 1
    };
    renderResult();

    // sessionStorage에 저장 (재진입 시 캐시 사용)
    const id = ResultShared.id;
    if (id) {
      const stored = sessionStorage.getItem('current_result_' + id);
      if (stored) {
        const data = JSON.parse(stored);
        data.rewrite = lastRewrite;
        sessionStorage.setItem('current_result_' + id, JSON.stringify(data));
      }
    }
  }

  function renderResult() {
    const r = lastRewrite;
    show('result');

    document.getElementById('rwScoreBefore').textContent = r.beforeTotal;
    document.getElementById('rwScoreAfter').textContent = r.afterTotal;
    document.getElementById('rwGradeBefore').textContent = r.beforeGrade.label;
    document.getElementById('rwGradeAfter').textContent = r.afterGrade.label;
    const delta = r.afterTotal - r.beforeTotal;
    document.getElementById('rwScoreDelta').textContent = (delta >= 0 ? '+' : '') + delta + '점 상승';

    document.getElementById('rwBeforeContent').textContent = r.original;
    document.getElementById('rwAfterContent').textContent = r.rewritten;
    document.getElementById('rwBeforeMeta').textContent = `${r.original.length}자`;
    document.getElementById('rwAfterMeta').textContent = `${r.rewritten.length}자`;

    const KPI_NAMES = {
      visibility: '검색 가시성', velocity: '콘텐츠 생산력', authority: 'E-E-A-T 신뢰도',
      citation: 'AI 인용 가능성', engagement: '고객 참여도', conversion: '전환 설계',
      channel: '채널 확장', brand: '브랜드 일관성', competitive: '경쟁 점유율', aio: 'AI 최적화 준비도'
    };
    const html = Object.keys(KPI_NAMES).map(k => {
      const before = r.beforeScores[k]?.value || 0;
      const after = r.afterScores[k]?.value || 0;
      const d = after - before;
      return `
        <div class="rewrite-kpi-row">
          <div class="rewrite-kpi-name">${KPI_NAMES[k]}</div>
          <div class="rewrite-kpi-bars">
            <div class="rewrite-kpi-bar-before" style="width: ${before}%"></div>
            <div class="rewrite-kpi-bar-after" style="width: ${after}%"></div>
          </div>
          <div class="rewrite-kpi-delta ${d < 0 ? 'neg' : ''}">${d >= 0 ? '+' : ''}${d}</div>
        </div>`;
    }).join('');
    document.getElementById('rwKpiComparison').innerHTML = html;

    // ai_writing 4신호 Before→After 비교 (KPI 4 세부 분석)
    renderAiwComparison(r);
  }

  function renderAiwComparison(r) {
    const beforeAiw = r.beforeScores?.citation?.aiwSignals;
    const afterAiw  = r.afterScores?.citation?.aiwSignals;
    const target = document.getElementById('rwAiwComparison');
    if (!target) return;
    if (!beforeAiw || !afterAiw) {
      target.innerHTML = '';
      return;
    }

    const items = [
      { label: '① 질문형 H2 비율', target: 50, beforeRate: beforeAiw.questionH2Rate || 0, afterRate: afterAiw.questionH2Rate || 0 },
      { label: '② 정의문 H2 비율', target: 50, beforeRate: beforeAiw.definitionH2Rate || 0, afterRate: afterAiw.definitionH2Rate || 0 },
      { label: '③ 브랜드 반복 비율', target: 50, beforeRate: beforeAiw.brandRepetitionRate || 0, afterRate: afterAiw.brandRepetitionRate || 0 },
      { label: '④ 외부 신호 비율', target: 30, beforeRate: beforeAiw.externalSignalRate || 0, afterRate: afterAiw.externalSignalRate || 0 },
      { label: '⑤ CTA 도달률', target: 50, beforeRate: beforeAiw.ctaReachRate || 0, afterRate: afterAiw.ctaReachRate || 0 }
    ];

    const rows = items.map(it => {
      const bPct = Math.round(it.beforeRate * 100);
      const aPct = Math.round(it.afterRate * 100);
      const delta = aPct - bPct;
      const reachedTarget = aPct >= it.target;
      return `
        <div style="display: grid; grid-template-columns: 160px 1fr 80px; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(168,85,247,0.1);">
          <div style="font-size: 0.88rem; font-weight: 600;">${it.label}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="width: 50px; font-size: 0.78rem; color: #ff6b35;">${bPct}%</span>
              <div style="flex:1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${bPct}%; background: #ff6b35; opacity: 0.6;"></div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 50px; font-size: 0.78rem; color: #00d68f; font-weight: 700;">${aPct}%</span>
              <div style="flex:1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${aPct}%; background: #00d68f; transition: width 0.6s;"></div>
              </div>
              <span style="font-size: 0.72rem; color: var(--text-tertiary);">목표 ${it.target}%</span>
            </div>
          </div>
          <div style="text-align: right; font-weight: 700; color: ${delta >= 0 ? '#00d68f' : '#ff3d71'}; font-size: 0.95rem;">
            ${delta >= 0 ? '+' : ''}${delta}%
            ${reachedTarget ? '<div style="font-size: 0.7rem; color: #00d68f;">✅ 달성</div>' : ''}
          </div>
        </div>`;
    }).join('');

    target.innerHTML = `
      <div style="margin-top: 32px; padding: 24px; background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.25); border-radius: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #a855f7;">⭐ AI 인용 5신호 Before → After</h3>
          <span style="font-size: 0.78rem; color: var(--text-tertiary);">출처: <a href="manual.html#ai-writing" style="color: #a855f7;">ai_writing 6원칙</a></span>
        </div>
        <div style="display: flex; gap: 16px; margin-bottom: 12px; font-size: 0.78rem;">
          <span><span style="display: inline-block; width: 12px; height: 12px; background: #ff6b35; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>원본</span>
          <span><span style="display: inline-block; width: 12px; height: 12px; background: #00d68f; border-radius: 2px; vertical-align: middle; margin-right: 4px;"></span>재작성 후</span>
        </div>
        ${rows}
      </div>`;
  }

  function render(result, recommendation) {
    const stored = sessionStorage.getItem('current_diagnosis');
    let diagnosis = null;
    try { if (stored) diagnosis = JSON.parse(stored); } catch (e) {}

    // 이미 재작성 결과가 있으면 바로 표시
    if (result.rewrite) {
      lastRewrite = result.rewrite;
      renderResult();
      return;
    }

    // content 모드가 아닌 경우 안내 (URL 모드는 원본 글이 없음)
    if (!diagnosis || !diagnosis.content) {
      document.getElementById('rwInputArea').innerHTML = `
        <div style="text-align: center; padding: 48px 24px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
          <h3 style="margin-bottom: 12px;">원본 글이 없습니다</h3>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">
            URL로 진단한 경우 재작성할 원본 글이 없습니다.<br/>
            <strong>홈페이지에서 "📝 작성한 글로 진단" 모드</strong>를 사용해 글을 직접 입력해주세요.
          </p>
          <a href="index.html" class="btn btn-primary">🏠 홈으로 가기</a>
        </div>`;
      return;
    }

    // 자동 채움 + 즉시 시작 버튼
    document.getElementById('rwBrandDisplay').textContent = result.companyName;
    document.getElementById('rwIndustryDisplay').textContent = result.industry || diagnosis.industry || '미분류';
    document.getElementById('rwContentPreview').textContent = diagnosis.content.slice(0, 300) + (diagnosis.content.length > 300 ? '...' : '');
    document.getElementById('rwOriginalLength').textContent = `${diagnosis.content.length}자`;
    document.getElementById('rwCurrentScore').textContent = result.totalScore;

    document.getElementById('btnRunRewrite').addEventListener('click', () => {
      runRewrite(result.companyName, result.industry || diagnosis.industry, diagnosis.content, result.scores, result.totalScore, result.grade);
    });
    document.getElementById('btnRwCopy')?.addEventListener('click', () => {
      if (!lastRewrite) return;
      navigator.clipboard.writeText(lastRewrite.rewritten).then(() => toast('복사 완료', 'success'));
    });
    document.getElementById('btnRwDownload')?.addEventListener('click', () => {
      if (!lastRewrite) return;
      const blob = new Blob([lastRewrite.rewritten], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geo-90score-${lastRewrite.brand}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('btnRwRegen')?.addEventListener('click', () => {
      runRewrite(result.companyName, result.industry || diagnosis.industry, diagnosis.content, result.scores, result.totalScore, result.grade);
    });
    document.getElementById('btnRwCitationTest')?.addEventListener('click', () => {
      if (!lastRewrite) return;
      // sessionStorage에 재작성 결과 저장 후 citation-test로 이동
      const id = ResultShared.id;
      // citation-test가 자동 채움할 수 있도록 ?id 전달 (rewrite 결과에서 content 추출)
      location.href = `citation-test.html?id=${id || ''}`;
    });
  }

  // 결과 페이지 진입 시 자동 채움
  document.addEventListener('DOMContentLoaded', () => {
    ResultShared.init((result, recommendation) => {
      // 입력 폼/결과 영역 동적 생성
      const container = document.getElementById('rewriteTabContent');
      container.innerHTML = `
        <div id="rwInputArea">
          <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px; padding: 32px;">
            <h3 style="margin-bottom: 20px;">📝 분석된 원본 글로 90점 생성</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div style="padding: 14px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 700; text-transform: uppercase;">브랜드</div>
                <div id="rwBrandDisplay" style="font-weight: 700;">-</div>
              </div>
              <div style="padding: 14px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 700; text-transform: uppercase;">업종</div>
                <div id="rwIndustryDisplay" style="font-weight: 700;">-</div>
              </div>
              <div style="padding: 14px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 700; text-transform: uppercase;">현재 점수</div>
                <div style="font-weight: 700; color: #ff3d71;"><span id="rwCurrentScore">-</span>점</div>
              </div>
            </div>
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 600;">📜 원본 글 (미리보기)</div>
                <div id="rwOriginalLength" style="font-size: 0.78rem; color: var(--text-tertiary);">-</div>
              </div>
              <div id="rwContentPreview" style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px; font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); max-height: 200px; overflow-y: auto; white-space: pre-wrap;">-</div>
            </div>
            <div style="text-align: center;">
              <button class="btn btn-primary btn-large" id="btnRunRewrite">🚀 90점 글로 재작성 시작</button>
              <p style="margin-top: 12px; font-size: 0.78rem; color: var(--text-tertiary);">⏱️ 약 30~60초 소요 · 자가 검증 루프 최대 3회</p>
            </div>
          </div>
        </div>

        <div id="rwLoaderArea" class="hidden">
          <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px; padding: 60px 32px; text-align: center;">
            <div class="rewrite-spinner"></div>
            <h3 style="margin-bottom: 12px;">AI가 글을 재작성하고 있습니다</h3>
            <div id="rwLoaderStages" style="margin: 24px 0;">
              <span class="rewrite-loader-stage" data-stage="1">1️⃣ 원본 분석</span>
              <span class="rewrite-loader-stage" data-stage="2">2️⃣ 부족 신호</span>
              <span class="rewrite-loader-stage" data-stage="3">3️⃣ 재작성</span>
              <span class="rewrite-loader-stage" data-stage="4">4️⃣ 검증</span>
              <span class="rewrite-loader-stage" data-stage="5">5️⃣ 완료</span>
            </div>
            <p id="rwLoaderInfo" style="color: var(--text-tertiary); font-size: 0.85rem;">분석 시작...</p>
          </div>
        </div>

        <div id="rwResultArea" class="hidden">
          <div class="rewrite-score-summary">
            <div class="rewrite-score-block">
              <div class="rewrite-score-label">📉 원본</div>
              <div class="rewrite-score-value before" id="rwScoreBefore">-</div>
              <div class="rewrite-score-grade" id="rwGradeBefore">-</div>
            </div>
            <div class="rewrite-arrow">→</div>
            <div class="rewrite-score-block">
              <div class="rewrite-score-label">📈 재작성 후</div>
              <div class="rewrite-score-value after" id="rwScoreAfter">-</div>
              <div class="rewrite-score-grade" id="rwGradeAfter">-</div>
              <div class="rewrite-delta" id="rwScoreDelta">-</div>
            </div>
          </div>

          <div class="rewrite-side-by-side">
            <div class="rewrite-doc before">
              <div class="rewrite-doc-header">
                <div class="rewrite-doc-title">📜 원본 글</div>
                <div class="rewrite-doc-meta" id="rwBeforeMeta">-자</div>
              </div>
              <div class="rewrite-doc-content" id="rwBeforeContent">-</div>
            </div>
            <div class="rewrite-doc after">
              <div class="rewrite-doc-header">
                <div class="rewrite-doc-title">✨ AI 재작성 글</div>
                <div class="rewrite-doc-meta" id="rwAfterMeta">-자</div>
              </div>
              <div class="rewrite-doc-content" id="rwAfterContent">-</div>
            </div>
          </div>

          <div class="rewrite-kpi-comparison">
            <h3 style="margin-bottom: 16px;">📊 KPI별 점수 변화</h3>
            <div id="rwKpiComparison"></div>
          </div>

          <div id="rwAiwComparison"></div>

          <div class="rewrite-actions">
            <button class="btn btn-primary" id="btnRwCopy">📋 재작성 글 복사</button>
            <button class="btn btn-secondary" id="btnRwDownload">📥 다운로드</button>
            <button class="btn btn-secondary" id="btnRwRegen">🔄 다시 생성</button>
            <button class="btn btn-primary" id="btnRwCitationTest" style="background: linear-gradient(135deg, #0095ff, #00d68f);">🔍 AI 인용성 실제 검증</button>
          </div>
        </div>`;

      render(result, recommendation);
    });
  });
})();
