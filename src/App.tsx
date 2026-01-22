import { useState, useEffect } from 'react'
import './App.css'

// Declare chrome to avoid TypeScript errors if @types/chrome is missing
declare const chrome: any;

function App() {
  const [status, setStatus] = useState<string>('Ready to connect');
  const [token, setToken] = useState<string | null>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [newCardTitles, setNewCardTitles] = useState<{ [key: string]: string }>({});

  const handleAuth = () => {
    setStatus('Requesting Trello access...');
    
    // Send message to background script to trigger the auth flow
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response: any) => {
      // Check for runtime errors (e.g., background script not reachable)
      if (chrome.runtime.lastError) {
        setStatus('Error: ' + chrome.runtime.lastError.message);
        return;
      }

      if (response && response.success) {
        setToken(response.token);
        setStatus('Token received. Fetching boards...');
        fetchBoards(response.token);
      } else {
        setStatus('Auth failed: ' + (response?.error || 'Unknown error'));
      }
    });
  };

  const fetchBoards = (authToken: string) => {
    chrome.runtime.sendMessage({ action: 'get-boards', token: authToken }, (response: any) => {
      if (response && response.success) {
        setBoards(response.data);
        setStatus(`Loaded ${response.data.length} boards!`);
      } else {
        setStatus('Failed to fetch boards.');
      }
    });
  };

  const fetchBoardData = (boardId: string) => {
    setStatus('Fetching lists...');
    chrome.runtime.sendMessage({ action: 'get-board-data', token, boardId }, (response: any) => {
      if (response && response.success) {
        setLists(response.data);
        setStatus(`Loaded ${response.data.length} lists`);
      } else {
        setStatus('Failed to load lists');
      }
    });
  };

  const handleCreateCard = (listId: string) => {
    const name = newCardTitles[listId];
    if (!name) return;
    
    setStatus('Creating card...');
    chrome.runtime.sendMessage({ action: 'create-card', token, listId, name }, (response: any) => {
      if (response && response.success) {
        setNewCardTitles(prev => ({ ...prev, [listId]: '' }));
        if (selectedBoard) fetchBoardData(selectedBoard.id);
      } else {
        setStatus('Failed to create card');
      }
    });
  };

  const handleDeleteCard = (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    setStatus('Deleting card...');
    chrome.runtime.sendMessage({ action: 'delete-card', token, cardId }, (response: any) => {
      if (response && response.success) {
        if (selectedBoard) fetchBoardData(selectedBoard.id);
      } else {
        setStatus('Failed to delete card');
      }
    });
  };

  const handleMoveCard = (cardId: string, listId: string) => {
    setStatus('Moving card...');
    chrome.runtime.sendMessage({ action: 'move-card', token, cardId, listId }, (response: any) => {
     if (response && response.success) {
       if (selectedBoard) fetchBoardData(selectedBoard.id);
     } else {
       setStatus('Failed to move card');
     }
   });
 };

  useEffect(() => {
    chrome.storage.local.get('trello_token', (result: any) => {
      if (result.trello_token) {
        setToken(result.trello_token);
        fetchBoards(result.trello_token);
      }
    });
  }, []);

  const prefs = selectedBoard?.prefs;
  const hasBg = prefs && (prefs.backgroundImage || prefs.backgroundColor);
  const bgStyle = hasBg ? {
    backgroundImage: prefs.backgroundImage ? `url(${prefs.backgroundImage})` : undefined,
    backgroundColor: prefs.backgroundColor || undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
  } : {};

  return (
    <div className="app-container" style={bgStyle}>
      <h2>Trello Booster</h2>
      <div style={{ margin: '1rem 0' }}>
        {!token ? (
          <button onClick={handleAuth} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Authorize with Trello
          </button>
        ) : (
          <div style={{ color: 'green', fontWeight: 'bold' }}>
            ✅ Authenticated
          </div>
        )}
      </div>
      
      <div className="status-box">
        <strong>Status:</strong> {status}
      </div>

      {selectedBoard ? (
        <div style={{ marginTop: '1rem', textAlign: 'left' }}>
          <button 
            onClick={() => { setSelectedBoard(null); setLists([]); setStatus('Ready'); }}
            style={{ marginBottom: '10px', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-color)' }}
          >
            ← Back to Boards
          </button>
          <h3 style={{ marginTop: 0 }}>{selectedBoard.name}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', overflowX: 'auto', paddingBottom: '12px', alignItems: 'flex-start' }}>
            {lists.map((list) => (
              <div 
                key={list.id} 
                className="trello-list"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const cardId = e.dataTransfer.getData("cardId");
                  if (cardId) handleMoveCard(cardId, list.id);
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>{list.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {list.cards && list.cards.map((card: any) => (
                    <div
                      key={card.id}
                      draggable
                      className="trello-card"
                      onDragStart={(e: any) => e.dataTransfer.setData("cardId", card.id)}
                    >
                      <a 
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {card.name}
                      </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCard(card.id);
                        }}
                        className="delete-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(!list.cards || list.cards.length === 0) && <span className="no-cards">No cards</span>}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                  <input 
                    type="text" 
                    placeholder="Add a card..." 
                    value={newCardTitles[list.id] || ''}
                    onChange={(e) => setNewCardTitles({ ...newCardTitles, [list.id]: e.target.value })}
                    className="card-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCard(list.id);
                    }}
                  />
                  <button 
                    onClick={() => handleCreateCard(list.id)}
                    className="add-btn"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : boards.length > 0 && (
        <div style={{ marginTop: '1rem', textAlign: 'left' }}>
          <h3>Your Boards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {boards.map((board) => {
              const { backgroundImage, backgroundColor } = board.prefs || {};
              const bgStyle = backgroundImage 
                ? { backgroundImage: `url(${backgroundImage})` } 
                : { backgroundColor: backgroundColor || '#0079bf' };

              return (
                <div 
                  key={board.id}
                  onClick={() => { setSelectedBoard(board); fetchBoardData(board.id); }}
                  className="board-tile"
                  style={{ 
                    ...bgStyle,
                  }}
                >
                  {board.name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
