/**
 * src/utils/storage.js
 * Centralized data management and 7-day retention engine for Reel Counter.
 * 
 * C++ Analogy:
 * Think of this file like a Data Access Object (DAO) or repository class in C++.
 * Instead of writing raw SQL or managing files directly, callers invoke methods
 * like `ReelStorage.recordReel(id)` or `ReelStorage.getStats()`.
 */

// Define on window (global scope in browser JS) so other scripts can access it.
window.ReelStorage = (() => {

  /**
   * Helper: Formats the current local date as "YYYY-MM-DD".
   * 
   * C++ Equivalent:
   * strftime(buf, sizeof(buf), "%Y-%m-%d", localtime(&now))
   * 
   * @returns {string} e.g. "2026-11-01"
   */
  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    // getMonth() is zero-indexed (0 = January, 10 = November)
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Calculates a date key N days before/after a given reference date.
   * 
   * @param {Date} date - The starting date
   * @param {number} daysOffset - Days to add or subtract
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
   * Enforces the 7-day rolling retention policy.
   * Deletes any records older than 7 days ago.
   * 
   * C++ Analogy:
   * std::erase_if(history, [cutoff](const auto& item) { return item.first < cutoff; });
   * 
   * @param {Object} history - The history object from storage
   * @returns {Object} Pruned history object
   */
  function pruneOldHistory(history) {
    const today = new Date();
    // 7 days ago cutoff date string
    const cutoffKey = getDateKeyOffset(today, -7);

    // In JS, Object.keys(obj) returns an array (vector) of all keys in the object
    const dateKeys = Object.keys(history);

    for (const dateKey of dateKeys) {
      // String comparison works for "YYYY-MM-DD" formatted dates
      if (dateKey < cutoffKey) {
        delete history[dateKey]; // Remove stale entry
      }
    }
    return history;
  }

  /**
   * Records a viewed Reel ID.
   * Checks for duplicate views today. If unique, increments the counter.
   * 
   * C++ Analogy:
   * bool record_reel(const std::string& id)
   * 
   * @param {string} reelId - Unique alphanumeric identifier of the video
   * @param {string} platform - "instagram", "youtube", or "facebook"
   * @returns {Promise<{isNew: boolean, todayCount: number}>}
   */
  async function recordReel(reelId, platform = 'instagram') {
    if (!reelId || typeof reelId !== 'string') {
      return { isNew: false, todayCount: 0 };
    }

    const todayKey = getTodayKey();

    // chrome.storage.local.get retrieves values by key asynchronously.
    // In C++, this is like reading an async future: `auto data = read_db_async().get();`
    const data = await chrome.storage.local.get(['history', 'totalCount']);

    // If 'history' does not exist yet in storage, initialize an empty object {}
    const history = data.history || {};
    let totalCount = data.totalCount || 0;

    // Ensure today's record exists
    if (!history[todayKey]) {
      history[todayKey] = {
        count: 0,
        ids: [] // Array of unique IDs seen today
      };
    }

    const todayRecord = history[todayKey];

    // Check if reelId was already viewed today (Deduplication)
    // C++ Equivalent: std::find(ids.begin(), ids.end(), reelId) != ids.end()
    if (todayRecord.ids.includes(reelId)) {
      return { isNew: false, todayCount: todayRecord.count };
    }

    // It's a new unique reel!
    todayRecord.ids.push(reelId);
    todayRecord.count += 1;
    totalCount += 1;

    // Apply the 7-day retention policy to keep storage minimal
    const cleanedHistory = pruneOldHistory(history);

    // Save back to persistent storage
    await chrome.storage.local.set({
      history: cleanedHistory,
      totalCount: totalCount
    });

    console.log(`[Reel Counter] New unique Reel counted (${platform}):`, reelId, `Today count: ${todayRecord.count}`);

    return { isNew: true, todayCount: todayRecord.count };
  }

  /**
   * Retrieves dashboard statistics for the popup.
   * 
   * @returns {Promise<{todayCount: number, past7Days: Array<{date: string, count: number}>, totalCount: number}>}
   */
  async function getStats() {
    const todayKey = getTodayKey();
    const data = await chrome.storage.local.get(['history', 'totalCount']);
    const history = data.history || {};
    const totalCount = data.totalCount || 0;

    const todayCount = history[todayKey] ? history[todayKey].count : 0;

    // Build ordered list of the last 7 calendar days
    const past7Days = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const dateKey = getDateKeyOffset(now, -i);
      const count = history[dateKey] ? history[dateKey].count : 0;
      past7Days.push({ date: dateKey, count: count });
    }

    return {
      todayCount,
      past7Days,
      totalCount
    };
  }

  /**
   * Resets today's counter to 0 (useful for testing or user reset).
   */
  async function resetToday() {
    const todayKey = getTodayKey();
    const data = await chrome.storage.local.get(['history']);
    const history = data.history || {};

    if (history[todayKey]) {
      history[todayKey] = { count: 0, ids: [] };
      await chrome.storage.local.set({ history });
    }
  }

  // Public API exposed by the module
  return {
    getTodayKey,
    recordReel,
    getStats,
    resetToday
  };
})();
