/**
 * GEO Score AI - 90점 글 자동 생성 워크플로
 */
(function() {
  let lastResult = null;

  // 진단 결과에서 자동 채움 (?id=X) + CEP 자동 채움 (?cep=X 또는 sessionStorage)
  function autoFill() {
    const url = new URL(location.href);
    const id = url.searchParams.get('id');
    const cepParam = url.searchParams.get('cep');

    if (id) {
      const stored = sessionStorage.getItem('current_diagnosis');
      if (stored) {
        try {
          const d = JSON.parse(stored);
          if (d.id === id) {
            if (d.companyName) document.getElementById('rwBrand').value = d.companyName;
            if (d.industry) document.getElementById('rwIndustry').value = d.industry;
            if (d.content) document.getElementById('rwContent').value = d.content;
          }
        } catch (e) {}
      }
    }

    // CEP 자동 채움: URL 파라미터 또는 sessionStorage의 selected_cep
    let scene = null;
    if (cepParam) {
      try { scene = decodeURIComponent(cepParam); } catch (e) { scene = cepParam; }
    } else {
      const cepStored = sessionStorage.getItem('selected_cep');
      if (cepStored) {
        try {
          const c = JSON.parse(cepStored);
          scene = c.scene || c;
        } catch (e) { scene = cepStored; }
      }
    }
    if (scene && document.getElementById('rwCepScene')) {
      document.getElementById('rwCepScene').value = scene;
      const notice = document.getElementById('cepAutoFillNotice');
      if (notice) notice.style.display = 'inline';
    }

    updateLivePreview();
  }

  // ============== 실시간 4신호 미리보기 (G) ==============
  function detect4SignalsLive(content, brand) {
    const aiwSrc = content || '';
    const cnShort = (brand || '').slice(0, 5);

    const h2Md = (aiwSrc.match(/^##\s+(.+?)$/gm) || []).map(s => s.replace(/^##\s+/, '').trim());
    const h2Html = [...aiwSrc.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    const h2List = [...h2Md, ...h2Html].filter(Boolean);
    const h2Count = h2List.length;

    const qPattern = /\?|어떻게|왜|언제|무엇|어디|누가|어느|얼마|어떤|뭐가|할까|있나|좋을까/i;
    const questionH2Count = h2List.filter(h => qPattern.test(h)).length;
    const questionH2Rate = h2Count > 0 ? questionH2Count / h2Count : 0;

    // 정의문 H2 (원칙 2) — 주어 ≥ 3자, 형용사 어미 오탐 방지
    const isDefSent = (s) => {
      if (!s) return false;
      const t = s.trim();
      if (t.length < 10 || t.length > 250) return false;
      return /^([\w가-힣·]{3,30})(은|는|이란|란)\s+[\s\S]{5,}?(이다|입니다|니다|이며|이라\s*한다|이라고\s*한다)[\.\!\?]?\s*$/.test(t);
    };
    const aiwLines = aiwSrc.split('\n');
    const sectionFirstSents = [];
    for (let i = 0; i < aiwLines.length; i++) {
      if (/^##\s+/.test(aiwLines[i])) {
        for (let j = i + 1; j < aiwLines.length; j++) {
          const t = aiwLines[j].trim();
          if (!t) continue;
          if (/^[#>\-\*\d]/.test(t)) break;
          sectionFirstSents.push(t.split(/(?<=[\.\!\?])\s/)[0]);
          break;
        }
      }
    }
    const definitionH2Count = sectionFirstSents.filter(isDefSent).length;
    const definitionH2Rate = h2Count > 0 ? definitionH2Count / h2Count : 0;

    let brandSectionHits = 0;
    let totalBrandMentions = 0;
    if (cnShort && aiwSrc) {
      aiwSrc.split(/^##\s+/m).forEach(sec => { if (sec.includes(cnShort)) brandSectionHits++; });
      totalBrandMentions = (aiwSrc.match(new RegExp(cnShort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    }
    const brandRepetitionRate = h2Count > 0
      ? brandSectionHits / Math.max(h2Count, 1)
      : (totalBrandMentions >= 3 ? 0.5 : 0);

    const extPatterns = [
      /에\s*따르면|에\s*의하면|인용|보도|발표|조사|논문|리뷰|후기|평점|⭐|★|recommend|만족도/i,
      />\s*["“'].{5,}|"[^"]{8,}"|【[^】]+】|<blockquote/i,
      /(KBS|MBC|SBS|JTBC|연합뉴스|한겨레|중앙일보|조선일보|뉴스|매체|언론|press|cite)/i
    ];
    const externalSignalRate = extPatterns.filter(re => re.test(aiwSrc)).length / extPatterns.length;

    const ctaP = /상담|예약|문의|신청|가입|구독|체험|무료|클릭|지금|버튼|시작|kakao|카카오|전화|이메일|tel|email/i;
    const ctaBlocks = [];
    for (let i = 0; i < aiwSrc.length; i += 800) ctaBlocks.push(aiwSrc.slice(i, i + 800));
    const ctaReachRate = ctaBlocks.length > 0
      ? ctaBlocks.filter(b => ctaP.test(b)).length / ctaBlocks.length
      : 0;

    const toScale3 = (rate, target) => {
      if (rate >= target) return 3;
      if (rate >= target * 0.6) return 2;
      if (rate >= target * 0.3) return 1;
      return 0;
    };

    return {
      h2Count, questionH2Count, definitionH2Count,
      questionH2Rate, definitionH2Rate, brandRepetitionRate, externalSignalRate, ctaReachRate,
      questionHeadings: toScale3(questionH2Rate, 0.5),
      definitionH2: toScale3(definitionH2Rate, 0.5),
      brandRepetition: toScale3(brandRepetitionRate, 0.5),
      externalSignal: toScale3(externalSignalRate, 1/3),
      ctaReach: toScale3(ctaReachRate, 0.5)
    };
  }

  function updateLivePreview() {
    const content = (document.getElementById('rwContent')?.value || '').trim();
    const brand = (document.getElementById('rwBrand')?.value || '').trim();
    const panel = document.getElementById('rwLivePreview');
    if (!panel) return;
    if (content.length < 50) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    const s = detect4SignalsLive(content, brand);

    const items = [
      { label: '① 질문형 H2', target: 50, rate: s.questionH2Rate, scale: s.questionHeadings, hint: 'H2를 "어떻게/왜" 질문형으로' },
      { label: '② 정의문 H2', target: 50, rate: s.definitionH2Rate, scale: s.definitionH2, hint: 'H2 첫 문장 "X는 ~이다"' },
      { label: '③ 브랜드 반복', target: 50, rate: s.brandRepetitionRate, scale: s.brandRepetition, hint: '각 H2 섹션에 브랜드명' },
      { label: '④ 외부 신호',  target: 30, rate: s.externalSignalRate, scale: s.externalSignal, hint: '후기·언론 인용' },
      { label: '⑤ CTA 도달',  target: 50, rate: s.ctaReachRate, scale: s.ctaReach, hint: '800자마다 CTA' }
    ];

    const colorOf = (scale) => scale >= 3 ? '#00d68f' : scale >= 2 ? '#ffa800' : scale >= 1 ? '#ff6b35' : '#ef4444';
    const emojiOf = (scale) => scale >= 3 ? '✅' : scale >= 2 ? '⚠️' : scale >= 1 ? '🟡' : '🚨';

    document.getElementById('rwLiveSignals').innerHTML = items.map(it => {
      const pct = Math.round(it.rate * 100);
      return `
        <div style="padding: 8px 10px; background: rgba(255,255,255,0.03); border-left: 3px solid ${colorOf(it.scale)}; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
            <span>${it.label}</span>
            <span style="color: ${colorOf(it.scale)}; font-weight: 700;">${emojiOf(it.scale)} ${pct}% / ${it.target}%</span>
          </div>
          ${it.scale < 3 ? `<div style="font-size: 0.72rem; color: var(--text-tertiary);">💡 ${it.hint}</div>` : ''}
        </div>`;
    }).join('');

    // citation 환산 점수 (5신호)
    const total = s.questionHeadings + s.definitionH2 + s.brandRepetition + s.externalSignal + s.ctaReach;
    const aiwScore = Math.min(95, Math.max(5, Math.round(20 + total * 5)));
    document.getElementById('rwLiveScore').innerHTML = `예상 KPI 4: <strong style="color: ${colorOf(Math.round(total/5))};">${aiwScore}점</strong> (${total}/15)`;
  }

  function show(id) {
    document.getElementById('inputSection').classList.toggle('hidden', id !== 'input');
    document.getElementById('loaderSection').classList.toggle('hidden', id !== 'loader');
    document.getElementById('resultSection').classList.toggle('hidden', id !== 'result');
  }

  function setStage(n, info) {
    document.querySelectorAll('.rewrite-loader-stage').forEach(el => {
      const s = parseInt(el.dataset.stage);
      el.classList.remove('active', 'done');
      if (s < n) el.classList.add('done');
      else if (s === n) el.classList.add('active');
    });
    if (info) document.getElementById('loaderInfo').textContent = info;
  }

  async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function startRewrite() {
    const brand = document.getElementById('rwBrand').value.trim();
    const industry = document.getElementById('rwIndustry').value;
    const content = document.getElementById('rwContent').value.trim();
    const cepScene = (document.getElementById('rwCepScene')?.value || '').trim();

    if (!brand) { toast('브랜드/회사명을 입력해주세요', 'warning'); return; }
    if (content.length < 100) { toast('100자 이상의 글을 입력해주세요', 'warning'); return; }
    if (content.length > 20000) { toast('20,000자 이내로 줄여주세요', 'warning'); return; }

    show('loader');

    try {
      // 1. 원본 분석
      setStage(1, '원본 글의 GEO Score를 측정하는 중...');
      const beforeResult = await api.post('/api/analyze', {
        companyName: brand, industry, mode: 'content', content
      });
      await sleep(400);

      // 2. 부족 신호 추출 (분석 결과로 자동)
      setStage(2, `부족한 KPI ${Object.values(beforeResult.scores).filter(s => s.value < 70).length}개 영역 식별...`);
      await sleep(400);

      // 3. 재작성 (서버에서 검증 루프 포함)
      setStage(3, cepScene ? `CEP 장면 "${cepScene.slice(0, 30)}..." 기반 재작성 중...` : 'Gemini AI가 신호를 보강한 글을 작성 중...');
      const rewriteResult = await api.post('/api/rewrite-content', {
        companyName: brand, industry, content, cepScene,
        currentScores: beforeResult.scores,
        currentTotal: beforeResult.totalScore,
        targetScore: 90
      });
      await sleep(400);

      // 4. 재작성된 글 점수 검증
      setStage(4, '재작성된 글의 점수를 검증 중...');
      const afterResult = await api.post('/api/analyze', {
        companyName: brand, industry, mode: 'content', content: rewriteResult.rewritten
      });
      await sleep(400);

      // 5. 완료
      setStage(5, `✅ ${afterResult.totalScore}점 달성 (목표 90점)`);
      await sleep(600);

      lastResult = {
        brand, industry,
        original: content,
        rewritten: rewriteResult.rewritten,
        beforeScores: beforeResult.scores,
        afterScores: afterResult.scores,
        beforeTotal: beforeResult.totalScore,
        afterTotal: afterResult.totalScore,
        beforeGrade: beforeResult.grade,
        afterGrade: afterResult.grade,
        iterations: rewriteResult.iterations || 1
      };
      renderResult();
    } catch (e) {
      console.error('[rewrite]', e);
      toast('재작성 실패: ' + e.message, 'error');
      show('input');
    }
  }

  function renderResult() {
    const r = lastResult;
    show('result');

    document.getElementById('scoreBefore').textContent = r.beforeTotal;
    document.getElementById('scoreAfter').textContent = r.afterTotal;
    document.getElementById('gradeBefore').textContent = r.beforeGrade.label;
    document.getElementById('gradeAfter').textContent = r.afterGrade.label;
    const delta = r.afterTotal - r.beforeTotal;
    document.getElementById('scoreDelta').textContent = (delta >= 0 ? '+' : '') + delta + '점 상승';

    document.getElementById('beforeContent').textContent = r.original;
    document.getElementById('afterContent').textContent = r.rewritten;
    document.getElementById('beforeMeta').textContent = `${r.original.length}자`;
    document.getElementById('afterMeta').textContent = `${r.rewritten.length}자`;

    // KPI별 비교 막대
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
    document.getElementById('kpiComparison').innerHTML = html;

    // ai_writing 4신호 Before→After 비교
    renderRwAiwComparison(r);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderRwAiwComparison(r) {
    const beforeAiw = r.beforeScores?.citation?.aiwSignals;
    const afterAiw  = r.afterScores?.citation?.aiwSignals;
    let target = document.getElementById('rwAiwCompPanel');
    if (!target) {
      target = document.createElement('div');
      target.id = 'rwAiwCompPanel';
      const kpi = document.getElementById('kpiComparison').closest('.rewrite-kpi-comparison');
      kpi.parentNode.insertBefore(target, kpi.nextSibling);
    }
    if (!beforeAiw || !afterAiw) { target.innerHTML = ''; return; }

    const items = [
      { label: '① 질문형 H2 비율', target: 50, b: beforeAiw.questionH2Rate || 0, a: afterAiw.questionH2Rate || 0 },
      { label: '② 정의문 H2 비율', target: 50, b: beforeAiw.definitionH2Rate || 0, a: afterAiw.definitionH2Rate || 0 },
      { label: '③ 브랜드 반복 비율', target: 50, b: beforeAiw.brandRepetitionRate || 0, a: afterAiw.brandRepetitionRate || 0 },
      { label: '④ 외부 신호 비율', target: 30, b: beforeAiw.externalSignalRate || 0, a: afterAiw.externalSignalRate || 0 },
      { label: '⑤ CTA 도달률', target: 50, b: beforeAiw.ctaReachRate || 0, a: afterAiw.ctaReachRate || 0 }
    ];
    const rows = items.map(it => {
      const bp = Math.round(it.b * 100), ap = Math.round(it.a * 100), d = ap - bp;
      const reached = ap >= it.target;
      return `
        <div style="display: grid; grid-template-columns: 160px 1fr 80px; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(168,85,247,0.1);">
          <div style="font-size: 0.88rem; font-weight: 600;">${it.label}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="width: 50px; font-size: 0.78rem; color: #ff6b35;">${bp}%</span>
              <div style="flex:1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${bp}%; background: #ff6b35; opacity: 0.6;"></div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 50px; font-size: 0.78rem; color: #00d68f; font-weight: 700;">${ap}%</span>
              <div style="flex:1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${ap}%; background: #00d68f; transition: width 0.6s;"></div>
              </div>
              <span style="font-size: 0.72rem; color: var(--text-tertiary);">목표 ${it.target}%</span>
            </div>
          </div>
          <div style="text-align: right; font-weight: 700; color: ${d >= 0 ? '#00d68f' : '#ff3d71'}; font-size: 0.95rem;">
            ${d >= 0 ? '+' : ''}${d}%
            ${reached ? '<div style="font-size: 0.7rem; color: #00d68f;">✅ 달성</div>' : ''}
          </div>
        </div>`;
    }).join('');

    target.innerHTML = `
      <div style="margin-top: 24px; padding: 24px; background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.25); border-radius: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #a855f7;">⭐ AI 인용 5신호 Before → After</h3>
          <span style="font-size: 0.78rem; color: var(--text-tertiary);">출처: <a href="manual.html#ai-writing" style="color: #a855f7;">ai_writing 6원칙</a></span>
        </div>
        ${rows}
      </div>`;
  }

  // 액션 버튼
  document.getElementById('btnRewrite').addEventListener('click', startRewrite);
  document.getElementById('btnCopy').addEventListener('click', () => {
    if (!lastResult) return;
    navigator.clipboard.writeText(lastResult.rewritten).then(() => {
      toast('재작성 글이 클립보드에 복사되었습니다', 'success');
    }).catch(() => toast('복사 실패', 'error'));
  });
  document.getElementById('btnDownload').addEventListener('click', () => {
    if (!lastResult) return;
    const blob = new Blob([lastResult.rewritten], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-90score-${lastResult.brand}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('다운로드 완료', 'success');
  });
  document.getElementById('btnRegen').addEventListener('click', startRewrite);
  document.getElementById('btnNew').addEventListener('click', () => {
    document.getElementById('rwContent').value = '';
    show('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 라이브 미리보기 input 핸들러
  ['rwContent', 'rwBrand'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateLivePreview);
  });

  // 초기화
  document.addEventListener('DOMContentLoaded', autoFill);
})();
