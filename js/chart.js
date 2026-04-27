/**
 * GEO Score AI - SVG 차트 라이브러리 (의존성 없음)
 * 레이더 차트, 게이지, 바 차트 자체 구현
 */

window.Chart = {
  /**
   * 레이더 차트 생성
   * @param {string} containerId - 컨테이너 ID
   * @param {Array} data - [{label, value (0-100)}, ...]
   * @param {Object} options
   */
  radar(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = options.size || 500;
    const cx = size / 2;
    const cy = size / 2;
    const radius = options.radius || size * 0.32;
    const levels = options.levels || 5;
    const total = data.length;
    // 라벨이 차트 주변에 직접 들어가도록 viewBox 충분히 확장
    const padX = 110, padY = 40;
    const vbW = size + padX * 2;
    const vbH = size + padY * 2;

    const angleSlice = (Math.PI * 2) / total;
    const colorOf = v => v >= 70 ? '#00d68f' : v >= 40 ? '#ffa800' : '#ff3d71';

    let svg = `<svg viewBox="${-padX} ${-padY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">`;

    svg += `
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#ff4500" stop-opacity="0.2"/>
        </radialGradient>
        <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffa800"/>
          <stop offset="100%" stop-color="#ff6b35"/>
        </linearGradient>
      </defs>
    `;

    // 배경 그리드
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      const points = [];
      for (let i = 0; i < total; i++) {
        const angle = angleSlice * i - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      svg += `<polygon points="${points.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
      if (lvl % 2 === 0) {
        svg += `<text x="${cx + 4}" y="${cy - r}" fill="rgba(255,255,255,0.3)" font-size="10" font-family="monospace">${lvl * 20}</text>`;
      }
    }

    // 축
    for (let i = 0; i < total; i++) {
      const angle = angleSlice * i - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    }

    // 데이터 다각형
    const dataPoints = [];
    const dotPoints = [];
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (d.value / 100) * radius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      dataPoints.push(`${x},${y}`);
      dotPoints.push({ x, y, value: d.value, label: d.label });
    });

    svg += `<polygon points="${dataPoints.join(' ')}"
              fill="url(#radarGrad)"
              stroke="url(#radarStroke)"
              stroke-width="2.5"
              opacity="0.85"
              style="filter: drop-shadow(0 0 8px rgba(255,107,53,0.4))"/>`;

    // 데이터 포인트
    dotPoints.forEach((p) => {
      svg += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${colorOf(p.value)}" stroke="white" stroke-width="2"/>`;
    });

    // 축 라벨 (KPI 명 + 점수) — 차트 주변에 직접 표시
    data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelR = radius + 26;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);
      const cosA = Math.cos(angle);
      const anchor = Math.abs(cosA) < 0.15 ? 'middle' : cosA > 0 ? 'start' : 'end';
      const c = colorOf(d.value);

      // KPI 이름
      svg += `<text x="${x}" y="${y}"
                text-anchor="${anchor}"
                dominant-baseline="middle"
                fill="rgba(255,255,255,0.92)"
                font-size="13"
                font-weight="700">${d.label}</text>`;
      // 점수 (라벨 아래)
      svg += `<text x="${x}" y="${y + 17}"
                text-anchor="${anchor}"
                dominant-baseline="middle"
                fill="${c}"
                font-size="13"
                font-weight="900"
                font-family="monospace">${d.value}</text>`;
    });

    svg += '</svg>';
    container.innerHTML = svg;
  },

  /**
   * 점수 게이지 (도넛 형태)
   */
  gauge(containerId, score, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = options.size || 280;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;

    container.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;transform:rotate(-90deg);">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff6b35"/>
            <stop offset="50%" stop-color="#ffa800"/>
            <stop offset="100%" stop-color="#00d68f"/>
          </linearGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${r}"
                fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="16"/>
        <circle cx="${cx}" cy="${cy}" r="${r}"
                fill="none" stroke="url(#gaugeGrad)" stroke-width="16"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="transition: stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1);"/>
      </svg>
    `;
  },

  /**
   * 바 차트 (가로형)
   */
  bar(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const max = options.max || 100;
    container.innerHTML = data.map(d => {
      const pct = Math.min(100, (d.value / max) * 100);
      const color = d.value >= 70 ? '#00d68f' : d.value >= 40 ? '#ffa800' : '#ff3d71';
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:6px;">
            <span style="color:var(--text-secondary);">${d.label}</span>
            <span style="color:${color};font-weight:700;font-family:monospace;">${d.value}</span>
          </div>
          <div style="height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 1s ease-out;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * 비교 차트 (귀사 vs 경쟁사)
   */
  comparison(containerId, ourScore, competitors, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const all = [
      { label: '귀사', value: ourScore, isUs: true },
      ...competitors
    ];
    const max = Math.max(100, ...all.map(d => d.value));

    container.innerHTML = all.map(d => {
      const pct = (d.value / max) * 100;
      const grade = window.getGrade(d.value);
      const color = d.isUs ? '#ff6b35' : '#0095ff';
      return `
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;font-size:0.95rem;margin-bottom:8px;">
            <span style="color:${d.isUs ? '#ff6b35' : 'var(--text-secondary)'};font-weight:${d.isUs ? '700' : '500'};">
              ${d.isUs ? '🏢 ' : ''}${d.label}
            </span>
            <span style="font-family:monospace;font-weight:700;color:${color};">
              ${d.value}/100 · ${grade.label}
            </span>
          </div>
          <div style="height:12px;background:var(--bg-tertiary);border-radius:6px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg, ${color}, ${color}88);border-radius:6px;transition:width 1.2s cubic-bezier(0.4,0,0.2,1);"></div>
          </div>
        </div>
      `;
    }).join('');
  }
};
