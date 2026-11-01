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

## How to Install & Use (From GitHub)

No build tools, Node.js, or compilation steps are required. This extension runs on 100% vanilla JavaScript.

### Step 1: Clone or Download the Repository

**Option A (Using Git CLI):**
```bash
git clone https://github.com/shafinchowdhury/reel-counter-extension.git
cd reel-counter-extension
```

**Option B (Direct Download):**
1. Click the green **Code** button at the top of the GitHub page.
2. Select **Download ZIP**.
3. Extract (unzip) the downloaded ZIP folder to a convenient location on your computer.

---

### Step 2: Load into Google Chrome or Brave Browser

1. Open your browser and open the Extensions page:
   - **Google Chrome**: type `chrome://extensions` in the address bar and press <kbd>Enter</kbd>.
   - **Brave Browser**: type `brave://extensions` in the address bar and press <kbd>Enter</kbd>.
   - *(Also compatible with Microsoft Edge at `edge://extensions`)*
2. In the top-right corner, turn **ON** the **Developer mode** toggle switch.
3. In the top-left corner, click the **Load unpacked** button.
4. In the file picker, select the cloned/extracted project folder (the folder containing `manifest.json`).

---

### Step 3: Pin & Start Tracking

1. Click the **Extensions (puzzle piece)** icon in your browser's top toolbar.
2. Click the **Pin (📌)** icon next to **Reel Counter** so the live badge is visible at all times.
3. Visit any supported short-form video feed:
   - [Instagram Reels](https://www.instagram.com/reels/)
   - [YouTube Shorts](https://www.youtube.com/shorts/)
   - [Facebook Reels](https://www.facebook.com/reel/)
4. **Watch the live counter**:
   - As you scroll through new videos, the toolbar badge updates automatically in real-time.
   - Click the toolbar icon to view your ultra-compact popup showing `Count: X`.
   - Click the bar or arrow to expand and see your breakdown for the **Past 7 Days**.

---

### How to Update After Pulling New Changes

If you pull new updates from Git:
```bash
git pull origin main
```
Simply return to `chrome://extensions` (or `brave://extensions`) and click the **🔄 (Reload)** icon on the **Reel Counter** card.

