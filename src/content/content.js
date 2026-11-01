/**
 * src/content/content.js
 * Content script running inside Instagram, YouTube, and Facebook.
 * 
 * Responsibilities:
 * 1. Monitor URL changes and DOM updates as the user scrolls through Reels/Shorts.
 * 2. Extract the unique video ID for the active platform.
 * 3. Filter out duplicate events (e.g. repeated DOM mutations on the same video).
 * 4. Pass unique candidate IDs to ReelStorage for persistent deduplication.
 * 
 * C++ Analogy:
 * Think of this as an event listener / sensor in an embedded system. It monitors
 * an input stream (DOM & URL), debounces noise, and signals the data layer.
 */

(() => {
  // Prevent duplicate script injection in the same frame
  if (window.__REEL_COUNTER_INJECTED__) return;
  window.__REEL_COUNTER_INJECTED__ = true;

  console.log('[Reel Counter] Content script attached to:', window.location.hostname);

  // In-memory cache of the currently active video ID
  // Prevents re-triggering while the user is simply watching the current video
  let lastActiveId = null;
  let lastCheckedUrl = '';

  /**
   * Identifies the current platform based on hostname.
   * 
   * @returns {'instagram' | 'youtube' | 'facebook' | null}
   */
  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('youtube.com')) return 'youtube';
    if (host.includes('facebook.com')) return 'facebook';
    return null;
  }

  /**
   * Extracts the unique Reel or Short ID from the current URL.
   * 
   * Regex matching breakdown (C++ std::regex equivalent):
   * - Instagram: /reels?\/([A-Za-z0-9_-]+)/
   * - YouTube:   /shorts\/([A-Za-z0-9_-]+)/
   * - Facebook:  /reel\/([0-9A-Za-z_-]+)/
   * 
   * @param {string} url - Current window.location.href
   * @param {string} platform - The active platform
   * @returns {string | null} Unique video ID or null if not currently on a reel
   */
  function extractReelId(url, platform) {
    if (!url) return null;

    let match = null;

    if (platform === 'instagram') {
      // Matches both https://www.instagram.com/reel/ID/ and /reels/ID/
      match = url.match(/(?:reels?)\/([A-Za-z0-9_-]+)/i);
    } else if (platform === 'youtube') {
      // Matches https://www.youtube.com/shorts/ID
      match = url.match(/\/shorts\/([A-Za-z0-9_-]+)/i);
    } else if (platform === 'facebook') {
      // Matches https://www.facebook.com/reel/ID
      match = url.match(/\/reel\/([0-9A-Za-z_-]+)/i);
    }

    // match[1] contains the first capture group (the ID)
    return match ? match[1] : null;
  }

  /**
   * Main check routine.
   * Called whenever a URL change or significant DOM mutation is detected.
   */
  async function checkForReelNavigation() {
    const currentUrl = window.location.href;
    const platform = detectPlatform();

    if (!platform) return;

    // Fast-path: If the URL hasn't changed at all, skip regex processing
    if (currentUrl === lastCheckedUrl) return;
    lastCheckedUrl = currentUrl;

    const candidateId = extractReelId(currentUrl, platform);

    // If we're not currently on a Reel/Short page (e.g. user went to home feed)
    if (!candidateId) {
      lastActiveId = null;
      return;
    }

    // In-memory deduplication:
    // If the user is still on the same reel, do nothing
    if (candidateId === lastActiveId) {
      return;
    }

    // Update current in-memory active ID
    lastActiveId = candidateId;

    // Send to our storage manager for persistent daily counting and deduplication
    if (window.ReelStorage && window.ReelStorage.recordReel) {
      await window.ReelStorage.recordReel(candidateId, platform);
    }
  }

  // --- Observation Mechanism ---
  // SPAs change URLs without a full page reload. We combine two lightweight strategies:

  // Strategy 1: URL Poller
  // Checking window.location.href every 400ms is computationally trivial (~0.001ms)
  // and catches any navigation that doesn't trigger DOM mutations.
  setInterval(checkForReelNavigation, 400);

  // Strategy 2: MutationObserver
  // Reacts immediately whenever DOM elements change (e.g. user scrolls down).
  const observer = new MutationObserver(() => {
    checkForReelNavigation();
  });

  // Start observing document body when available
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Initial check on load
  checkForReelNavigation();
})();
