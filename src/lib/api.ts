/**
 * The optional backend (backend/, deployed on Emergent). Its URL comes from
 * VITE_API_URL; without it, or when a call fails, callers fall back to their
 * offline answers and say so on screen.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

export const hasBackend = BASE !== '';

/** POST JSON and parse the reply, or null on any failure. */
export async function postJSON<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T | null> {
  if (!hasBackend) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
