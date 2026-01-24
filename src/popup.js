document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup: Minimal script loaded and DOMContentLoaded fired!');

  const apiKeySection = document.getElementById('apiKeySection');
  const trelloBoardsContainer = document.getElementById('trelloBoardsContainer');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const statusElement = document.getElementById('status');
  const boardsList = document.getElementById('boardsList');

  // Function to display status messages
  const setStatus = (message, isError = false) => {
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.color = isError ? 'red' : 'green';
    }
  };

  // Helper to show/hide sections
  const showApiKeySection = () => {
    if (apiKeySection) apiKeySection.style.display = 'block';
    if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'none';
  };

  const showBoardsSection = () => {
    if (apiKeySection) apiKeySection.style.display = 'none';
    if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'block';
  };

  // Function to fetch and display Trello boards
  const fetchAndDisplayTrelloBoards = async () => {
    setStatus('Authenticating with Trello...', false);
    try {
      const authResponse = await chrome.runtime.sendMessage({ action: 'authenticate' });
      if (!authResponse || !authResponse.success) {
        setStatus(`Authentication failed: ${authResponse.error || 'Unknown error'}`, true);
        showApiKeySection(); // Show API key input if auth fails
        return;
      }
      const token = authResponse.token;
      setStatus('Fetching Trello boards...', false);
      const boardsResponse = await chrome.runtime.sendMessage({ action: 'get-boards', token: token });

      if (boardsResponse && boardsResponse.success && boardsResponse.data) {
        showBoardsSection();
        if (boardsList) {
          boardsList.innerHTML = ''; // Clear previous list
          boardsResponse.data.forEach(board => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = board.url;
            link.textContent = board.name;
            link.target = '_blank'; // Open in new tab
            listItem.appendChild(link);
            boardsList.appendChild(listItem);
          });
          setStatus(`Loaded ${boardsResponse.data.length} Trello boards.`, false);
        }
      } else {
        setStatus(`Error fetching boards: ${boardsResponse.error || 'Unknown error'}`, true);
        showApiKeySection(); // Show API key input if fetching boards fails
      }
    } catch (error) {
      setStatus(`Communication error during board fetch: ${error.message}`, true);
      console.error('Popup: Error during board fetch:', error);
      showApiKeySection(); // Show API key input on communication error
    }
  };

  // Initial load logic
  chrome.storage.local.get(['trello_api_key'], async (result) => {
    if (!apiKeyInput || !saveKeyBtn || !statusElement || !trelloBoardsContainer || !boardsList || !apiKeySection) {
      console.error('Popup: One or more required DOM elements not found!');
      // Attempt to show API key section as a fallback if critical elements are missing
      if (apiKeySection) apiKeySection.style.display = 'block';
      return;
    }

    if (result.trello_api_key) {
      apiKeyInput.value = result.trello_api_key;
      setStatus('API Key found. Attempting to load boards...', false);
      await fetchAndDisplayTrelloBoards();
    } else {
      showApiKeySection();
      setStatus('Please enter your Trello API Key.', false);
    }
  });

  // Event listener for the Save button
  if (saveKeyBtn && apiKeyInput) {
    saveKeyBtn.addEventListener('click', async () => {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        setStatus('API Key cannot be empty!', true);
        return;
      }

      setStatus('Saving API Key and authenticating...', false);
      console.log('Popup: Sending save-api-key message to background.');

      try {
        const response = await chrome.runtime.sendMessage({ action: 'save-api-key', key: apiKey });
        if (response && response.success) {
          console.log('Popup: API Key saved successfully. Now fetching boards.');
          await fetchAndDisplayTrelloBoards(); // After saving, try to authenticate and display boards
        } else {
          setStatus(`Error saving API Key: ${response.error || 'Unknown error'}`, true);
          console.error('Popup: Error saving API Key:', response.error);
        }
      } catch (error) {
        setStatus(`Communication error: ${error.message}`, true);
        console.error('Popup: Error sending message to background:', error);
      }
    });
  }
});