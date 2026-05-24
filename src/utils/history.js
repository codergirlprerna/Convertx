import { HISTORY_KEY, MAX_HISTORY } from "../constants";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    // Strip blob URLs before saving — they don't survive refresh
    const toSave = history.map(({ downloadUrl, ...rest }) => rest);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave.slice(0, MAX_HISTORY)));
  } catch (e) {
    console.warn("Could not save history:", e);
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
