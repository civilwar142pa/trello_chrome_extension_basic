// src/background.js
console.log("Trello Extension Background Service Worker Running");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed successfully");
});

// Helper to retrieve the API key from storage
const getApiKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['trello_api_key'], (result) => {
      if (result.trello_api_key) {
        resolve(result.trello_api_key);
      } else {
        console.error('Background: Trello API Key not found in storage.');
        reject(new Error('Trello API Key not configured. Please set it in the extension settings.'));
      }
    });
  });
};

// Trello authentication
const authenticateTrello = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['trello_token'], (result) => {
      if (result.trello_token) {
        console.log('Background: Existing Trello token found in storage. Reusing it.');
        resolve(result.trello_token);
      } else {
        console.log('Background: No existing Trello token found. Initiating new authentication flow.');
        getApiKey().then((apiKey) => {
          const redirectURL = chrome.identity.getRedirectURL();
          console.log('Background: Using API Key:', apiKey);
          console.log('Background: Generated Redirect URL:', redirectURL);
          const authURL = `https://trello.com/1/authorize?expiration=never&name=TrelloReactBooster&scope=read,write&response_type=token&key=${apiKey}&return_url=${encodeURIComponent(redirectURL)}`;

          console.log('Background: Launching web auth flow with URL:', authURL);
          chrome.identity.launchWebAuthFlow(
            {
              url: authURL,
              interactive: true,
            },
            (responseUrl) => {
              if (chrome.runtime.lastError || !responseUrl) {
                const error = chrome.runtime.lastError ? chrome.runtime.lastError.message : 'Web auth flow completed without a response URL.';
                console.error('Background: chrome.identity.launchWebAuthFlow error:', error);
                reject(new Error(error));
                return;
              }
              // Extract token from URL hash
              const url = new URL(responseUrl);
              const params = new URLSearchParams(url.hash.substring(1)); // removes '#'
              const token = params.get('token');
              
              if (token) {
                chrome.storage.local.set({ trello_token: token }, () => {
                  console.log('Background: Trello token saved successfully.');
                  resolve(token);
                });
              } else {
                console.error('Background: No token found in response URL:', responseUrl);
                reject(new Error('No token found in response.'));
              }
            }
          );
        }).catch(reject); // Catch errors from getApiKey
      }
    });
  });
};

// Listen for a message to trigger auth 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'save-api-key') {
    if (!request.key || typeof request.key !== 'string' || request.key.trim() === '') {
      console.error('Background: Received save-api-key request but no valid key was provided.', request);
      sendResponse({ success: false, error: 'No valid API key provided.' });
      return true;
    }
    console.log('Background: Saving API key to chrome.storage.local:', request.key);
    chrome.storage.local.set({ trello_api_key: request.key }, () => { //
      if (chrome.runtime.lastError) {
        console.error('Background: Error saving API key:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Background: API key saved to chrome.storage.local. Sending success response.');
        sendResponse({ success: true });
      }
    });
    return true;
  } else if (request.action === 'authenticate') {
    authenticateTrello()
      .then((token) => sendResponse({ success: true, token }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Indicates we will send a response asynchronously
  } else if (request.action === 'get-boards') {
    const { token } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=name,url,prefs&filter=open`;
      return fetch(url);
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'get-board-data') {
    const { token, boardId } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${apiKey}&token=${token}&cards=open&card_fields=name,url,pos`;
      return fetch(url);
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'create-card') {
    const { token, listId, name } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/cards?key=${apiKey}&token=${token}&idList=${listId}&name=${encodeURIComponent(name)}`;
      return fetch(url, { method: 'POST' });
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'delete-card') {
    const { token, cardId } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}`;
      return fetch(url, { method: 'DELETE' });
    })
      .then((response) => {
        if (response.ok) sendResponse({ success: true });
        else sendResponse({ success: false, error: 'Failed to delete' });
      })
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'move-card') {
    const { token, cardId, listId } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}&idList=${listId}`;
      return fetch(url, { method: 'PUT' });
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'get-card-details') {
    const { token, cardId } = request;
    getApiKey().then((apiKey) => {
      // Requesting name, description, due date, labels, checklists, and comments
      const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}&fields=name,desc,due,idLabels,idChecklists,badges,url&actions=commentCard&action_fields=data,date,memberCreator&checklists=all`;
      return fetch(url);
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch card details: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
      })
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'update-card-description') {
    const { token, cardId, description } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}&desc=${encodeURIComponent(description)}`;
      return fetch(url, { method: 'PUT' });
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update card description: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
      })
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'add-comment') {
    const { token, cardId, commentText } = request;
    getApiKey().then((apiKey) => {
      const url = `https://api.trello.com/1/cards/${cardId}/actions/comments?key=${apiKey}&token=${token}&text=${encodeURIComponent(commentText)}`;
      return fetch(url, { method: 'POST' });
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to add comment: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
      })
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'get-labels') {
    // Placeholder for future label fetching if needed
    // For now, card details include idLabels, which can be used to get label names/colors from board data
    sendResponse({ success: false, error: 'Not implemented yet' });
    return true;
  }
});
