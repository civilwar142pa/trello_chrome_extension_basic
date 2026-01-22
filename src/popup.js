document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveBtn = document.getElementById('saveKeyBtn');
  const status = document.getElementById('status');

  // Load existing key
  chrome.storage.local.get(['trello_api_key'], (result) => {
    if (result.trello_api_key) {
      apiKeyInput.value = result.trello_api_key;
    }
  });

  // Save key
  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    chrome.runtime.sendMessage({ action: 'save-api-key', key }, (response) => {
      if (response && response.success) {
        status.textContent = 'API Key Saved!';
        setTimeout(() => status.textContent = '', 2000);
      }
    });
  });
});