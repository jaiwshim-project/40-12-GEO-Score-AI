/**
 * GEO Score AI - 분석 진행 페이지
 * sessionStorage의 current_diagnosis를 읽어 분석을 수행하고
 * 완료 시 results.html로 이동.
 */
(function() {
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

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function runAnalysis() {
    const info = getDiagnosisInfo();
    if (!info) {
      showError('진단 정보를 찾을 수 없습니다. 처음부터 다시 시작해주세요.');
      return;
    }

    document.getElementById('targetCompany').textContent = info.companyName;
    document.getElementById('targetUrl').textContent = info.websiteUrl;

    try {
      updateLoaderStage(1);
      await sleep(900);

      updateLoaderStage(2);
      const analysisPromise = api.post('/api/analyze', {
        companyName: info.companyName,
        websiteUrl: info.websiteUrl,
        industry: info.industry,
        mode: info.mode || 'url',
        content: info.content || null
      });

      await sleep(1600);
      updateLoaderStage(3);

      const result = await analysisPromise;

      updateLoaderStage(4);
      await sleep(700);

      // 추천 솔루션
      let recommendation = null;
      try {
        recommendation = await api.post('/api/recommend', {
          scores: result.scores,
          totalScore: result.totalScore,
          companyName: result.companyName,
          industry: result.industry
        });
      } catch (e) {
        console.warn('[analyzing] recommendation 실패', e);
      }

      // 히스토리 저장
      try { History.save(result); } catch (e) {}

      // 자동 재작성 옵션 (content 모드에서만 가능)
      let rewrite = null;
      if (info.autoRewrite && info.mode === 'content' && info.content) {
        try {
          const stage = document.querySelector('.loader-stage[data-stage="4"] div div:first-child');
          if (stage) stage.textContent = '✨ 90점 글 자동 생성 중';
          const rwRes = await api.post('/api/rewrite-content', {
            companyName: result.companyName, industry: result.industry,
            content: info.content,
            currentScores: result.scores, currentTotal: result.totalScore,
            targetScore: 90
          });
          // 재작성된 글 재평가
          const after = await api.post('/api/analyze', {
            companyName: result.companyName, industry: result.industry,
            mode: 'content', content: rwRes.rewritten
          });
          rewrite = {
            brand: result.companyName,
            industry: result.industry,
            original: info.content,
            rewritten: rwRes.rewritten,
            beforeScores: result.scores, afterScores: after.scores,
            beforeTotal: result.totalScore, afterTotal: after.totalScore,
            beforeGrade: result.grade, afterGrade: after.grade,
            iterations: rwRes.iterations || 1
          };
        } catch (e) {
          console.warn('[analyzing] 자동 재작성 실패', e);
        }
      }

      sessionStorage.setItem('current_result_' + info.id, JSON.stringify({
        result, recommendation, rewrite,
        savedAt: Date.now()
      }));

      // ✓ 모든 단계 완료 표시
      updateLoaderStage(5);
      await sleep(500);

      // 자동 재작성 했으면 90점 글 탭으로, 아니면 종합 분석으로
      const targetPage = rewrite ? 'result-rewrite.html' : 'result-overview.html';
      location.href = targetPage + '?id=' + info.id;
    } catch (e) {
      console.error('[analyzing] 분석 실패', e);
      showError(e.message || '알 수 없는 오류가 발생했습니다.');
    }
  }

  document.addEventListener('DOMContentLoaded', runAnalysis);
})();
