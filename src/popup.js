document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup: Minimal script loaded and DOMContentLoaded fired!');

  const mainContainer = document.getElementById('mainContainer');
  const apiKeySection = document.getElementById('apiKeySection');
  const trelloBoardsContainer = document.getElementById('trelloBoardsContainer');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const trelloListsContainer = document.getElementById('trelloListsContainer');
  const selectedBoardTitle = document.getElementById('selectedBoardTitle');
  const listsGrid = document.getElementById('listsGrid');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const statusElement = document.getElementById('status');
  const boardsGrid = document.getElementById('boardsGrid');

  // New elements for card details
  const cardDetailContainer = document.getElementById('cardDetailContainer');
  const cardDetailTitle = document.getElementById('cardDetailTitle');
  const cardDetailDescription = document.getElementById('cardDetailDescription');
  const cardDetailDueDateInput = document.getElementById('cardDetailDueDateInput');
  const saveDueDateBtn = document.getElementById('saveDueDateBtn');
  const clearDueDateBtn = document.getElementById('clearDueDateBtn');

  const cardDetailChecklists = document.getElementById('cardDetailChecklists');
  const cardDetailComments = document.getElementById('cardDetailComments');
  const backToListsBtn = document.getElementById('backToListsBtn');
  const editDescriptionBtn = document.getElementById('editDescriptionBtn');
  const saveDescriptionBtn = document.getElementById('saveDescriptionBtn');
  const newCommentInput = document.getElementById('newCommentInput');
  const addCommentBtn = document.getElementById('addCommentBtn');
  const newChecklistNameInput = document.getElementById('newChecklistNameInput');
  const addChecklistBtn = document.getElementById('addChecklistBtn');

  // New elements for settings
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsBtnLists = document.getElementById('settingsBtnLists');
  const settingsContainer = document.getElementById('settingsContainer');
  const lightModeBtn = document.getElementById('lightModeBtn');
  const darkModeBtn = document.getElementById('darkModeBtn');
  const backFromSettingsBtn = document.getElementById('backFromSettingsBtn');

  let currentView = 'boards'; // To keep track of which view to return to from settings

  // Function to display status messages
  const setStatus = (message, isError = false) => {
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.style.color = isError ? 'red' : 'green';
      statusElement.classList.toggle('error', isError);
    }
  };

  // Helper to show/hide sections
  const showApiKeySection = () => {
    if (mainContainer) {
      mainContainer.style.backgroundImage = '';
      mainContainer.style.backgroundColor = '#0079bf'; // Default Trello blue
      mainContainer.classList.remove('light-text');
    }
    if (apiKeySection) apiKeySection.style.display = 'block';
    if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'none';
    if (trelloListsContainer) trelloListsContainer.style.display = 'none';
    if (cardDetailContainer) cardDetailContainer.style.display = 'none';
    console.log('Popup: settingsContainer element:', settingsContainer); // diag log 
    if (settingsContainer) settingsContainer.style.display = 'block';
  };

  const showBoardsSection = () => {
    if (mainContainer) {
      mainContainer.style.backgroundImage = '';
      mainContainer.style.backgroundColor = 'var(--main-bg-color('; // use css variable
      mainContainer.classList.remove('light-text');
    }
    if (apiKeySection) apiKeySection.style.display = 'none';
    if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'block';
    if (cardDetailContainer) cardDetailContainer.style.display = 'none';
    if (trelloListsContainer) trelloListsContainer.style.display = 'none';
    if (settingsContainer) settingsContainer.style.display = 'none'; // Explicitly hide settings
    currentView = 'boards';
  };

  const showListsSection = () => {
    // Background is set by fetchAndDisplayTrelloLists
    // No reset here, as it should retain the board's background
    if (apiKeySection) apiKeySection.style.display = 'none';
    if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'none';
    if (cardDetailContainer) cardDetailContainer.style.display = 'none';
    if (trelloListsContainer) trelloListsContainer.style.display = 'block';
    if (settingsContainer) settingsContainer.style.display = 'none'; //explicitly hide settings
    currentView = 'lists';
  };

  const showCardDetailSection = () => {
    if (apiKeySection) apiKeySection.style.display = 'none';
    if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'none';
    if (trelloListsContainer) trelloListsContainer.style.display = 'none';
    if (cardDetailContainer) cardDetailContainer.style.display = 'block';
    if (settingsContainer) settingsContainer.style.display = 'none';
    currentView = 'lists';
  };

 // Changed to function declaration for better hoisting behavior
