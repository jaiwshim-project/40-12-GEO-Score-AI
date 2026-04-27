/**
 * GEO Score AI - PDF 리포트 내보내기
 *
 * 진단 결과 + 90점 글 + 30개 파생 등을 단일 PDF로 export.
 * html2canvas + jsPDF (CDN) 사용 — 클라이언트 측 처리.
 */
(function() {
  // CDN 라이브러리 동적 로드
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('스크립트 로드 실패: ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureLibs() {
    if (window.html2canvas && window.jspdf) return;
    await Promise.all([
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
      loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    ]);
  }

  // 단일 엘리먼트(또는 배열)를 PDF로
  // options: { filename, orientation: 'p'|'l', format: 'a4', margin: 10 }
  async function exportElementsToPDF(elements, options = {}) {
    const els = Array.isArray(elements) ? elements : [elements];
    if (els.length === 0) return;

    await ensureLibs();
    const { jsPDF } = window.jspdf;
    const opts = Object.assign({
      filename: `geo-report-${Date.now()}.pdf`,
      orientation: 'p',
      format: 'a4',
      margin: 10
    }, options);

    const pdf = new jsPDF({ orientation: opts.orientation, unit: 'mm', format: opts.format });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const usableW = pageW - opts.margin * 2;
    const usableH = pageH - opts.margin * 2;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;

      // 캡쳐
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).getPropertyValue('background-color') || '#0a0a0f',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const imgW = usableW;
      const imgH = (canvas.height * imgW) / canvas.width;

      // 페이지에 들어가지 않으면 분할
      let heightLeft = imgH;
      let position = opts.margin;

      if (i > 0) pdf.addPage();

      pdf.addImage(imgData, 'PNG', opts.margin, position, imgW, Math.min(imgH, usableH));
      heightLeft -= usableH;

      while (heightLeft > 0) {
        position = opts.margin - (imgH - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', opts.margin, position, imgW, imgH);
        heightLeft -= usableH;
      }
    }

    pdf.save(opts.filename);
  }

  // 결과 페이지 통합 PDF (히어로 + KPI + 4신호 + 솔루션)
  async function exportResultPagePDF(result, recommendation, opts = {}) {
    const targets = [
      document.querySelector('.score-hero'),
      document.getElementById('kpiDetailGrid') || document.querySelector('.kpi-detail-grid'),
      document.querySelector('.solution-section'),
      document.querySelector('.problems-section')
    ].filter(Boolean);
    if (targets.length === 0) {
      window.toast?.('PDF로 내보낼 컨텐츠를 찾지 못했습니다', 'warning');
      return;
    }
    window.toast?.('PDF 생성 중... (5~10초)', 'info');
    try {
      await exportElementsToPDF(targets, {
        filename: `geo-report-${(result?.companyName || 'report').replace(/[^\w가-힣]/g, '_')}-${Date.now()}.pdf`
      });
      window.toast?.('PDF 다운로드 완료', 'success');
    } catch (e) {
      console.error('[pdf-export]', e);
      window.toast?.('PDF 생성 실패: ' + e.message, 'error');
    }
  }

  // 90점 글 + 30개 파생 등 전체 페이지의 메인 컨텐츠를 PDF로
  async function exportPageMainPDF(filename) {
    const main = document.querySelector('section.section') || document.querySelector('main') || document.body;
    window.toast?.('PDF 생성 중... (5~10초)', 'info');
    try {
      await exportElementsToPDF(main, { filename: filename || `geo-export-${Date.now()}.pdf` });
      window.toast?.('PDF 다운로드 완료', 'success');
    } catch (e) {
      console.error('[pdf-export]', e);
      window.toast?.('PDF 생성 실패: ' + e.message, 'error');
    }
  }

  // 임의의 마크다운/텍스트 콘텐츠를 PDF로 (예: 30개 파생 일괄)
  async function exportTextPDF(content, opts = {}) {
    await ensureLibs();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const usableW = pageW - margin * 2;

    // 한글 폰트 미내장 → setFont 'helvetica'로 처리하면 한글 깨짐
    // 대신 콘텐츠를 캔버스(div)에 렌더 후 캡쳐 (HTML→Canvas 우회)
    const tmp = document.createElement('div');
    tmp.style.cssText = `
      position: fixed; top: -9999px; left: 0;
      width: ${pageW * 3.8}px; padding: 24px;
      background: white; color: #111; font-family: 'Pretendard', sans-serif;
      line-height: 1.7; font-size: 14px;
      white-space: pre-wrap; word-wrap: break-word;
    `;
    tmp.textContent = content;
    document.body.appendChild(tmp);
    try {
      await exportElementsToPDF(tmp, opts);
    } finally {
      document.body.removeChild(tmp);
    }
  }

  window.PdfExport = { exportElementsToPDF, exportResultPagePDF, exportPageMainPDF, exportTextPDF };
})();
