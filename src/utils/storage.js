/**
 * src/utils/storage.js
 * Centralized data management, time tracking, and 7-day retention engine.
 * 
 * C++ Analogy:
 * Think of this as the Data Storage / Repository Layer.
 * It manages persistence, daily midnight rollover, and rolling data structures.
 */

window.ReelStorage = (() => {

  /**
   * Formats the current local date as "YYYY-MM-DD".
   * Automatically resets daily at 12:00 AM midnight.
   * 
   * @returns {string} e.g. "2026-11-01"
   */
  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Calculates a date key N days offset from a given date.
   * 
   * @param {Date} date 
   * @param {number} daysOffset 
   * @returns {string} "YYYY-MM-DD"
   */
  function getDateKeyOffset(date, daysOffset) {
    const target = new Date(date);
    target.setDate(target.getDate() + daysOffset);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats raw seconds into human-readable time (e.g. "45s", "12m", "1h 24m").
   * 
   * @param {number} totalSeconds 
   * @returns {string}
   */
  function formatDuration(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds || 0));
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remainingSec = sec % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${remainingSec}s`;
  }

  /**
   * Enforces 7-day rolling retention.
   * Prunes any stored records older than 7 days.
   * 
   * @param {Object} history 
   * @returns {Object} Pruned history
   */
  function pruneOldHistory(history) {
    const today = new Date();
    const cutoffKey = getDateKeyOffset(today, -7);

    for (const dateKey of Object.keys(history)) {
      if (dateKey < cutoffKey) {
        delete history[dateKey];
      }
    }
    return history;
  }

  /**
   * Records a Reel/Short play.
   * If a reel is replayed or looped, it is counted as requested.
   * 
   * @param {string} reelId 
   * @param {string} platform 
   * @returns {Promise<{todayCount: number}>}
   */
  async function recordReelPlay(reelId, platform = 'instagram') {
    const todayKey = getTodayKey();
    const data = await chrome.storage.local.get(['history', 'totalCount']);

    const history = data.history || {};
    let totalCount = data.totalCount || 0;

    if (!history[todayKey]) {
      history[todayKey] = {
        count: 0,
        timeSpentSeconds: 0
      };
    }

    const todayRecord = history[todayKey];
    todayRecord.count += 1;
    totalCount += 1;

    const cleanedHistory = pruneOldHistory(history);

    await chrome.storage.local.set({
      history: cleanedHistory,
      totalCount: totalCount
    });

    console.log(`[Reel Counter] Reel played (${platform}): ${reelId}. Today's total plays: ${todayRecord.count}`);

    return { todayCount: todayRecord.count };
  }

  /**
   * Accumulates time spent watching reels today.
   * 
   * @param {number} additionalSeconds - Number of seconds to add
   */
  async function addTimeSpent(additionalSeconds) {
    if (!additionalSeconds || additionalSeconds <= 0) return;

    const todayKey = getTodayKey();
    const data = await chrome.storage.local.get(['history', 'totalTimeSpentSeconds']);

    const history = data.history || {};
    let totalTimeSpentSeconds = (data.totalTimeSpentSeconds || 0) + additionalSeconds;

    if (!history[todayKey]) {
      history[todayKey] = {
        count: 0,
        timeSpentSeconds: 0
      };
    }

    history[todayKey].timeSpentSeconds = (history[todayKey].timeSpentSeconds || 0) + additionalSeconds;

    const cleanedHistory = pruneOldHistory(history);

    await chrome.storage.local.set({
      history: cleanedHistory,
      totalTimeSpentSeconds
    });
  }

  /**
   * Retrieves dashboard statistics for today and the past 7 days.
   */
  async function getStats() {
    const todayKey = getTodayKey();
    const data = await chrome.storage.local.get(['history', 'totalCount', 'totalTimeSpentSeconds']);

    const history = data.history || {};
    const totalCount = data.totalCount || 0;
    const totalTimeSpentSeconds = data.totalTimeSpentSeconds || 0;

    const todayRecord = history[todayKey] || { count: 0, timeSpentSeconds: 0 };

    const past7Days = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const dateKey = getDateKeyOffset(now, -i);
      const rec = history[dateKey] || { count: 0, timeSpentSeconds: 0 };
      past7Days.push({
        date: dateKey,
        count: rec.count || 0,
        timeSpentSeconds: rec.timeSpentSeconds || 0
      });
    }

    return {
      todayCount: todayRecord.count || 0,
      todayTimeSpentSeconds: todayRecord.timeSpentSeconds || 0,
      past7Days,
      totalCount,
      totalTimeSpentSeconds
    };
  }

  return {
    getTodayKey,
    formatDuration,
    recordReelPlay,
    addTimeSpent,
    getStats
  };
})();
