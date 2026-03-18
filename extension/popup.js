const API_BASE = 'http://127.0.0.1:27183';

async function checkStatus() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  try {
    const response = await fetch(`${API_BASE}/status`);
    const data = await response.json();

    if (data.status === 'unlocked') {
      dot.className = 'status-dot connected';
      text.textContent = 'Connected - Unlocked';
      return true;
    } else {
      dot.className = 'status-dot locked';
      text.textContent = 'Connected - Locked (unlock app first)';
      return false;
    }
  } catch {
    dot.className = 'status-dot disconnected';
    text.textContent = 'Disconnected - Start MyPwd app';
    return false;
  }
}

async function loadCredentials() {
  const list = document.getElementById('credentials-list');

  try {
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      list.innerHTML = '<div class="empty-state"><div class="icon">&#x1F310;</div><div>No active tab</div></div>';
      return;
    }

    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: tab.url })
    });
    const data = await response.json();

    if (data.credentials && data.credentials.length > 0) {
      list.innerHTML = '';
      data.credentials.forEach(cred => {
        const item = document.createElement('div');
        item.className = 'credential-item';
        item.innerHTML = `
          <div class="credential-title">${escapeHtml(cred.title)}</div>
          <div class="credential-username">${escapeHtml(cred.username)}</div>
        `;
        item.addEventListener('click', () => fillCredential(cred.id, tab.id));
        list.appendChild(item);
      });
    } else {
      list.innerHTML = '<div class="empty-state"><div class="icon">&#x1F50D;</div><div>No saved credentials for this site</div></div>';
    }
  } catch {
    list.innerHTML = '<div class="empty-state"><div class="icon">&#x26A0;&#xFE0F;</div><div>Cannot connect to MyPwd</div></div>';
  }
}

async function fillCredential(id, tabId) {
  try {
    const response = await fetch(`${API_BASE}/autofill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await response.json();

    if (data.username && data.password) {
      // Send to content script to fill
      chrome.tabs.sendMessage(tabId, {
        type: 'FILL_CREDENTIALS',
        username: data.username,
        password: data.password
      });
      window.close();
    }
  } catch (err) {
    console.error('Failed to fill:', err);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
(async () => {
  const isUnlocked = await checkStatus();
  if (isUnlocked) {
    await loadCredentials();
  } else {
    document.getElementById('credentials-list').innerHTML =
      '<div class="empty-state"><div class="icon">&#x1F512;</div><div>Unlock MyPwd to see credentials</div></div>';
  }
})();
