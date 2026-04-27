/**
 * 경쟁사 비교 탭
 */
(function() {
  function render(result) {
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
    const m = document.getElementById('competitiveMessage');
    if (m) m.textContent = msg;
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
