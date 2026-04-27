/**
 * 온톨로지 분석 탭 - iframe에 진단 데이터 전달
 */
(function() {
  function pushToFrame(result, recommendation) {
    const iframe = document.getElementById('ontologyFrame');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'diagnosis-result',
      result, recommendation
    }, '*');
  }

  function render(result, recommendation) {
    // iframe이 로딩될 때 데이터 푸시
    const iframe = document.getElementById('ontologyFrame');
    if (iframe) {
      iframe.addEventListener('load', () => pushToFrame(result, recommendation));
      // 이미 로드된 경우 대비
      setTimeout(() => pushToFrame(result, recommendation), 1500);
    }
    // iframe에서 요청 시 응답
    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'request-diagnosis' && e.source && e.source.postMessage) {
        e.source.postMessage({ type: 'diagnosis-result', result, recommendation }, '*');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
