/**
 * GEO Score AI - 관리 대시보드
 * Supabase 저장 진단 이력을 비밀번호 인증 후 조회/필터/CSV 다운로드
 */
(function() {
  let adminPass = '';
  let curOffset = 0;
  let curLimit = 50;
  let curFilter = {};
  let curItems = [];
  let curStats = null;
  let curIndustries = [];

  function $(id) { return document.getElementById(id); }
  function show(id) {
    $('adLogin').classList.toggle('hidden', id !== 'login');
    $('adMain').classList.toggle('hidden', id !== 'main');
  }
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 비밀번호 sessionStorage 기억 (이번 세션만)
  const SAVED = sessionStorage.getItem('admin_pass');
  if (SAVED) {
    adminPass = SAVED;
    fetchData().then(ok => { if (ok) show('main'); else { sessionStorage.removeItem('admin_pass'); show('login'); } });
  }

  $('adLoginBtn')?.addEventListener('click', async () => {
    adminPass = $('adPassword').value.trim();
    if (!adminPass) { $('adLoginErr').textContent = '비밀번호를 입력하세요'; return; }
    const ok = await fetchData();
    if (ok) {
      sessionStorage.setItem('admin_pass', adminPass);
      $('adLoginErr').textContent = '';
      show('main');
    } else {
      $('adLoginErr').textContent = '로그인 실패 (비밀번호 또는 Supabase 설정 확인)';
    }
  });

  $('adPassword')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') $('adLoginBtn').click();
  });

  $('adLogout')?.addEventListener('click', () => {
    sessionStorage.removeItem('admin_pass');
    adminPass = '';
    show('login');
  });

  async function fetchData() {
    try {
      const r = await fetch('/api/list-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPass,
          limit: curLimit,
          offset: curOffset,
          filter: curFilter,
          sortBy: 'created_at',
          order: 'desc'
        })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        console.warn('[admin] list 실패', err);
        return false;
      }
      const data = await r.json();
      if (!data.success) return false;

      curItems = data.items || [];
      curStats = data.stats || {};
      curIndustries = data.byIndustry || [];

      renderStats();
      renderIndustry();
      renderTable();
      renderPagination(data.pagination);
      return true;
    } catch (e) {
      console.error('[admin] fetch 실패', e);
      return false;
    }
  }

  function renderStats() {
    const s = curStats || {};
    $('adStats').innerHTML = `
      <div class="ad-stat"><div class="ad-stat-val">${s.total_count || 0}</div><div class="ad-stat-lbl">총 진단 수</div></div>
      <div class="ad-stat"><div class="ad-stat-val">${s.last_7_days || 0}</div><div class="ad-stat-lbl">지난 7일</div></div>
      <div class="ad-stat"><div class="ad-stat-val">${s.last_30_days || 0}</div><div class="ad-stat-lbl">지난 30일</div></div>
      <div class="ad-stat"><div class="ad-stat-val">${s.avg_score || 0}</div><div class="ad-stat-lbl">평균 점수</div></div>
      <div class="ad-stat"><div class="ad-stat-val">${s.unique_companies || 0}</div><div class="ad-stat-lbl">고유 회사</div></div>
      <div class="ad-stat gA"><div class="ad-stat-val">${(s.grade_a_plus || 0) + (s.grade_a || 0)}</div><div class="ad-stat-lbl">A+/A 등급</div></div>
      <div class="ad-stat gB"><div class="ad-stat-val">${s.grade_b || 0}</div><div class="ad-stat-lbl">B 보통</div></div>
      <div class="ad-stat gC"><div class="ad-stat-val">${(s.grade_c || 0) + (s.grade_d || 0)}</div><div class="ad-stat-lbl">C/D 등급</div></div>
      <div class="ad-stat gF"><div class="ad-stat-val">${s.grade_f || 0}</div><div class="ad-stat-lbl">F 위급</div></div>
    `;
  }

  function renderIndustry() {
    const sel = $('filIndustry');
    if (sel && sel.options.length <= 1) {
      sel.innerHTML = '<option value="">전체</option>' + curIndustries.map(i =>
        `<option value="${escapeHtml(i.industry)}">${escapeHtml(i.industry)} (${i.count})</option>`
      ).join('');
    }
    $('adIndustry').innerHTML = curIndustries.length === 0
      ? '<div style="color: var(--text-tertiary); font-size: 0.85rem;">데이터 없음</div>'
      : curIndustries.map(i => `
          <div class="ad-industry-card">
            <div class="name">${escapeHtml(i.industry || '미분류')}</div>
            <div class="meta">진단 ${i.count}건 · 평균 <strong>${i.avg_score || 0}점</strong> (${i.min_score || 0}~${i.max_score || 0})</div>
          </div>`).join('');
  }

  function renderTable() {
    if (curItems.length === 0) {
      $('adTableBody').innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-tertiary);">데이터 없음</td></tr>`;
      return;
    }
    $('adTableBody').innerHTML = curItems.map(it => {
      const date = new Date(it.created_at || it.analyzed_at || Date.now()).toLocaleString('ko-KR');
      const url = it.website_url || '-';
      const domain = url !== '-' ? url.replace(/^https?:\/\//,'').split('/')[0] : '-';
      return `
        <tr>
          <td style="white-space: nowrap; font-size: 0.78rem;">${escapeHtml(date)}</td>
          <td><strong>${escapeHtml(it.company_name)}</strong></td>
          <td style="font-size: 0.78rem;"><a href="${escapeHtml(url)}" target="_blank" style="color: #0095ff;">${escapeHtml(domain)}</a></td>
          <td>${escapeHtml(it.industry || '-')}</td>
          <td><span style="font-size: 0.72rem; padding: 2px 6px; background: var(--bg-tertiary); border-radius: 4px;">${escapeHtml(it.mode || 'url')}</span></td>
          <td><strong style="font-family: monospace;">${it.total_score || 0}</strong></td>
          <td><span class="ad-grade ${escapeHtml(it.grade_key || '')}">${escapeHtml(it.grade_label || '-')}</span></td>
          <td>
            <div class="ad-actions">
              <button data-id="${escapeHtml(it.diagnosis_id)}" class="ad-view">📋 상세</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    // 상세 보기 버튼
    document.querySelectorAll('.ad-view').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = curItems.find(i => i.diagnosis_id === id);
        if (!item) return;
        // sessionStorage에 result 형식으로 저장 후 result-overview로 이동
        const result = {
          id: item.diagnosis_id,
          companyName: item.company_name,
          websiteUrl: item.website_url,
          industry: item.industry,
          analyzedAt: item.analyzed_at,
          totalScore: item.total_score,
          grade: { key: item.grade_key, label: item.grade_label },
          scores: item.scores,
          legacyScores: item.legacy_scores,
          weights: item.weights,
          summary: item.summary,
          competitors: item.competitors,
          meta: item.meta
        };
        sessionStorage.setItem('current_result_' + id, JSON.stringify({ result, recommendation: null }));
        window.open(`result-tabs.html?id=${id}`, '_blank');
      });
    });
  }

  function renderPagination(pg) {
    if (!pg) return;
    const cur = Math.floor(pg.offset / pg.limit) + 1;
    const total = Math.ceil(pg.totalCount / pg.limit) || 1;
    $('adPageInfo').textContent = `${cur} / ${total} 페이지 (총 ${pg.totalCount}건)`;
    $('adPrev').disabled = pg.offset === 0;
    $('adNext').disabled = !pg.hasMore;
  }

  $('adPrev')?.addEventListener('click', () => {
    curOffset = Math.max(0, curOffset - curLimit);
    fetchData();
  });
  $('adNext')?.addEventListener('click', () => {
    curOffset += curLimit;
    fetchData();
  });
  $('adRefresh')?.addEventListener('click', () => fetchData());

  $('adApplyFil')?.addEventListener('click', () => {
    curFilter = {
      search: $('filSearch').value.trim() || undefined,
      gradeKey: $('filGrade').value || undefined,
      industry: $('filIndustry').value || undefined,
      minScore: $('filMin').value ? parseInt($('filMin').value, 10) : undefined,
      maxScore: $('filMax').value ? parseInt($('filMax').value, 10) : undefined
    };
    curOffset = 0;
    fetchData();
  });

  $('adCsv')?.addEventListener('click', () => {
    if (!curItems.length) return;
    const headers = ['일시', '회사명', 'URL', '업종', '모드', '점수', '등급'];
    const rows = curItems.map(it => [
      new Date(it.created_at).toISOString(),
      it.company_name,
      it.website_url || '',
      it.industry || '',
      it.mode || '',
      it.total_score || 0,
      it.grade_label || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-diagnostics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
})();