function showSettingsSection() {
  console.log('Popup: showSettingsSection called!'); // Diagnostic log
  if (apiKeySection) apiKeySection.style.display = 'none';
  if (trelloBoardsContainer) trelloBoardsContainer.style.display = 'none';
  if (trelloListsContainer) trelloListsContainer.style.display = 'none';
  if (cardDetailContainer) cardDetailContainer.style.display = 'none';
  console.log('Popup: settingsContainer element:', settingsContainer); // Diagnostic log
  if (settingsContainer) settingsContainer.style.display = 'block';
  // No change to currentView here, as we want to return to the previous view
}

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
        setStatus(`Loaded ${boardsResponse.data.length} Trello boards.`, false);
        showBoardsSection();
        if (boardsGrid) {
          boardsGrid.innerHTML = ''; // Clear previous list
          boardsResponse.data.forEach(board => {
            const boardBlock = document.createElement('div');
            boardBlock.classList.add('board-block');
            boardBlock.textContent = board.name;

            boardBlock.dataset.boardPrefs = JSON.stringify(board.prefs);

            if (board.prefs) {
              if (board.prefs.backgroundImage) {
                boardBlock.style.backgroundImage = `url(${board.prefs.backgroundImage})`;
                if (board.prefs.backgroundTile) {
                  boardBlock.style.backgroundRepeat = 'repeat';
                  boardBlock.style.backgroundSize = 'auto';
                } else {
                  boardBlock.style.backgroundRepeat = 'no-repeat';
                  boardBlock.style.backgroundSize = 'cover';
                }
              } else if (board.prefs.backgroundColor) {
                boardBlock.style.backgroundColor = board.prefs.backgroundColor;
              }

              // Adjust text color based on background brightness
              if (board.prefs.backgroundBrightness === 'light') {
                boardBlock.classList.add('light-text');
              }
            }

            // Open board URL on click
            boardBlock.addEventListener('click', () => fetchAndDisplayTrelloLists(board.id, board.name, board.prefs));

            boardsGrid.appendChild(boardBlock);
          });
        } else {
          // Handle case where boardsGrid is null
          setStatus('Error: Boards grid element not found.', true);
          console.error('Popup: boardsGrid element not found.');
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

  // Function to handle adding a new card
  const handleCreateCard = async (listId, cardName) => {
    if (!cardName.trim()) {
      setStatus('Card name cannot be empty!', true);
      return;
    }
    setStatus('Creating card...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }
      const response = await chrome.runtime.sendMessage({ action: 'create-card', token: token, listId: listId, name: cardName });
      if (response && response.success) {
        setStatus('Card created successfully!', false);
        // Re-fetch lists to update the UI
        const currentBoardId = trelloListsContainer.dataset.boardId;
        const currentBoardName = trelloListsContainer.dataset.boardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}');
        if (currentBoardId && currentBoardName && currentBoardPrefs) {
          fetchAndDisplayTrelloLists(currentBoardId, currentBoardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error creating card: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error creating card:', error);
    }
  };

  // Function to handle deleting a card
  const handleDeleteCard = async (cardId, cardName) => {
    if (!confirm(`Are you sure you want to delete "${cardName}"?`)) {
      return;
    }
    setStatus('Deleting card...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }
      const response = await chrome.runtime.sendMessage({ action: 'delete-card', token: token, cardId: cardId });
      if (response && response.success) {
        setStatus('Card deleted successfully!', false);
        // Re-fetch lists to update the UI
        const currentBoardId = trelloListsContainer.dataset.boardId;
        const currentBoardName = trelloListsContainer.dataset.boardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}');
        if (currentBoardId && currentBoardName && currentBoardPrefs) {
          fetchAndDisplayTrelloLists(currentBoardId, currentBoardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error deleting card: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error deleting card:', error);
    }
  };

  // Function to handle moving a card
  const handleMoveCard = async (cardId, targetListId) => {
    setStatus('Moving card...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }
      const response = await chrome.runtime.sendMessage({ action: 'move-card', token: token, cardId: cardId, listId: targetListId });
      if (response && response.success) {
        setStatus('Card moved successfully!', false);
        // Re-fetch lists to update the UI
        const currentBoardId = trelloListsContainer.dataset.boardId;
        const currentBoardName = trelloListsContainer.dataset.boardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}');
        if (currentBoardId && currentBoardName && currentBoardPrefs) {
          fetchAndDisplayTrelloLists(currentBoardId, currentBoardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error moving card: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error moving card:', error);
    }
  };

  // Function to apply board background to main container
  const applyBoardBackground = (boardPrefs) => {
    if (mainContainer) {
      mainContainer.style.backgroundImage = ''; // Clear previous
      mainContainer.style.backgroundColor = 'var(--main-bg-color)'; // Reset to theme default first, then apply board specific
      mainContainer.classList.remove('light-text');

      if (boardPrefs.backgroundImage) {
        mainContainer.style.backgroundImage = `url(${boardPrefs.backgroundImage})`;
        if (boardPrefs.backgroundTile) {
          mainContainer.style.backgroundRepeat = 'repeat';
          mainContainer.style.backgroundSize = 'auto';
        } else {
          mainContainer.style.backgroundRepeat = 'no-repeat';
          mainContainer.style.backgroundSize = 'cover';
        }
      } else if (boardPrefs.backgroundColor) {
        mainContainer.style.backgroundColor = boardPrefs.backgroundColor;
      }

      if (boardPrefs.backgroundBrightness === 'light') {
        mainContainer.classList.add('light-text');
      }
    }
  };

  // Function to fetch and display Trello card details
  const fetchAndDisplayCardDetails = async (cardId, cardName, boardPrefs) => {
    setStatus(`Fetching details for "${cardName}"...`, false);
    applyBoardBackground(boardPrefs); // Apply board background to card detail view
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;

      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }

      const cardResponse = await chrome.runtime.sendMessage({ action: 'get-card-details', token: token, cardId: cardId });

      if (cardResponse && cardResponse.success && cardResponse.data) {
        showCardDetailSection();
        const card = cardResponse.data;

        // Set dataset attributes for the card being displayed
        if (cardDetailContainer) {
          cardDetailContainer.dataset.cardId = card.id;
          cardDetailContainer.dataset.cardName = card.name; // Also store name for convenience
        }
        if (cardDetailTitle) cardDetailTitle.textContent = card.name;

        if (cardDetailDescription) {
          cardDetailDescription.value = card.desc || '';
          cardDetailDescription.readOnly = true;
          cardDetailDescription.style.height = 'auto'; // Reset height
          cardDetailDescription.style.height = cardDetailDescription.scrollHeight + 'px'; // Adjust height to content
        }
        if (editDescriptionBtn) editDescriptionBtn.style.display = 'inline-block';
        if (saveDescriptionBtn) saveDescriptionBtn.style.display = 'none';

        // Due Date Input
        if (cardDetailDueDateInput) {
          // Trello's 'due' can be null or a date string. Input type="date" expects 'YYYY-MM-DD'.
          cardDetailDueDateInput.value = card.due ? new Date(card.due).toISOString().split('T')[0] : '';
          if (saveDueDateBtn) saveDueDateBtn.style.display = 'inline-block';
          if (clearDueDateBtn) clearDueDateBtn.style.display = 'inline-block';
        }

        // Display Labels
        if (cardDetailLabels) {
          cardDetailLabels.innerHTML = '';
          if (card.labels && card.labels.length > 0) {
            card.labels.forEach(label => {
              const labelSpan = document.createElement('span');
              labelSpan.classList.add('trello-label');
              labelSpan.style.backgroundColor = label.color || '#ccc'; // Default color if none
              labelSpan.textContent = label.name || label.color;
              cardDetailLabels.appendChild(labelSpan);
            });
          } else {
            cardDetailLabels.textContent = 'No labels';
          }
        }

        // Display Checklists
        if (cardDetailChecklists) {
          cardDetailChecklists.innerHTML = '';
          if (card.checklists && card.checklists.length > 0) {
            card.checklists.forEach(checklist => {
              const checklistDiv = document.createElement('div');
              checklistDiv.classList.add('trello-checklist');
              const checklistTitle = document.createElement('h4');
              checklistTitle.textContent = checklist.name;
              checklistDiv.appendChild(checklistTitle);
              const checklistItems = document.createElement('ul');
              checklist.checkItems.forEach(item => {
                const listItem = document.createElement('li');
                listItem.textContent = item.name;
                if (item.state === 'complete') {
                  listItem.style.textDecoration = 'line-through';
                  listItem.style.opacity = '0.7';
                }
                checklistItems.appendChild(listItem);
              });
              checklistDiv.appendChild(checklistItems);
              cardDetailChecklists.appendChild(checklistDiv);
            });
          } else {
            cardDetailChecklists.textContent = 'No checklists';
          }
        }

        // Display Comments
        if (cardDetailComments) {
          cardDetailComments.innerHTML = '';
          if (card.actions && card.actions.length > 0) {
            card.actions.filter(action => action.type === 'commentCard').forEach(comment => {
              const commentDiv = document.createElement('div');
              commentDiv.classList.add('trello-comment');
              commentDiv.innerHTML = `<strong>${comment.memberCreator ? comment.memberCreator.fullName : 'Unknown'}:</strong> ${comment.data.text} <br> <small>${new Date(comment.date).toLocaleString()}</small>`;
              cardDetailComments.appendChild(commentDiv);
            });
          } else {
            cardDetailComments.textContent = 'No comments';
          }
        }

        setStatus(`Details loaded for "${cardName}".`, false);
      } else {
        setStatus(`Error fetching card details: ${cardResponse.error || 'Unknown error'}`, true);
        // Optionally go back to lists or boards
      }
    } catch (error) {
      setStatus(`Communication error during card detail fetch: ${error.message}`, true);
      console.error('Popup: Error during card detail fetch:', error);
    }
  };

  // Function to fetch and display Trello lists for a specific board
  const fetchAndDisplayTrelloLists = async (boardId, boardName, boardPrefs) => {
    setStatus(`Fetching lists for "${boardName}"...`, false);
    // Store current board info for re-fetching
    if (trelloListsContainer) {
      trelloListsContainer.dataset.boardId = boardId;
      trelloListsContainer.dataset.boardName = boardName;
      trelloListsContainer.dataset.boardPrefs = JSON.stringify(boardPrefs);
    }

    // Apply board background
    applyBoardBackground(boardPrefs);

    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;

      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }

      const listsResponse = await chrome.runtime.sendMessage({ action: 'get-board-data', token: token, boardId: boardId });

      if (listsResponse && listsResponse.success && listsResponse.data) {
        showListsSection(); // This will hide settingsContainer
        if (selectedBoardTitle) selectedBoardTitle.textContent = boardName;
        if (listsGrid) {
          listsGrid.innerHTML = ''; // Clear previous lists
          listsResponse.data.forEach(list => {
            const listContainer = document.createElement('div');
            listContainer.classList.add('trello-list');
            listContainer.dataset.listId = list.id; // Store list ID for drag and drop

            // Drag and drop for lists (as drop targets)
            listContainer.addEventListener('dragover', (e) => { // Drag over a list
              e.preventDefault(); // Allow drop
              if (e.dataTransfer.types.includes('text/plain')) { // Only allow card drops
                listContainer.style.backgroundColor = 'rgba(255,255,255,0.1)'; // Visual cue for drop target
              }
            });
            listContainer.addEventListener('dragleave', () => {
              listContainer.style.backgroundColor = ''; // Reset visual cue
            });
            listContainer.addEventListener('drop', (e) => {
              e.preventDefault();
              listContainer.style.backgroundColor = ''; // Reset visual cue
              const cardId = e.dataTransfer.getData('text/plain');
              if (cardId && cardId !== 'undefined') {
                handleMoveCard(cardId, list.id);
              }
            });

            const listTitle = document.createElement('h3');
            listTitle.classList.add('trello-list-title');
            listTitle.textContent = list.name;
            listContainer.appendChild(listTitle);

            const cardsContainer = document.createElement('div');
            cardsContainer.classList.add('cards-container');
            if (list.cards && list.cards.length > 0) {
              list.cards.forEach(card => {
                const cardBlock = document.createElement('div');
                cardBlock.classList.add('trello-card');
                cardBlock.setAttribute('draggable', 'true');
                cardBlock.dataset.cardId = card.id; // Store card ID for drag and drop
                cardBlock.dataset.cardName = card.name; // Store card name for display
                cardBlock.addEventListener('dragstart', (e) => {
                  e.dataTransfer.setData('text/plain', card.id);
                });
                // Removed cardBlock's click listener as it's now handled by cardLink
                const cardLink = document.createElement('a');
                cardLink.href = '#'; // Prevent actual navigation, will be handled by JS
                // Removed target="_blank" to prevent opening a new tab
                cardLink.rel = 'noopener noreferrer';
                cardLink.textContent = card.name;
                cardLink.addEventListener('click', (e) => {
                  e.preventDefault(); // Prevent the default link behavior (opening new tab or navigating)
                  fetchAndDisplayCardDetails(card.id, card.name, boardPrefs); // Call the function to show card details
                });
                cardBlock.appendChild(cardLink);

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-card-btn');
                deleteButton.textContent = '×';
                deleteButton.title = `Delete "${card.name}"`;
                deleteButton.addEventListener('click', (e) => {
                  e.stopPropagation(); // Prevent card click from triggering
                  handleDeleteCard(card.id, card.name);
                });
                cardBlock.appendChild(deleteButton);

                cardsContainer.appendChild(cardBlock);
              });
            } else {
              const noCardsMessage = document.createElement('p');
              noCardsMessage.classList.add('no-cards');
              noCardsMessage.textContent = 'No cards in this list.';
              cardsContainer.appendChild(noCardsMessage);
            }
            listContainer.appendChild(cardsContainer);

            // Add new card input and button
            const newCardInput = document.createElement('input');
            newCardInput.type = 'text';
            newCardInput.classList.add('add-card-input');
            newCardInput.placeholder = 'Add a card...';
            newCardInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                handleCreateCard(list.id, newCardInput.value);
                newCardInput.value = ''; // Clear input after adding
              }
            });
            listContainer.appendChild(newCardInput);

            const addCardButton = document.createElement('button');
            addCardButton.classList.add('add-card-btn');
            addCardButton.textContent = 'Add Card';
            addCardButton.addEventListener('click', () => {
              handleCreateCard(list.id, newCardInput.value);
              newCardInput.value = ''; // Clear input after adding
            });
            listContainer.appendChild(addCardButton);

            listsGrid.appendChild(listContainer);
          });
          setStatus(`Loaded ${listsResponse.data.length} lists for "${boardName}".`, false);
        }
      } else {
        setStatus(`Error fetching lists: ${listsResponse.error || 'Unknown error'}`, true);
        showBoardsSection(); // Go back to boards if fetching lists fails
      }
    } catch (error) {
      setStatus(`Communication error during list fetch: ${error.message}`, true);
      console.error('Popup: Error during list fetch:', error);
      showBoardsSection(); // Go back to boards on communication error
    }
  };

  // Function to handle updating card description
  const handleUpdateCardDescription = async (cardId, description) => {
    setStatus('Updating description...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }
      const response = await chrome.runtime.sendMessage({ action: 'update-card-description', token: token, cardId: cardId, description: description });
      if (response && response.success) {
        setStatus('Description updated successfully!', false);
        // Re-fetch card details to update the UI
        const currentCardId = cardDetailContainer.dataset.cardId;
        const currentCardName = cardDetailContainer.dataset.cardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}'); // Get board prefs from lists container
        if (currentCardId && currentCardName) {
          fetchAndDisplayCardDetails(currentCardId, currentCardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error updating description: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error updating description:', error);
    }
  };

  // Function to handle updating card due date
  const handleUpdateCardDueDate = async (cardId, dueDateString) => {
    setStatus('Updating due date...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }

      let formattedDueDate = null;
      if (dueDateString) {
        // Convert YYYY-MM-DD from input to ISO string for Trello API
        formattedDueDate = new Date(dueDateString).toISOString();
      }
      const response = await chrome.runtime.sendMessage({ action: 'update-card-duedate', token: token, cardId: cardId, dueDate: formattedDueDate });
      if (response && response.success) {
        setStatus('Due date updated successfully!', false);
        const currentCardId = cardDetailContainer.dataset.cardId;
        const currentCardName = cardDetailContainer.dataset.cardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}');
        if (currentCardId && currentCardName) {
          fetchAndDisplayCardDetails(currentCardId, currentCardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error updating due date: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error updating due date:', error);
    }
  };

  // Function to handle adding a new checklist
  const handleAddChecklist = async (cardId, checklistName) => {
    if (!checklistName.trim()) {
      setStatus('Checklist name cannot be empty!', true);
      return;
    }
    setStatus('Adding checklist...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }
      const response = await chrome.runtime.sendMessage({ action: 'add-checklist', token: token, cardId: cardId, name: checklistName });
      if (response && response.success) {
        setStatus('Checklist added successfully!', false);
        if (newChecklistNameInput) newChecklistNameInput.value = ''; // Clear input
        // Re-fetch card details to update the UI
        const currentCardId = cardDetailContainer.dataset.cardId;
        const currentCardName = cardDetailContainer.dataset.cardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}');
        if (currentCardId && currentCardName) {
          fetchAndDisplayCardDetails(currentCardId, currentCardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error adding checklist: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error adding checklist:', error);
    }
  };

  // Function to handle adding a comment
  const handleAddComment = async (cardId, commentText) => {
    if (!commentText.trim()) {
      setStatus('Comment cannot be empty!', true);
      return;
    }
    setStatus('Adding comment...', false);
    try {
      const tokenResult = await chrome.storage.local.get(['trello_token']);
      const token = tokenResult.trello_token;
      if (!token) {
        setStatus('Trello token not found. Please re-authenticate.', true);
        showApiKeySection();
        return;
      }
      const response = await chrome.runtime.sendMessage({ action: 'add-comment', token: token, cardId: cardId, commentText: commentText });
      if (response && response.success) {
        setStatus('Comment added successfully!', false);
        if (newCommentInput) newCommentInput.value = ''; // Clear input
        // Re-fetch card details to update the UI
        const currentCardId = cardDetailContainer.dataset.cardId;
        const currentCardName = cardDetailContainer.dataset.cardName;
        const currentBoardPrefs = JSON.parse(trelloListsContainer.dataset.boardPrefs || '{}'); // Get board prefs from lists container
        if (currentCardId && currentCardName) {
          fetchAndDisplayCardDetails(currentCardId, currentCardName, currentBoardPrefs);
        }
      } else {
        setStatus(`Error adding comment: ${response.error || 'Unknown error'}`, true);
      }
    } catch (error) {
      setStatus(`Communication error: ${error.message}`, true);
      console.error('Popup: Error adding comment:', error);
    }
  };




  // Function to apply theme
  const applyTheme = (theme) => {
    document.body.dataset.theme = theme;
    chrome.storage.local.set({ theme: theme });
    // Re-apply background if on lists view to ensure correct text color
    // This is important because board backgrounds might have light/dark brightness
    // which affects text color, and the theme also affects default text color.
    // We need to re-evaluate the text color based on the new theme.
    if (currentView === 'lists' && trelloListsContainer.dataset.boardPrefs) {
      applyBoardBackground(JSON.parse(trelloListsContainer.dataset.boardPrefs));
    } else if (currentView === 'boards') {
      // If on boards view, reset to default theme background
      showBoardsSection();
    }
  };

  // Initial load logic
  chrome.storage.local.get(['trello_api_key', 'theme'], async (result) => {
    // Check all required DOM elements and log if any are missing, but don't return early
    const elementChecks = {
      apiKeyInput: apiKeyInput,
      saveKeyBtn: saveKeyBtn,
      statusElement: statusElement,
      trelloBoardsContainer: trelloBoardsContainer,
      boardsGrid: boardsGrid,
      apiKeySection: apiKeySection,
      trelloListsContainer: trelloListsContainer,
      selectedBoardTitle: selectedBoardTitle,
      listsGrid: listsGrid,
      cardDetailContainer: cardDetailContainer,
      cardDetailTitle: cardDetailTitle,
      cardDetailDescription: cardDetailDescription,
      cardDetailDueDateInput: cardDetailDueDateInput, 
      cardDetailLabels: cardDetailLabels,
      saveDueDateBtn: saveDueDateBtn,
      clearDueDateBtn: clearDueDateBtn,
      cardDetailChecklists: cardDetailChecklists,
      cardDetailComments: cardDetailComments,
      backToListsBtn: backToListsBtn,
      settingsBtn: settingsBtn,
      editDescriptionBtn: editDescriptionBtn,
      settingsBtnLists: settingsBtnLists,
      settingsContainer: settingsContainer,
      lightModeBtn: lightModeBtn,
      darkModeBtn: darkModeBtn,
      backFromSettingsBtn: backFromSettingsBtn
    };
    for (const [id, element] of Object.entries(elementChecks)) {
      if (!element) {
        console.error(`Popup: Required DOM element '${id}' not found!`);
      }
    }

    // Apply saved theme
    applyTheme(result.theme || 'light'); // Default to light if no theme saved

    if (result.trello_api_key) {
      apiKeyInput.value = result.trello_api_key;
      setStatus('API Key found. Attempting to load boards...', false);
      await fetchAndDisplayTrelloBoards(); // Initial fetch
    } else {
      showApiKeySection();
      setStatus('Please enter your Trello API Key.', false);
    }
    // Ensure settingsContainer is hidden on initial load
    if (cardDetailContainer) cardDetailContainer.style.display = 'none';
    if (settingsContainer) settingsContainer.style.display = 'none';
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

  // Event listener for the "Back to Boards" button
  const backToBoardsBtn = document.getElementById('backToBoardsBtn');
  if (backToBoardsBtn) {
    backToBoardsBtn.addEventListener('click', () => {
      showBoardsSection();
      setStatus('Viewing Trello boards.', false);
    });
  }

  // Event listener for "Back to Lists" button
  if (backToListsBtn) {
    backToListsBtn.addEventListener('click', () => {
      showListsSection();
      // Re-apply background for lists view after returning from card details
      if (trelloListsContainer.dataset.boardPrefs) {
        applyBoardBackground(JSON.parse(trelloListsContainer.dataset.boardPrefs));
      }
      setStatus('Viewing Trello lists.', false);
    });
  }

  // Event listeners for card detail actions
  if (editDescriptionBtn && cardDetailDescription && saveDescriptionBtn) {
    editDescriptionBtn.addEventListener('click', () => {
      cardDetailDescription.readOnly = false;
      editDescriptionBtn.style.display = 'none';
      saveDescriptionBtn.style.display = 'inline-block';
      cardDetailDescription.focus();
    });
    saveDescriptionBtn.addEventListener('click', () => {
      const currentCardId = cardDetailContainer.dataset.cardId;
      if (currentCardId) {
        handleUpdateCardDescription(currentCardId, cardDetailDescription.value);
      }
    });
  }
  if (addCommentBtn && newCommentInput && cardDetailContainer) {
    addCommentBtn.addEventListener('click', () => handleAddComment(cardDetailContainer.dataset.cardId, newCommentInput.value));
  }

  // Event listeners for due date actions
  if (saveDueDateBtn && cardDetailDueDateInput && cardDetailContainer) {
    saveDueDateBtn.addEventListener('click', () => {
      const currentCardId = cardDetailContainer.dataset.cardId;
      if (currentCardId) {
        handleUpdateCardDueDate(currentCardId, cardDetailDueDateInput.value); // Pass the raw input value
      }
    });
  }
  if (clearDueDateBtn && cardDetailContainer) {
    clearDueDateBtn.addEventListener('click', () => {
      const currentCardId = cardDetailContainer.dataset.cardId;
      if (currentCardId) {
        handleUpdateCardDueDate(currentCardId, null); // Pass null to clear due date
      }
    });
  }

  // Event listener for adding a checklist
  if (addChecklistBtn && newChecklistNameInput && cardDetailContainer) {
    addChecklistBtn.addEventListener('click', () => handleAddChecklist(cardDetailContainer.dataset.cardId, newChecklistNameInput.value));
  }

  // Event listeners for settings buttons
  if (settingsBtn) {
    console.log('Popup: settingsBtn found, attaching listener.');
    settingsBtn.addEventListener('click', () => {
      console.log('Popup: settingsBtn clicked!');
      showSettingsSection();
    });
  }
  if (settingsBtnLists) {
    console.log('Popup: settingsBtnLists found, attaching listener.');
    settingsBtnLists.addEventListener('click', () => {
      console.log('Popup: settingsBtnLists clicked!');
      showSettingsSection();
    });
  }
  if (backFromSettingsBtn) {
    backFromSettingsBtn.addEventListener('click', () => {
      if (currentView === 'boards') {
        showBoardsSection();
      } else if (currentView === 'lists') {
        showListsSection();
        // Re-apply background for lists view after returning from settings
        if (trelloListsContainer.dataset.boardPrefs) {
          applyBoardBackground(JSON.parse(trelloListsContainer.dataset.boardPrefs));
        }
      } else {
        showApiKeySection();
      }
      setStatus('Settings closed.', false);
    });
  }

  // Event listeners for theme selection
  if (lightModeBtn) {
    lightModeBtn.addEventListener('click', () => applyTheme('light'));
  }
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => applyTheme('dark'));
  }
}); 