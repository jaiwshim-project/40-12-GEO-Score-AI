/**
 * GEO Score AI - AI 인용성 검증 워크플로
 */
(function() {
  let lastResult = null;

  function show(id) {
    document.getElementById('ctInputSection').classList.toggle('hidden', id !== 'input');
    document.getElementById('ctLoaderSection').classList.toggle('hidden', id !== 'loader');
    document.getElementById('ctResultSection').classList.toggle('hidden', id !== 'result');
  }

  // 진단 결과/재작성 결과에서 자동 채움 (?id=X)
  function autoFill() {
    const url = new URL(location.href);
    const id = url.searchParams.get('id');
    if (id) {
      const stored = sessionStorage.getItem('current_result_' + id);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          const r = data.result;
          if (r) {
            document.getElementById('ctBrand').value = r.companyName || '';
            document.getElementById('ctIndustry').value = r.industry || '';
            // 재작성된 글이 있으면 우선, 없으면 원본 진단 콘텐츠
            const rw = data.rewrite?.rewritten;
            const orig = (() => {
              try { return JSON.parse(sessionStorage.getItem('current_diagnosis') || '{}').content || ''; }
              catch (e) { return ''; }
            })();
            document.getElementById('ctContent').value = rw || orig || '';
          }
        } catch (e) {}
      }
    }
  }

  async function startTest() {
    const brand = document.getElementById('ctBrand').value.trim();
    const industry = document.getElementById('ctIndustry').value;
    const content = document.getElementById('ctContent').value.trim();

    if (!brand) { toast('브랜드명을 입력해주세요', 'warning'); return; }
    if (content.length < 100) { toast('100자 이상의 글을 입력해주세요', 'warning'); return; }

    // P. 요금제 한도 검사
    if (!Usage.check('citationTest')) {
      toast(Usage.message('citationTest'), 'error', 5000);
      return;
    }
    Usage.consume('citationTest');

    show('loader');
    document.getElementById('ctLoaderInfo').textContent = '10개 가상 질문 생성 + 답변 시뮬레이션 중...';

    try {
      const result = await api.post('/api/citation-test', { brand, industry, content });
      if (!result.success) throw new Error(result.error || '실패');
      lastResult = result;
      renderResult(result);
    } catch (e) {
      console.error('[citation-test]', e);
      toast('검증 실패: ' + e.message, 'error');
      show('input');
    }
  }

  function renderResult(r) {
    show('result');
    const rate = r.citationRate || 0;
    const pct = Math.round(rate * 100);
    const cls = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';

    const rateEl = document.getElementById('ctRate');
    rateEl.textContent = pct + '%';
    rateEl.className = 'ct-rate ' + cls;

    document.getElementById('ctGrade').textContent =
      `${r.grade.label} · ${r.citedCount}/${r.total}개 답변에서 ${r.brand} 인용`;

    document.getElementById('ctCited').textContent = `${r.citedCount}/${r.total}`;
    document.getElementById('ctGeneral').textContent = Math.round((r.generalRate || 0) * 100) + '%';
    document.getElementById('ctBranded').textContent = Math.round((r.brandedRate || 0) * 100) + '%';

    // 인사이트 메시지
    let insight;
    if (rate >= 0.8) insight = `🎉 AI 검색에서 ${r.brand}이(가) 거의 모든 질문에 인용됩니다. 콘텐츠가 LLM 인용 친화적입니다.`;
    else if (rate >= 0.5) insight = `✅ ${r.brand}이(가) 절반 이상의 답변에 인용됩니다. 일반 질문 인용률(${Math.round(r.generalRate*100)}%)을 더 높이려면 정의문 H2 + 외부 신호 보강 권장.`;
    else if (rate >= 0.3) insight = `⚠️ 인용률 ${pct}%로 보강 필요. 90upgrade 또는 30개 파생으로 KPI 4를 90점 이상으로 올린 뒤 재검증을 권장합니다.`;
    else insight = `🚨 인용률 ${pct}%로 매우 낮습니다. AI 검색에서 ${r.brand}이(가) 거의 발견되지 않습니다. /90upgrade 즉시 적용 후 재검증하세요.`;
    document.getElementById('ctSummaryText').textContent = insight;

    // 답변 카드
    document.getElementById('ctAnswers').innerHTML = (r.answers || []).map(a => `
      <div class="ct-answer-card ${a.cited ? 'cited' : 'notcited'}">
        <div class="ct-q">
          <span><span class="ct-q-tag ${a.type}">${a.type === 'general' ? '일반' : '브랜드'}</span> Q${a.id}. ${escapeHtml(a.question)}</span>
          <span class="ct-cited-badge ${a.cited ? 'yes' : 'no'}">${a.cited ? '✅ 인용됨' : '❌ 인용 안됨'}</span>
        </div>
        ${a.error ? `<div class="ct-a" style="color: #ef4444;">에러: ${escapeHtml(a.error)}</div>`
                  : `<div class="ct-a">${escapeHtml(a.answer || '')}</div>`}
      </div>`).join('');
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  document.getElementById('btnCt')?.addEventListener('click', startTest);
  document.getElementById('btnCtNew')?.addEventListener('click', () => show('input'));
  document.getElementById('btnCtCopy')?.addEventListener('click', () => {
    if (!lastResult) return;
    const md = `# AI 인용성 검증 결과\n\n` +
      `**브랜드**: ${lastResult.brand}\n` +
      `**인용률**: ${Math.round(lastResult.citationRate * 100)}% (${lastResult.citedCount}/${lastResult.total})\n` +
      `**등급**: ${lastResult.grade.label}\n\n` +
      `## 답변별 결과\n\n` +
      lastResult.answers.map(a =>
        `### Q${a.id} [${a.type}] ${a.question}\n\n${a.cited ? '✅ 인용됨' : '❌ 인용 안됨'}\n\n${a.answer || a.error || ''}\n`
      ).join('\n');
    navigator.clipboard.writeText(md).then(() => toast('복사 완료', 'success'));
  });
  document.getElementById('btnCtDownload')?.addEventListener('click', () => {
    if (!lastResult) return;
    const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citation-test-${lastResult.brand}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.addEventListener('DOMContentLoaded', () => {
    autoFill();
    const usagePanel = document.getElementById('ctUsagePanel');
    if (usagePanel) usagePanel.innerHTML = Usage.panelHtml('citationTest');
  });
})();

