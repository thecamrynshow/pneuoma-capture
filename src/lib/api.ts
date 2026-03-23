/**
 * API base URL for fetch calls.
 * - Empty string = same-origin (when app is served from the API server, e.g. VM)
 * - Set NEXT_PUBLIC_API_URL = full URL when app is bundled locally (e.g. Capacitor
 *   with static assets) and API runs elsewhere
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? ''
  }
  return ''
}
