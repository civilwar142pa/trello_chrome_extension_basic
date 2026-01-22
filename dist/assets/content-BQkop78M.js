(function(){console.log("Trello Extension Content Script Loaded");const t=new MutationObserver(()=>{const e=document.querySelector('[data-testid="header-container"]');e&&(e.style.borderBottom="5px solid #61dafb")});t.observe(document.body,{childList:!0,subtree:!0});
})()
