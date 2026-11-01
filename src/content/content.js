/**
 * src/content/content.js
 * Injected script for Instagram, YouTube Shorts, and Facebook Reels.
 * 
 * Features:
 * 1. Counts every play of a reel (initial navigation, returning to it, and loop replays).
 * 2. Tracks real-time active viewing duration ("time wasted").
 * 3. Syncs seamlessly with ReelStorage.
 */

(() => {
  if (window.__REEL_COUNTER_INJECTED__) return;
  window.__REEL_COUNTER_INJECTED__ = true;

  console.log('[Reel Counter] Content script attached to:', window.location.hostname);

  let currentPlatform = null;
  let activeReelId = null;
  let activeVideoEl = null;

  // Time tracking accumulator (in seconds)
  let unsavedSeconds = 0;

  // Video loop tracking state
  let lastVideoTime = 0;
  let playCountedForCurrentCycle = false;

  /**
   * Identifies the current platform based on hostname.
   */
  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('youtube.com')) return 'youtube';
    if (host.includes('facebook.com')) return 'facebook';
    return null;
  }

  currentPlatform = detectPlatform();
  if (!currentPlatform) return;

  /**
   * Extracts the unique Reel or Short ID from the current URL.
   */
  function extractReelId(url) {
    if (!url) return null;
    let match = null;

    if (currentPlatform === 'instagram') {
      match = url.match(/(?:reels?)\/([A-Za-z0-9_-]+)/i);
    } else if (currentPlatform === 'youtube') {
      match = url.match(/\/shorts\/([A-Za-z0-9_-]+)/i);
    } else if (currentPlatform === 'facebook') {
      match = url.match(/\/reel\/([0-9A-Za-z_-]+)/i);
    }

    return match ? match[1] : null;
  }

  /**
   * Flushes accumulated seconds to persistent storage.
   */
  async function flushTimeSpent() {
    if (unsavedSeconds > 0 && window.ReelStorage && window.ReelStorage.addTimeSpent) {
      const toSave = unsavedSeconds;
      unsavedSeconds = 0;
      await window.ReelStorage.addTimeSpent(toSave);
    }
  }

  /**
   * Counts a reel play or replay.
   */
  async function triggerPlayCount(reelId) {
    if (!reelId || !window.ReelStorage) return;
    await window.ReelStorage.recordReelPlay(reelId, currentPlatform);
  }

  /**
   * Finds the currently playing or most prominent <video> element on the page.
   */
  function findActiveVideoElement() {
    const videos = Array.from(document.querySelectorAll('video'));
    if (videos.length === 0) return null;

    // Prefer video that is currently not paused
    const playing = videos.find(v => !v.paused && v.readyState > 1);
    if (playing) return playing;

    // Fallback: pick the largest video visible in the viewport
    const sorted = videos.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return (rectB.width * rectB.height) - (rectA.width * rectA.height);
    });

    return sorted[0] || null;
  }

  /**
   * Attaches loop detection listeners to the active video element.
   */
  function attachVideoListeners(video) {
    if (!video || video === activeVideoEl) return;
    activeVideoEl = video;
    lastVideoTime = video.currentTime;

    // When video ends (some browsers/players emit 'ended' on loop)
    video.addEventListener('ended', () => {
      if (activeReelId) {
        console.log('[Reel Counter] Video ended/looped:', activeReelId);
        triggerPlayCount(activeReelId);
      }
    });

    // Detect loops when playback wraps around from near the end back to start
    video.addEventListener('timeupdate', () => {
      const current = video.currentTime;
      const duration = video.duration;

      // If duration is known and video jumped from >80% back to near start (<1.5s)
      if (duration && duration > 2 && lastVideoTime > (duration * 0.8) && current < 1.5) {
        console.log('[Reel Counter] Loop detected via timeupdate:', activeReelId);
        triggerPlayCount(activeReelId);
      }
      lastVideoTime = current;
    });
  }

  /**
   * Checks for URL navigation (scrolling to next or previous reel).
   */
  async function checkForReelNavigation() {
    const candidateId = extractReelId(window.location.href);

    if (!candidateId) {
      // User navigated away from reels (e.g. back to home feed)
      if (activeReelId) {
        await flushTimeSpent();
        activeReelId = null;
        activeVideoEl = null;
      }
      return;
    }

    // If navigated to a new reel or returned back to a previously seen reel
    if (candidateId !== activeReelId) {
      await flushTimeSpent();
      activeReelId = candidateId;
      lastVideoTime = 0;

      // Count this play
      await triggerPlayCount(activeReelId);
    }

    // Attach listeners to active video
    const video = findActiveVideoElement();
    if (video) {
      attachVideoListeners(video);
    }
  }

  // --- Real-time Time Wasted Tracking ---
  // Every 1 second, if the tab is visible and a reel is active, accumulate watch time
  setInterval(() => {
    if (!activeReelId) return;
    if (document.hidden) return; // Tab is in background

    const video = activeVideoEl || findActiveVideoElement();
    // Only count time if video is playing (not paused)
    if (video && !video.paused) {
      unsavedSeconds += 1;
    }

    // Flush every 5 seconds to storage
    if (unsavedSeconds >= 5) {
      flushTimeSpent();
    }
  }, 1000);

  // Flush when tab is hidden or page is closed
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      flushTimeSpent();
    }
  });
  window.addEventListener('beforeunload', () => {
    flushTimeSpent();
  });

  // --- Observation Mechanisms ---
  setInterval(checkForReelNavigation, 400);

  const observer = new MutationObserver(() => {
    checkForReelNavigation();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  checkForReelNavigation();
})();
