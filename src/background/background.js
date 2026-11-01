/**
 * src/background/background.js
 * Service Worker: Manages the browser toolbar badge and reacts to storage changes.
 * 
 * C++ Analogy:
 * Think of this as a background daemon or event sink. It registers listeners
 * with the browser runtime and stays dormant until an event fires.
 */

// Helper to format today's date key: "YYYY-MM-DD"
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Updates the extension toolbar badge with today's count.
 * 
 * @param {number} count 
 */
function updateBadge(count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#FF3366' });
}

/**
 * Reads storage and refreshes the badge based on current local date.
 */
async function refreshBadgeFromStorage() {
  const todayKey = getTodayKey();
  const data = await chrome.storage.local.get(['history']);
  const history = data.history || {};
  const todayCount = history[todayKey] ? history[todayKey].count : 0;
  updateBadge(todayCount);
}

// 1. Lifecycle: extension installed or browser started
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Reel Counter] Extension installed/updated.');
  refreshBadgeFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Reel Counter] Browser started.');
  refreshBadgeFromStorage();
});

// 2. React to storage updates (Observer Pattern)
// Whenever content.js increments the count in storage, this listener automatically triggers.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.history) {
    const todayKey = getTodayKey();
    const newHistory = changes.history.newValue || {};
    const todayCount = newHistory[todayKey] ? newHistory[todayKey].count : 0;
    updateBadge(todayCount);
  }
});

// 3. Midnight rollover check:
// When the user switches tabs or focuses the window, refresh the badge.
// If the clock passed midnight, the badge will automatically clear back to 0.
chrome.tabs.onActivated.addListener(() => {
  refreshBadgeFromStorage();
});
