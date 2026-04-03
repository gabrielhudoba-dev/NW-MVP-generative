/**
 * Session identity — generates a unique session_id per browser tab/session.
 * Uses sessionStorage so it persists across SPA navigations but not across tabs.
 */

const SESSION_KEY = "nw_session_id";

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

let cachedSessionId: string | null = null;

export function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId;

  if (typeof window === "undefined") return "ssr";

  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    cachedSessionId = id;
    return id;
  } catch {
    cachedSessionId = generateId();
    return cachedSessionId;
  }
}
