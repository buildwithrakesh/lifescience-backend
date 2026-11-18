import NodeCache from "node-cache";

// High-performance in-memory cache with automatic standard TTL & checkperiod
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // check for expired keys every 60s
  useClones: false // performance optimization: don't clone objects
});

export const CACHE_KEYS = {
  SLIDERS_ACTIVE: "sliders:active",
  SLIDERS_ALL: "sliders:all",
  FEATURED_POSTERS_ACTIVE: "featured_posters:active",
  OFFERS_ACTIVE: "offers:active",
  PRODUCTS_ALL: "products:all",
  PRODUCTS_FEATURED: "products:featured",
  ADMIN_STATS: "admin:dashboard:stats",
};

export const cache = {
  get: (key) => memoryCache.get(key),
  set: (key, val, ttl = 300) => memoryCache.set(key, val, ttl),
  del: (key) => memoryCache.del(key),
  delByPrefix: (prefix) => {
    const keys = memoryCache.keys().filter(k => k.startsWith(prefix));
    if (keys.length > 0) {
      memoryCache.del(keys);
    }
  },
  flush: () => memoryCache.flushAll(),
  has: (key) => memoryCache.has(key)
};

export default cache;
