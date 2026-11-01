/**
 * src/popup/popup.js
 * Controller for the extension popup UI.
 * 
 * Displays the ultra-compact "Count: X" bar by default,
 * and reveals time wasted and 7-day history when clicked.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const todayCountEl = document.getElementById('today-count');
  const todayTimeEl = document.getElementById('today-time');
  const detailsPanel = document.getElementById('details-panel');
  const compactBar = document.getElementById('compact-bar');
  const toggleBtn = document.getElementById('toggle-btn');
  const historyListEl = document.getElementById('history-list');
  const weekTotalReelsEl = document.getElementById('week-total-reels');
  const weekTotalTimeEl = document.getElementById('week-total-time');

  /**
   * Formats a "YYYY-MM-DD" string into a friendly label like "Today", "Yesterday", or "Fri".
   */
  function formatDateLabel(dateKey, dayIndex) {
    if (dayIndex === 0) return 'Today';
    if (dayIndex === 1) return 'Yesterday';

    const [year, month, day] = dateKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  /**
   * Loads statistics from storage and updates the DOM elements.
   */
  async function renderStats() {
    if (!window.ReelStorage) return;

    const stats = await window.ReelStorage.getStats();

    // 1. Primary Compact Display
    todayCountEl.textContent = stats.todayCount;

    // 2. Today's Time Wasted
    todayTimeEl.textContent = window.ReelStorage.formatDuration(stats.todayTimeSpentSeconds);

    // 3. Render 7-Day History
    historyListEl.innerHTML = '';
    let weekTotalCount = 0;
    let weekTotalSeconds = 0;

    stats.past7Days.forEach((entry, index) => {
      weekTotalCount += entry.count;
      weekTotalSeconds += entry.timeSpentSeconds;

      const row = document.createElement('div');
      row.className = `history-row ${index === 0 ? 'today' : ''}`;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'history-date';
      dateSpan.textContent = formatDateLabel(entry.date, index);

      const statsContainer = document.createElement('div');
      statsContainer.className = 'history-stats';

      const countSpan = document.createElement('span');
      countSpan.className = 'history-count';
      countSpan.textContent = `${entry.count} reels`;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = window.ReelStorage.formatDuration(entry.timeSpentSeconds);

      statsContainer.appendChild(countSpan);
      statsContainer.appendChild(timeSpan);

      row.appendChild(dateSpan);
      row.appendChild(statsContainer);
      historyListEl.appendChild(row);
    });

    // 4. Update 7-Day Summary
    weekTotalReelsEl.textContent = weekTotalCount;
    weekTotalTimeEl.textContent = window.ReelStorage.formatDuration(weekTotalSeconds);
  }

  // Toggle between ultra-compact and full information view
  function toggleDetails(event) {
    event.stopPropagation();
    const isHidden = detailsPanel.classList.toggle('hidden');
    toggleBtn.classList.toggle('rotated', !isHidden);
  }

  compactBar.addEventListener('click', toggleDetails);
  toggleBtn.addEventListener('click', toggleDetails);

  // Initial render when popup opens
  await renderStats();
});
