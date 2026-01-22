document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup: Minimal script loaded and DOMContentLoaded fired!');
  document.body.style.backgroundColor = 'lightblue'; // Visual cue
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveBtn = document.getElementById('saveKeyBtn');
  const status = document.getElementById('status');

  if (apiKeyInput) {
    console.log('Popup: apiKeyInput element found.');
  } else {
    console.error('Popup: apiKeyInput element NOT found!');
  }

  if (saveBtn) {
    console.log('Popup: saveBtn element found.');
    saveBtn.addEventListener('click', () => {
      console.log('Popup: Minimal Save button clicked!');
      if (status) {
        status.textContent = 'Button clicked!';
      }
    });
  } else {
    console.error('Popup: saveBtn element NOT found!');
  }

  if (status) {
    console.log('Popup: status element found.');
  } else {
    console.error('Popup: status element NOT found!');
  }
});