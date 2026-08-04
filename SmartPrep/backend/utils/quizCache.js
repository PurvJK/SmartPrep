const cache = new Map();

const DEFAULT_TTL_MS = Number(process.env.QUIZ_CACHE_TTL_MS || 60000);

export const getCachedValue = (key) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
};

export const setCachedValue = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
};

export const clearQuizCache = () => {
  for (const key of Array.from(cache.keys())) {
    if (typeof key === 'string' && (key.startsWith('quizzes:') || key.startsWith('quiz:'))) {
      cache.delete(key);
    }
  }
};
