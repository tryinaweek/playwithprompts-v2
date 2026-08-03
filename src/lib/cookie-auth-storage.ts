/**
 * Session storage for supabase-js that lives in cookies on
 * `.playwithprompts.com`, so playwithprompts.com (the game) and
 * www.playwithprompts.com (courses) share one login.
 *
 * The session JSON can exceed the ~4KB cookie limit, so it is URI-encoded and
 * split across numbered cookies (key.0, key.1, …) — the same scheme
 * @supabase/ssr uses. localStorage is kept in sync as a fallback and as the
 * migration path for sessions saved before cookies existed. On hosts outside
 * playwithprompts.com (localhost, previews) it is localStorage only.
 *
 * IMPORTANT: the old course site ships an identical copy of this file; both
 * apps must use the same cookie scheme or logins stop carrying over.
 */

const COOKIE_DOMAIN = '.playwithprompts.com';
const CHUNK_SIZE = 3180;
const MAX_CHUNKS = 8;
const ONE_YEAR = 31536000;

const onBrandDomain = (): boolean =>
  typeof document !== 'undefined' &&
  /(^|\.)playwithprompts\.com$/.test(window.location.hostname);

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split('; ')) {
    if (part.startsWith(prefix)) return part.slice(prefix.length);
  }
  return null;
}

function writeCookie(name: string, value: string, maxAge: number): void {
  document.cookie = `${name}=${value}; domain=${COOKIE_DOMAIN}; path=/; max-age=${maxAge}; secure; samesite=lax`;
}

function readChunked(key: string): string | null {
  const single = readCookie(key);
  if (single !== null) return decodeURIComponent(single);
  let joined = '';
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const chunk = readCookie(`${key}.${i}`);
    if (chunk === null) break;
    joined += chunk;
  }
  return joined ? decodeURIComponent(joined) : null;
}

function clearChunks(key: string): void {
  writeCookie(key, '', 0);
  for (let i = 0; i < MAX_CHUNKS; i++) {
    writeCookie(`${key}.${i}`, '', 0);
  }
}

function writeChunked(key: string, value: string): void {
  clearChunks(key);
  const encoded = encodeURIComponent(value);
  if (encoded.length <= CHUNK_SIZE) {
    writeCookie(key, encoded, ONE_YEAR);
    return;
  }
  for (let i = 0; i * CHUNK_SIZE < encoded.length && i < MAX_CHUNKS; i++) {
    writeCookie(`${key}.${i}`, encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), ONE_YEAR);
  }
}

export const cookieAuthStorage = {
  getItem(key: string): string | null {
    if (onBrandDomain()) {
      const fromCookie = readChunked(key);
      if (fromCookie !== null) return fromCookie;
      // Migration: sessions saved to localStorage before cookie sharing.
      const legacy = window.localStorage.getItem(key);
      if (legacy !== null) writeChunked(key, legacy);
      return legacy;
    }
    return window.localStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value);
    if (onBrandDomain()) writeChunked(key, value);
  },

  removeItem(key: string): void {
    window.localStorage.removeItem(key);
    if (onBrandDomain()) clearChunks(key);
  },
};
