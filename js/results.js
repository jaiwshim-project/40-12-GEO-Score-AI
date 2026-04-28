/**
 * GEO Score AI - 결과 페이지 로직
 */

(function() {
  let currentResult = null;
  let recommendation = null;

  // 3축(homepage/blog/article)에 맞는 KPI 정의 배열 가져오기
  function getActiveKpiList(result) {
    // 1순위: 서버 응답의 kpiList (target에 맞는 KPI 정의)
    if (result?.kpiList && Array.isArray(result.kpiList) && result.kpiList.length) {
      // kpiList는 {id, name, weight}만 있을 수 있으므로, target별 정의에서 풀버전 매칭
      const target = result.target || 'homepage';
      const fullDefs = (window.getKPIDefinitions ? window.getKPIDefinitions(target) : null) || window.KPI_DEFINITIONS || [];
      return result.kpiList.map(k => fullDefs.find(d => d.id === k.id) || { ...k, icon: '📊', color: '#888', color2: '#666', desc: '', description: '' });
    }
    // 2순위: target 기준
    if (result?.target && window.getKPIDefinitions) {
      const defs = window.getKPIDefinitions(result.target);
      if (defs && defs.length) return defs;
    }
    // 3순위: 레거시 단일 10 KPI
    return window.KPI_DEFINITIONS || [];
  }

  // 온톨로지 iframe과 데이터 통신
  window.addEventListener('message', e => {
    if (e.data && e.data.type === 'request-diagnosis') {
      if (currentResult && e.source && e.source.postMessage) {
        e.source.postMessage({
          type: 'diagnosis-result',
          result: currentResult,
          recommendation: recommendation
        }, '*');
      }
    }
  });

  // renderResults 호출 후 iframe에 푸시 (재로드 대비)
  function pushToOntologyFrame() {
    const iframe = document.getElementById('ontologyFrame');
    if (iframe && iframe.contentWindow && currentResult) {
      iframe.contentWindow.postMessage({
        type: 'diagnosis-result',
        result: currentResult,
        recommendation: recommendation
      }, '*');
    }
  }

  function getDiagnosisInfo() {
    const url = new URL(location.href);
    const id = url.searchParams.get('id');
    const stored = sessionStorage.getItem('current_diagnosis');
    if (!stored) return null;
    try {
      const data = JSON.parse(stored);
      if (data.id === id) return data;
    } catch (e) {}
    return null;
  }

  function updateLoaderStage(stageNum) {
    document.querySelectorAll('.loader-stage').forEach(el => {
      const num = parseInt(el.dataset.stage);
      el.classList.remove('active');
      if (num < stageNum) {
        el.classList.add('done');
        el.querySelector('.stage-icon').textContent = '✓';
      } else if (num === stageNum) {
        el.classList.add('active');
      }
    });
  }

  function showError(msg) {
    document.getElementById('analysisSection').classList.add('hidden');
    document.getElementById('errorSection').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = msg;
  }

  async function runAnalysis() {
    // analyzing.html에서 sessionStorage에 저장한 결과를 읽어 즉시 렌더
    const url = new URL(location.href);
    const id = url.searchParams.get('id');
    const stored = sessionStorage.getItem('current_result_' + id);

    if (stored) {
      try {
        const data = JSON.parse(stored);
        currentResult = data.result;
        recommendation = data.recommendation;
        renderResults(currentResult);
        return;
      } catch (e) {
        console.warn('[results] sessionStorage 파싱 실패', e);
      }
    }

    // 결과가 없으면 analyzing.html로 리다이렉트하여 분석부터 진행
    const info = getDiagnosisInfo();
    if (info && id) {
      location.href = 'analyzing.html?id=' + id;
      return;
    }
    showError('진단 정보를 찾을 수 없습니다. 처음부터 다시 시작해주세요.');
  }

  function renderResults(result) {
    document.getElementById('analysisSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('hidden');

    // 헤더
    document.getElementById('companyTitle').textContent = result.companyName;
    document.getElementById('urlSubtitle').textContent =
      `${extractDomain(result.websiteUrl)} · ${result.industry || '미분류'}`;
    document.getElementById('resultMeta').textContent =
      `${formatDate(Date.parse(result.analyzedAt) || Date.now())} · ${result.meta?.usedGemini ? 'Gemini AI' : '기본 분석'}`;

    // 종합 점수 애니메이션
    animateScore(result.totalScore);

    // 등급
    const gradeEl = document.getElementById('scoreGrade');
    gradeEl.textContent = `${getGrade(result.totalScore).emoji} ${result.grade.label} - ${getGrade(result.totalScore).desc}`;
    gradeEl.className = `score-grade ${result.grade.key}`;

    // 충격 메시지
    document.getElementById('shockMessage').innerHTML =
      `<span class="highlight">${escapeHtml(result.summary?.headline || `현재 점수는 ${result.totalScore}점입니다`)}</span>`;
    document.getElementById('diagnosisText').textContent =
      result.summary?.diagnosis || '';

    // 레이더 차트 (3축 — target에 맞는 KPI만 표시)
    const activeKpis = getActiveKpiList(result);
    const radarData = activeKpis.map(kpi => ({
      label: kpi.name.replace(' 지수', '').replace('지수', ''),
      value: result.scores[kpi.id]?.value || 0
    }));
    Chart.radar('radarChart', radarData);

    // 진단 대상(target) 배지 표시
    const targetBadgeEl = document.getElementById('targetBadge');
    if (targetBadgeEl && window.TARGET_LABELS && result.target) {
      const t = window.TARGET_LABELS[result.target] || window.TARGET_LABELS.homepage;
      targetBadgeEl.textContent = `${t.icon} ${t.ko} 축 진단`;
      targetBadgeEl.style.display = 'inline-block';
    }

    // 강점/약점/즉시 개선
    renderStrengthsWeaknesses(result);

    // KPI 상세
    renderKpiDetails(result);

    // 문제 영역
    renderProblems(result);

    // 비교 차트
    renderComparison(result);

    // 솔루션
    renderSolution(result);

    setupTabs();
    setupActions(result);

    setTimeout(pushToOntologyFrame, 1500);

    // 스크롤
    setTimeout(() => {
      document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function animateScore(target) {
    const valueEl = document.getElementById('scoreValue');
    const fgEl = document.getElementById('scoreFg');
    const circumference = 753.98;
    const offset = circumference - (target / 100) * circumference;

    let current = 0;
    const duration = 1500;
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(target * eased);
      valueEl.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    tick();

    setTimeout(() => {
      fgEl.setAttribute('stroke-dashoffset', offset);
    }, 100);
  }

  function renderStrengthsWeaknesses(result) {
    const activeKpis = getActiveKpiList(result);
    const sorted = Object.entries(result.scores)
      .map(([id, s]) => ({
        id,
        value: s.value || 0,
        kpi: activeKpis.find(k => k.id === id),
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
      </div>
    `).join('');

    document.getElementById('weaknessesList').innerHTML = weaknesses.map(w => `
      <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,61,113,0.08); border-left: 3px solid #ff3d71; border-radius: 6px;">
        <div style="display:flex;justify-content:space-between;font-weight:600;">
          <span>${w.kpi.icon} ${w.kpi.name}</span>
          <span style="color:#ff3d71;font-family:monospace;">${w.value}</span>
        </div>
      </div>
    `).join('');

    // quickWins: 점수가 낮은 KPI 중 비교적 빠르게 개선 가능한 항목
    // (target별로 추천 키워드가 다름 — homepage/blog/article 모두 지원)
    const quickWinIds = [
      // homepage
      'hp_botAccess', 'hp_sitemap', 'hp_schema', 'hp_ctaDesign',
      // blog
      'bl_publishFreq', 'bl_internalLinks',
      // article
      'ar_definitionH2', 'ar_questionH2', 'ar_ctaReach', 'ar_faq',
      // legacy
      'citation', 'conversion', 'visibility', 'aiCitation'
    ];
    const quickWins = sorted.filter(s => s.value < 50 && quickWinIds.includes(s.id));
    document.getElementById('quickWinsList').innerHTML = quickWins.length ? quickWins.map(q => `
      <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,168,0,0.08); border-left: 3px solid #ffa800; border-radius: 6px;">
        <div style="font-weight:600;margin-bottom:4px;">${q.kpi.icon} ${q.kpi.name}</div>
        <div style="font-size:0.85rem;color:var(--text-tertiary);">2주 내 적용 가능</div>
      </div>
    `).join('') : '<div style="color:var(--text-tertiary);font-size:0.9rem;">현재 즉시 개선 가능한 항목이 적습니다.</div>';
  }

  function renderKpiDetails(result) {
    const grid = document.getElementById('kpiDetailGrid');
    const activeKpis = getActiveKpiList(result);
    grid.innerHTML = activeKpis.map(kpi => {
      const s = result.scores[kpi.id] || {};
      const value = s.value || 0;
      const insight = window.getKpiInsight(kpi, value);
      const scoreCls = window.getScoreClass(value);

      return `
        <div class="kpi-detail-card">
          <div class="kpi-detail-header">
            <div class="kpi-detail-name">
              <span class="kpi-icon-mini">${kpi.icon}</span>
              ${kpi.name}
            </div>
            <div class="kpi-score ${scoreCls}">${value}</div>
          </div>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" style="width: ${value}%;"></div>
          </div>
          <div class="kpi-detail-desc">${kpi.desc}</div>
          <div class="kpi-insight">
            <strong>📌 진단 인사이트</strong>
            ${escapeHtml(s.reason || insight)}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderProblems(result) {
    const problems = result.summary?.topProblems || [];
    const opportunities = result.summary?.opportunities || [];

    document.getElementById('problemGrid').innerHTML = problems.length ? problems.map((p, i) => `
      <div class="problem-card">
        <div class="problem-icon">${['🚨', '⚠️', '🛑'][i] || '⚠️'}</div>
        <div class="problem-title">문제 ${i + 1}</div>
        <div class="problem-desc">${escapeHtml(p)}</div>
      </div>
    `).join('') : '<div style="color:var(--text-tertiary);text-align:center;width:100%;padding:32px;">분석된 문제가 없습니다.</div>';

    document.getElementById('opportunityGrid').innerHTML = opportunities.length ? opportunities.map((o, i) => `
      <div class="problem-card solution-card">
        <div class="problem-icon">${['✨', '🎯', '🚀'][i] || '✨'}</div>
        <div class="problem-title">기회 ${i + 1}</div>
        <div class="problem-desc">${escapeHtml(o)}</div>
      </div>
    `).join('') : '<div style="color:var(--text-tertiary);text-align:center;width:100%;padding:32px;">분석된 기회가 없습니다.</div>';
  }

  function renderComparison(result) {
    const competitors = result.competitors || [];
    Chart.comparison('comparisonChart', result.totalScore, competitors);

    const avg = competitors.find(c => c.label.includes('평균'))?.value || 45;
    const top = competitors.find(c => c.label.includes('상위'))?.value || 78;

    let msg;
    if (result.totalScore < avg) {
      msg = `현재 귀사는 업계 평균(${avg}점)보다 ${avg - result.totalScore}점 뒤처져 있습니다`;
    } else if (result.totalScore < top) {
      msg = `상위 10% 기업(${top}점)까지 ${top - result.totalScore}점 차이`;
    } else {
      msg = `상위 10% 기업 수준에 도달했습니다 - 우위 유지 전략 필요`;
    }
    document.getElementById('competitiveMessage').textContent = msg;
  }

  function renderSolution(result) {
    const container = document.getElementById('solutionContent');

    if (!recommendation) {
      container.innerHTML = `
        <div style="text-align:center;padding:48px;color:var(--text-tertiary);">
          솔루션 추천을 불러오지 못했습니다. <a href="chatbot.html">전문가 상담</a>으로 문의해주세요.
        </div>
      `;
      return;
    }

    const tier = recommendation.packageTier;
    const actions = recommendation.priorityActions;
    const outcome = recommendation.expectedOutcome;
    const pitch = recommendation.personalizedPitch;

    container.innerHTML = `
      ${pitch ? `
        <div class="cta-section" style="margin-bottom: 32px;">
          <h2 class="cta-title" style="font-size: 1.5rem;">${escapeHtml(pitch)}</h2>
        </div>
      ` : ''}

      <div class="section-header">
        <h2>📋 우선순위 액션 플랜</h2>
        <p class="section-subtitle">가장 약한 KPI 3개에 대한 즉시 실행 가능한 액션</p>
      </div>

      <div class="kpi-detail-grid">
        ${actions.map((a, i) => {
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
                ${escapeHtml(a.action)}
              </div>
              <div class="kpi-detail-desc">${escapeHtml(a.detail)}</div>
              <div style="display:flex;gap:8px;margin-top:12px;">
                <span style="padding:4px 10px;background:rgba(0,214,143,0.1);color:#00d68f;border-radius:12px;font-size:0.8rem;font-weight:600;">
                  ${escapeHtml(a.impact)}
                </span>
                <span style="padding:4px 10px;background:rgba(0,149,255,0.1);color:#0095ff;border-radius:12px;font-size:0.8rem;font-weight:600;">
                  ${escapeHtml(a.cost)}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="section-header" style="margin-top: 64px;">
        <span class="section-tag">추천 패키지</span>
        <h2>🎁 ${escapeHtml(tier.name)}</h2>
        <p class="section-subtitle">${escapeHtml(tier.reason)}</p>
      </div>

      <div class="kpi-detail-card" style="max-width:720px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:2rem;font-weight:800;color:var(--color-accent);margin-bottom:8px;">
            ${escapeHtml(tier.price)}
          </div>
          <div style="color:var(--text-tertiary);">${escapeHtml(tier.duration)}</div>
        </div>
        <div style="border-top:1px solid var(--border-primary);padding-top:24px;">
          <h4 style="margin-bottom:16px;">포함 사항</h4>
          <ul style="list-style:none;padding:0;">
            ${tier.includes.map(item => `
              <li style="padding:8px 0;display:flex;align-items:center;gap:12px;">
                <span style="color:#00d68f;font-weight:700;">✓</span>
                <span style="color:var(--text-secondary);">${escapeHtml(item)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>

      <div class="section-header" style="margin-top: 64px;">
        <h2>📈 3개월 후 예상 결과</h2>
      </div>

      <div class="stats-grid" style="max-width:720px;margin:0 auto;">
        <div class="stat-card">
          <div class="stat-label">예상 노출 증가</div>
          <div class="stat-value">${escapeHtml(outcome.improvement)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">예상 신규 점수</div>
          <div class="stat-value">${outcome.newScoreEstimate}<span style="font-size:1.25rem;color:var(--text-tertiary);">/100</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">달성 기간</div>
          <div class="stat-value">${escapeHtml(outcome.timeframe)}</div>
        </div>
      </div>
    `;
  }

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

  function setupActions(result) {
    const cta = document.getElementById('ctaPrimary');
    if (recommendation?.cta?.primaryUrl) {
      cta.href = recommendation.cta.primaryUrl;
      cta.target = '_blank';
    }

    document.getElementById('saveReport').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geo-score-${result.companyName}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('리포트가 다운로드되었습니다', 'success');
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

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  document.addEventListener('DOMContentLoaded', runAnalysis);
})();
