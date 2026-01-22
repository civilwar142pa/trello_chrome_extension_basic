import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

const manifest = {
  "manifest_version": 3,
  "name": "Trello Booster",
  "version": "1.0.0",
  "action": {
    "default_popup": "src/popup.html"
  },
  "permissions": ["storage", "activeTab", "identity"],
  "host_permissions": [
    "https://trello.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://trello.com/*"],
      "js": ["src/content.js"]
    }
  ],
  "background": {
    "service_worker": "src/background.js"
  }
};

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }), // Keep manifest object directly defined
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup.html', // Explicitly define source HTML for popup
        content: 'src/content.js', // Explicitly define source JS for content script
        background: 'src/background.js', // Explicitly define source JS for background script
      },
    },
  },
});