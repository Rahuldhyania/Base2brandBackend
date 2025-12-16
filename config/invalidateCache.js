// utils/invalidateCache.js
const invalidateCache = async (pattern) => {
  if (!global.redisReady || !global.redisClient) return;

  try {
    const keys = await global.redisClient.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await global.redisClient.del(keys);
      console.log(`Cache invalidated: ${keys.length} keys → ${pattern}`);
    }
  } catch (err) {
    console.log("Cache invalidation failed:", err.message);
  }
};

module.exports = { invalidateCache };