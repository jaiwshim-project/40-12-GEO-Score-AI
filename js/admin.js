/**
 * GEO Score AI - 관리자 페이지 로직
 */

(function() {
  const ADMIN_SESSION_KEY = 'geo_admin_session';
  const DEFAULT_PASS = '963314';

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function checkSession() {
    try {
      const ts = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (ts && Date.now() - parseInt(ts) < 30 * 60 * 1000) return true;
    } catch (e) {}
    return false;
  }

  function login() {
    const pass = document.getElementById('adminPass').value;
    if (!pass) {
      toast('비밀번호를 입력해주세요', 'warning');
      return;
    }

    if (pass !== DEFAULT_PASS) {
      toast('비밀번호가 일치하지 않습니다', 'error');
      return;
    }

    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, String(Date.now()));
    } catch (e) {}

    showAdminUI();
  }

  function logout() {
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) {}
    location.reload();
  }

  async function showAdminUI() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');

    await loadHealth();
    loadStats();
    loadDiagnoses();
    loadActivity();
  }

  async function loadHealth() {
    try {
      const data = await api.get('/api/health');
      document.getElementById('svcStatus').innerHTML =
        `<span style="color:#00d68f;">✓ ${data.status}</span>`;
      document.getElementById('geminiStatus').innerHTML = data.env.hasGeminiKey
        ? '<span style="color:#00d68f;">✓ 설정됨</span>'
        : '<span style="color:#ff3d71;">✗ 미설정</span>';
      document.getElementById('nodeVer').textContent = data.env.node || '-';

      document.getElementById('envInfo').innerHTML = `
        <div>서비스: ${escapeHtml(data.service)} v${escapeHtml(data.version)}</div>
        <div>타임스탬프: ${escapeHtml(data.timestamp)}</div>
        <div>Node: ${escapeHtml(data.env.node)}</div>
        <div>GEMINI_API_KEY: ${data.env.hasGeminiKey ? '✓' : '✗'}</div>
        <div>ADMIN_DASH_PASS: ${data.env.hasAdminPass ? '✓' : '✗'}</div>
        <div>GEO_AIO_URL: ${data.env.hasGeoAioUrl ? '✓' : '✗'}</div>
      `;
    } catch (e) {
      document.getElementById('svcStatus').innerHTML = '<span style="color:#ff3d71;">✗ 오류</span>';
      console.error('[admin] health 실패', e);
    }
  }

  function loadStats() {
    const history = History.list();
    document.getElementById('totalLocal').textContent = history.length;

    if (!history.length) {
      ['gradeDistribution', 'adminKpiAvg', 'industryDist'].forEach(id => {
        document.getElementById(id).innerHTML =
          '<div style="color:var(--text-tertiary);text-align:center;padding:32px;">데이터 없음</div>';
      });
      return;
    }

    const gradeCount = { dominant: 0, strong: 0, growing: 0, weak: 0, critical: 0 };
    const industryCount = {};
    const kpiSum = {};

    history.forEach(h => {
      const grade = h.grade?.key || window.getGrade(h.totalScore).key;
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;

      const ind = h.industry || '미분류';
      industryCount[ind] = (industryCount[ind] || 0) + 1;

      Object.entries(h.scores || {}).forEach(([id, s]) => {
        if (!kpiSum[id]) kpiSum[id] = { sum: 0, count: 0 };
        kpiSum[id].sum += s.value || 0;
        kpiSum[id].count += 1;
      });
    });

    document.getElementById('gradeDistribution').innerHTML = Object.entries(gradeCount).map(([k, v]) => {
      const grade = window.GRADE_CONFIG.find(g => g.key === k);
      const pct = history.length ? (v / history.length) * 100 : 0;
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.9rem;">
            <span>${grade?.emoji || ''} ${grade?.label || k}</span>
            <span style="font-family:monospace;font-weight:700;">${v}건 (${pct.toFixed(0)}%)</span>
          </div>
          <div style="height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:var(--color-accent);"></div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('adminKpiAvg').innerHTML = window.KPI_DEFINITIONS.map(kpi => {
      const data = kpiSum[kpi.id];
      const avg = data ? Math.round(data.sum / data.count) : 0;
      return `
        <div style="margin-bottom:8px;display:flex;justify-content:space-between;font-size:0.85rem;">
          <span>${kpi.icon} ${kpi.name}</span>
          <span style="font-family:monospace;font-weight:700;color:${avg >= 70 ? '#00d68f' : avg >= 40 ? '#ffa800' : '#ff3d71'};">
            ${avg}
          </span>
        </div>
      `;
    }).join('');

    const sortedIndustries = Object.entries(industryCount).sort((a, b) => b[1] - a[1]);
    document.getElementById('industryDist').innerHTML = sortedIndustries.map(([ind, count]) => `
      <div style="margin-bottom:8px;display:flex;justify-content:space-between;font-size:0.9rem;">
        <span>${escapeHtml(ind)}</span>
        <span style="font-family:monospace;font-weight:700;">${count}건</span>
      </div>
    `).join('');
  }

  function getModeBadge(h) {
    const t = h.target || h.target_type;
    const m = h.mode;
    if (m === 'content')  return { label: '📄 글',      color: '#ff8800' };
    if (t === 'article')  return { label: '📄 글',      color: '#ff8800' };
    if (t === 'blog')     return { label: '📝 블로그',  color: '#a855f7' };
    if (t === 'homepage') return { label: '🏠 홈페이지', color: '#0095ff' };
    if (m === 'url' || m === 'site') return { label: '🏠 홈페이지', color: '#0095ff' };
    return { label: escapeHtml(m || '-'), color: '#888' };
  }

  function loadDiagnoses(filter = '') {
    const history = History.list();
    const filtered = filter
      ? history.filter(h => (h.companyName || '').toLowerCase().includes(filter.toLowerCase()))
      : history;

    const tbody = document.getElementById('diagTableBody');
    tbody.innerHTML = filtered.length ? filtered.map(h => {
      const gradeKey = h.grade?.key || window.getGrade(h.totalScore).key;
      const mode = getModeBadge(h);
      return `
        <tr>
          <td>
            <a href="#" data-id="${escapeHtml(h.id)}" data-action="view"
               style="color:#0095ff;text-decoration:none;font-weight:700;cursor:pointer;"
               onmouseover="this.style.textDecoration='underline'"
               onmouseout="this.style.textDecoration='none'">${escapeHtml(h.companyName)}</a>
          </td>
          <td>${escapeHtml(h.industry || '미분류')}</td>
          <td><span style="font-size:0.74rem;padding:3px 8px;background:${mode.color}1A;color:${mode.color};border:1px solid ${mode.color}40;border-radius:999px;font-weight:700;white-space:nowrap;">${mode.label}</span></td>
          <td><span style="font-family:monospace;font-weight:700;">${h.totalScore}/100</span></td>
          <td><span class="score-grade ${gradeKey}" style="font-size:0.75rem;padding:2px 10px;">${escapeHtml(h.grade?.label || '')}</span></td>
          <td style="font-size:0.85rem;color:var(--text-tertiary);">${formatDate(h.savedAt)}</td>
          <td>
            <button class="btn btn-ghost" data-id="${escapeHtml(h.id)}" data-action="view" style="padding:6px 12px;font-size:0.8rem;">보기</button>
            <button class="btn btn-ghost" data-id="${escapeHtml(h.id)}" data-action="del" style="padding:6px 12px;font-size:0.8rem;">삭제</button>
          </td>
        </tr>
      `;
    }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:32px;">데이터 없음</td></tr>`;

    tbody.addEventListener('click', e => {
      const trigger = e.target.closest('[data-action]');
      if (!trigger) return;
      e.preventDefault();
      const id = trigger.dataset.id;
      if (trigger.dataset.action === 'view') {
        location.href = `/results.html?id=${id}&view=1`;
      } else if (trigger.dataset.action === 'del') {
        if (confirm('삭제하시겠습니까?')) {
          History.remove(id);
          loadDiagnoses(filter);
          loadStats();
        }
      }
    }, { once: true });
  }

  function loadActivity() {
    const history = History.list();
    const log = history.slice(0, 30).map(h =>
      `[${formatDate(h.savedAt)}] 진단: ${h.companyName} (${h.totalScore}점, ${h.grade?.label || ''})`
    ).join('\n');
    document.getElementById('activityLog').textContent = log || '활동 내역 없음';
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

  function exportData() {
    const data = History.list();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-score-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('데이터를 내보냈습니다', 'success');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (checkSession()) {
      showAdminUI();
    }

    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('adminPass').addEventListener('keypress', e => {
      if (e.key === 'Enter') login();
    });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    setupTabs();

    document.getElementById('searchBox')?.addEventListener('input', e => {
      loadDiagnoses(e.target.value);
    });

    document.getElementById('exportData')?.addEventListener('click', exportData);

    document.getElementById('clearAll')?.addEventListener('click', () => {
      if (confirm('정말 모든 진단 데이터를 삭제하시겠습니까? 되돌릴 수 없습니다.')) {
        History.clear();
        loadDiagnoses();
        loadStats();
        loadActivity();
        toast('모든 데이터가 삭제되었습니다', 'info');
      }
    });
  });
})();
