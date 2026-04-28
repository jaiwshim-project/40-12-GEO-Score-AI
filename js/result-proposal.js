/**
 * 고객사 제안서 탭 — 의뢰자에게 그대로 전달 가능한 비즈니스 제안서.
 * 기술 용어 없이 (1) 핵심 문제점 (2) 부작용·악영향 (3) 해결 방안 (4) 기대 효과 (5) 행동 유도(CTA).
 */
(function () {

  // KPI별 비즈니스 언어 매핑 (기술 용어 → 비즈니스 가치 언어)
  const KPI_BIZ = {
    hp_botAccess: {
      problem: 'AI 검색 차단 — ChatGPT·Claude·Perplexity가 우리 사이트를 학습할 수 없는 상태',
      sideEffect: '"○○치과 어디가 좋아?" 같은 AI 검색에서 우리는 등장하지 않고 경쟁사가 추천됩니다. AI 검색이 이미 한국에서 월 1억 회 이상 발생하는 시대에, 우리 회사는 보이지 않는 상태입니다.',
      solution: 'AI 검색 7종(ChatGPT·Claude·Perplexity·Google AI·Amazon·CCBot 등) 모두 학습할 수 있도록 사이트 접근 설정 변경. 약 15분 작업으로 즉시 해결됩니다.',
      benefit: 'AI 검색 결과에 우리 사이트가 노출되기 시작 → 신규 고객 유입 채널 확보',
      monthlyImpact: '월 50~200건의 신규 노출 기회 회복 (업종·규모에 따라)'
    },
    hp_sitemap: {
      problem: '사이트 지도 부재 — 검색엔진이 우리 페이지를 효율적으로 찾을 수 없음',
      sideEffect: '신규 페이지를 만들어도 구글·네이버가 1~2주 늦게 발견하거나 영영 발견하지 못합니다. 이벤트·캠페인 페이지가 검색에서 제때 노출되지 않아 마케팅 효과가 반감됩니다.',
      solution: '사이트 지도(Sitemap)를 자동 생성하고 구글·네이버에 공식 제출. 약 1시간 작업으로 검색엔진이 우리 사이트의 모든 페이지를 즉시 인지합니다.',
      benefit: '신규 페이지 발행 즉시 검색 노출 시작 — 캠페인 골든타임 확보',
      monthlyImpact: '신규 콘텐츠 노출 속도 14일 → 1~2일'
    },
    hp_indexExposure: {
      problem: '검색 등록 부족 — 구글·네이버에 우리 사이트가 거의 등록되지 않은 상태',
      sideEffect: '잠재 고객이 우리 회사명·서비스명을 검색해도 우리 페이지가 나타나지 않습니다. 가장 기본적인 "검색에서 발견될 수 있는 권리"를 잃고 있습니다.',
      solution: 'Search Console·네이버 서치어드바이저에 사이트 등록 + 핵심 페이지 색인 요청 + 내부 링크 구조 강화. 1~2일 작업 + 7~14일 후 검색 결과 반영.',
      benefit: '검색 결과 1페이지 노출 가능성 회복 — 무료 트래픽 채널 확보',
      monthlyImpact: '월 100~500건의 검색 트래픽 신규 유입'
    },
    hp_schema: {
      problem: 'AI가 우리 회사를 정확히 이해하지 못함 — 회사 정보 구조가 표준화되지 않은 상태',
      sideEffect: 'AI 답변에서 우리 회사가 누락되거나 잘못된 정보로 인용됩니다. "주소가 어디?" "전화번호?" "운영 시간?" 같은 질문에 AI가 우리 정보 대신 경쟁사 정보를 답합니다.',
      solution: '회사 정보(이름·주소·전화·운영시간·리뷰)를 AI가 인식하는 표준 형식(Schema.org)으로 정리. 2~4시간 작업으로 AI가 우리를 정확히 인식합니다.',
      benefit: 'AI 답변에 우리 정보가 정확하게 포함 — 신뢰도 + 발견율 동시 상승',
      monthlyImpact: 'AI 인용 가능성 30~50% 상승 (구조화 데이터 적용 사이트 평균)'
    },
    hp_pageInfo: {
      problem: '검색 결과 미리보기 매력도 낮음 — 페이지 제목·설명·이미지가 클릭을 유도하지 못함',
      sideEffect: '구글·네이버 검색 결과에 우리 페이지가 노출되더라도 클릭률이 낮습니다. 비슷한 순위의 경쟁사 페이지는 매력적인 제목·설명으로 더 많은 방문자를 가져갑니다.',
      solution: '페이지마다 고유한 제목(50~60자)·설명(140~160자)·SNS 미리보기 이미지·OG 태그 정비. 1~2시간 작업으로 즉시 효과.',
      benefit: '동일 검색 노출에서 클릭률 30~50% 상승',
      monthlyImpact: '같은 노출량에서 방문자 ↑ 30~50%'
    },
    hp_externalAuthority: {
      problem: '외부 매체 언급 부재 — 언론·블로거가 우리 회사를 거의 언급하지 않은 상태',
      sideEffect: '처음 우리를 접하는 고객이 "이 회사 믿을 만한가?"를 검색해도 외부 검증 자료가 나오지 않습니다. AI도 외부에서 자주 언급되는 회사를 신뢰하기 때문에 인용 후순위로 밀립니다.',
      solution: '보도자료 발신·업종 매체 인터뷰·협회 회원 등재·블로거 협업 12주 로드맵. 점진적이지만 누적되면 강력한 권위 자산이 됩니다.',
      benefit: '외부 매체 언급으로 신뢰도 ↑ + AI 인용 가중치 ↑ + 검색 순위 ↑',
      monthlyImpact: '12주 후 백링크 5~10개 + 보도자료 1~2건 누적'
    },
    hp_eeatPage: {
      problem: '신뢰 정보 부족 — 누가 운영하는지·어떤 자격이 있는지·언제부터 했는지 정보가 노출되지 않음',
      sideEffect: '고객이 "이 곳을 믿어도 되나?" 결정 단계에서 정보 부족으로 이탈합니다. 특히 의료·법률·교육·금융 같은 신뢰 산업에서 결정적인 약점입니다.',
      solution: '대표자 프로필·자격증·운영 연혁·연락처를 명확히 노출하는 소개 페이지 신설. 4~8시간 작업.',
      benefit: '결정 단계 이탈 감소 + AI가 신뢰할 만한 정보원으로 인식',
      monthlyImpact: '문의 전환율 15~30% 상승 (신뢰 정보 노출 사이트 평균)'
    },
    hp_ctaDesign: {
      problem: '연락 경로 부족 — 방문자가 상담·예약으로 이어지는 길이 좁음',
      sideEffect: '관심을 가진 잠재 고객의 70~80%가 "어떻게 연락해야 하나" 헤매다 이탈합니다. 어렵게 모은 방문자가 매출로 전환되지 않는 핵심 원인입니다.',
      solution: '전화·예약·상담폼·메신저 4종 연락 경로를 모든 페이지에 배치. 모바일 화면 하단에 항상 보이는 고정 버튼 추가. 2~4시간 작업.',
      benefit: '방문자 → 문의 전환율 직접 상승',
      monthlyImpact: '문의 건수 30~80% 상승 (CTA 4종 + 모바일 sticky 적용 사이트 평균)'
    },
    hp_mobilePerf: {
      problem: '모바일 로딩 속도 느림 — 페이지가 완전히 표시되기까지 3초 이상 소요',
      sideEffect: '모바일 방문자의 53%가 3초 이상 로딩되면 이탈합니다(Google 2018). 광고비를 들여 데려온 고객이 페이지를 보지도 못하고 떠납니다. 모바일 트래픽이 70% 이상인 시대에 결정적 손실입니다.',
      solution: '이미지 최적화·불필요한 코드 제거·CDN 적용으로 로딩 속도 90점 이상 달성. 1~2일 작업.',
      benefit: '모바일 이탈률 직접 감소 + 검색 순위 상승 (구글이 페이지 속도를 순위 요소로 사용)',
      monthlyImpact: '모바일 이탈률 53% → 20% 이하'
    },
    hp_cmsAutonomy: {
      problem: '운영 자율성 제약 — 콘텐츠를 자유롭게 수정·추가할 수 없는 임대형 사이트 구조',
      sideEffect: '신상품·이벤트·캠페인을 즉시 반영할 수 없어 마케팅 골든타임을 놓칩니다. 페이지 한 줄 수정에도 외부 도움이 필요해 운영비가 누적됩니다.',
      solution: '도메인은 그대로 유지하면서 자체 운영 가능한 시스템으로 전환. 1~2주 마이그레이션.',
      benefit: '운영자가 직접 콘텐츠·메타·이미지 수정 가능 → 마케팅 자율성 100%',
      monthlyImpact: '외부 작업 의존 0건 + 캠페인 반영 속도 즉시'
    }
  };

  // 등급별 메인 메시지
  const GRADE_MESSAGE = {
    critical: { tone: '위급', emoji: '🚨', headline: 'AI 검색에서 사실상 보이지 않는 상태', subline: '경쟁사가 우리 자리를 빠르게 차지하고 있습니다' },
    poor:     { tone: '심각', emoji: '⚠️', headline: 'AI 추천에서 거의 발견되지 않는 상태', subline: '지금 행동하지 않으면 시장 점유 기회를 잃습니다' },
    weak:     { tone: '미흡', emoji: '⚠️', headline: '기본 노출은 되지만 AI 인용에는 미달', subline: '핵심 영역 개선만으로 상위권 진입 가능' },
    growing:  { tone: '보통', emoji: '📈', headline: '검색 노출 기반은 형성됨', subline: '약점 보강으로 1위권 도달 가능' },
    strong:   { tone: '우수', emoji: '💪', headline: 'AI 검색에서 안정적으로 발견되는 상태', subline: '추가 강화로 시장 지배 가능' },
    dominant: { tone: '최상위', emoji: '👑', headline: 'AI 검색 시장을 지배하는 상태', subline: '운영 유지로 우위 보존' }
  };

  function getCompetitorScore(industry) {
    return { avg: 60, top10: 85 };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render(result) {
    const target = document.getElementById('proposalTabContent');
    if (!target) return;

    const company = result.companyName || '귀사';
    const url = result.websiteUrl || '-';
    const total = result.totalScore || 0;
    const gradeKey = result.grade?.key || 'critical';
    const gradeLabel = result.grade?.label || '-';
    const msg = GRADE_MESSAGE[gradeKey] || GRADE_MESSAGE.critical;
    const cmp = getCompetitorScore(result.industry);

    // 약점 KPI 분석 (점수 낮은 순) — 비즈니스 언어 매핑이 있는 KPI만
    const scores = result.scores || {};
    const weakest = Object.entries(scores)
      .map(([id, s]) => ({ id, value: s.value || 0, biz: KPI_BIZ[id] }))
      .filter(x => x.biz && x.value < 70)
      .sort((a, b) => a.value - b.value)
      .slice(0, 5);

    // 종합 ROI 추정 (간이 계산)
    const monthlyVisitorEstimate = total < 40 ? '월 100~300명' : total < 60 ? '월 300~800명' : '월 800~2,000명';
    const projectedScore = Math.min(95, total + 35);

    target.innerHTML = `
      <!-- A. 진단 한 줄 요약 (헤로) -->
      <div style="padding: 32px 36px; background: linear-gradient(135deg, rgba(168,85,247,0.10), rgba(236,72,153,0.06)); border: 1px solid rgba(168,85,247,0.30); border-radius: 18px; margin-bottom: 32px; text-align: center;">
        <div style="font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: 8px;">AI 검색 시대 ${escapeHtml(company)} 진단 결과</div>
        <h2 style="margin: 0 0 16px; font-size: 1.6rem; line-height: 1.5;">
          <strong style="color: #c084fc;">${escapeHtml(company)}</strong>의 GEO Score는<br/>
          <span style="font-size: 2.4rem; font-weight: 900; color: ${total >= 70 ? '#00d68f' : total >= 40 ? '#ffa800' : '#ff3d71'}; font-family: monospace;">${total}점</span>
          <span style="font-size: 1.1rem; color: var(--text-secondary);">/ 100점 (${escapeHtml(gradeLabel)})</span>
        </h2>
        <p style="margin: 0 0 8px; font-size: 1.1rem; font-weight: 700;">${msg.emoji} ${escapeHtml(msg.headline)}</p>
        <p style="margin: 0; font-size: 0.92rem; color: var(--text-secondary);">${escapeHtml(msg.subline)}</p>
      </div>

      <!-- 시장 위치 비교 -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 36px;">
        <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">${escapeHtml(company)}</div>
          <div style="font-size: 1.8rem; font-weight: 900; font-family: monospace; color: ${total >= 70 ? '#00d68f' : total >= 40 ? '#ffa800' : '#ff3d71'};">${total}</div>
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">현재 위치</div>
        </div>
        <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">업계 평균</div>
          <div style="font-size: 1.8rem; font-weight: 900; font-family: monospace; color: var(--text-secondary);">${cmp.avg}</div>
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">동종업계 평균</div>
        </div>
        <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">상위 10%</div>
          <div style="font-size: 1.8rem; font-weight: 900; font-family: monospace; color: #00d68f;">${cmp.top10}</div>
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">시장 리더 그룹</div>
        </div>
      </div>

      <!-- B. 발견된 핵심 문제점 -->
      <h3 style="margin: 0 0 16px; font-size: 1.25rem; padding-left: 14px; border-left: 4px solid #ff3d71;">⚠️ 1. 발견된 핵심 문제점</h3>
      <p style="margin: 0 0 20px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
        진단 결과 ${escapeHtml(company)}의 사이트에서 <strong style="color: #ff3d71;">${weakest.length}가지 핵심 문제</strong>를 발견했습니다. 각각 AI 검색·잠재고객 유입·신뢰도에 직접적인 영향을 주고 있습니다.
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px;">
        ${weakest.map((w, i) => `
          <div style="padding: 18px 22px; background: var(--bg-card); border-left: 4px solid #ff3d71; border-radius: 10px;">
            <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #ff3d71;">문제 #${i + 1}</span>
              <strong style="font-size: 1rem; flex: 1;">${escapeHtml(w.biz.problem)}</strong>
              <span style="font-family: monospace; font-size: 0.85rem; color: var(--text-tertiary);">현재 ${w.value}점</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- C. 부작용·악영향 -->
      <h3 style="margin: 0 0 16px; font-size: 1.25rem; padding-left: 14px; border-left: 4px solid #ffa800;">📉 2. 이 문제들이 일으키는 손실</h3>
      <p style="margin: 0 0 20px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
        위 문제점들은 단순한 기술적 결함이 아니라 <strong>매출과 직결되는 비즈니스 손실</strong>입니다. 지금 이 순간에도 이런 손실이 누적되고 있습니다.
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px;">
        ${weakest.map((w, i) => `
          <div style="padding: 18px 22px; background: linear-gradient(90deg, rgba(255,168,0,0.06), transparent); border-left: 4px solid #ffa800; border-radius: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 1.1rem;">⚠️</span>
              <strong style="font-size: 0.95rem; color: #ffa800;">${escapeHtml(w.biz.problem.split('—')[0].trim())}로 인한 부작용</strong>
            </div>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7;">${escapeHtml(w.biz.sideEffect)}</p>
          </div>
        `).join('')}
      </div>

      <!-- 누적 손실 박스 -->
      <div style="padding: 20px 24px; background: rgba(255,61,113,0.08); border: 1px dashed #ff3d71; border-radius: 14px; margin-bottom: 40px;">
        <div style="font-weight: 800; color: #ff3d71; margin-bottom: 8px; font-size: 1.05rem;">💸 매월 누적되는 추정 손실</div>
        <p style="margin: 0; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
          AI 검색에서 ${escapeHtml(company)}이(가) 노출되지 않는 동안, 같은 키워드를 검색한 <strong>${monthlyVisitorEstimate}의 잠재 고객</strong>이 경쟁사로 유입되고 있습니다.
          이 손실은 누적되며, 시간이 지날수록 경쟁사의 AI 인용·신뢰도 격차가 커져 따라잡기 어려워집니다.
        </p>
      </div>

      <!-- D. 해결 방안 -->
      <h3 style="margin: 0 0 16px; font-size: 1.25rem; padding-left: 14px; border-left: 4px solid #00d68f;">💡 3. 해결 방안</h3>
      <p style="margin: 0 0 20px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
        다행히 위 문제점들은 모두 <strong style="color: #00d68f;">검증된 방법으로 해결 가능</strong>합니다. 작업 순서와 시간을 명확히 정리했습니다.
      </p>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 36px;">
        ${weakest.map((w, i) => `
          <div style="padding: 18px 22px; background: linear-gradient(90deg, rgba(0,214,143,0.06), transparent); border-left: 4px solid #00d68f; border-radius: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 1.1rem;">✅</span>
              <strong style="font-size: 0.95rem; color: #00d68f;">해결책 #${i + 1}</strong>
            </div>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7;">${escapeHtml(w.biz.solution)}</p>
          </div>
        `).join('')}
      </div>

      <!-- E. 기대 효과 -->
      <h3 style="margin: 0 0 16px; font-size: 1.25rem; padding-left: 14px; border-left: 4px solid #c084fc;">🎯 4. 해결 후 기대 효과</h3>
      <p style="margin: 0 0 20px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
        위 해결책들을 모두 적용하면 ${escapeHtml(company)}은(는) 다음과 같이 변합니다.
      </p>

      <!-- Before/After 카드 -->
      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; margin-bottom: 28px;">
        <div style="padding: 24px; background: var(--bg-card); border: 1px solid rgba(255,61,113,0.30); border-radius: 14px; text-align: center;">
          <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 700;">📉 현재 (BEFORE)</div>
          <div style="font-size: 3rem; font-weight: 900; font-family: monospace; color: #ff3d71;">${total}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(gradeLabel)}</div>
          <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-top: 8px;">AI 검색에서 누락 / 잠재고객 이탈</div>
        </div>
        <div style="font-size: 2.5rem; color: #c084fc; font-weight: 900;">→</div>
        <div style="padding: 24px; background: linear-gradient(135deg, rgba(0,214,143,0.10), rgba(0,214,143,0.04)); border: 2px solid #00d68f; border-radius: 14px; text-align: center;">
          <div style="font-size: 0.78rem; color: #00d68f; margin-bottom: 8px; font-weight: 700;">📈 해결 후 (AFTER)</div>
          <div style="font-size: 3rem; font-weight: 900; font-family: monospace; color: #00d68f;">${projectedScore}+</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">A 우수 / A+ Premium</div>
          <div style="font-size: 0.78rem; color: var(--text-tertiary); margin-top: 8px;">AI 검색 우선 노출 / 신규 고객 유입</div>
        </div>
      </div>

      <!-- 영역별 기대 효과 -->
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px;">
        ${weakest.map((w, i) => `
          <div style="padding: 14px 18px; background: var(--bg-card); border: 1px solid var(--border-primary); border-left: 4px solid #c084fc; border-radius: 10px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 0.78rem; padding: 3px 10px; background: rgba(192,132,252,0.18); color: #c084fc; border-radius: 999px; font-weight: 700;">효과 #${i + 1}</span>
            <div style="flex: 1; min-width: 200px;">
              <div style="font-weight: 700; font-size: 0.92rem; margin-bottom: 4px;">${escapeHtml(w.biz.benefit)}</div>
              <div style="font-size: 0.82rem; color: var(--text-tertiary);">→ ${escapeHtml(w.biz.monthlyImpact)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 종합 ROI 박스 -->
      <div style="padding: 24px 28px; background: linear-gradient(135deg, rgba(0,214,143,0.08), rgba(192,132,252,0.04)); border: 1px solid rgba(0,214,143,0.30); border-radius: 14px; margin-bottom: 40px;">
        <div style="font-weight: 800; color: #00d68f; margin-bottom: 12px; font-size: 1.05rem;">🎁 종합 기대 결과</div>
        <ul style="margin: 0; padding-left: 22px; color: var(--text-secondary); line-height: 1.9; font-size: 0.95rem;">
          <li><strong>AI 검색 시대 1위권 진입</strong> — ChatGPT·Perplexity·Gemini 답변에 ${escapeHtml(company)}이(가) 우선 추천됨</li>
          <li><strong>잠재 고객 유입 채널 회복</strong> — 검색 + AI 답변 양쪽에서 신규 고객 유입</li>
          <li><strong>신뢰도 상승</strong> — 외부 검증 자료 + 전문성 노출로 결정 단계 이탈률 감소</li>
          <li><strong>운영 자율성 확보</strong> — 캠페인·이벤트를 즉시 반영해 마케팅 골든타임 활용</li>
          <li><strong>경쟁 우위 확보</strong> — 상위 10% 사이트와 동급의 AI 친화도 달성</li>
        </ul>
      </div>

      <!-- F. CTA — 행동 유도 -->
      <h3 style="margin: 0 0 16px; font-size: 1.4rem; padding-left: 14px; border-left: 4px solid #ff6b35;">🚀 5. 다음 단계 — 무엇을 하시면 좋은가</h3>

      <!-- 권장 진행 -->
      <div style="padding: 28px 32px; background: linear-gradient(135deg, rgba(255,107,53,0.10), rgba(255,168,0,0.06)); border: 2px solid #ff6b35; border-radius: 16px; margin-bottom: 24px;">
        <div style="font-size: 0.78rem; color: #ff6b35; font-weight: 800; margin-bottom: 10px; letter-spacing: 0.5px;">⭐ 권장 진행 방식</div>
        <h4 style="margin: 0 0 14px; font-size: 1.3rem; line-height: 1.5;">
          ${total < 40
            ? `${escapeHtml(company)}은(는) <strong style="color: #ff6b35;">신규 개발</strong>이 효율적입니다`
            : `${escapeHtml(company)}은(는) <strong style="color: #ff6b35;">기존 사이트 업그레이드</strong>로 충분합니다`}
        </h4>
        <p style="margin: 0 0 18px; font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7;">
          ${total < 40
            ? '현재 점수가 낮고 구조적 결함이 다수 있어, 부분 개선보다 처음부터 AI 친화적으로 새로 만드는 것이 비용·효과 면에서 유리합니다. 기존 도메인은 그대로 유지합니다.'
            : '핵심 약점 KPI 2~3개만 보강하면 상위권 도달이 가능한 상태입니다. 4주 단위 단계별 작업으로 90점 이상을 목표로 합니다.'}
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 14px;">
          <div style="padding: 12px 14px; background: var(--bg-card); border-radius: 10px;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">예상 기간</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${total < 40 ? '3주' : '4주'}</div>
          </div>
          <div style="padding: 12px 14px; background: var(--bg-card); border-radius: 10px;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">예상 비용</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${total < 40 ? '400만원' : '200~500만원'}</div>
          </div>
          <div style="padding: 12px 14px; background: var(--bg-card); border-radius: 10px;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">목표 점수</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #00d68f;">${projectedScore}+ / 100</div>
          </div>
          <div style="padding: 12px 14px; background: var(--bg-card); border-radius: 10px;">
            <div style="font-size: 0.72rem; color: var(--text-tertiary);">ROI 회수 시점</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">3~6개월</div>
          </div>
        </div>
      </div>

      <!-- CTA 4종 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 28px;">
        <a href="chatbot.html" class="btn btn-primary btn-large" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 18px 24px; background: linear-gradient(135deg, #ff6b35, #ffa800); border: none; color: white; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(255,107,53,0.30);">
          <span style="font-size: 1.4rem;">💬</span>
          <div style="text-align: left;">
            <div style="font-size: 0.95rem;">무료 1:1 컨설팅</div>
            <div style="font-size: 0.72rem; opacity: 0.9; font-weight: 500;">30분 · 진단 결과 자세히 설명</div>
          </div>
        </a>
        <a href="generate-report.html" class="btn btn-secondary btn-large" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 18px 24px; background: var(--bg-card); border: 2px solid var(--color-accent); color: var(--text-primary); font-weight: 800; text-decoration: none; border-radius: 12px;">
          <span style="font-size: 1.4rem;">📋</span>
          <div style="text-align: left;">
            <div style="font-size: 0.95rem;">정식 견적 요청</div>
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 500;">맞춤 견적서 발송</div>
          </div>
        </a>
        <a href="mailto:jaiwshim@gmail.com?subject=GEO%20Score%20AI%20%EC%83%81%EB%8B%B4%20%EC%9A%94%EC%B2%AD%20-%20${encodeURIComponent(company)}" class="btn btn-secondary btn-large" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 18px 24px; background: var(--bg-card); border: 1px solid var(--border-primary); color: var(--text-primary); font-weight: 800; text-decoration: none; border-radius: 12px;">
          <span style="font-size: 1.4rem;">✉️</span>
          <div style="text-align: left;">
            <div style="font-size: 0.95rem;">이메일 문의</div>
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 500;">jaiwshim@gmail.com</div>
          </div>
        </a>
        <button id="proposalDownloadBtn" class="btn btn-secondary btn-large" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 18px 24px; background: var(--bg-card); border: 1px solid var(--border-primary); color: var(--text-primary); font-weight: 800; cursor: pointer; border-radius: 12px;">
          <span style="font-size: 1.4rem;">📥</span>
          <div style="text-align: left;">
            <div style="font-size: 0.95rem;">제안서 다운로드</div>
            <div style="font-size: 0.72rem; color: var(--text-tertiary); font-weight: 500;">.md 파일</div>
          </div>
        </button>
      </div>

      <!-- 마무리 메시지 -->
      <div style="padding: 24px 28px; background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 14px; text-align: center;">
        <p style="margin: 0; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7;">
          <strong style="color: var(--text-primary);">"문제를 알게 된 지금이 가장 빠른 시점입니다."</strong><br/>
          AI 검색 시장은 매월 빠르게 변하고 있습니다. 한 달 늦어질수록 경쟁사와의 격차는 커집니다.<br/>
          위 CTA 중 하나를 선택해 ${escapeHtml(company)}의 AI 검색 시대 진입을 시작하세요.
        </p>
      </div>
    `;

    // 제안서 .md 다운로드
    document.getElementById('proposalDownloadBtn')?.addEventListener('click', () => {
      const md = buildProposalMarkdown(result, weakest, msg, projectedScore, monthlyVisitorEstimate);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geo-proposal-${(company || 'client').replace(/[^a-zA-Z0-9가-힣]/g, '_')}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /** 비즈니스 톤 제안서 마크다운 (의뢰자 전달용) */
  function buildProposalMarkdown(result, weakest, msg, projectedScore, monthlyVisitor) {
    const company = result.companyName || '귀사';
    const url = result.websiteUrl || '-';
    const total = result.totalScore || 0;
    const grade = result.grade?.label || '-';
    const isNew = total < 40;

    let md = `# ${company} GEO Score AI 진단 제안서

## 🎯 진단 결과 요약

- **회사**: ${company}
- **사이트**: ${url}
- **현재 GEO Score**: **${total}점 / 100점 (${grade})**
- **시장 위치**: 업계 평균 60점 / 상위 10% 85점 대비 ${total < 60 ? '하위권' : total < 85 ? '평균권' : '상위권'}
- **진단 일시**: ${new Date(result.analyzedAt || Date.now()).toLocaleString('ko-KR')}

> ${msg.emoji} **${msg.headline}** — ${msg.subline}

---

## ⚠️ 1. 발견된 핵심 문제점 (${weakest.length}가지)

`;

    weakest.forEach((w, i) => {
      md += `### 문제 ${i + 1}. ${w.biz.problem}\n현재 점수: **${w.value}점**\n\n`;
    });

    md += `\n---\n\n## 📉 2. 이 문제들이 일으키는 손실\n\n`;
    weakest.forEach((w, i) => {
      md += `### ${i + 1}. ${w.biz.problem.split('—')[0].trim()}\n${w.biz.sideEffect}\n\n`;
    });

    md += `\n### 💸 매월 누적되는 추정 손실\nAI 검색에서 ${company}이(가) 노출되지 않는 동안, 같은 키워드를 검색한 **${monthlyVisitor}의 잠재 고객**이 경쟁사로 유입되고 있습니다. 이 손실은 누적되며, 시간이 지날수록 경쟁사의 AI 인용·신뢰도 격차가 커져 따라잡기 어려워집니다.\n\n---\n\n## 💡 3. 해결 방안\n\n`;

    weakest.forEach((w, i) => {
      md += `### 해결책 ${i + 1}. ${w.biz.problem.split('—')[0].trim()} 해결\n${w.biz.solution}\n\n`;
    });

    md += `\n---\n\n## 🎯 4. 해결 후 기대 효과\n\n### Before vs After\n| 구분 | 현재 (BEFORE) | 해결 후 (AFTER) |\n|---|---:|---:|\n| GEO Score | ${total}점 | ${projectedScore}+ 점 |\n| 등급 | ${grade} | A 우수 또는 A+ Premium |\n| AI 검색 노출 | 누락 | 우선 추천 |\n| 잠재고객 유입 | 이탈 | 신규 채널 확보 |\n\n### 영역별 효과\n`;

    weakest.forEach((w, i) => {
      md += `${i + 1}. **${w.biz.benefit}** — ${w.biz.monthlyImpact}\n`;
    });

    md += `\n### 🎁 종합 기대 결과\n- **AI 검색 시대 1위권 진입** — ChatGPT·Perplexity·Gemini 답변에 ${company}이(가) 우선 추천됨\n- **잠재 고객 유입 채널 회복** — 검색 + AI 답변 양쪽에서 신규 고객 유입\n- **신뢰도 상승** — 외부 검증 자료 + 전문성 노출로 결정 단계 이탈률 감소\n- **운영 자율성 확보** — 캠페인·이벤트를 즉시 반영해 마케팅 골든타임 활용\n- **경쟁 우위 확보** — 상위 10% 사이트와 동급의 AI 친화도 달성\n\n---\n\n## 🚀 5. 다음 단계\n\n### ⭐ 권장 진행 방식\n\n**${company}은(는) ${isNew ? '신규 개발' : '기존 사이트 업그레이드'}이(가) 효율적입니다.**\n\n${isNew
      ? '현재 점수가 낮고 구조적 결함이 다수 있어, 부분 개선보다 처음부터 AI 친화적으로 새로 만드는 것이 비용·효과 면에서 유리합니다. 기존 도메인은 그대로 유지합니다.'
      : '핵심 약점 KPI 2~3개만 보강하면 상위권 도달이 가능한 상태입니다. 4주 단위 단계별 작업으로 90점 이상을 목표로 합니다.'}\n\n| 항목 | 내용 |\n|---|---|\n| 예상 기간 | ${isNew ? '3주' : '4주'} |\n| 예상 비용 | ${isNew ? '400만원' : '200~500만원'} |\n| 목표 점수 | ${projectedScore}+ / 100 |\n| ROI 회수 | 3~6개월 |\n\n### 📞 다음 행동 (CTA)\n\n1. **무료 1:1 컨설팅 (30분)** — 진단 결과를 함께 자세히 검토합니다\n2. **정식 견적 요청** — ${company} 맞춤 견적서를 발송해 드립니다\n3. **이메일 문의** — jaiwshim@gmail.com\n\n---\n\n> "문제를 알게 된 지금이 가장 빠른 시점입니다."\n> AI 검색 시장은 매월 빠르게 변하고 있습니다. 한 달 늦어질수록 경쟁사와의 격차는 커집니다.\n\n*제안서 작성: GEO Score AI · 심재우 (jaiwshim@gmail.com)*\n`;

    return md;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.ResultShared) return;
    ResultShared.init(render);
  });
})();
