/**
 * User history utilities for tracking and retrieving user actions
 */

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: 'image_uploaded' | 'preview_generated' | 'payment_completed' | 'story_completed';
  data: Record<string, any>;
}

export function getUserHistory(): HistoryEntry[] {
  try {
    const history = sessionStorage.getItem('user_history');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to retrieve user history:', error);
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const newEntry: HistoryEntry = {
      id: `${entry.action}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry
    };

    const history = getUserHistory();
    history.push(newEntry);

    // Keep only last 10 entries
    if (history.length > 10) {
      history.shift();
    }

    sessionStorage.setItem('user_history', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history entry:', error);
  }
}

export function clearUserHistory(): void {
  try {
    sessionStorage.removeItem('user_history');
  } catch (error) {
    console.error('Failed to clear user history:', error);
  }
}

export function getLastPreview(): HistoryEntry | null {
  const history = getUserHistory();
  const previews = history.filter(entry => entry.action === 'preview_generated');
  return previews.length > 0 ? previews[previews.length - 1] : null;
}

export function getRecentUploads(limit: number = 5): HistoryEntry[] {
  const history = getUserHistory();
  return history
    .filter(entry => entry.action === 'image_uploaded')
    .slice(-limit);
}