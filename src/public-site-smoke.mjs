/*
 * Read-only anonymous check for already-public information pages.
 * No cookies, credentials, tokens, forms, redirects, patient records or writes.
 */
export const PUBLIC_PAGES = Object.freeze(['/', '/booking/', '/en/booking/']);
const ORIGIN = 'https://www.drkhalidmentalhealth.com';

export async function probePublicPages(fetchFn = fetch) {
  const result = [];
  for (const path of PUBLIC_PAGES) {
    const url = new URL(path, ORIGIN);
    const res = await fetchFn(url.href, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(12000),
    });
    // Only safe non-writing responses. Never expose response body or Location.
    if (res.body && typeof res.body.cancel === 'function') await res.body.cancel();
    result.push(Object.freeze({ path, status: res.status, healthy: res.status >= 200 && res.status < 400 }));
  }
  return Object.freeze(result);
}
