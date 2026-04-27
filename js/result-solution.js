/**
 * 솔루션 제안 탭
 * - 권장 경로 자동 판정 매트릭스 (5종)
 * - 신규 개발 권장 시 견적 템플릿 표출
 * - 4 Phase 액션 플랜
 * - 기존 우선순위 액션 / 추천 패키지 / 예상 결과
 */
(function() {

  // ========================================
  // 1) 권장 경로 자동 판정 매트릭스
  // ========================================
  function recommendPath(totalScore, infraSignals) {
    const blocked = (infraSignals && infraSignals.blockedBotsCount >= 5) || false;
    const sitemapBroken = !!(infraSignals && infraSignals.sitemapFound && !infraSignals.sitemapValid);
    const forceNewDev = blocked || sitemapBroken;

    // 강제 신규 개발 (인프라 심각 차단)
    if (forceNewDev) {
      return {
        type: 'new-dev-required',
        label: '신규 개발 필수',
        color: '#ff4d4f',
        bgColor: 'rgba(255, 77, 79, 0.10)',
        borderColor: 'rgba(255, 77, 79, 0.40)',
        emoji: '🚨',
        cost: '400만원~ (VAT 별도)',
        duration: '3주 / 21일',
        expected: '+45점 이상 상승, AI 노출 가능 사이트로 전환',
        description: blocked
          ? 'AI 봇 접근 설정이 5개 이상 차단되어 있습니다. AI 검색에 노출 자체가 불가능한 상태이므로 사이트 재구축이 필요합니다.'
          : '사이트 지도가 손상되어 있어 검색엔진이 페이지를 발견할 수 없습니다. 구조부터 다시 만들어야 합니다.',
        checklist: [
          '현재 사이트의 AI 봇 접근 설정 전면 재정비',
          '사이트 지도(검색 노출용 페이지 목록) 재발급',
          '구조화 정보 6종 표준 적용 (회사/제품/FAQ/리뷰/직원/위치)',
          '반응형 디자인 + 모바일 속도 1.5초 이내',
          '운영자가 직접 글을 올릴 수 있는 블로그 시스템'
        ],
        showQuote: true
      };
    }

    if (totalScore < 30) {
      return {
        type: 'new-dev-required',
        label: '신규 개발 필수',
        color: '#ff4d4f',
        bgColor: 'rgba(255, 77, 79, 0.10)',
        borderColor: 'rgba(255, 77, 79, 0.40)',
        emoji: '🚨',
        cost: '400만원~ (VAT 별도)',
        duration: '3주 / 21일',
        expected: '+50점 이상 상승, AI 추천 가능 사이트로 전환',
        description: '현재 점수가 30점 미만입니다. 부분 개선으로는 AI 검색 시대 경쟁력을 회복하기 어려우므로 사이트 자체를 다시 만드는 것이 가장 빠르고 저렴한 길입니다.',
        checklist: [
          '정보 구조 처음부터 재설계 (메뉴·키워드 정리)',
          'AI 검색·일반 검색 동시 최적화',
          '구조화 정보 6종 자동 생성 시스템',
          '운영자 직접 운영 가능한 블로그',
          '도메인·보안 인증서 이관 + 1년 호스팅 포함'
        ],
        showQuote: true
      };
    }

    if (totalScore < 45) {
      return {
        type: 'new-dev-recommended',
        label: '신규 개발 권장',
        color: '#ff7a45',
        bgColor: 'rgba(255, 122, 69, 0.10)',
        borderColor: 'rgba(255, 122, 69, 0.40)',
        emoji: '⚠️',
        cost: '400만원~ (VAT 별도)',
        duration: '3주 / 21일',
        expected: '+35~45점 상승, 6개월 내 AI 추천 진입',
        description: '점수 45점 미만은 누적된 문제가 많아, 부분 개선 비용을 합치면 신규 개발과 비슷해집니다. 신규 개발이 비용 대비 효과가 가장 좋습니다.',
        checklist: [
          '기존 콘텐츠 마이그레이션 (글 자산 보존)',
          '검색 노출 친화적 정보 구조 신규 설계',
          'AI 봇 접근 + 사이트 지도 표준화',
          '구조화 정보 자동 생성 + 메타 태그 보강',
          '오픈 후 14일 무상 안정화 + 운영자 매뉴얼'
        ],
        showQuote: true
      };
    }

    if (totalScore < 60) {
      return {
        type: 'compare',
        label: '전면 개선 vs 신규 개발 비교 검토',
        color: '#faad14',
        bgColor: 'rgba(250, 173, 20, 0.10)',
        borderColor: 'rgba(250, 173, 20, 0.40)',
        emoji: '⚖️',
        cost: '전면 개선 250만원~ / 신규 개발 400만원~',
        duration: '전면 개선 3주 / 신규 개발 3주',
        expected: '+25~35점 상승',
        description: '점수 45~60점대는 살릴 부분과 버릴 부분이 섞여 있습니다. 전면 개선과 신규 개발의 비용·기간이 비슷하므로, 기존 자산의 양에 따라 선택합니다.',
        checklist: [
          '기존 콘텐츠 평가 (살릴 글 vs 버릴 글)',
          '정보 구조 재정렬 + 핵심 키워드 재배치',
          '구조화 정보 4종 이상 적용',
          'AI 봇 접근 설정 + 사이트 지도 재발급',
          '메타 태그 + 검색 노출 등록 일괄 정비'
        ],
        showQuote: false
      };
    }

    if (totalScore < 75) {
      return {
        type: 'partial-improve',
        label: '부분 개선',
        color: '#ffa940',
        bgColor: 'rgba(255, 169, 64, 0.10)',
        borderColor: 'rgba(255, 169, 64, 0.40)',
        emoji: '🔧',
        cost: '100만원~ (VAT 별도)',
        duration: '2주 / 14일',
        expected: '+15~20점 상승, 약점 KPI 집중 보강',
        description: '기본 골격은 양호합니다. 부족한 영역만 정밀 보강하면 단기간에 우수 등급으로 진입할 수 있습니다.',
        checklist: [
          '약점 KPI 3개 집중 보강',
          'FAQ 구조화 정보 + 메타 태그 보강',
          'AI 봇 접근 설정 미세 조정',
          '핵심 페이지 5개 콘텐츠 재작성',
          '검색 노출 등록 재점검'
        ],
        showQuote: false
      };
    }

    // 75점 이상 — 콘텐츠/권위 강화 단계
    return {
      type: 'strengthen',
      label: '콘텐츠·권위 강화',
      color: '#52c41a',
      bgColor: 'rgba(82, 196, 26, 0.10)',
      borderColor: 'rgba(82, 196, 26, 0.40)',
      emoji: '🌱',
      cost: '월 150~200만원',
      duration: '3~6개월 운영',
      expected: '+10~15점 상승, AI 인용 빈도 3배 이상',
      description: '구조와 기본 신호는 우수합니다. 이제 콘텐츠 양과 외부 권위를 키워 AI가 자주 인용하는 기업으로 만들 단계입니다.',
      checklist: [
        '월 8건 블로그 정기 발행 (잠재 고객 검색 키워드 기반)',
        '외부 매체 백링크 캠페인',
        'PR 보도자료 + 인터뷰 노출',
        '리뷰·후기 구조화 정보 누적',
        '경쟁사 대비 인용 빈도 추적'
      ],
      showQuote: false
    };
  }

  // ========================================
  // 2) 견적 템플릿 (신규 개발 권장 시)
  // ========================================
  function renderQuoteTable() {
    return `
      <div class="section-header" style="margin-top: 48px;">
        <span class="section-tag">신규 개발 견적</span>
        <h2>💰 4,000,000원 / 3주 표준 견적</h2>
        <p class="section-subtitle">계약 시 50% · 오픈 시 50% 지급, VAT 별도</p>
      </div>

      <div class="kpi-detail-card" style="max-width: 880px; margin: 0 auto;">
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-primary);">
              <th style="text-align:left; padding: 12px 8px; color: var(--text-secondary); font-weight:700;">항목</th>
              <th style="text-align:right; padding: 12px 8px; color: var(--text-secondary); font-weight:700;">금액</th>
              <th style="text-align:left; padding: 12px 8px; color: var(--text-secondary); font-weight:700;">설명</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-primary);">
              <td style="padding: 12px 8px;">기획·정보구조 설계</td>
              <td style="padding: 12px 8px; text-align:right; font-weight:700;">600,000원</td>
              <td style="padding: 12px 8px; color: var(--text-secondary);">메뉴 구성·핵심 키워드 정리</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-primary);">
              <td style="padding: 12px 8px;">PC + 모바일 디자인</td>
              <td style="padding: 12px 8px; text-align:right; font-weight:700;">800,000원</td>
              <td style="padding: 12px 8px; color: var(--text-secondary);">메인 + 서브 12종 시안</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-primary);">
              <td style="padding: 12px 8px;">화면 개발 (18페이지)</td>
              <td style="padding: 12px 8px; text-align:right; font-weight:700;">1,200,000원</td>
              <td style="padding: 12px 8px; color: var(--text-secondary);">반응형 코드 구현</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-primary);">
              <td style="padding: 12px 8px;">AI 검색·일반 검색 최적화</td>
              <td style="padding: 12px 8px; text-align:right; font-weight:700;">700,000원</td>
              <td style="padding: 12px 8px; color: var(--text-secondary);">표준 정보 구조 + 검색 등록</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-primary);">
              <td style="padding: 12px 8px;">블로그 시스템</td>
              <td style="padding: 12px 8px; text-align:right; font-weight:700;">400,000원</td>
              <td style="padding: 12px 8px; color: var(--text-secondary);">운영자 직접 글쓰기 화면</td>
            </tr>
            <tr style="border-bottom: 2px solid var(--border-primary);">
              <td style="padding: 12px 8px;">초기 콘텐츠 6편</td>
              <td style="padding: 12px 8px; text-align:right; font-weight:700;">300,000원</td>
              <td style="padding: 12px 8px; color: var(--text-secondary);">잠재 고객 검색 키워드 기반</td>
            </tr>
            <tr style="background: rgba(255,107,53,0.08);">
              <td style="padding: 16px 8px; font-weight:800; font-size: 1.05rem;">합계 (VAT 별도)</td>
              <td style="padding: 16px 8px; text-align:right; font-weight:800; font-size:1.2rem; color: var(--color-accent);">4,000,000원</td>
              <td style="padding: 16px 8px; font-weight:700;">3주 / 21일</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 24px; padding: 20px; background: rgba(0, 214, 143, 0.06); border-radius: 12px;">
          <div style="font-weight:700; margin-bottom: 8px; color: #00d68f;">✓ 기본 포함 사항</div>
          <ul style="list-style:none; padding:0; margin:0; color: var(--text-secondary); line-height: 1.9;">
            <li>· 도메인 이관 + 보안 인증서 (HTTPS) 자동 발급</li>
            <li>· 1년 호스팅 무료 제공</li>
            <li>· 오픈 후 14일 무상 안정화</li>
            <li>· 운영자 매뉴얼 PDF 제공</li>
            <li>· 1회 화상 교육 (1시간, 운영자 대상)</li>
          </ul>
        </div>
      </div>
    `;
  }

  // ========================================
  // 3) 4 Phase 액션 플랜
  // ========================================
  function renderPhases() {
    const phases = [
      {
        num: 1,
        emoji: '⚡',
        label: '즉시 가능',
        color: '#00d68f',
        bgColor: 'rgba(0, 214, 143, 0.10)',
        borderColor: 'rgba(0, 214, 143, 0.35)',
        items: ['AI 봇 접근 설정 수정', '사이트 지도 재발급', '구조화 정보 1종 적용'],
        duration: '1주',
        cost: '무료'
      },
      {
        num: 2,
        emoji: '🔨',
        label: '단기 강화',
        color: '#0095ff',
        bgColor: 'rgba(0, 149, 255, 0.10)',
        borderColor: 'rgba(0, 149, 255, 0.35)',
        items: ['FAQ 구조화 정보 추가', '메타 태그 일괄 보강', '검색 노출 등록'],
        duration: '2주',
        cost: '100만원'
      },
      {
        num: 3,
        emoji: '📝',
        label: '콘텐츠 가속',
        color: '#ffa800',
        bgColor: 'rgba(255, 168, 0, 0.10)',
        borderColor: 'rgba(255, 168, 0, 0.35)',
        items: ['월 8건 블로그 정기 발행', '잠재 고객 키워드 기반', '콘텐츠 자산화'],
        duration: '3개월',
        cost: '월 150만원'
      },
      {
        num: 4,
        emoji: '🌐',
        label: '외부 권위',
        color: '#a855f7',
        bgColor: 'rgba(168, 85, 247, 0.10)',
        borderColor: 'rgba(168, 85, 247, 0.35)',
        items: ['외부 매체 백링크 캠페인', 'PR 보도자료 + 인터뷰', '리뷰·후기 누적'],
        duration: '6개월',
        cost: '월 200만원'
      }
    ];

    return `
      <div class="section-header" style="margin-top: 64px;">
        <span class="section-tag">4단계 액션 플랜</span>
        <h2>🗺️ 단계별 실행 로드맵</h2>
        <p class="section-subtitle">즉시 → 단기 → 중기 → 장기, 단계별 비용·기간·효과</p>
      </div>

      <div class="kpi-detail-grid">
        ${phases.map(p => `
          <div class="kpi-detail-card" style="border: 1px solid ${p.borderColor}; background: ${p.bgColor};">
            <div style="display:flex; align-items:center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: ${p.color}; color: #fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size: 1.2rem;">
                ${p.num}
              </div>
              <div>
                <div style="font-size: 1.1rem; font-weight: 800;">${p.emoji} Phase ${p.num}</div>
                <div style="color: ${p.color}; font-weight: 700; font-size: 0.95rem;">${p.label}</div>
              </div>
            </div>
            <ul style="list-style:none; padding:0; margin: 0 0 16px 0;">
              ${p.items.map(i => `
                <li style="padding: 6px 0; display:flex; gap:8px; color: var(--text-secondary);">
                  <span style="color: ${p.color};">✓</span><span>${i}</span>
                </li>`).join('')}
            </ul>
            <div style="display:flex; justify-content:space-between; padding-top: 12px; border-top: 1px solid var(--border-primary);">
              <span style="color: var(--text-tertiary); font-size: 0.85rem;">기간: <strong style="color: var(--text-primary);">${p.duration}</strong></span>
              <span style="color: var(--text-tertiary); font-size: 0.85rem;">비용: <strong style="color: ${p.color};">${p.cost}</strong></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ========================================
  // 4) 권장 경로 큰 카드 (페이지 최상단)
  // ========================================
  function renderPathHero(path) {
    const esc = ResultShared.escapeHtml;
    return `
      <div style="margin-bottom: 48px; padding: 36px; border-radius: 20px;
                  background: ${path.bgColor};
                  border: 2px solid ${path.borderColor};">
        <div style="display:flex; align-items:center; gap: 16px; margin-bottom: 20px;">
          <div style="font-size: 2.6rem;">${path.emoji}</div>
          <div style="flex:1;">
            <div style="font-size: 0.85rem; font-weight: 700; color: ${path.color}; letter-spacing: 0.5px; margin-bottom: 4px;">권장 경로 자동 판정</div>
            <h2 style="font-size: 1.9rem; margin: 0; color: ${path.color};">${esc(path.label)}</h2>
          </div>
        </div>

        <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 24px; font-size: 1.05rem;">
          ${esc(path.description)}
        </p>

        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="stat-label">예상 비용</div>
            <div class="stat-value" style="color: ${path.color}; font-size: 1.4rem;">${esc(path.cost)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">기간</div>
            <div class="stat-value" style="color: ${path.color}; font-size: 1.4rem;">${esc(path.duration)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">기대 효과</div>
            <div class="stat-value" style="color: ${path.color}; font-size: 1.4rem;">${esc(path.expected)}</div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px;">
          <div style="font-weight: 700; margin-bottom: 12px;">📋 핵심 체크리스트</div>
          <ul style="list-style:none; padding: 0; margin: 0;">
            ${path.checklist.map(c => `
              <li style="padding: 8px 0; display:flex; gap: 10px; color: var(--text-secondary);">
                <span style="color: ${path.color}; font-weight: 700;">✓</span>
                <span>${esc(c)}</span>
              </li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  // ========================================
  // 5) 최종 렌더 함수
  // ========================================
  function render(result, recommendation) {
    const container = document.getElementById('solutionContent');
    if (!recommendation) {
      container.innerHTML = `
        <div style="text-align:center;padding:48px;color:var(--text-tertiary);">
          솔루션 추천을 불러오지 못했습니다. <a href="chatbot.html">전문가 상담</a>으로 문의해주세요.
        </div>`;
      return;
    }

    const esc = ResultShared.escapeHtml;
    const totalScore = (result && typeof result.totalScore === 'number') ? result.totalScore : 50;
    const infraSignals = (result && result.meta && result.meta.infraSignals) || null;
    const path = recommendPath(totalScore, infraSignals);

    const tier = recommendation.packageTier;
    const actions = recommendation.priorityActions || [];
    const outcome = recommendation.expectedOutcome;
    const pitch = recommendation.personalizedPitch;

    container.innerHTML = `
      ${renderPathHero(path)}

      ${path.showQuote ? renderQuoteTable() : ''}

      ${renderPhases()}

      ${pitch ? `
        <div class="cta-section" style="margin: 48px 0 32px;">
          <h2 class="cta-title" style="font-size: 1.5rem;">${esc(pitch)}</h2>
        </div>
      ` : ''}

      <div class="section-header">
        <h2>📋 우선순위 액션 플랜</h2>
        <p class="section-subtitle">가장 약한 KPI 3개에 대한 즉시 실행 가능한 액션</p>
      </div>

      <div class="kpi-detail-grid">
        ${actions.map(a => {
          const kpi = window.KPI_DEFINITIONS && window.KPI_DEFINITIONS.find(k => k.id === a.kpiId);
          return `
            <div class="kpi-detail-card">
              <div class="kpi-detail-header">
                <div class="kpi-detail-name">
                  <span class="kpi-icon-mini">${(kpi && kpi.icon) || '📌'}</span>
                  순위 ${a.rank}: ${(kpi && kpi.name) || a.kpiId}
                </div>
                <div class="kpi-score low">${a.score}</div>
              </div>
              <div style="font-weight:700;font-size:1.05rem;margin-bottom:8px;color:var(--color-accent);">
                ${esc(a.action)}
              </div>
              <div class="kpi-detail-desc">${esc(a.detail)}</div>
              <div style="display:flex;gap:8px;margin-top:12px;">
                <span style="padding:4px 10px;background:rgba(0,214,143,0.1);color:#00d68f;border-radius:12px;font-size:0.8rem;font-weight:600;">${esc(a.impact)}</span>
                <span style="padding:4px 10px;background:rgba(0,149,255,0.1);color:#0095ff;border-radius:12px;font-size:0.8rem;font-weight:600;">${esc(a.cost)}</span>
              </div>
            </div>`;
        }).join('')}
      </div>

      ${tier ? `
        <div class="section-header" style="margin-top: 64px;">
          <span class="section-tag">추천 패키지</span>
          <h2>🎁 ${esc(tier.name)}</h2>
          <p class="section-subtitle">${esc(tier.reason)}</p>
        </div>

        <div class="kpi-detail-card" style="max-width:720px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:2rem;font-weight:800;color:var(--color-accent);margin-bottom:8px;">${esc(tier.price)}</div>
            <div style="color:var(--text-tertiary);">${esc(tier.duration)}</div>
          </div>
          <div style="border-top:1px solid var(--border-primary);padding-top:24px;">
            <h4 style="margin-bottom:16px;">포함 사항</h4>
            <ul style="list-style:none;padding:0;">
              ${(tier.includes || []).map(item => `
                <li style="padding:8px 0;display:flex;align-items:center;gap:12px;">
                  <span style="color:#00d68f;font-weight:700;">✓</span>
                  <span style="color:var(--text-secondary);">${esc(item)}</span>
                </li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      ${outcome ? `
        <div class="section-header" style="margin-top: 64px;">
          <h2>📈 3개월 후 예상 결과</h2>
        </div>

        <div class="stats-grid" style="max-width:720px;margin:0 auto;">
          <div class="stat-card">
            <div class="stat-label">예상 노출 증가</div>
            <div class="stat-value">${esc(outcome.improvement)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">예상 신규 점수</div>
            <div class="stat-value">${outcome.newScoreEstimate}<span style="font-size:1.25rem;color:var(--text-tertiary);">/100</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">달성 기간</div>
            <div class="stat-value">${esc(outcome.timeframe)}</div>
          </div>
        </div>
      ` : ''}`;
  }

  document.addEventListener('DOMContentLoaded', () => ResultShared.init(render));
})();
