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

  // 업종 영문 코드 → 한글 라벨 매핑 (진단 폼 select 옵션과 동일)
  const INDUSTRY_KO = {
    dental: '치과',
    hospital: '병원/의료',
    legal: '법무/세무',
    education: '교육/학원',
    beauty: '미용/뷰티',
    restaurant: '음식점/카페',
    retail: '유통/판매',
    b2b: 'B2B/제조',
    other: '기타',
    '': '미분류',
    '미분류': '미분류'
  };
  function getIndustryKo(code) {
    if (!code) return '미분류';
    return INDUSTRY_KO[code] || code;
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
      // 필터 옵션은 업종 코드를 value로(서버 필터용), 라벨은 한글로 표시
      sel.innerHTML = '<option value="">전체</option>' + curIndustries.map(i =>
        `<option value="${escapeHtml(i.industry)}">${escapeHtml(getIndustryKo(i.industry))} (${i.count})</option>`
      ).join('');
    }
    $('adIndustry').innerHTML = curIndustries.length === 0
      ? '<div style="color: var(--text-tertiary); font-size: 0.85rem;">데이터 없음</div>'
      : curIndustries.map(i => `
          <div class="ad-industry-card">
            <div class="name">${escapeHtml(getIndustryKo(i.industry))}</div>
            <div class="meta">진단 ${i.count}건 · 평균 <strong>${i.avg_score || 0}점</strong> (${i.min_score || 0}~${i.max_score || 0})</div>
          </div>`).join('');
  }

  function renderTable() {
    if (curItems.length === 0) {
      $('adTableBody').innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-tertiary);">데이터 없음</td></tr>`;
      return;
    }
    // 모드 라벨 변환 — v3.x(target_type 필드) + 옛 진단(mode 필드) 모두 호환
    function getModeBadge(it) {
      const t = it.target_type || it.target;
      const m = it.mode;
      if (t === 'homepage') return { label: '🏠 홈페이지', color: '#0095ff' };
      if (t === 'blog')     return { label: '📝 블로그',  color: '#a855f7' };
      if (t === 'article')  return { label: '📄 글',      color: '#ff8800' };
      if (m === 'content')  return { label: '📄 글',      color: '#ff8800' };
      if (m === 'url' || m === 'site') return { label: '🏠 홈페이지', color: '#0095ff' };
      return { label: escapeHtml(m || '-'), color: 'var(--text-tertiary)' };
    }


    $('adTableBody').innerHTML = curItems.map(it => {
      const date = new Date(it.created_at || it.analyzed_at || Date.now()).toLocaleString('ko-KR');
      const url = it.website_url || '-';
      const domain = url !== '-' ? url.replace(/^https?:\/\//,'').split('/')[0] : '-';
      const mode = getModeBadge(it);
      return `
        <tr>
          <td style="white-space: nowrap; font-size: 0.78rem;">${escapeHtml(date)}</td>
          <td>
            <a href="#" data-id="${escapeHtml(it.diagnosis_id)}" class="ad-view-link" title="진단 결과 페이지 열기"
               style="color: #0095ff; text-decoration: none; font-weight: 700; cursor: pointer;"
               onmouseover="this.style.textDecoration='underline'"
               onmouseout="this.style.textDecoration='none'">${escapeHtml(it.company_name)}</a>
          </td>
          <td style="font-size: 0.78rem;"><a href="${escapeHtml(url)}" target="_blank" style="color: var(--text-tertiary);">${escapeHtml(domain)}</a></td>
          <td>${escapeHtml(getIndustryKo(it.industry))}</td>
          <td><span style="font-size: 0.74rem; padding: 3px 8px; background: ${mode.color}1A; color: ${mode.color}; border: 1px solid ${mode.color}40; border-radius: 999px; font-weight: 700; white-space: nowrap;">${mode.label}</span></td>
          <td><strong style="font-family: monospace;">${it.total_score || 0}</strong></td>
          <td><span class="ad-grade ${escapeHtml(it.grade_key || '')}">${escapeHtml(it.grade_label || '-')}</span></td>
          <td>
            <div class="ad-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button data-id="${escapeHtml(it.diagnosis_id)}" class="ad-view" style="padding: 4px 10px; font-size: 0.78rem; background: rgba(0,149,255,0.12); color: #0095ff; border: 1px solid rgba(0,149,255,0.3); border-radius: 6px; cursor: pointer;">📋 상세</button>
              <button data-id="${escapeHtml(it.diagnosis_id)}" data-company="${escapeHtml(it.company_name)}" class="ad-delete" style="padding: 4px 10px; font-size: 0.78rem; background: rgba(255,61,113,0.12); color: #ff3d71; border: 1px solid rgba(255,61,113,0.3); border-radius: 6px; cursor: pointer;">🗑️ 삭제</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    // 진단 결과 열기 — 회사명 링크 + 📋 상세 버튼 양쪽 동일 핸들러
    function openResult(id) {
      const item = curItems.find(i => i.diagnosis_id === id);
      if (!item) return;
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
    }

    document.querySelectorAll('.ad-view-link').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        openResult(a.dataset.id);
      });
    });
    document.querySelectorAll('.ad-view').forEach(btn => {
      btn.addEventListener('click', () => openResult(btn.dataset.id));
    });

    // 삭제 버튼 — 2단계 재확인 후 실행
    document.querySelectorAll('.ad-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const company = btn.dataset.company || '-';
        openDeleteConfirm({ ids: [id], label: `${company} (1건)` });
      });
    });
  }

  /**
   * 2단계 재확인 모달 — 1단계 OK → 2단계: 회사명 또는 "삭제"를 직접 입력해야 활성화.
   */
  function openDeleteConfirm({ ids, label }) {
    if (!ids || !ids.length) return;
    const expected = '삭제';

    // 모달 DOM 동적 생성 (한 번만 사용 후 제거)
    const wrap = document.createElement('div');
    wrap.id = 'adDeleteModal';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:20px;';
    wrap.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 16px; max-width: 480px; width: 100%; padding: 28px; box-shadow: 0 24px 64px rgba(0,0,0,0.4);">

        <!-- Step 1 -->
        <div id="adDelStep1">
          <div style="font-size: 2.2rem; text-align: center; margin-bottom: 12px;">⚠️</div>
          <h3 style="margin: 0 0 12px; text-align: center; font-size: 1.15rem;">진단 항목을 삭제하시겠습니까?</h3>
          <div style="padding: 12px 14px; background: var(--bg-tertiary); border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 0.76rem; color: var(--text-tertiary); margin-bottom: 4px;">삭제 대상</div>
            <strong style="color: #ff3d71;">${escapeHtml(label)}</strong>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 20px;">
            삭제된 항목은 <strong style="color: #ff3d71;">복구할 수 없습니다.</strong> 정말 삭제하시려면 다음 단계로 진행하세요.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button id="adDelCancel1" style="padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-primary); border-radius: 10px; font-weight: 700; cursor: pointer;">취소</button>
            <button id="adDelNext" style="padding: 12px; background: rgba(255,61,113,0.18); color: #ff3d71; border: 1px solid #ff3d71; border-radius: 10px; font-weight: 700; cursor: pointer;">다음 단계 →</button>
          </div>
        </div>

        <!-- Step 2 (hidden 초기) -->
        <div id="adDelStep2" style="display: none;">
          <div style="font-size: 2.2rem; text-align: center; margin-bottom: 12px;">🗑️</div>
          <h3 style="margin: 0 0 12px; text-align: center; font-size: 1.15rem;">최종 확인</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 16px; text-align: center;">
            <strong style="color: #ff3d71;">${escapeHtml(label)}</strong>을(를) 영구 삭제합니다.<br/>
            확인을 위해 아래 입력란에 <strong style="color: #ff3d71;">${expected}</strong>를 정확히 입력하세요.
          </p>
          <input id="adDelConfirmInput" type="text" placeholder='${expected} 입력' autocomplete="off"
                 style="width: 100%; padding: 12px 14px; font-size: 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 10px; color: var(--text-primary); margin-bottom: 16px; box-sizing: border-box;" />
          <div id="adDelErr" style="font-size: 0.82rem; color: #ff3d71; margin-bottom: 12px; min-height: 18px;"></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button id="adDelCancel2" style="padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-primary); border-radius: 10px; font-weight: 700; cursor: pointer;">취소</button>
            <button id="adDelExecute" disabled
                    style="padding: 12px; background: #ff3d71; color: white; border: none; border-radius: 10px; font-weight: 800; cursor: not-allowed; opacity: 0.5;">🗑️ 영구 삭제</button>
          </div>
        </div>

        <!-- Step 3: 진행 (hidden 초기) -->
        <div id="adDelStep3" style="display: none; text-align: center; padding: 20px 0;">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">⏳</div>
          <p style="margin: 0; color: var(--text-secondary);">삭제 중...</p>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const close = () => wrap.remove();
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });

    document.getElementById('adDelCancel1').addEventListener('click', close);
    document.getElementById('adDelCancel2').addEventListener('click', close);

    document.getElementById('adDelNext').addEventListener('click', () => {
      document.getElementById('adDelStep1').style.display = 'none';
      document.getElementById('adDelStep2').style.display = 'block';
      setTimeout(() => document.getElementById('adDelConfirmInput').focus(), 50);
    });

    const input = document.getElementById('adDelConfirmInput');
    const exeBtn = document.getElementById('adDelExecute');
    input.addEventListener('input', () => {
      const ok = input.value.trim() === expected;
      exeBtn.disabled = !ok;
      exeBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
      exeBtn.style.opacity = ok ? '1' : '0.5';
    });
    input.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !exeBtn.disabled) exeBtn.click();
    });

    exeBtn.addEventListener('click', async () => {
      document.getElementById('adDelStep2').style.display = 'none';
      document.getElementById('adDelStep3').style.display = 'block';
      try {
        const r = await fetch('/api/delete-diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: adminPass,
            ids: ids,
            confirm: 'YES_DELETE'
          })
        });
        const data = await r.json();
        if (!r.ok || !data.success) {
          alert('삭제 실패: ' + (data.error || r.status));
          close();
          return;
        }
        close();
        await fetchData();   // 테이블 갱신
        // 토스트 (있으면)
        if (window.toast) window.toast(`✅ ${data.deletedCount}건 삭제되었습니다`, 'success');
        else console.log('[admin] 삭제 완료', data);
      } catch (e) {
        alert('삭제 중 오류: ' + e.message);
        close();
      }
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
