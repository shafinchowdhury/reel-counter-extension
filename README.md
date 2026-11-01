# Cross-Browser Reel Counter Extension

A privacy-first, lightweight browser extension for **Google Chrome** and **Brave Browser** that tracks and counts your unique Instagram Reels, Facebook Reels, and YouTube Shorts scrolling habits.

## Features

- **Daily Auto-Reset**: Counters reset every night at 12:00 AM (midnight) based on your local timezone.
- **7-Day Rolling History**: Stores history for the past 7 days; older entries are pruned automatically to keep storage minimal.
- **Unique Counting**: Scrolling backward or re-watching the same video in a single day is deduplicated.
- **Ultra-Compact UI**: Minimalist popup displaying the immediate count, with an expandable view for 7-day statistics.
- **Live Toolbar Badge**: Displays today's count directly on the extension icon.
- **100% Private**: Works entirely locally via `chrome.storage.local`. No external servers, no tracking, zero analytics.

## Project Structure

```
├── manifest.json              # Extension metadata and permissions (Manifest V3)
├── icons/                     # Extension icons (16px, 48px, 128px)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── content/
│   │   └── content.js         # Content script injected into target pages (DOM & URL monitoring)
│   ├── background/
│   │   └── background.js      # Background service worker (toolbar badge updates)
│   ├── popup/
│   │   ├── popup.html         # Ultra-compact popup interface
│   │   ├── popup.css          # Minimalist styling
│   │   └── popup.js           # Popup controller and statistics renderer
│   └── utils/
│       └── storage.js         # Storage logic, date hashing, and 7-day retention engine
├── .gitignore
└── README.md
```

## How to Install in Chrome or Brave (Developer Mode)

1. Open your browser and navigate to the Extensions page:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this project root folder.

