/**
 * GEO Score AI — 온톨로지 분석 탭
 *
 * /ontology 스킬 (AX Ontology OS) 적용 — 모드 B (기존 플랫폼 진단).
 * 10 KPI + 5 ai_writing 신호 + 인프라 신호를 AXOS 8종 노드 + 9종 관계로 모델링.
 * 약점 KPI 클릭 → root cause 사슬 + 자동 솔루션 추천.
 */
(function() {
  // ============== AXOS 표준 스키마 (8종 노드 + 9종 관계) ==============
  const NODE_TYPES = {
    Actor:    { color: '#1F6BFF', icon: '👤', label: 'Actor (사람/역할)' },
    Process:  { color: '#7c3aed', icon: '⚙️', label: 'Process (업무/KPI)' },
    Data:     { color: '#0d9488', icon: '🗄️', label: 'Data (데이터)' },
    System:   { color: '#06b6d4', icon: '🔧', label: 'System (인프라/외부)' },
    Artifact: { color: '#ea580c', icon: '📄', label: 'Artifact (결과물)' },
    Decision: { color: '#dc2626', icon: '⚖️', label: 'Decision (의사결정)' },
    Event:    { color: '#d97706', icon: '⚡', label: 'Event (트리거)' },
    Issue:    { color: '#be123c', icon: '🚨', label: 'Issue (병목/문제)' }
  };

  const REL_TYPES = {
    FLOW:     { color: '#64748b', label: '순서/흐름', dash: '0' },
    INPUT:    { color: '#0d9488', label: '입력', dash: '0' },
    OUTPUT:   { color: '#ea580c', label: '출력', dash: '0' },
    USES:     { color: '#7c3aed', label: '사용/의존', dash: '0' },
    CREATES:  { color: '#06b6d4', label: '생성', dash: '0' },
    DECIDES:  { color: '#dc2626', label: '결정', dash: '6,3' },
    TRIGGERS: { color: '#d97706', label: '트리거', dash: '6,3' },
    CAUSES:   { color: '#f59e0b', label: '원인', dash: '0' },
    BLOCKS:   { color: '#ef4444', label: '차단/병목', dash: '4,3' }
  };

  // GEO Score 도메인 온톨로지 (정적 노드 + 동적 약점 표시)
  const NODES = [
    // Actor
    { id: 'brand',    type: 'Actor',  x: 80,  y: 60,  label: '브랜드' },
    { id: 'aiEngine', type: 'Actor',  x: 920, y: 60,  label: 'AI 검색\nChatGPT/Claude' },
    // System (외부 인프라)
    { id: 'robots',   type: 'System', x: 80,  y: 180, label: 'robots.txt\n(AI 봇 접근)' },
    { id: 'sitemap',  type: 'System', x: 80,  y: 280, label: 'sitemap.xml\n(사이트 지도)' },
    { id: 'channels', type: 'System', x: 80,  y: 380, label: '멀티채널\n(블로그/SNS)' },
    // Data (콘텐츠 신호)
    { id: 'schema',   type: 'Data',   x: 230, y: 130, label: 'Schema.org\n구조화 정보' },
    { id: 'faq',      type: 'Data',   x: 230, y: 230, label: 'FAQ\nQ&A 구조' },
    { id: 'content',  type: 'Data',   x: 230, y: 330, label: '본문 콘텐츠\n+ 정의문 H2' },
    { id: 'reviews',  type: 'Data',   x: 230, y: 430, label: '외부 신호\n(후기/언론)' },
    { id: 'eeat',     type: 'Data',   x: 230, y: 530, label: 'E-E-A-T\n저자/실적' },
    // Process (10 KPI)
    { id: 'visibility',  type: 'Process', x: 480, y: 80,  kpi: 'visibility',  label: '검색 가시성' },
    { id: 'velocity',    type: 'Process', x: 480, y: 160, kpi: 'velocity',    label: '콘텐츠 생산력' },
    { id: 'authority',   type: 'Process', x: 480, y: 240, kpi: 'authority',   label: 'E-E-A-T 신뢰' },
    { id: 'citation',    type: 'Process', x: 480, y: 320, kpi: 'citation',    label: 'AI 인용' },
    { id: 'engagement',  type: 'Process', x: 480, y: 400, kpi: 'engagement',  label: '고객 참여' },
    { id: 'conversion',  type: 'Process', x: 480, y: 480, kpi: 'conversion',  label: '전환 설계' },
    { id: 'channelKpi',  type: 'Process', x: 700, y: 100, kpi: 'channel',     label: '채널 확장' },
    { id: 'brandKpi',    type: 'Process', x: 700, y: 200, kpi: 'brand',       label: '브랜드 일관성' },
    { id: 'competitive', type: 'Process', x: 700, y: 300, kpi: 'competitive', label: '경쟁 점유율' },
    { id: 'aio',         type: 'Process', x: 700, y: 400, kpi: 'aio',         label: 'AI 최적화 준비' },
    // Artifact (출력)
    { id: 'aiCitation', type: 'Artifact', x: 920, y: 200, label: '실제 AI 답변\n인용' },
    { id: 'leads',      type: 'Artifact', x: 920, y: 320, label: '리드 → 계약' },
    // Decision
    { id: 'recPath',    type: 'Decision', x: 920, y: 460, label: '권장 경로\n(개발/개선)' }
  ];

  const LINKS = [
    // System → KPI (인프라 → 가시성/인용)
    { from: 'robots',   to: 'visibility', type: 'USES' },
    { from: 'robots',   to: 'citation',   type: 'BLOCKS' },
    { from: 'sitemap',  to: 'visibility', type: 'USES' },
    { from: 'channels', to: 'channelKpi', type: 'USES' },
    { from: 'channels', to: 'velocity',   type: 'USES' },
    // Data → KPI (콘텐츠 → 인용)
    { from: 'schema',  to: 'citation',  type: 'INPUT' },
    { from: 'schema',  to: 'aio',       type: 'INPUT' },
    { from: 'faq',     to: 'citation',  type: 'INPUT' },
    { from: 'faq',     to: 'aio',       type: 'INPUT' },
    { from: 'content', to: 'citation',  type: 'INPUT' },
    { from: 'content', to: 'velocity',  type: 'INPUT' },
    { from: 'content', to: 'visibility',type: 'INPUT' },
    { from: 'reviews', to: 'engagement',type: 'INPUT' },
    { from: 'reviews', to: 'authority', type: 'INPUT' },
    { from: 'eeat',    to: 'authority', type: 'INPUT' },
    // KPI → KPI (인과)
    { from: 'visibility', to: 'citation',   type: 'CAUSES' },
    { from: 'authority',  to: 'citation',   type: 'CAUSES' },
    { from: 'aio',        to: 'citation',   type: 'CAUSES' },
    { from: 'citation',   to: 'conversion', type: 'CAUSES' },
    { from: 'engagement', to: 'conversion', type: 'CAUSES' },
    { from: 'brandKpi',   to: 'citation',   type: 'CAUSES' },
    // Brand & Process
    { from: 'brand', to: 'brandKpi',  type: 'CREATES' },
    // KPI → Outcome (결과물)
    { from: 'citation',   to: 'aiCitation', type: 'OUTPUT' },
    { from: 'aiEngine',   to: 'aiCitation', type: 'CREATES' },
    { from: 'conversion', to: 'leads',      type: 'OUTPUT' },
    // Decision
    { from: 'visibility', to: 'recPath', type: 'DECIDES' }
  ];

  // ============== Root Cause 자동 추적 (X 모드) ==============
  // 약점 KPI(<70) → 부족한 입력 신호 식별 → 솔루션 3가지 자동 매핑
  function findRootCauses(kpiId, kpi, signals, infraSignals, ai) {
    const causes = [];
    const v = kpi?.value || 0;

    if (kpiId === 'citation') {
      if ((signals?.faq || 0) < 2) causes.push({ input: 'FAQ 부재', sol: 'Q1~Q5 형식 FAQ 5쌍 추가 (서비스 비용·기간·차이)', impact: '+15점' });
      if ((signals?.schema || 0) < 1) causes.push({ input: 'Schema.org 미적용', sol: 'FAQPage + Organization 구조화 정보 삽입', impact: '+12점' });
      if ((ai?.questionHeadings || 0) < 2) causes.push({ input: '질문형 H2 < 50%', sol: 'H2를 "어떻게/왜/얼마/어떤" 패턴으로 변경', impact: '+9점' });
      if ((ai?.definitionH2 || 0) < 2) causes.push({ input: '정의문 H2 < 50%', sol: 'H2 첫 문장 "X는 ~이다" 형식으로 시작', impact: '+8점' });
      if (infraSignals && infraSignals.blockedBotsCount >= 3) causes.push({ input: 'AI 봇 차단', sol: 'AI 봇 접근 설정에서 GPTBot/ClaudeBot/PerplexityBot 허용', impact: '+10점' });
    }
    else if (kpiId === 'visibility') {
      if (infraSignals && !infraSignals.sitemapValid) causes.push({ input: '사이트 지도 손상', sol: '자기 도메인 sitemap.xml 정비 + 50+ URL 등록', impact: '+10점' });
      if (infraSignals && infraSignals.blockedBotsCount >= 5) causes.push({ input: 'AI 봇 5종+ 차단', sol: '검색·AI 봇 접근 허용 (전면 재검토)', impact: '+15점' });
      if (!signals || (signals.heading || 0) < 2) causes.push({ input: '제목 구조 부재', sol: 'H1·H2 구조화 + 메타 태그 페이지별 차별화', impact: '+8점' });
      if (!signals?.lengthGood) causes.push({ input: '본문 길이 < 1500자', sol: '핵심 페이지 본문을 1,800~2,200자로 확장', impact: '+6점' });
    }
    else if (kpiId === 'authority') {
      if ((signals?.expert || 0) < 2) causes.push({ input: '저자/대표 정보 부재', sol: '도입부+결론에 "○○ 대표 (경력 N년·자격증)" 단락 추가', impact: '+12점' });
      if ((signals?.experience || 0) < 2) causes.push({ input: '실제 경험 사례 부족', sol: '"실제로 ~해본 결과" + 케이스 5건 추가', impact: '+8점' });
      if ((signals?.authority || 0) < 2) causes.push({ input: '외부 권위 신호 부재', sol: '언론 보도 / 수상 / 인증 / 협력사 명시', impact: '+10점' });
      if ((signals?.trust || 0) < 2) causes.push({ input: '신뢰 신호 부족', sol: '연락처 + 환불/보증 조항 + 실명 후기 추가', impact: '+6점' });
    }
    else if (kpiId === 'velocity') {
      if ((signals?.channel || 0) < 1) causes.push({ input: '블로그/뉴스 채널 부재', sol: '월 8건 이상 블로그 발행 자동화', impact: '+15점' });
      if (!signals?.hasDates) causes.push({ input: '날짜 표기 부재', sol: '모든 글에 발행일/갱신일 명시', impact: '+5점' });
      if (!signals?.lengthExcellent) causes.push({ input: '콘텐츠 양 부족', sol: '월 30건 이상 발행 + 카테고리 5개 분산', impact: '+10점' });
    }
    else if (kpiId === 'conversion') {
      if ((signals?.cta || 0) < 2) causes.push({ input: 'CTA 약함', sol: '카카오톡 / 전화 / 예약 3종 동시 노출', impact: '+18점' });
      if ((ai?.ctaReach || 0) < 2) causes.push({ input: 'CTA 도달률 < 50%', sol: '본문 800자마다 CTA 1개씩 배치', impact: '+9점' });
      if ((signals?.trust || 0) < 2) causes.push({ input: '신뢰 신호 부족', sol: '환불/보증 + 후기 + 실명 노출', impact: '+7점' });
    }
    else if (kpiId === 'engagement') {
      if ((signals?.review || 0) < 2) causes.push({ input: '후기/평점 부재', sol: '★★★★★ 4.9/5.0 + 고객 후기 3건 이상 노출', impact: '+18점' });
      if ((signals?.channel || 0) < 1) causes.push({ input: 'SNS 채널 미연동', sol: '인스타그램/유튜브 피드 임베드', impact: '+10점' });
    }
    else if (kpiId === 'channel') {
      if ((signals?.channel || 0) < 2) causes.push({ input: '단일 채널 의존', sol: '블로그 + 인스타 + 유튜브 + 네이버블로그 + 카카오 5채널 분산', impact: '+22점' });
    }
    else if (kpiId === 'brand') {
      if ((signals?.brand || 0) < 2) causes.push({ input: '브랜드명 반복 부족', sol: '본문 H2마다 브랜드명 1회 이상 반복 (50%+)', impact: '+15점' });
      if ((ai?.brandRepetition || 0) < 2) causes.push({ input: '브랜드 반복률 < 50%', sol: '각 H2 섹션에 브랜드명 자연스럽게 삽입', impact: '+8점' });
    }
    else if (kpiId === 'competitive') {
      if ((signals?.competitive || 0) < 1) causes.push({ input: '경쟁 차별화 부재', sol: '"업계 평균 vs 우리" 비교 표 3열 + 차별점 명시', impact: '+22점' });
    }
    else if (kpiId === 'aio') {
      if ((signals?.schema || 0) < 1) causes.push({ input: 'Schema.org 미적용', sol: 'FAQPage + Organization JSON-LD 코드 블록 삽입', impact: '+18점' });
      if ((signals?.faq || 0) < 2) causes.push({ input: 'FAQ 구조 부재', sol: 'Q1~Q5 + A1~A5 페어 구조화', impact: '+8점' });
      if (!signals?.hasLists) causes.push({ input: '리스트 구조 부재', sol: '번호 리스트(1.2.3.) + 불릿(•) 구조화', impact: '+6점' });
    }

    // 상태 정보 (현재 점수 포함)
    return {
      kpiId,
      currentScore: v,
      target: 70,
      gap: Math.max(0, 70 - v),
      causes: causes.slice(0, 3),
      isWeak: v < 70
    };
  }

  // ============== SVG 그래프 렌더링 ==============
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function nodeColor(node, scores, infraSignals) {
    // 약점 KPI는 빨강 강조, 인프라 차단도 빨강
    if (node.kpi && scores?.[node.kpi]?.value < 70) return NODE_TYPES.Issue.color;
    if (node.id === 'robots' && infraSignals?.blockedBotsCount >= 3) return NODE_TYPES.Issue.color;
    if (node.id === 'sitemap' && infraSignals && !infraSignals.sitemapValid) return NODE_TYPES.Issue.color;
    return NODE_TYPES[node.type].color;
  }

  function renderSVG(scores, infraSignals) {
    const W = 1040, H = 600;
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; background: #fafbfc; border-radius: 12px;">`;

    // arrow markers
    svg += `<defs>`;
    Object.entries(REL_TYPES).forEach(([k, v]) => {
      svg += `<marker id="arr-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${v.color}"/></marker>`;
    });
    svg += `</defs>`;

    // links
    LINKS.forEach(l => {
      const from = NODES.find(n => n.id === l.from);
      const to = NODES.find(n => n.id === l.to);
      if (!from || !to) return;
      const rel = REL_TYPES[l.type];
      svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${rel.color}" stroke-width="1.5" stroke-dasharray="${rel.dash}" marker-end="url(#arr-${l.type})" opacity="0.55"/>`;
    });

    // nodes
    NODES.forEach(n => {
      const meta = NODE_TYPES[n.type];
      const color = nodeColor(n, scores, infraSignals);
      const score = n.kpi ? (scores?.[n.kpi]?.value || 0) : null;
      const isWeak = n.kpi && score < 70;
      const w = 110, h = 50;
      svg += `<g class="ax-node" data-id="${n.id}" data-kpi="${n.kpi || ''}" data-type="${n.type}" style="cursor: ${n.kpi ? 'pointer' : 'default'};">`;
      svg += `<rect x="${n.x - w/2}" y="${n.y - h/2}" width="${w}" height="${h}" rx="8" fill="${color}" fill-opacity="${isWeak ? 0.92 : 0.18}" stroke="${color}" stroke-width="${isWeak ? 2.5 : 1.5}"/>`;
      const txt = n.label.split('\n');
      txt.forEach((line, i) => {
        svg += `<text x="${n.x}" y="${n.y - (txt.length - 1) * 6 + i * 12 + 4}" text-anchor="middle" font-size="10.5" font-weight="${isWeak ? 700 : 600}" fill="${isWeak ? '#fff' : '#111827'}" font-family="Pretendard, sans-serif">${escapeHtml(line)}</text>`;
      });
      if (score !== null) {
        svg += `<text x="${n.x + w/2 - 6}" y="${n.y - h/2 + 12}" text-anchor="end" font-size="10" font-weight="800" fill="${isWeak ? '#fff' : color}" font-family="monospace">${score}</text>`;
      }
      svg += `</g>`;
    });

    svg += `</svg>`;
    return svg;
  }

  // ============== Root Cause 패널 ==============
  function renderRootCausePanel(rc, kpiName) {
    if (!rc) return '<div style="padding: 24px; color: var(--text-tertiary);">노드를 선택하세요.</div>';
    if (!rc.isWeak) {
      return `<div style="padding: 24px; background: rgba(0,214,143,0.06); border-left: 4px solid #00d68f; border-radius: 8px;">
        <h4 style="margin: 0 0 8px; color: #00d68f;">✅ ${escapeHtml(kpiName)} — 양호</h4>
        <p style="margin: 0; color: var(--text-secondary); font-size: 0.92rem;">현재 ${rc.currentScore}점. 목표 70점 도달. 추가 강화는 선택사항입니다.</p>
      </div>`;
    }
    const causes = rc.causes;
    if (!causes.length) {
      return `<div style="padding: 24px; background: rgba(168,85,247,0.06); border-radius: 8px;">
        <h4 style="margin: 0 0 8px; color: #a855f7;">${escapeHtml(kpiName)} — root cause 미식별</h4>
        <p style="margin: 0; color: var(--text-secondary); font-size: 0.92rem;">현재 ${rc.currentScore}점. URL 진단 데이터로는 구체 원인 추정이 어려움. /90upgrade 권장.</p>
      </div>`;
    }
    const totalImpact = causes.reduce((s, c) => s + (parseInt(c.impact) || 0), 0);
    return `
      <div style="padding: 20px; background: rgba(190,18,60,0.06); border-left: 4px solid #be123c; border-radius: 8px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 6px; color: #be123c;">🚨 ${escapeHtml(kpiName)} 약점</h4>
        <div style="display: flex; gap: 16px; font-size: 0.88rem; color: var(--text-secondary);">
          <span>현재 <strong style="color: #ef4444;">${rc.currentScore}점</strong></span>
          <span>목표 70점</span>
          <span>격차 <strong>${rc.gap}점</strong></span>
          <span>예상 회복 <strong style="color: #00d68f;">+${totalImpact}점</strong></span>
        </div>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 8px;">📍 Root Cause 사슬 (CAUSES 관계 추적):</div>
      ${causes.map((c, i) => `
        <div style="display: grid; grid-template-columns: 32px 1fr auto; gap: 12px; align-items: start; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-left: 3px solid #be123c; border-radius: 8px; margin-bottom: 8px;">
          <div style="width: 28px; height: 28px; background: #be123c; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800;">${i + 1}</div>
          <div>
            <div style="font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">${escapeHtml(c.input)}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">💡 ${escapeHtml(c.sol)}</div>
          </div>
          <div style="font-weight: 800; color: #00d68f; font-family: monospace; align-self: center;">${escapeHtml(c.impact)}</div>
        </div>`).join('')}`;
  }

  // ============== AXOS 범례 ==============
  function renderLegend() {
    const nodeChips = Object.entries(NODE_TYPES).map(([k, v]) =>
      `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: ${v.color}22; border: 1px solid ${v.color}66; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">
         <span style="width: 8px; height: 8px; background: ${v.color}; border-radius: 50%;"></span>${v.icon} ${escapeHtml(k)}
       </span>`).join('');
    const relChips = Object.entries(REL_TYPES).map(([k, v]) =>
      `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--bg-tertiary); border-radius: 999px; font-size: 0.78rem; font-weight: 600;">
         <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="${v.color}" stroke-width="2" stroke-dasharray="${v.dash}"/></svg>
         ${escapeHtml(k)}
       </span>`).join('');
    return `
      <div style="padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; margin-bottom: 16px;">
        <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">AXOS 노드 (8종)</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">${nodeChips}</div>
        <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">AXOS 관계 (9종)</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">${relChips}</div>
      </div>`;
  }

  // ============== 메인 렌더 ==============
  function renderAxos(result) {
    const container = document.getElementById('axosPanel');
    if (!container) return;

    const scores = result.scores || {};
    const infraSignals = result.meta?.infraSignals || null;
    const ai = scores.citation?.aiwSignals || result.meta?.aiwSignals || null;

    // 약점 KPI 식별
    const weakKpis = Object.entries(scores)
      .filter(([k, s]) => (s.value || 0) < 70)
      .sort((a, b) => (a[1].value || 0) - (b[1].value || 0));

    const KPI_NAMES = {
      visibility: '검색 가시성', velocity: '콘텐츠 생산력', authority: 'E-E-A-T 신뢰도',
      citation: 'AI 인용 가능성', engagement: '고객 참여도', conversion: '전환 설계',
      channel: '채널 확장', brand: '브랜드 일관성', competitive: '경쟁 점유율', aio: 'AI 최적화 준비도'
    };

    const totalCauses = weakKpis.reduce((sum, [k, s]) => {
      const rc = findRootCauses(k, s, scores, infraSignals, ai);
      return sum + rc.causes.length;
    }, 0);

    container.innerHTML = `
      <div style="margin-bottom: 16px; padding: 16px 20px; background: linear-gradient(135deg, rgba(124,58,237,0.05), rgba(190,18,60,0.05)); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px;">
        <h3 style="margin: 0 0 6px; color: #7c3aed;">🕸️ AXOS 온톨로지 인과 분석</h3>
        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
          <strong>10 KPI + 5 ai_writing 신호 + 인프라 신호</strong>를 AXOS 표준 스키마(8종 노드 · 9종 관계)로 모델링.
          <strong style="color: #be123c;">빨간 노드(${weakKpis.length}개)</strong>는 70점 미만 약점 — 클릭하면 root cause 사슬과 솔루션이 표시됩니다.
          전체 식별된 root cause: <strong>${totalCauses}건</strong>.
        </div>
      </div>

      ${renderLegend()}

      <div style="display: grid; grid-template-columns: 1fr 380px; gap: 16px;">
        <div id="axosGraph" style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; padding: 12px; overflow: auto;">
          ${renderSVG(scores, infraSignals)}
        </div>
        <div>
          <div style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">📍 Root Cause 분석</div>
          <div id="axosRootCause" style="min-height: 200px;">
            ${weakKpis.length > 0
              ? renderRootCausePanel(findRootCauses(weakKpis[0][0], weakKpis[0][1], scores, infraSignals, ai), KPI_NAMES[weakKpis[0][0]])
              : '<div style="padding: 24px; text-align: center; color: #00d68f; background: rgba(0,214,143,0.08); border-radius: 12px;">✅ 약점 KPI 없음 — 모두 70점 이상</div>'}
          </div>
          ${weakKpis.length > 1 ? `
            <div style="margin-top: 16px; font-size: 0.78rem; color: var(--text-tertiary);">
              💡 그래프에서 다른 빨간 노드를 클릭하면 해당 KPI의 root cause로 전환됩니다.
            </div>` : ''}
        </div>
      </div>

      <!-- 약점 KPI 일괄 root cause 사슬 -->
      ${weakKpis.length > 1 ? `
        <details style="margin-top: 24px;">
          <summary style="cursor: pointer; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 8px; font-weight: 700; color: #be123c;">
            🚨 전체 약점 KPI ${weakKpis.length}개 일괄 root cause 사슬
          </summary>
          <div style="margin-top: 12px; display: grid; gap: 12px;">
            ${weakKpis.map(([k, s]) => {
              const rc = findRootCauses(k, s, scores, infraSignals, ai);
              return renderRootCausePanel(rc, KPI_NAMES[k]);
            }).join('<hr style="border: none; border-top: 1px dashed var(--border-primary); margin: 4px 0;">')}
          </div>
        </details>` : ''}
    `;

    // 노드 클릭 이벤트
    container.querySelectorAll('.ax-node').forEach(g => {
      const kpiId = g.dataset.kpi;
      if (!kpiId) return;
      g.addEventListener('click', () => {
        const rc = findRootCauses(kpiId, scores[kpiId], scores, infraSignals, ai);
        const name = KPI_NAMES[kpiId] || kpiId;
        document.getElementById('axosRootCause').innerHTML = renderRootCausePanel(rc, name);
        // 선택된 노드 강조
        container.querySelectorAll('.ax-node rect').forEach(r => r.style.filter = '');
        g.querySelector('rect').style.filter = 'drop-shadow(0 0 6px rgba(124,58,237,0.7))';
      });
    });
  }

  // iframe (기존 ontology.html)에 데이터 push (호환 유지)
  function pushToFrame(result, recommendation) {
    const iframe = document.getElementById('ontologyFrame');
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'diagnosis-result', result, recommendation }, '*');
  }

  function render(result, recommendation) {
    // 1) AXOS 패널 (신규)
    renderAxos(result);

    // 2) iframe 호환 (기존 ontology.html이 있으면 데이터 push)
    const iframe = document.getElementById('ontologyFrame');
    if (iframe) {
      iframe.addEventListener('load', () => pushToFrame(result, recommendation));
      setTimeout(() => pushToFrame(result, recommendation), 1500);
    }
    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'request-diagnosis' && e.source && e.source.postMessage) {
        e.source.postMessage({ type: 'diagnosis-result', result, recommendation }, '*');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
