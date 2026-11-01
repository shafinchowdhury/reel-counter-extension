/**
 * src/popup/popup.js
 * Controller for the extension popup UI.
 * 
 * C++ Analogy:
 * Think of this as the UI Controller or Presenter (in MVC/MVP).
 * It listens for user clicks (toggle, reset), queries the Model (ReelStorage),
 * and updates the DOM view elements.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const todayCountEl = document.getElementById('today-count');
  const detailsPanel = document.getElementById('details-panel');
  const compactBar = document.getElementById('compact-bar');
  const toggleBtn = document.getElementById('toggle-btn');
  const historyListEl = document.getElementById('history-list');

  /**
   * Helper: Formats a "YYYY-MM-DD" string into a friendly label like "Today", "Yesterday", or "Fri, Oct 31".
   * 
   * @param {string} dateKey 
   * @param {number} dayIndex (0 = Today, 1 = Yesterday)
   * @returns {string}
   */
  function formatDateLabel(dateKey, dayIndex) {
    if (dayIndex === 0) return 'Today';
    if (dayIndex === 1) return 'Yesterday';

    // Parse date: e.g. "2026-11-01" -> Date object
    const [year, month, day] = dateKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    // Returns short weekday, e.g. "Thu" or "Wed"
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  /**
   * Loads statistics from storage and updates the DOM.
   */
  async function renderStats() {
    if (!window.ReelStorage) return;

    const stats = await window.ReelStorage.getStats();

    // 1. Update the compact primary count
    todayCountEl.textContent = stats.todayCount;

    // 2. Render 7-day history list
    historyListEl.innerHTML = '';

    stats.past7Days.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = `history-row ${index === 0 ? 'today' : ''}`;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'history-date';
      dateSpan.textContent = formatDateLabel(entry.date, index);

      const countSpan = document.createElement('span');
      countSpan.className = 'history-count';
      countSpan.textContent = entry.count;

      row.appendChild(dateSpan);
      row.appendChild(countSpan);
      historyListEl.appendChild(row);
    });
  }

  // --- Event Listeners ---

  // Toggle expand/collapse of the details panel
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
