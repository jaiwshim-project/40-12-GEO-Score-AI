/**
 * GEO Score AI - 공통 유틸리티
 */

// ============== Session Management ==============
const SESSION_KEY = 'geo_score_session';
const HISTORY_KEY = 'geo_score_history';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

window.Session = {
  login(data) {
    const session = {
      ...data,
      ts: Date.now(),
      ttl: SESSION_TTL
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('[Session] localStorage unavailable, using memory store');
      window._sessionMemory = session;
    }
    return session;
  },

  get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (Date.now() - session.ts < session.ttl) return session;
        this.logout();
      }
    } catch (e) {}
    return window._sessionMemory || null;
  },

  logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    window._sessionMemory = null;
  }
};

// ============== Diagnosis History ==============
window.History = {
  save(result) {
    try {
      const arr = this.list();
      arr.unshift({
        ...result,
        savedAt: Date.now()
      });
      const trimmed = arr.slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[History] save failed', e);
    }
  },

  list() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  get(id) {
    return this.list().find(h => h.id === id);
  },

  remove(id) {
    try {
      const arr = this.list().filter(h => h.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
    } catch (e) {}
  },

  clear() {
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
  }
};

// ============== Usage Limits (요금제 연동) ==============
// 요금제별 월간 한도. Session.tier로 결정 (없으면 free).
const USAGE_KEY = 'geo_usage';
const USAGE_LIMITS = {
  free: { derive: 1,  bulkUpgrade: 0,   citationTest: 1 },
  pro:  { derive: 10, bulkUpgrade: 30,  citationTest: 20 },
  max:  { derive: 50, bulkUpgrade: 300, citationTest: 200 }
};
const USAGE_LABELS = {
  derive: '30개 파생 생성',
  bulkUpgrade: '30개 일괄 90점 변환',
  citationTest: 'AI 인용성 검증'
};

window.Usage = {
  // 현재 사용량 조회 (월별 자동 리셋)
  current() {
    try {
      const raw = localStorage.getItem(USAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const month = new Date().toISOString().slice(0, 7); // YYYY-MM
      if (data.month !== month) {
        // 월이 바뀌면 자동 리셋
        return { month, derive: 0, bulkUpgrade: 0, citationTest: 0 };
      }
      return data;
    } catch (e) {
      return { month: new Date().toISOString().slice(0, 7), derive: 0, bulkUpgrade: 0, citationTest: 0 };
    }
  },

  // 현재 tier (Session에서, 없으면 free)
  tier() {
    const s = (window.Session && Session.get()) || {};
    return (s.tier || 'free').toLowerCase();
  },

  // 한도 정보
  limit(action) {
    const t = this.tier();
    return (USAGE_LIMITS[t] || USAGE_LIMITS.free)[action] || 0;
  },

  // 한도 검사 — 사용 가능하면 true, 한도 초과면 false
  check(action) {
    const used = this.current()[action] || 0;
    const limit = this.limit(action);
    return used < limit;
  },

  // 1회 사용 기록
  consume(action) {
    if (!this.check(action)) return false;
    try {
      const data = this.current();
      data[action] = (data[action] || 0) + 1;
      localStorage.setItem(USAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    return true;
  },

  // 사용자에게 보여줄 한도 메시지
  message(action) {
    const used = this.current()[action] || 0;
    const limit = this.limit(action);
    const tier = this.tier();
    const label = USAGE_LABELS[action] || action;
    const remaining = Math.max(0, limit - used);
    if (limit === 0) {
      return `${label}: ${tier.toUpperCase()} 요금제는 이용 불가 — Pro/Max 업그레이드 필요`;
    }
    return `${label}: ${used} / ${limit}회 사용 (이번 달 남은 횟수 ${remaining}회, ${tier.toUpperCase()} 요금제)`;
  },

  // UI에 표시할 한도 패널 HTML
  panelHtml(action) {
    const used = this.current()[action] || 0;
    const limit = this.limit(action);
    const tier = this.tier();
    const label = USAGE_LABELS[action] || action;
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const exceeded = used >= limit;
    const color = exceeded ? '#ef4444' : (used / Math.max(limit, 1) >= 0.8 ? '#ffa800' : '#00d68f');
    return `
      <div style="padding: 12px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: 10px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; margin-bottom: 6px;">
          <span><strong>${label}</strong> · ${tier.toUpperCase()} 요금제</span>
          <span style="color: ${color}; font-weight: 700; font-family: monospace;">${used} / ${limit}회</span>
        </div>
        <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; width: ${pct}%; background: ${color}; transition: width 0.3s;"></div>
        </div>
        ${exceeded ? `<div style="margin-top: 8px; font-size: 0.78rem; color: #ef4444;">⚠️ 이번 달 한도 초과 — <a href="#" style="color: #0095ff;">Pro/Max 업그레이드</a></div>` : ''}
      </div>`;
  }
};

// ============== Toast Notification ==============
window.toast = function(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; top: 24px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; gap: 12px;
      max-width: 360px;
    `;
    document.body.appendChild(container);
  }

  const colors = {
    success: '#00d68f',
    error: '#ff3d71',
    warning: '#ffa800',
    info: '#0095ff'
  };

  const toastEl = document.createElement('div');
  toastEl.style.cssText = `
    padding: 16px 20px;
    background: rgba(30, 41, 64, 0.95);
    border-left: 4px solid ${colors[type] || colors.info};
    border-radius: 12px;
    color: white;
    font-size: 0.95rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    animation: toastSlide 0.3s ease-out;
    cursor: pointer;
  `;
  toastEl.textContent = message;
  toastEl.onclick = () => toastEl.remove();

  if (!document.getElementById('toast-anim-style')) {
    const style = document.createElement('style');
    style.id = 'toast-anim-style';
    style.textContent = `
      @keyframes toastSlide {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toastEl);
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(100%)';
    toastEl.style.transition = 'all 0.3s';
    setTimeout(() => toastEl.remove(), 300);
  }, duration);
};

// ============== URL Validation ==============
window.normalizeUrl = function(url) {
  if (!url) return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  try {
    const u = new URL(url);
    return u.href;
  } catch (e) {
    return null;
  }
};

window.extractDomain = function(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return url;
  }
};

// ============== ID Generator ==============
window.genId = function() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

// ============== Format Helpers ==============
window.formatDate = function(ts) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
};

window.formatRelative = function(ts) {
  const diff = Date.now() - ts;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return '방금 전';
  if (diff < hour) return Math.floor(diff / min) + '분 전';
  if (diff < day) return Math.floor(diff / hour) + '시간 전';
  if (diff < 7 * day) return Math.floor(diff / day) + '일 전';
  return formatDate(ts);
};

// ============== API Client ==============
window.api = {
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(data)
    });
    const text = await res.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (e) {
      throw new Error('서버 응답이 올바른 JSON이 아닙니다: ' + text.slice(0, 200));
    }
    if (!res.ok || payload.error) {
      throw new Error(payload.error || `HTTP ${res.status}`);
    }
    return payload;
  },

  async get(url) {
    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
};

// ============== Auth Gating ==============
window.AUTH_WHITELIST = ['/', '/index.html', '/manual.html', '/architecture.html'];

window.requireAuth = function(redirect = '/') {
  const session = Session.get();
  if (!session) {
    location.href = redirect;
    return false;
  }
  return true;
};

// ============== Smooth Scroll Anchor ==============
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href === '#') return;
  const target = document.querySelector(href);
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

console.log('[GEO Score AI] common.js loaded · v1.0');
