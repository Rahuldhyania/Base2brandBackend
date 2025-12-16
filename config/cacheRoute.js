// utils/cacheRoute.js
const crypto = require("crypto");

const cacheRoute = (cacheKeyBase, ttl = 1800, handler) => {
  return async (req, res) => {
    
    const queryString = JSON.stringify(req.query);
    const dynamicKey = `${cacheKeyBase}:${crypto
      .createHash("md5")
      .update(queryString)
      .digest("hex")}`;

    try {
      // 1. Try Redis Cache First (if available)
      if (global.redisReady && global.redisClient) {
        const cached = await global.redisClient.get(dynamicKey);
        if (cached) {
          console.log(`CACHE HIT → ${dynamicKey}`);
          return res.json(JSON.parse(cached));
        }
      }

      // 2. Run actual logic
      const result = await handler(req, res);

      // 3. Save to Redis (only if Redis is working)
      if (global.redisReady && global.redisClient && result) {
        try {
          await global.redisClient.setEx(dynamicKey, ttl, JSON.stringify(result));
          console.log(`CACHE SAVED → ${dynamicKey} (TTL: ${ttl}s)`);
        } catch (cacheErr) {
          console.log("Redis write failed (continuing):", cacheErr.message);
        }
      }

      // 4. Send response
      res.json(result);
    } catch (error) {
      console.error(`Error in cached route ${cacheKeyBase}:`, error);
      res.status(500).json({
        message: "Server error",
        error: error.message || error,
      });
    }
  };
};

module.exports = { cacheRoute };