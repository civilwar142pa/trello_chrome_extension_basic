// src/content.js
console.log("Trello Extension Content Script Loaded");

// Example: Change the background color of the Trello board header to prove it works
const observer = new MutationObserver(() => {
  const header = document.querySelector('[data-testid="header-container"]');
  if (header) {
    header.style.borderBottom = "5px solid #61dafb"; // React Blue
  }
});

observer.observe(document.body, { childList: true, subtree: true });
