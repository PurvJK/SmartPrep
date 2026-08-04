const loginCache = new Map();
const LOGIN_CACHE_TTL_MS = Number(process.env.LOGIN_CACHE_TTL_MS || 60000);

const buildCacheKey = (email, password) => `${String(email || '').trim().toLowerCase()}::${String(password || '')}`;

export const getCachedLoginResult = (email, password) => {
  const key = buildCacheKey(email, password);
  const entry = loginCache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    loginCache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCachedLoginResult = (email, password, value) => {
  const key = buildCacheKey(email, password);
  loginCache.set(key, {
    value,
    expiresAt: Date.now() + LOGIN_CACHE_TTL_MS
  });
};
