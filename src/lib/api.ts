/**
 * The backend (backend/). In production one server serves the site and the
 * API together, so calls go to /api on the same address; in development Vite
 * forwards /api to the local backend. VITE_API_URL points elsewhere if the API
 * ever lives on its own. On any failure, callers fall back to their offline
 * answers and say so on screen.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

/** POST JSON and parse the reply, or null on any failure. */
export async function postJSON<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
