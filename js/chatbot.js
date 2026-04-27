/**
 * GEO Score AI - 챗봇 UI 로직
 */

(function() {
  const messages = [];
  let diagnosisContext = null;
  let isLoading = false;

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMessage(role, content) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    // 줄바꿈 보존 + 마크다운 강조 일부
    const html = escapeHtml(content)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function showTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg assistant';
    div.id = 'typingIndicator';
    div.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  async function sendMessage(text) {
    if (!text || isLoading) return;
    isLoading = true;

    const sendBtn = document.getElementById('chatSend');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loader"></span>';

    renderMessage('user', text);
    messages.push({ role: 'user', content: text });
    document.getElementById('chatInput').value = '';

    showTyping();

    try {
      const res = await api.post('/api/chat', {
        message: text,
        history: messages.slice(-6),
        diagnosisContext
      });
      hideTyping();
      renderMessage('assistant', res.reply || '응답을 받지 못했습니다.');
      messages.push({ role: 'assistant', content: res.reply });
    } catch (e) {
      hideTyping();
      renderMessage('assistant',
        `오류가 발생했습니다: ${e.message}\n\n잠시 후 다시 시도해주세요. 긴급하시면 jaiwshim@gmail.com 으로 연락 부탁드립니다.`);
      console.error('[chatbot]', e);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      sendBtn.innerHTML = '✈️ 전송';
    }
  }

  function loadLatestDiagnosis() {
    const history = History.list();
    if (!history.length) {
      toast('진단 이력이 없습니다. 먼저 진단을 진행해주세요.', 'warning');
      return;
    }
    const latest = history[0];
    diagnosisContext = {
      companyName: latest.companyName,
      industry: latest.industry,
      totalScore: latest.totalScore,
      grade: latest.grade,
      summary: latest.summary,
      weakKpis: Object.entries(latest.scores || {})
        .map(([id, s]) => ({ id, value: s.value || 0 }))
        .sort((a, b) => a.value - b.value)
        .slice(0, 3)
        .map(x => x.id)
    };
    document.getElementById('diagContext').innerHTML = `
      <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;">
        <div style="font-weight:700;margin-bottom:4px;">${escapeHtml(latest.companyName)}</div>
        <div style="font-size:0.85rem;color:var(--text-tertiary);margin-bottom:8px;">
          ${escapeHtml(latest.industry || '미분류')} · ${latest.totalScore}점 · ${escapeHtml(latest.grade?.label || '')}
        </div>
        <div style="font-size:0.8rem;color:var(--color-accent);">✓ 컨텍스트 적용됨</div>
      </div>
    `;
    toast('최근 진단 결과를 컨텍스트로 적용했습니다', 'success');

    // 자동 메시지
    if (messages.length === 0) {
      const autoMsg = `[자동] 방금 ${latest.companyName} 진단을 완료했습니다 (${latest.totalScore}점). 이 결과를 바탕으로 가장 시급한 액션 1가지만 알려주세요.`;
      sendMessage(autoMsg);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');

    sendBtn.addEventListener('click', () => sendMessage(input.value.trim()));

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value.trim());
      }
    });

    document.querySelectorAll('.suggested-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.q;
        input.value = q;
        sendMessage(q);
      });
    });

    document.getElementById('loadLatest').addEventListener('click', loadLatestDiagnosis);

    document.getElementById('clearChat').addEventListener('click', () => {
      if (confirm('대화를 초기화하시겠습니까?')) {
        messages.length = 0;
        document.getElementById('chatMessages').innerHTML = `
          <div class="msg assistant">
            대화가 초기화되었습니다. 새로운 질문을 해주세요!
          </div>
        `;
      }
    });

    // URL ?diag=1 이면 자동 로드
    if (new URLSearchParams(location.search).get('diag') === '1') {
      setTimeout(loadLatestDiagnosis, 500);
    }
  });
})();
