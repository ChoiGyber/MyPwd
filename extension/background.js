const API_BASE = 'http://127.0.0.1:27183';

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_STATUS') {
    fetch(`${API_BASE}/status`)
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(() => sendResponse({ status: 'disconnected' }));
    return true; // async response
  }

  if (message.type === 'SEARCH_CREDENTIALS') {
    fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: message.url })
    })
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(() => sendResponse({ credentials: [] }));
    return true;
  }

  if (message.type === 'GET_CREDENTIAL') {
    fetch(`${API_BASE}/autofill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: message.id })
    })
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(() => sendResponse({ error: 'Failed to get credential' }));
    return true;
  }
});
