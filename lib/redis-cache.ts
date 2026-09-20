const STALE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ITEMS = 500;
const inMemoryCache = new Map<string, { data: string; expiry: number }>();

const rateLimitBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const MAX_TOKENS = 35;
const REFILL_INTERVAL_MS = 10000;

export function getCached<T>(key: string): T | null {
  const cached = inMemoryCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now >= cached.expiry) {
    if (now >= cached.expiry + STALE_CACHE_TTL_MS) inMemoryCache.delete(key);
    return null;
  }

  try {
    return JSON.parse(cached.data) as T;
  } catch {
    inMemoryCache.delete(key);
    return null;
  }
}

export function getStaleCached<T>(key: string): T | null {
  const cached = inMemoryCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now < cached.expiry || now >= cached.expiry + STALE_CACHE_TTL_MS) return null;

  try {
    return JSON.parse(cached.data) as T;
  } catch {
    inMemoryCache.delete(key);
    return null;
  }
}

export function setCached<T>(key: string, data: T, ttlSeconds = CACHE_TTL_MS / 1000): void {
  inMemoryCache.set(key, {
    data: JSON.stringify(data),
    expiry: Date.now() + ttlSeconds * 1000,
  });

  while (inMemoryCache.size > MAX_CACHE_ITEMS) {
    const firstKey = inMemoryCache.keys().next().value;
    if (!firstKey) break;
    inMemoryCache.delete(firstKey);
  }
}

export function checkRateLimit(identifier = 'tmdb_global'): boolean {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimitBuckets.set(identifier, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  if (elapsed > REFILL_INTERVAL_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  } else {
    const refillAmount = Math.floor((elapsed / REFILL_INTERVAL_MS) * MAX_TOKENS);
    if (refillAmount > 0) {
      bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refillAmount);
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}