(function() {
  'use strict';

  const MYPWD_CLASS = 'mypwd-injected';
  let currentCredentials = [];
  let dropdown = null;

  // Detect password fields
  function findLoginForms() {
    const passwordFields = document.querySelectorAll('input[type="password"]:not(.mypwd-processed)');
    passwordFields.forEach(field => {
      field.classList.add('mypwd-processed');
      injectButton(field);
    });
  }

  // Inject MyPwd button next to password field
  function injectButton(passwordField) {
    // Find the associated username field (previous input of type text/email)
    const form = passwordField.closest('form') || passwordField.parentElement;
    const usernameField = form ?
      form.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[name*="login"], input[id*="user"], input[id*="email"]') :
      null;

    // Create the MyPwd button
    const btn = document.createElement('div');
    btn.className = 'mypwd-autofill-btn';
    btn.innerHTML = '\uD83D\uDD10';
    btn.title = 'MyPwd Auto-Fill';

    // Position the button inside the password field
    const wrapper = passwordField.parentElement;
    if (wrapper) {
      wrapper.style.position = wrapper.style.position || 'relative';
      btn.style.position = 'absolute';
      btn.style.right = '8px';
      btn.style.top = '50%';
      btn.style.transform = 'translateY(-50%)';
      btn.style.zIndex = '10000';
      wrapper.appendChild(btn);
    }

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Request credentials for current URL
      chrome.runtime.sendMessage(
        { type: 'SEARCH_CREDENTIALS', url: window.location.href },
        (response) => {
          if (response && response.credentials && response.credentials.length > 0) {
            showDropdown(btn, response.credentials, usernameField, passwordField);
          } else if (response && response.status === 'locked') {
            showNotification('MyPwd is locked. Please unlock the app first.');
          } else if (response && response.credentials && response.credentials.length === 0) {
            showNotification('No saved credentials for this site.');
          } else {
            showNotification('Cannot connect to MyPwd. Is the app running?');
          }
        }
      );
    });
  }

  // Show credential dropdown
  function showDropdown(anchor, credentials, usernameField, passwordField) {
    removeDropdown();

    dropdown = document.createElement('div');
    dropdown.className = 'mypwd-dropdown';

    const header = document.createElement('div');
    header.className = 'mypwd-dropdown-header';
    header.textContent = '\uD83D\uDD10 MyPwd';
    dropdown.appendChild(header);

    credentials.forEach(cred => {
      const item = document.createElement('div');
      item.className = 'mypwd-dropdown-item';

      const title = document.createElement('div');
      title.className = 'mypwd-dropdown-title';
      title.textContent = cred.title;

      const username = document.createElement('div');
      username.className = 'mypwd-dropdown-username';
      username.textContent = cred.username;

      item.appendChild(title);
      item.appendChild(username);

      // Action buttons row
      const actions = document.createElement('div');
      actions.className = 'mypwd-dropdown-actions';

      const fillBtn = document.createElement('button');
      fillBtn.className = 'mypwd-action-btn mypwd-action-fill';
      fillBtn.textContent = '자동입력';
      fillBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage(
          { type: 'GET_CREDENTIAL', id: cred.id },
          (response) => {
            if (response && response.username && response.password) {
              if (usernameField) setNativeValue(usernameField, response.username);
              setNativeValue(passwordField, response.password);
              removeDropdown();
              showNotification('자동 입력 완료!');
            }
          }
        );
      });

      const copyBtn = document.createElement('button');
      copyBtn.className = 'mypwd-action-btn mypwd-action-copy';
      copyBtn.textContent = '📋 복사';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage(
          { type: 'GET_CREDENTIAL', id: cred.id },
          (response) => {
            if (response && response.username && response.password) {
              navigator.clipboard.writeText(response.username).then(() => {
                showNotification('아이디 복사됨! 붙여넣기 후 다시 클릭하면 비밀번호 복사');
                // Change button to copy password
                copyBtn.textContent = '🔑 비밀번호 복사';
                copyBtn.onclick = (e2) => {
                  e2.stopPropagation();
                  navigator.clipboard.writeText(response.password).then(() => {
                    removeDropdown();
                    showNotification('비밀번호 복사됨! Ctrl+V로 붙여넣기');
                  });
                };
              });
            }
          }
        );
      });

      actions.appendChild(fillBtn);
      actions.appendChild(copyBtn);
      item.appendChild(actions);

      dropdown.appendChild(item);
    });

    // Position dropdown below the anchor
    const rect = anchor.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.zIndex = '2147483647';

    document.body.appendChild(dropdown);

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);
  }

  function handleOutsideClick(e) {
    if (dropdown && !dropdown.contains(e.target)) {
      removeDropdown();
    }
  }

  function removeDropdown() {
    if (dropdown) {
      dropdown.remove();
      dropdown = null;
      document.removeEventListener('click', handleOutsideClick);
    }
  }

  // Fill input using trusted browser commands (isTrusted: true)
  function setNativeValue(element, value) {
    element.focus();
    element.click();

    // Select all existing content and delete it
    element.select();
    document.execCommand('delete', false);

    // insertText creates trusted input events through the browser's editing pipeline
    // This bypasses isTrusted checks on sites like MailNara
    const success = document.execCommand('insertText', false, value);

    if (!success) {
      // Fallback: clipboard paste approach (also creates trusted events)
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', value);
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: clipboardData,
      });
      const wasPrevented = !element.dispatchEvent(pasteEvent);
      if (!wasPrevented) {
        // If paste event wasn't handled by the site, set value directly
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  // Show temporary notification
  function showNotification(message) {
    const existing = document.querySelector('.mypwd-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'mypwd-notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.classList.add('mypwd-notification-hide');
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  // Run on page load and observe DOM changes
  findLoginForms();

  const observer = new MutationObserver(() => {
    findLoginForms();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Listen for fill commands from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FILL_CREDENTIALS') {
      const passwordField = document.querySelector('input[type="password"]');
      if (passwordField) {
        const form = passwordField.closest('form') || passwordField.parentElement;
        const usernameField = form ?
          form.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[name*="login"], input[id*="user"], input[id*="email"]') :
          null;

        if (usernameField) {
          setNativeValue(usernameField, message.username);
        }
        setNativeValue(passwordField, message.password);
        showNotification('Credentials filled!');
      }
      sendResponse({ success: true });
    }
  });
})();
